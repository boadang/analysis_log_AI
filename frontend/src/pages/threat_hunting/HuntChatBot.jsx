import { useState, useRef, useEffect } from "react";

export default function HuntChatBot({ huntId, findings, hypothesis }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Scroll xuống cuối khi có message mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Placeholder: auto welcome message
  useEffect(() => {
    if (huntId) {
      setMessages([
        { role: "bot", text: "🤖 Hunt Assistant online. Ask me about this hunt!" },
      ]);
    }
  }, [huntId]);

  const sendMessage = () => {
    if (!input.trim()) return;

    // append user message
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    // simulate bot response (sau này thay bằng API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `You asked: "${input}". (AI answer placeholder)` },
      ]);
    }, 500);

    setInput("");
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">🤖 Hunt Assistant</h2>

      {/* Chat area */}
      <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-lg max-w-xs ${
              msg.role === "user"
                ? "bg-blue-100 text-blue-800 self-end ml-auto"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask about this hunt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </section>
  );
}
