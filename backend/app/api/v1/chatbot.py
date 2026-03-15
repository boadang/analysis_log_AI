# backend/app/api/v1/chatbot.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.chatRequest import ChatRequest
from app.services.chatbot_service import ChatbotService

router = APIRouter()

@router.post("/chat-stream")
def chat_stream(req: ChatRequest):

    def generate():
        for chunk in ChatbotService.stream(req.message, req.history):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
