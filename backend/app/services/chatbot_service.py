from app.utils.ollama_client import call_ollama
from app.prompts.chatbot_prompt import build_chatbot_prompt

class ChatbotService:

    @staticmethod
    def chat(user_message: str, history: list, model: str = "qwen3:8b"):
        """
        Xử lý cuộc hội thoại và gọi AI.
        """

        # 1. Build prompt từ user message + lịch sử hội thoại
        prompt = build_chatbot_prompt(user_message, history)

        # 2. Gọi Ollama
        ai_response = call_ollama(model, prompt)

        # 3. Trả về câu trả lời
        return ai_response
