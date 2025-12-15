# backend/app/services/ai_processor.py

import ollama
import json
import re
from typing import List, Dict
from app.core.config import settings


class AIProcessor:
    """
    AI log analysis processor using Ollama
    Supports:
    - Single log analysis
    - Batch log analysis (FAST)
    - Aggregation
    """

    # =====================================================
    # Public API – single log (fallback / debug)
    # =====================================================
    @staticmethod
    def analyze(raw_log: str) -> Dict:
        """
        Analyze a single log entry (slow, fallback mode)
        """
        results = AIProcessor.analyze_batch([raw_log])
        return results[0] if results else AIProcessor._safe_fallback(raw_log)

    # =====================================================
    # Public API – batch analysis (MAIN)
    # =====================================================
    @staticmethod
    def analyze_batch(logs: List[str]) -> List[Dict]:
        """
        Analyze multiple logs in ONE LLM call (recommended)

        Args:
            logs: list of raw log strings

        Returns:
            List of structured analysis dicts
        """

        if not logs:
            return []

        prompt = AIProcessor._build_batch_prompt(logs)

        try:
            response = ollama.chat(
                model=settings.OLLAMA_MODEL,
                messages=[{"role": "user", "content": prompt}],
                options={
                    "temperature": 0.1,     # stable JSON
                    "num_ctx": 4096,        # reduce hallucination
                }
            )

            content = response["message"]["content"].strip()
            content = AIProcessor._clean_json(content)

            parsed = json.loads(content)

            results = parsed.get("results", [])
            if not isinstance(results, list):
                raise ValueError("Invalid AI batch format: results is not a list")

            # Normalize each result
            normalized = []
            for i, r in enumerate(results):
                normalized.append(AIProcessor._normalize_result(r, logs[i]))

            return normalized

        except Exception as e:
            print(f"[AI] Batch analysis failed: {e}")
            return [AIProcessor._safe_fallback(log) for log in logs]

    # =====================================================
    # Aggregation
    # =====================================================
    @staticmethod
    def aggregate_threats(analysis_results: List[Dict]) -> Dict:
        total = len(analysis_results)
        threats = [r for r in analysis_results if r.get("is_threat")]

        risk_counts = {
            "none": 0,
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0
        }

        for r in analysis_results:
            level = r.get("risk_level", "none")
            if level in risk_counts:
                risk_counts[level] += 1

        threat_types = {}
        for r in threats:
            t = r.get("threat_type", "other")
            threat_types[t] = threat_types.get(t, 0) + 1

        confidences = [r.get("confidence", 0) for r in threats]
        avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0

        return {
            "total_logs": total,
            "total_threats": len(threats),
            "threat_percentage": round((len(threats) / total * 100), 2) if total else 0,
            "risk_distribution": risk_counts,
            "threat_types": threat_types,
            "average_confidence": avg_conf,
            "highest_risk": max(risk_counts, key=risk_counts.get) if total else "none"
        }

    # =====================================================
    # Prompt builder
    # =====================================================
    @staticmethod
    def _build_batch_prompt(logs: List[str]) -> str:
        return f"""
    You are a cybersecurity log analysis AI.

    Analyze EACH log independently.
    DO NOT merge logs together.

    Return STRICT JSON ONLY.
    No markdown. No explanation.

    For each log return:
    - risk_level: none | low | medium | high | critical
    - threat_type: authentication_failure | suspicious_activity | malware | ddos | normal | other
    - is_threat: boolean
    - confidence: number between 0 and 1
    - summary: short explanation
    - details: object {{ source_ip, timestamp, action }}

    INPUT LOGS:
    {json.dumps(logs, indent=2)}

    OUTPUT FORMAT:
    {{
    "results": [
        {{
        "risk_level": "none",
        "threat_type": "normal",
        "is_threat": false,
        "confidence": 0.95,
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
    # Helpers
    # =====================================================
    @staticmethod
    def _clean_json(text: str) -> str:
        """
        Remove markdown fences if LLM adds them
        """
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"^```\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @staticmethod
    def _normalize_result(result: Dict, raw_log: str) -> Dict:
        """
        Ensure required fields exist
        """
        return {
            "risk_level": result.get("risk_level", "none"),
            "threat_type": result.get("threat_type", "other"),
            "is_threat": bool(result.get("is_threat", False)),
            "confidence": float(result.get("confidence", 0.0)),
            "summary": result.get("summary", "No summary"),
            "details": result.get("details", {}),
            "recommendations": result.get("recommendations", [])
        }

    @staticmethod
    def _safe_fallback(raw_log: str) -> Dict:
        """
        Guaranteed safe output if AI fails
        """
        return {
            "risk_level": "none",
            "threat_type": "other",
            "is_threat": False,
            "confidence": 0.0,
            "summary": f"AI analysis failed for log: {raw_log[:80]}",
            "details": {},
            "recommendations": []
        }
