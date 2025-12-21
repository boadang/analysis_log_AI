// ExecutePanel.jsx
import { useState } from "react";

export default function ExecutePanel({ disabled, execution, onExecute, onPause, onStop }) {
  // FIX: Sử dụng đúng giá trị theo backend schema
  const [mode, setMode] = useState("ai-assisted");
  const [depth, setDepth] = useState("standard");
  const [strategy, setStrategy] = useState("ai_powered");

  const handleExecute = () => {
    // Validate trước khi gửi
    if (!mode || !depth) {
      alert("❌ Vui lòng chọn đầy đủ Mode và Depth");
      return;
    }

    const payload = {
      mode: mode,           // KHÔNG được null
      depth: depth,         // KHÔNG được null
      strategy: strategy    // Có thể null
    };

    console.log("🚀 [ExecutePanel] Sending payload:", payload);
    onExecute(payload);
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Execution Mode *
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={disabled || execution.status === "running"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="ai-assisted">AI-Assisted</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Depth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Depth *
          </label>
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            disabled={disabled || execution.status === "running"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="quick">Quick Scan</option>
            <option value="standard">Standard</option>
            <option value="deep">Deep Analysis</option>
          </select>
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hunt Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            disabled={disabled || execution.status === "running"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="ai_powered">AI-Powered</option>
            <option value="rule_based">Rule-Based</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      {execution.status === "running" && execution.total > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Đang phân tích... {execution.processed}/{execution.total} logs
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round((execution.processed / execution.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(execution.processed / execution.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {execution.status === "idle" || execution.status === "completed" || execution.status === "failed" || execution.status === "stopped" ? (
          <button
            onClick={handleExecute}
            disabled={disabled}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              disabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Bắt đầu Hunt</span>
          </button>
        ) : execution.status === "running" ? (
          <>
            <button
              onClick={onPause}
              className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tạm dừng</span>
            </button>
            <button
              onClick={onStop}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>Dừng hẳn</span>
            </button>
          </>
        ) : execution.status === "paused" ? (
          <>
            <button
              onClick={handleExecute}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span>Tiếp tục</span>
            </button>
            <button
              onClick={onStop}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Dừng hẳn
            </button>
          </>
        ) : null}
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center">
        <StatusBadge status={execution.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    idle: { bg: "bg-gray-100", text: "text-gray-700", label: "Chưa chạy" },
    queued: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang chờ..." },
    running: { bg: "bg-green-100", text: "text-green-700", label: "Đang chạy", pulse: true },
    paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Đã tạm dừng" },
    stopped: { bg: "bg-red-100", text: "text-red-700", label: "Đã dừng" },
    completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Hoàn thành" },
    failed: { bg: "bg-red-100", text: "text-red-700", label: "Thất bại" },
  };

  const config = configs[status] || configs.idle;

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full ${config.bg} ${config.text}`}>
      {config.pulse && (
        <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></span>
      )}
      <span className="font-medium">{config.label}</span>
    </div>
  );
}