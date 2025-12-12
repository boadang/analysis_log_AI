# backend/app/utils/ollama_client.py
import json
import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

def call_ollama(
    model: str,
    prompt: str,
    max_tokens: int = 300,
    timeout: int = 60,
    stream: bool | None = None,
):
    """
    Hàm gọi Ollama cải tiến:
    - stream=None  → mặc định streaming như phiên bản cũ (ưu tiên chatbot / phân tích)
    - stream=True  → yield token theo thời gian thực
    - stream=False → trả về full string (không stream)
    
    => Giúp linh hoạt cho cả chatbot, phân tích log, phân tích file lớn.
    """

    # Mặc định giữ y hệt bản cũ
    if stream is None:
        stream = True

    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": max_tokens,
        "stream": stream,
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            stream=stream,
            timeout=timeout,
        )
        response.raise_for_status()

        # =====================================
        # 1) STREAM MODE → yield từng chunk
        # =====================================
        if stream:
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    print("[Ollama] Stream chunk received:", data)
                    if "response" in data:
                        yield data["response"]
                except:
                    continue
            return

        # =====================================
        # 2) NON-STREAM MODE → trả về string
        # =====================================
        data = response.json()
        print("[Ollama] Non-stream response received.")
        return data.get("response", "")

    except Exception as e:
        print("[Ollama Error]", e)
        return "" if not stream else iter([])
