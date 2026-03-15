# backend/app/services/threat_service.py
from typing import List, Optional
import os
from app.utils.ollama_client import call_ollama
from app.utils.ai_parser import parse_ai_result
from app.prompts.threat_prompt import build_threat_hunt_prompt

def read_log_file_to_lines(path: str) -> List[str]:
    if not path or not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return [line.strip() for line in f.readlines() if line.strip()]

def hunt_threats_from_lines(lines: List[str], model: str = "qwen3:8b", user_query: str = "") -> List[dict]:
    """
    Gọi AI để thực hiện threat hunting trên danh sách dòng logs.
    """
    print("Hunting threats using model:", model)
    print("Number of log lines:", len(lines))
    prompt = build_threat_hunt_prompt(lines, user_query)
    raw = call_ollama(model, prompt, timeout=300)
    print("Raw AI response length:", len(raw), "content preview:", raw[:500])
    parsed = parse_ai_result(raw)
    print(f"Parsed {len(parsed)} threat items from AI response.")
    # Normalize fields: ensure ai_confidence int
    for item in parsed:
        try:
            item["ai_confidence"] = int(item.get("ai_confidence", 0))
        except Exception:
            item["ai_confidence"] = 0
    return parsed
