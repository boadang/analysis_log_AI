// ==========================================
// HypothesisPanel.jsx - Redesigned
// ==========================================
import { useState } from "react";

export default function HypothesisPanel({ onSave, disabled }) {
  const [text, setText] = useState("");
  const [techniqueId, setTechniqueId] = useState("");
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      alert("Vui lòng nhập giả thuyết");
      return;
    }

    setLoading(true);
    try {
      await onSave({ 
        hypothesis: text, 
        techniques: techniqueId ? [techniqueId] : [],
        rationale 
      });
      // Reset form sau khi lưu thành công
      setText("");
      setTechniqueId("");
      setRationale("");
    } catch (error) {
      console.error(error);
      alert("Lưu giả thuyết thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hypothesis Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Giả thuyết <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="VD: Attacker đang sử dụng PowerShell để thực thi payload độc hại với technique obfuscation..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          Mô tả chi tiết giả thuyết về mối đe dọa mà bạn đang tìm kiếm
        </p>
      </div>

      {/* MITRE ATT&CK Technique */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          MITRE ATT&CK Technique ID
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="VD: T1059.001"
            value={techniqueId}
            onChange={(e) => setTechniqueId(e.target.value)}
            disabled={disabled}
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Technique ID từ MITRE ATT&CK framework (tùy chọn)
        </p>
      </div>

      {/* Rationale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lý do & Bằng chứng
        </label>
        <textarea
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="Giải thích tại sao bạn tin rằng giả thuyết này có thể xảy ra, dựa trên các chỉ báo hoặc bằng chứng nào..."
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3 text-sm text-blue-800">
            <p className="font-medium">Mẹo xây dựng giả thuyết tốt:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Rõ ràng và có thể kiểm chứng được</li>
              <li>Dựa trên threat intelligence hoặc indicators</li>
              <li>Xác định rõ artifacts cần tìm kiếm</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          disabled={disabled || loading}
          onClick={handleSave}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Lưu giả thuyết</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}