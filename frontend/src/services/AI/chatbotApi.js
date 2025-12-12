// frontend/src/services/AI/chatbotApi.js
const API_AI_URL = "http://127.0.0.1:8000/api/v1/chatbot";

export async function streamChatbotResponse(body, onChunk) {
  console.log("Streaming chatbot response with body:", body);
  const response = await fetch(`${API_AI_URL}/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const reader = response.body.getReader();
  console.log("Response reader:", reader);
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    onChunk(decoder.decode(value));
  }
}

