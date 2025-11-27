// src/pages/ThreatHunting.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ThreatHuntingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterThreat, setFilterThreat] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  // auth check
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Dummy data (sau này thay API / MongoDB)
  useEffect(() => {
    setTimeout(() => {
      setLogs([
        {
          timestamp: "2025-11-20 15:34:22",
          source_ip: "192.168.10.45",
          dest_ip: "8.8.8.8",
          protocol: "UDP",
          action: "block",
          threat_type: "DNS_Tunneling",
          ai_confidence: 94,
        },
        {
          timestamp: "2025-11-20 15:31:14",
          source_ip: "185.200.12.11",
          dest_ip: "10.10.10.10",
          protocol: "TCP",
          action: "allow",
          threat_type: "BruteForce",
          ai_confidence: 88,
        },
        {
          timestamp: "2025-11-20 15:29:44",
          source_ip: "45.72.91.101",
          dest_ip: "10.10.10.50",
          protocol: "TCP",
          action: "block",
          threat_type: "SQL_Injection",
          ai_confidence: 98,
        },
      ]);

      setLoadingData(false);
    }, 1200);
  }, []);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700">Loading Threat Hunting…</p>
      </div>
    );
  }

  // Filtering logic
  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      query === "" ||
      log.source_ip.includes(query) ||
      log.dest_ip.includes(query) ||
      log.threat_type.toLowerCase().includes(query.toLowerCase());

    const matchesAction =
      filterAction === "all" || log.action === filterAction;

    const matchesThreat =
      filterThreat === "all" || log.threat_type === filterThreat;

    return matchesQuery && matchesAction && matchesThreat;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header section giống Home */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Threat Hunting</h1>
          <p className="opacity-90">
            Chủ động săn tìm mối đe dọa dựa trên AI và phân tích hành vi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Bộ lọc & Tìm kiếm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Box */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Tìm kiếm</p>
              <input
                type="text"
                placeholder="IP nguồn, IP đích, Threat type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter by Action */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Hành động</p>
              <select
                className="w-full p-3 border rounded-lg"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="allow">Allow</option>
                <option value="block">Block</option>
                <option value="drop">Drop</option>
              </select>
            </div>

            {/* Filter by Threat */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Loại mối đe dọa</p>
              <select
                className="w-full p-3 border rounded-lg"
                value={filterThreat}
                onChange={(e) => setFilterThreat(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="DNS_Tunneling">DNS Tunneling</option>
                <option value="BruteForce">Brute Force</option>
                <option value="SQL_Injection">SQL Injection</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Kết quả Threat Hunting
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Source IP
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Dest IP
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Protocol
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Threat
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    AI Score
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className={log.ai_confidence > 90 ? "bg-red-50" : ""}>
                    <td className="px-6 py-3 text-sm">{log.timestamp}</td>
                    <td className="px-6 py-3 text-sm font-mono">{log.source_ip}</td>
                    <td className="px-6 py-3 text-sm font-mono">{log.dest_ip}</td>
                    <td className="px-6 py-3 text-sm">{log.protocol}</td>

                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          log.action === "block"
                            ? "bg-red-100 text-red-800"
                            : log.action === "allow"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-3 text-sm">{log.threat_type}</td>

                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              log.ai_confidence > 90
                                ? "bg-red-600"
                                : log.ai_confidence > 70
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${log.ai_confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {log.ai_confidence}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
