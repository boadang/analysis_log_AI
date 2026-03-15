# backend/app/services/ai_processor.py

import ollama
import json
import re
from typing import List, Dict, Any
from app.core.config import settings


class AIProcessor:
    """
    AI Processor for Threat Hunting

    Responsibilities:
    - Analyze logs using LLM (batch-first)
    - Normalize AI output
    - Convert AI result → Threat Hunting event
    - NEVER touch DB / API / Celery
    """

    # =====================================================
    # PUBLIC API
    # =====================================================

    @staticmethod
    def analyze_batch(logs: List[str]) -> List[Dict[str, Any]]:
        if not logs:
            print("[AI] ⚠️ Batch rỗng")
            return []

        print(f"[AI] 🚀 Bắt đầu phân tích batch {len(logs)} logs")
        print(f"[AI] Model đang dùng: {settings.OLLAMA_MODEL}")

        prompt = AIProcessor._build_batch_prompt(logs)
        print(f"[AI] 📤 Gửi prompt đến Ollama (độ dài: {len(prompt)} ký tự)")

        try:
            print("[AI] ⏳ Đang gọi ollama.chat()...")
            response = ollama.chat(
                model=settings.OLLAMA_MODEL,
                messages=[{"role": "user", "content": prompt}],
                options={
                    "temperature": 0.1,
                    "num_ctx": 8192,  # tăng lên để tránh cắt prompt
                },
            )

            content = response["message"]["content"]
            print(f"[AI] ✅ Ollama trả về (độ dài: {len(content)} ký tự):")
            print("-" * 60)
            print(content[:2000])  # in 2000 ký tự đầu
            if len(content) > 2000:
                print("... (còn lại bị cắt để hiển thị)")
            print("-" * 60)

            content = AIProcessor._clean_json(content)
            print(f"[AI] 🧹 Sau khi clean JSON: {content[:500]}...")

            parsed = json.loads(content)
            results = parsed.get("results", [])

            if not isinstance(results, list):
                raise ValueError(f"results không phải list: {results}")

            print(f"[AI] ✅ Parse JSON thành công, có {len(results)} kết quả")

            normalized: List[Dict] = []
            for i, r in enumerate(results):
                norm = AIProcessor._normalize_result(r, logs[i])
                threat_status = "🚨 THREAT" if norm["is_threat"] else "✅ normal"
                print(f"[AI] Log {i+1}: {threat_status} | risk={norm['risk_level']} | confidence={norm['confidence']} | type={norm['threat_type']}")
                normalized.append(norm)

            return normalized

        except json.JSONDecodeError as e:
            print(f"[AI] ❌ JSON parse failed: {e}")
            print(f"[AI] Nội dung thô từ Ollama: {content if 'content' in locals() else 'N/A'}")
        except ollama.ResponseError as e:
            print(f"[AI] ❌ Ollama ResponseError: {e}")
            print(f"[AI] Status code: {e.status_code if hasattr(e, 'status_code') else 'N/A'}")
        except ollama.RequestError as e:
            print(f"[AI] ❌ Ollama RequestError (không kết nối được): {e}")
        except Exception as e:
            print(f"[AI] ❌ Lỗi không xác định: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

        # Fallback
        print(f"[AI] ⚠️ Dùng fallback cho {len(logs)} logs")
        return [AIProcessor._safe_fallback(log) for log in logs]

    # =====================================================
    # NORMALIZATION
    # =====================================================

    @staticmethod
    def _normalize_result(result: Dict[str, Any], raw_log: str) -> Dict[str, Any]:
        """
        Ensure AI output ALWAYS has a stable schema
        """
        return {
            "risk_level": result.get("risk_level", "none"),
            "threat_type": result.get("threat_type", "other"),
            "is_threat": bool(result.get("is_threat", False)),
            "confidence": int(float(result.get("confidence", 0)) * 100)
            if float(result.get("confidence", 0)) <= 1
            else int(result.get("confidence", 0)),
            "summary": result.get("summary", "No summary"),
            "details": result.get("details", {}) or {},
            "recommendations": result.get("recommendations", []),
            "raw_log": raw_log,
        }

    # =====================================================
    # THREAT HUNTING ADAPTER
    # =====================================================

    @staticmethod
    def to_threat_event(ai_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert AI result → HuntFinding-compatible event
        """

        risk = ai_result.get("risk_level", "none")

        severity_map = {
            "none": None,
            "low": "low",
            "medium": "medium",
            "high": "high",
            "critical": "critical",
        }

        details = ai_result.get("details", {}) or {}

        return {
            "is_threat": ai_result.get("is_threat", False),
            "severity": severity_map.get(risk),
            "confidence": ai_result.get("confidence", 0),
            "event": ai_result.get("summary"),
            "timestamp": details.get("timestamp"),
            "source": details.get("source_ip"),
            "mitre_technique": ai_result.get("threat_type"),
            "evidence": {
                "raw_log": ai_result.get("raw_log"),
                "details": details,
            },
        }

    # =====================================================
    # AGGREGATION (FOR SUMMARY / DASHBOARD)
    # =====================================================

    @staticmethod
    def aggregate_threats(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(results)
        threats = [r for r in results if r.get("is_threat")]

        risk_distribution = {
            "none": 0,
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
        }

        for r in results:
            lvl = r.get("risk_level", "none")
            if lvl in risk_distribution:
                risk_distribution[lvl] += 1

        threat_types = {}
        for r in threats:
            t = r.get("threat_type", "other")
            threat_types[t] = threat_types.get(t, 0) + 1

        confidences = [r.get("confidence", 0) for r in threats]
        avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0

        return {
            "total_logs": total,
            "total_threats": len(threats),
            "threat_percentage": round((len(threats) / total * 100), 2)
            if total
            else 0,
            "risk_distribution": risk_distribution,
            "threat_types": threat_types,
            "average_confidence": avg_conf,
            "highest_risk": max(
                risk_distribution, key=risk_distribution.get
            )
            if total
            else "none",
        }

    # =====================================================
    # PROMPT
    # =====================================================

    @staticmethod
    def _build_batch_prompt(logs: List[str]) -> str:
        return f"""
You are a cybersecurity log analysis AI for SOC Threat Hunting.

Analyze EACH log independently.
DO NOT merge logs.
Return STRICT JSON ONLY.
No markdown. No explanation.

For each log return:
- risk_level: none | low | medium | high | critical
- threat_type: authentication_failure | suspicious_activity | malware | ddos | normal | other
- is_threat: boolean
- confidence: integer (0-100)
- summary: short explanation
- details:
    - source_ip
    - timestamp
    - action

INPUT LOGS:
{json.dumps(logs, indent=2)}

OUTPUT FORMAT:
{{
  "results": [
    {{
      "risk_level": "none",
      "threat_type": "normal",
      "is_threat": false,
      "confidence": 95,
      "summary": "Explanation",
      "details": {{
        "source_ip": null,
        "timestamp": null,
        "action": ""
      }}
    }}
  ]
}}
"""

    # =====================================================
    # HELPERS
    # =====================================================

    @staticmethod
    def _clean_json(text: str) -> str:
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"^```\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @staticmethod
    def _safe_fallback(raw_log: str) -> Dict[str, Any]:
        return {
            "risk_level": "none",
            "threat_type": "other",
            "is_threat": False,
            "confidence": 0,
            "summary": f"AI analysis failed for log: {raw_log[:100]}",
            "details": {},
            "recommendations": [],
            "raw_log": raw_log,
        }
