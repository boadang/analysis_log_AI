// ==========================================
// FindingsPanel.jsx - Complete Redesign
// ==========================================
import { useEffect, useState } from "react";

export default function FindingsPanel({ findings, summary }) {
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [sortBy, setSortBy] = useState("time"); // time, severity

  // Highlight animation cho findings mới
  useEffect(() => {
    if (!findings || findings.length === 0) return;

    const newIds = findings.slice(0, 3).map(f => f.id).filter(id => !highlightedIds.includes(id));
    if (newIds.length === 0) return;

    setHighlightedIds(prev => [...prev, ...newIds]);

    const timer = setTimeout(() => {
      setHighlightedIds(prev => prev.filter(id => !newIds.includes(id)));
    }, 3000);

    return () => clearTimeout(timer);
  }, [findings]);

  // Empty state
  if (!summary) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có Findings</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Kết quả phát hiện sẽ xuất hiện ở đây sau khi hunt được thực thi. Findings sẽ được cập nhật real-time.
        </p>
      </div>
    );
  }

  // Filter và search
  const filteredFindings = findings
    .filter(f => filter === "all" || f.severity === filter)
    .filter(f => 
      searchTerm === "" || 
      f.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.timestamp?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "severity") {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      },
      high: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
        icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      },
      medium: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
        icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      },
      low: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    };
    return configs[severity] || configs.low;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats với Interactive Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <FilterCard
          label="Tổng cộng"
          value={summary.total}
          color="blue"
          isActive={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterCard
          label="Critical"
          value={summary.critical}
          color="red"
          isActive={filter === "critical"}
          onClick={() => setFilter("critical")}
        />
        <FilterCard
          label="High"
          value={summary.high}
          color="orange"
          isActive={filter === "high"}
          onClick={() => setFilter("high")}
        />
        <FilterCard
          label="Medium"
          value={summary.medium}
          color="yellow"
          isActive={filter === "medium"}
          onClick={() => setFilter("medium")}
        />
        <FilterCard
          label="Low"
          value={summary.low}
          color="green"
          isActive={filter === "low"}
          onClick={() => setFilter("low")}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm findings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sắp xếp:</span>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="time">Thời gian</option>
            <option value="severity">Mức độ nghiêm trọng</option>
          </select>
        </div>

        {/* Export Button */}
        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Export CSV</span>
        </button>
      </div>

      {/* Findings List/Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Chi tiết Findings</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {filteredFindings.length} kết quả
                {filter !== "all" && ` • Lọc: ${filter}`}
                {searchTerm && ` • Tìm kiếm: "${searchTerm}"`}
              </p>
            </div>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFindings.map((f, index) => {
                const isNew = highlightedIds.includes(f.id);
                const config = getSeverityConfig(f.severity);
                
                return (
                  <tr
                    key={f.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      isNew ? "animate-pulse bg-blue-50" : ""
                    } ${selectedFinding?.id === f.id ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedFinding(f)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(f.timestamp).toLocaleTimeString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(f.timestamp).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {f.event}
                      </div>
                      {isNew && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1 animate-pulse"></span>
                          Mới
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                        </svg>
                        {f.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFinding(f);
                        }}
                      >
                        Chi tiết
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredFindings.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">Không tìm thấy findings phù hợp</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
}

// Filter Card Component
function FilterCard({ label, value, color, isActive, onClick }) {
  const colors = {
    blue: {
      active: "border-blue-500 bg-blue-50 shadow-blue-100",
      inactive: "border-gray-200 hover:border-blue-300",
      text: "text-blue-700",
      number: "text-blue-900"
    },
    red: {
      active: "border-red-500 bg-red-50 shadow-red-100",
      inactive: "border-gray-200 hover:border-red-300",
      text: "text-red-700",
      number: "text-red-900"
    },
    orange: {
      active: "border-orange-500 bg-orange-50 shadow-orange-100",
      inactive: "border-gray-200 hover:border-orange-300",
      text: "text-orange-700",
      number: "text-orange-900"
    },
    yellow: {
      active: "border-yellow-500 bg-yellow-50 shadow-yellow-100",
      inactive: "border-gray-200 hover:border-yellow-300",
      text: "text-yellow-700",
      number: "text-yellow-900"
    },
    green: {
      active: "border-green-500 bg-green-50 shadow-green-100",
      inactive: "border-gray-200 hover:border-green-300",
      text: "text-green-700",
      number: "text-green-900"
    }
  };

  const colorScheme = colors[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all text-center ${
        isActive ? `${colorScheme.active} shadow-lg` : `${colorScheme.inactive} hover:bg-gray-50`
      }`}
    >
      <div className={`text-3xl font-bold mb-1 ${isActive ? colorScheme.number : "text-gray-800"}`}>
        {value}
      </div>
      <div className={`text-sm font-medium ${isActive ? colorScheme.text : "text-gray-600"}`}>
        {label}
      </div>
    </button>
  );
}

// Finding Detail Modal
function FindingDetailModal({ finding, onClose }) {
  const config = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-600" },
    high: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", icon: "text-orange-600" },
    medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: "text-yellow-600" },
    low: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "text-blue-600" }
  }[finding.severity] || config.low;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-4 border-b-2 ${config.border} ${config.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
                <svg className={`w-6 h-6 ${config.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Finding Details</h3>
                <p className="text-sm text-gray-600">ID: {finding.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Severity Badge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
            <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 ${config.bg} ${config.text} ${config.border}`}>
              {finding.severity.toUpperCase()}
            </span>
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timestamp</label>
            <div className="text-gray-900">
              {new Date(finding.timestamp).toLocaleString('vi-VN')}
            </div>
          </div>

          {/* Event Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-900">
              {finding.event}
            </div>
          </div>

          {/* Additional Info */}
          {/* {finding.verdict && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verdict</label>
              <div className="text-gray-900">{finding.verdict}</div>
            </div>
          )} */}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Investigate
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              Mark as False Positive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
