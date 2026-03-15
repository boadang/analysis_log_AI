// ==========================================
// ConclusionPanel.jsx - Complete Redesign
// ==========================================
import { useState } from "react";

export default function ConclusionPanel({ onSave, disabled }) {
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [impactAssessment, setImpactAssessment] = useState("");
  const [affectedSystems, setAffectedSystems] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    if (!verdict || !confidence) {
      alert("Vui lòng chọn verdict và confidence level");
      return;
    }

    if (!notes.trim()) {
      alert("Vui lòng nhập ghi chú chi tiết");
      return;
    }

    setLoading(true);
    try {
      await onSave({ 
        verdict,
        confidence,
        recommendations
      });

      // Reset form sau khi lưu thành công
      setVerdict("");
      setConfidence("");
      setNotes("");
      setRecommendations("");
      setImpactAssessment("");
      setAffectedSystems("");
    } catch (error) {
      console.error(error);
      alert("Lưu kết luận thất bại");
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    let filled = 0;
    let total = 6;
    if (verdict) filled++;
    if (confidence) filled++;
    if (notes.trim()) filled++;
    if (recommendations.trim()) filled++;
    if (impactAssessment.trim()) filled++;
    if (affectedSystems.trim()) filled++;
    return Math.round((filled / total) * 100);
  };

  const completionPercent = getCompletionPercentage();
  const isFormValid = verdict && confidence && notes.trim();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Hoàn thiện Kết luận Hunt</h4>
              <p className="text-xs text-purple-700">Điền đầy đủ thông tin để đóng hunt session</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{completionPercent}%</div>
            <div className="text-xs text-purple-700">Hoàn thành</div>
          </div>
        </div>
        <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 transition-all duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Hướng dẫn viết kết luận:</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Xác định rõ verdict: đây có phải là mối đe dọa thực sự không?</li>
              <li>Đánh giá độ tin cậy dựa trên bằng chứng thu được</li>
              <li>Mô tả chi tiết findings và khuyến nghị hành động cụ thể</li>
              <li>Ghi chú các bài học kinh nghiệm cho hunt sau</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* Section 1: Verdict */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Final Verdict</h3>
              <p className="text-sm text-gray-600">Kết luận cuối cùng về hunt này</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VerdictCard
              title="Confirmed Threat"
              description="Mối đe dọa được xác nhận - cần hành động ngay"
              icon={(
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
              color="red"
              isSelected={verdict === "confirmed_threat"}
              onClick={() => !disabled && setVerdict("confirmed_threat")}
              disabled={disabled}
            />
            <VerdictCard
              title="False Positive"
              description="Báo động giả - không cần hành động thêm"
              icon={(
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
              color="green"
              isSelected={verdict === "false_positive"}
              onClick={() => !disabled && setVerdict("false_positive")}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Section 2: Confidence Level */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confidence Level</h3>
              <p className="text-sm text-gray-600">Mức độ tin cậy vào kết luận</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ConfidenceCard
              level="high"
              label="High"
              description="Chắc chắn > 90%"
              percentage="90-100%"
              icon="🎯"
              isSelected={confidence === "high"}
              onClick={() => !disabled && setConfidence("high")}
              disabled={disabled}
            />
            <ConfidenceCard
              level="medium"
              label="Medium"
              description="Khá chắc 60-90%"
              percentage="60-90%"
              icon="⚠️"
              isSelected={confidence === "medium"}
              onClick={() => !disabled && setConfidence("medium")}
              disabled={disabled}
            />
            <ConfidenceCard
              level="low"
              label="Low"
              description="Cần xác minh thêm"
              percentage="< 60%"
              icon="❓"
              isSelected={confidence === "low"}
              onClick={() => !disabled && setConfidence("low")}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Section 3: Impact Assessment */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Impact Assessment</h3>
              <p className="text-sm text-gray-600">Đánh giá mức độ tác động</p>
            </div>
          </div>

          <textarea
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="VD: Phát hiện 15 máy trạm bị nhiễm malware, ảnh hưởng đến phòng kế toán. Chưa có bằng chứng về data exfiltration..."
            value={impactAssessment}
            onChange={(e) => setImpactAssessment(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-2">
            Mô tả phạm vi và mức độ nghiêm trọng của tác động
          </p>
        </div>

        {/* Section 4: Affected Systems */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Affected Systems</h3>
              <p className="text-sm text-gray-600">Hệ thống bị ảnh hưởng</p>
            </div>
          </div>

          <textarea
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="VD: WIN-SERVER-01, WIN-CLIENT-05, 192.168.1.100-110, Domain Controller..."
            value={affectedSystems}
            onChange={(e) => setAffectedSystems(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-2">
            Liệt kê các server, workstation, IP addresses hoặc services bị ảnh hưởng
          </p>
        </div>

        {/* Section 5: Detailed Notes */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              5
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Detailed Notes <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">Ghi chú chi tiết về findings</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              notes.trim() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {notes.trim() ? "✓ Đã điền" : "Bắt buộc"}
            </span>
          </div>

          <textarea
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="Mô tả chi tiết:
- Timeline của sự việc
- Các artifacts và indicators phát hiện được
- Phương thức tấn công (nếu là threat)
- Root cause analysis
- Bài học kinh nghiệm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {notes.length} ký tự
            </p>
            {notes.length < 50 && notes.length > 0 && (
              <p className="text-xs text-orange-600">
                ⚠️ Nên viết ít nhất 50 ký tự
              </p>
            )}
          </div>
        </div>

        {/* Section 6: Recommendations */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
              6
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recommendations & Actions</h3>
              <p className="text-sm text-gray-600">Khuyến nghị và hành động tiếp theo</p>
            </div>
          </div>

          <textarea
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="Khuyến nghị hành động:
1. Immediate actions (Ngay lập tức): Isolate infected machines, block IOCs...
2. Short-term (Ngắn hạn): Patch vulnerabilities, update signatures...
3. Long-term (Dài hạn): Improve detection rules, security awareness training..."
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-2">
            Đề xuất các bước cụ thể để xử lý và ngăn chặn tái diễn
          </p>
        </div>
      </div>

      {/* Preview Toggle */}
      {isFormValid && (
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{showPreview ? "Ẩn xem trước" : "Xem trước báo cáo"}</span>
        </button>
      )}

      {/* Preview Section */}
      {showPreview && isFormValid && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Hunt Conclusion Report
          </h3>

          <div className="space-y-4 bg-white rounded-lg p-5 shadow-sm">
            <PreviewRow 
              label="Verdict" 
              value={verdict === "confirmed_threat" ? "🔴 Confirmed Threat" : "🟢 False Positive"}
              highlight={verdict === "confirmed_threat" ? "text-red-700 font-semibold" : "text-green-700 font-semibold"}
            />
            <PreviewRow 
              label="Confidence" 
              value={confidence.toUpperCase()}
              highlight={
                confidence === "high" ? "text-green-700 font-semibold" :
                confidence === "medium" ? "text-yellow-700 font-semibold" :
                "text-orange-700 font-semibold"
              }
            />
            {impactAssessment && <PreviewRow label="Impact" value={impactAssessment} />}
            {affectedSystems && <PreviewRow label="Affected Systems" value={affectedSystems} />}
            <PreviewRow label="Notes" value={notes} />
            {recommendations && <PreviewRow label="Recommendations" value={recommendations} />}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          disabled={disabled || loading || !isFormValid}
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lưu & Đóng Hunt</span>
            </>
          )}
        </button>

        {!disabled && !loading && (
          <button
            type="button"
            className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (window.confirm("Bạn có chắc muốn xóa tất cả nội dung đã nhập?")) {
                setVerdict("");
                setConfidence("");
                setNotes("");
                setRecommendations("");
                setImpactAssessment("");
                setAffectedSystems("");
              }
            }}
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Validation Warning */}
      {!isFormValid && (verdict || confidence || notes) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3 text-sm text-yellow-800">
              <p className="font-medium">Chưa đủ thông tin để lưu</p>
              <p className="mt-1">Vui lòng điền đầy đủ: Verdict, Confidence Level và Detailed Notes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Verdict Card Component
function VerdictCard({ title, description, icon, color, isSelected, onClick, disabled }) {
  const colorSchemes = {
    red: {
      border: "border-red-500",
      bg: "bg-red-50",
      hover: "hover:border-red-400",
      text: "text-red-700",
      iconBg: "bg-red-100"
    },
    green: {
      border: "border-green-500",
      bg: "bg-green-50",
      hover: "hover:border-green-400",
      text: "text-green-700",
      iconBg: "bg-green-100"
    }
  };

  const scheme = colorSchemes[color];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-5 rounded-xl border-2 transition-all text-left ${
        isSelected 
          ? `${scheme.border} ${scheme.bg} shadow-lg` 
          : `border-gray-300 hover:bg-gray-50 ${scheme.hover}`
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-3 rounded-lg ${scheme.iconBg}`}>
          <svg className={`w-6 h-6 ${scheme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            {isSelected && (
              <svg className={`w-5 h-5 ${scheme.text}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}

// Confidence Card Component
function ConfidenceCard({ level, label, description, percentage, icon, isSelected, onClick, disabled }) {
  const colorSchemes = {
    high: { border: "border-green-500", bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
    medium: { border: "border-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-200" },
    low: { border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" }
  };

  const scheme = colorSchemes[level];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-5 rounded-xl border-2 transition-all ${
        isSelected 
          ? `${scheme.border} ${scheme.bg} shadow-lg ring-4 ${scheme.ring}` 
          : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
        <p className="text-xs text-gray-600 mb-2">{description}</p>
        <div className={`text-sm font-medium ${isSelected ? scheme.text : "text-gray-500"}`}>
          {percentage}
        </div>
      </div>
    </button>
  );
}

// Preview Row Component
function PreviewRow({ label, value, highlight }) {
  return (
    <div className="border-b border-gray-200 pb-3 last:border-0">
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className={`text-gray-900 whitespace-pre-wrap ${highlight || ""}`}>
        {value}
      </div>
    </div>
  );
}