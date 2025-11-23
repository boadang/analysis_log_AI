// src/pages/home.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/header";
import Footer from "../components/footer";

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayAttacks: 0,
    blockedIPs: 0,
    aiScore: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Giả lập fetch dữ liệu từ backend (sau này bạn thay bằng API thật)
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalLogs: 125843,
        todayAttacks: 87,
        blockedIPs: 42,
        aiScore: 94.7,
      });

      setRecentLogs([
        { time: "10:23:11", src: "192.168.10.45", dst: "203.0.113.5", action: "block", threat: "Brute Force", ai: 98 },
        { time: "10:22:58", src: "185.220.101.12", dst: "your-server", action: "block", threat: "Malware C2", ai: 99 },
        { time: "10:21:34", src: "45.32.158.99", dst: "your-server", action: "allow", threat: "Normal", ai: 12 },
        { time: "10:20:07", src: "112.45.67.89", dst: "your-server", action: "block", threat: "SQL Injection", ai: 96 },
      ]);

      setLoading(false);
    }, 1200);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Chào mừng, {user?.name || user?.username || "Admin"}!
            </h1>
            <p className="text-xl opacity-90">
              Hệ thống phân tích log FortiGate tích hợp AI thời gian thực
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Tổng log hôm nay</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {loading ? "..." : stats.totalLogs.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 p-4 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Tấn công phát hiện</p>
                  <p className="text-3xl font-bold text-red-600">{loading ? "..." : stats.todayAttacks}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">IP bị chặn</p>
                  <p className="text-3xl font-bold text-orange-600">{loading ? "..." : stats.blockedIPs}</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-full">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Độ chính xác AI</p>
                  <p className="text-3xl font-bold text-green-600">{loading ? "..." : stats.aiScore}%</p>
                </div>
                <div className="bg-green-100 p-4 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Threats Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Mối đe dọa gần đây (AI phân tích)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại tấn công</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
                  ) : (
                    recentLogs.map((log, i) => (
                      <tr key={i} className={log.ai > 90 ? "bg-red-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{log.src}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${log.action === "block" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.threat}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div className={`h-2 rounded-full ${log.ai > 90 ? "bg-red-600" : log.ai > 70 ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${log.ai}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{log.ai}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}