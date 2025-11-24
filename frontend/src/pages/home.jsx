// src/pages/home.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalLogs: 0,
    todayAttacks: 0,
    blockedIPs: 0,
    aiScore: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Check auth: nếu chưa login → redirect
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch dữ liệu giả lập (sau này thay bằng API thật)
  useEffect(() => {
    const timer = setTimeout(() => {
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

      setDataLoading(false);
    }, 1200);

    return () => clearTimeout(timer); // cleanup tránh memory leak
  }, []); // chỉ chạy 1 lần khi mount

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700 text-lg">Loading...</p>
      </div>
    );
  }

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
            {/* Total Logs */}
            <StatCard title="Tổng log hôm nay" value={stats.totalLogs.toLocaleString()} iconColor="blue" />
            {/* Today Attacks */}
            <StatCard title="Tấn công phát hiện" value={stats.todayAttacks} iconColor="red" />
            {/* Blocked IPs */}
            <StatCard title="IP bị chặn" value={stats.blockedIPs} iconColor="orange" />
            {/* AI Score */}
            <StatCard title="Độ chính xác AI" value={`${stats.aiScore}%`} iconColor="green" />
          </div>

          {/* Recent Threats Table */}
          <RecentLogsTable logs={recentLogs} />
        </div>
      </div>    
    </>
  );
}

// Component nhỏ cho Stats Card
function StatCard({ title, value, iconColor }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${colors[iconColor]}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Component nhỏ cho Recent Logs Table
function RecentLogsTable({ logs }) {
  return (
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
            {logs.map((log, i) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
