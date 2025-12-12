// frontend/src/components/chatbot.jsx
import { useState, useEffect, useRef } from 'react';
import { streamChatbotResponse } from '../services/AI/chatbotApi';

export default function Chatbot({ analysisData }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
      if (analysisData) console.log("Chatbot got analysisData:", analysisData);
    }, [analysisData]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    const prompt = input;
    setInput('');
    setIsTyping(true);

    // Tạo 1 bot message rỗng
    let botIndex;
    setMessages(prev => {
      botIndex = prev.length;
      return [...prev, { sender: "bot", text: "" }];
    });

    await streamChatbotResponse(
      { message: prompt, history: [], context: analysisData || {} },
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[botIndex] = {
            sender: "bot",
            text: updated[botIndex].text + chunk // append chunk
          };
          return updated;
        });
      }
    );

    setIsTyping(false);
  };


  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          AI Chat
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 w-80 md:w-96 bg-white border shadow-xl rounded-xl
            flex flex-col overflow-hidden transition-all duration-300 ease-out
            ${minimized ? "h-14" : "h-96"}
            ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >

          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <span className="font-semibold">AI Assistant</span>

            <div className="flex gap-3">
              {/* Minimize button */}
              <button onClick={() => setMinimized(!minimized)}>
                {minimized ? "🔼" : "🔽"}
              </button>

              {/* Close */}
              <button onClick={() => setOpen(false)}>✖</button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`
                        px-3 py-2 rounded-lg max-w-[75%] whitespace-pre-wrap
                        ${msg.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border text-gray-900 shadow-sm"}
                      `}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-2 px-4 rounded-lg border shadow-sm flex items-center gap-2">
                      <div className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}></div>
              </div>

              {/* Input */}
              <div className="p-3 flex gap-2 border-t bg-white">
                <input
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Nhập tin nhắn..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700"
                >
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Typing indicator animation CSS */}
      <style>{`
        .dot { animation: bounce 1s infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-5px) }
        }
      `}</style>
    </>
  );
}
