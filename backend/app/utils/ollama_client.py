# backend/app/utils/ollama_client.py
import json
import requests
from typing import Optional

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

def call_ollama(model: str, prompt: str, timeout: int = 180) -> str:
    """
    Gọi Ollama theo streaming và trả về full text.
    """
    response = requests.post(
        OLLAMA_URL,
        json={"model": model, "prompt": prompt},
        stream=True,
        timeout=timeout,
    )
    response.raise_for_status()

    full_text = ""
    for line in response.iter_lines():
        if not line:
            continue
        # Một dòng JSON kiểu: {"response": "..."}
        try:
            data = json.loads(line.decode("utf-8"))
            full_text += data.get("response", "")
        except Exception:
            # nếu không phải JSON, append raw
            try:
                full_text += line.decode("utf-8")
            except Exception:
                pass

    return full_text
