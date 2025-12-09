from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.chatbot_service import ChatbotService
from app.schemas.chatRequest import ChatRequest

router = APIRouter()

@router.post("/chat-streaming")
def chat(req: ChatRequest):
    reply = ChatbotService.chat(req.message, req.history)
    return {"reply": reply}
    
    