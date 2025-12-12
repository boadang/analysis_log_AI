# backend/app/utils/ai_parser.py
import re
import json
from typing import List

def parse_ai_result(raw_text: str) -> List[dict]:
    """
    Parse JSON array từ raw_text do model trả về.
    Trả về list dict hoặc [] nếu lỗi.
    """
    if not raw_text:
        return []

    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    # tìm tất cả mảng JSON
    json_arrays = re.findall(r"\[\s*{.*?}\s*]", raw_text, flags=re.DOTALL)
    if not json_arrays:
        # fallback: nếu raw_text itself is JSON array-like
        try:
            data = json.loads(raw_text)
            if isinstance(data, list):
                return data
        except Exception:
            return []

    candidate = max(json_arrays, key=len)

    fixed = (
        candidate
        .replace("\n", " ")
        .replace("\t", " ")
        .replace(",]", "]")
        .replace(", }", " }")
        .strip()
    )

    if not fixed.endswith("]"):
        fixed += "]"

    try:
        data = json.loads(fixed)
        if isinstance(data, list):
            return data
    except Exception:
        return []

    return []
