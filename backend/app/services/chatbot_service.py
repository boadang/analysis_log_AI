# backend/app/services/chatbot_service.py
from app.utils.ollama_client import call_ollama
from app.prompts.chatbot_prompt import build_chatbot_prompt

class ChatbotService:

    @staticmethod
    def stream(user_message: str, history: list, model="qwen2.5:3b"):
        prompt = build_chatbot_prompt(user_message, history)

        # call_ollama(model, prompt) => iterator chunk
        for chunk in call_ollama(model, prompt, stream=True):
            yield chunk
