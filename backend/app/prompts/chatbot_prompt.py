def build_chatbot_prompt(user_message: str, history: list) -> str:
    """
    Xây dựng prompt chuẩn cho chatbot.
    """

    # Format lại lịch sử hội thoại
    history_text = ""
    for turn in history[-10:]:   # Chỉ lấy 10 câu gần nhất
        history_text += f"User: {turn['user']}\nAI: {turn['bot']}\n"

    return f"""
Bạn là một trợ lý AI thân thiện và hữu ích.

Dưới đây là lịch sử cuộc trò chuyện:
{history_text}

Người dùng hỏi:
{user_message}

Yêu cầu:
- Trả lời ngắn gọn, rõ ràng.
- Dựa vào ngữ cảnh phía trên.
- Nếu không hiểu câu hỏi, hãy yêu cầu làm rõ.
"""
