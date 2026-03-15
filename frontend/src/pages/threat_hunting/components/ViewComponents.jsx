// =========================
// VIEW COMPONENTS (Read-only)
// =========================
export function ViewHuntScope({ data }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tên Hunt</label>
        <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
          {data.name || "N/A"}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
        <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
          {data.description || "Không có mô tả"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Môi trường</label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
            {data.environment?.toUpperCase()}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dataset ID</label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
            {data.dataset_id}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian bắt đầu</label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
            {data.time_range_start
              ? new Date(data.time_range_start).toLocaleString("vi-VN")
              : "N/A"}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian kết thúc</label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
            {data.time_range_end
              ? new Date(data.time_range_end).toLocaleString("vi-VN")
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ViewHypothesis({ data }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Giả thuyết</label>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-900 border border-gray-200">
          {data.hypothesis}
        </div>
      </div>
      {data.techniques && data.techniques.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MITRE ATT&CK Techniques
          </label>
          <div className="flex flex-wrap gap-2">
            {data.techniques.map((tech, i) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ViewConclusion({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verdict</label>
          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            {data.verdict?.toUpperCase()}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
          <span className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">
            {data.risk_level?.toUpperCase()}
          </span>
        </div>
      </div>
      {data.recommendation && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Khuyến nghị</label>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-900 border border-gray-200">
            {data.recommendation}
          </div>
        </div>
      )}
      {data.closed_at && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian đóng</label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border border-gray-200">
            {new Date(data.closed_at).toLocaleString("vi-VN")}
          </div>
        </div>
      )}
    </div>
  );
}