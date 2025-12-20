// ==========================================
// ExecutePanel.jsx - Redesigned
// ==========================================
import {useState} from 'react';

export default function ExecutePanel({ onExecute, onPause, onStop, execution, disabled }) {
  const [mode, setMode] = useState("ai-assisted");
  const [strategy, setStrategy] = useState("behavioral");
  const [depth, setDepth] = useState("standard");

  const progressPercent =
    execution.total > 0 ? Math.round((execution.processed / execution.total) * 100) : 0;

  const isRunning = execution.status === "running";
  const isCompleted = execution.status === "completed";
  const isFailed = execution.status === "failed";

  const handleExecute = () => {
    onExecute({ mode, strategy, depth });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hunt Mode
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          >
            <option value="ai-assisted">AI-Assisted</option>
            <option value="manual">Manual</option>
            <option value="automated">Automated</option>
          </select>
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strategy
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            disabled={isRunning}
          >
            <option value="behavioral">Behavioral</option>
            <option value="signature">Signature-based</option>
            <option value="anomaly">Anomaly Detection</option>
          </select>
        </div>

        {/* Depth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Depth
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            disabled={isRunning}
          >
            <option value="quick">Quick Scan</option>
            <option value="standard">Standard</option>
            <option value="deep">Deep Analysis</option>
          </select>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isRunning ? "bg-yellow-500 animate-pulse" :
              isCompleted ? "bg-green-500" :
              isFailed ? "bg-red-500" :
              "bg-gray-400"
            }`} />
            <span className="text-lg font-semibold text-gray-800">
              Trạng thái: {
                isRunning ? "Đang chạy..." :
                isCompleted ? "Hoàn thành" :
                isFailed ? "Thất bại" :
                "Chưa bắt đầu"
              }
            </span>
          </div>
          
          {isRunning && (
            <span className="text-sm text-gray-600">
              {execution.processed} / {execution.total} records
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Đã xử lý: {execution.processed}</span>
              <span className="font-medium">{progressPercent}%</span>
              <span>Tổng: {execution.total}</span>
            </div>
          </div>
        )}

        {/* Completed Message */}
        {isCompleted && (
          <div className="flex items-center text-green-700 bg-green-50 rounded-lg p-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Hunt đã hoàn thành thành công!</span>
          </div>
        )}

        {/* Failed Message */}
        {isFailed && (
          <div className="flex items-center text-red-700 bg-red-50 rounded-lg p-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Hunt thất bại. Vui lòng thử lại.</span>
          </div>
        )}
      </div>

      {/* Execute Button */}
      <div className="flex justify-end space-x-3">
        {!isRunning && (
          <button
            type="button"
            className="flex items-center space-x-2 px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors shadow-lg"
            disabled={disabled}
            onClick={handleExecute}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Bắt đầu Hunt</span>
          </button>
        )}

        {isRunning && (
          <>
            <button
              type="button"
              onClick={() => onPause(execution.id)}
              className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition shadow"
            >
              Tạm dừng
            </button>

            <button
              type="button"
              onClick={() => onStop(execution.id)}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow"
            >
              Dừng Hunt
            </button>
          </>
        )}
      </div>
    </div>
  );
}