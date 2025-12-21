import { useState, useEffect } from "react";

export default function ThreatHuntHistoryPage({ onViewHunt, onCreateNew }) {
  const [hunts, setHunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadHunts();
  }, []);

  const loadHunts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/threat_hunt/hunts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Loaded hunts:", data);
        setHunts(data.items || []);
      }
    } catch (error) {
      console.error("❌ Failed to load hunts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHunts = hunts
    .filter((h) => filter === "all" || h.status === filter)
    .filter((h) => {
      if (!searchTerm) return true;
      return (
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.hypothesis?.hypothesis?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  const stats = {
    total: hunts.length,
    created: hunts.filter((h) => h.status === "created").length,
    running: hunts.filter((h) => h.status === "running").length,
    completed: hunts.filter((h) => h.status === "completed").length,
    closed: hunts.filter((h) => h.status === "closed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-700 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4">Threat Hunt History</h1>
              <p className="text-xl opacity-90">
                Quản lý và xem lại tất cả các phiên hunt đã thực hiện
              </p>
            </div>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tạo Hunt Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard
            title="Tổng Hunt Sessions"
            value={stats.total}
            iconColor="blue"
            onClick={() => setFilter("all")}
            isActive={filter === "all"}
          />
          <StatCard
            title="Đã tạo"
            value={stats.created}
            iconColor="gray"
            onClick={() => setFilter("created")}
            isActive={filter === "created"}
          />
          <StatCard
            title="Đang chạy"
            value={stats.running}
            iconColor="orange"
            onClick={() => setFilter("running")}
            isActive={filter === "running"}
          />
          <StatCard
            title="Hoàn thành"
            value={stats.completed}
            iconColor="green"
            onClick={() => setFilter("completed")}
            isActive={filter === "completed"}
          />
          <StatCard
            title="Đã đóng"
            value={stats.closed}
            iconColor="purple"
            onClick={() => setFilter("closed")}
            isActive={filter === "closed"}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-4 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm hunt theo tên hoặc giả thuyết..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Hunt Sessions Table */}
        <HuntSessionsTable hunts={filteredHunts} onViewHunt={onViewHunt} />
      </div>
    </div>
  );
}

function StatCard({ title, value, iconColor, onClick, isActive }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all hover:shadow-xl ${
        isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${colors[iconColor]}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

function HuntSessionsTable({ hunts, onViewHunt }) {
  const [selectedHunt, setSelectedHunt] = useState(null);

  const getStatusBadge = (status) => {
    const configs = {
      created: { bg: "bg-gray-100", text: "text-gray-800", label: "Đã tạo" },
      running: { bg: "bg-orange-100", text: "text-orange-800", label: "Đang chạy" },
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Hoàn thành" },
      closed: { bg: "bg-purple-100", text: "text-purple-800", label: "Đã đóng" },
    };
    return configs[status] || configs.created;
  };

  const getEnvironmentBadge = (env) => {
    const configs = {
      prod: { bg: "bg-red-100", text: "text-red-800", label: "Production" },
      dev: { bg: "bg-blue-100", text: "text-blue-800", label: "Development" },
      lab: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Lab" },
    };
    return configs[env] || configs.lab;
  };

  if (hunts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-500 text-lg">Không tìm thấy hunt session nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            Danh sách Hunt Sessions ({hunts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hunt Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Môi trường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Findings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hunts.map((hunt) => {
                const statusConfig = getStatusBadge(hunt.status);
                const envConfig = getEnvironmentBadge(hunt.environment);
                const findings = hunt.findings_summary || { total: 0, by_severity: {} };

                return (
                  <tr
                    key={hunt.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedHunt(hunt)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {hunt.name || `Hunt #${hunt.id}`}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {hunt.hypothesis?.hypothesis || "Chưa có giả thuyết"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${envConfig.bg} ${envConfig.text}`}
                      >
                        {envConfig.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{findings.total}</span>
                        <div className="flex space-x-1">
                          {findings.by_severity?.critical > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                              C:{findings.by_severity.critical}
                            </span>
                          )}
                          {findings.by_severity?.high > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                              H:{findings.by_severity.high}
                            </span>
                          )}
                          {findings.by_severity?.medium > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                              M:{findings.by_severity.medium}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {hunt.time_range_start
                        ? new Date(hunt.time_range_start).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewHunt && onViewHunt(hunt.id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHunt && (
        <HuntDetailModal
          hunt={selectedHunt}
          onClose={() => setSelectedHunt(null)}
          onView={() => onViewHunt && onViewHunt(selectedHunt.id)}
        />
      )}
    </>
  );
}

function HuntDetailModal({ hunt, onClose, onView }) {
  const statusConfig = {
    created: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800" },
    running: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800" },
    completed: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
    closed: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800" },
  }[hunt.status] || { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800" };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b-2 ${statusConfig.border} ${statusConfig.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {hunt.name || `Hunt #${hunt.id}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">Hunt ID: {hunt.id}</p>
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

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <span
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {hunt.status.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Môi trường</label>
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 bg-blue-50 text-blue-800 border-blue-200">
                {hunt.environment?.toUpperCase() || "N/A"}
              </span>
            </div>
          </div>

          {hunt.hypothesis && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giả thuyết</label>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-900 border border-gray-200">
                {hunt.hypothesis.hypothesis}
              </div>
            </div>
          )}

          {hunt.findings_summary && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tổng quan Findings</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{hunt.findings_summary.total}</p>
                    <p className="text-xs text-gray-600">Tổng</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {hunt.findings_summary.by_severity?.critical || 0}
                    </p>
                    <p className="text-xs text-gray-600">Critical</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {hunt.findings_summary.by_severity?.high || 0}
                    </p>
                    <p className="text-xs text-gray-600">High</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {hunt.findings_summary.by_severity?.medium || 0}
                    </p>
                    <p className="text-xs text-gray-600">Medium</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {hunt.findings_summary.by_severity?.low || 0}
                    </p>
                    <p className="text-xs text-gray-600">Low</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hunt.conclusion && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kết luận</label>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-900 border border-gray-200">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Verdict: </span>
                  <span className="font-semibold">{hunt.conclusion.verdict}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Risk Level: </span>
                  <span className="font-semibold">{hunt.conclusion.risk_level}</span>
                </div>
                {hunt.conclusion.recommendation && (
                  <p className="text-sm text-gray-700 mt-2">{hunt.conclusion.recommendation}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onView}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem chi tiết đầy đủ
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}