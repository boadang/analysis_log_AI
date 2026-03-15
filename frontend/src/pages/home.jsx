import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import getHomeData from "../services/homeApi";
import { InfoItem } from "../components/InfoItem";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalLogs: 0,
    detectedThreats: 0,
    datasets: 0,
    aiScore: 0,
  });

  const [recentLogs, setRecentLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchHomeData = async () => {
      try {
        const res = await getHomeData();
        console.log(res)

        setStats({
          totalLogs: res.stats.total_logs,
          detectedThreats: res.stats.detected_threats,
          datasets: res.stats.datasets,
          aiScore: res.stats.ai_score,
        });

        setRecentLogs(res.recent_logs || []);
      } catch (err) {
        console.error("Fetch home data failed", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

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

        <div className="max-w-7xl mx-auto px-4 -mt-10 mb-12">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Tổng quan phân tích log tường lửa
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Hệ thống thu thập và phân tích log từ FortiGate Firewall nhằm phát hiện
              các hành vi bất thường, truy cập trái phép và mối đe dọa bảo mật.
              Log được xử lý theo thời gian thực và đánh giá mức độ rủi ro bằng mô hình AI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <InfoItem title="Nguồn log" value="Traffic / Security / System" />
              <InfoItem title="Cơ chế phân tích" value="Rule-based + AI Model" />
              <InfoItem title="Thời gian xử lý" value="Near Realtime" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Tổng log phân tích"
              value={stats.totalLogs.toLocaleString()}
              iconColor="blue"
            />

            <StatCard
              title="Mối đe dọa phát hiện"
              value={stats.detectedThreats}
              iconColor="red"
            />

            <StatCard
              title="Dataset"
              value={stats.datasets}
              iconColor="orange"
            />

            <StatCard
              title="Độ chính xác AI"
              value={`${stats.aiScore}%`}
              iconColor="green"
            />
          </div>

          {/* Recent Logs */}
          <RecentLogsTable logs={recentLogs} />
        </div>
      </div>
    </>
  );
}

/* ===================== COMPONENTS ===================== */

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
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function RecentLogsTable({ logs }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Log phân tích gần đây
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nguồn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Loại đe dọa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                AI Score
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Chưa có log phân tích
                </td>
              </tr>
            )}

            {logs.map((log, i) => (
              <tr key={i} className={log.ai > 90 ? "bg-red-50" : ""}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {log.time}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">
                  {log.src || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      log.action === "block"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {log.action || "unknown"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.threat || "Unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          log.ai > 90
                            ? "bg-red-600"
                            : log.ai > 70
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${log.ai || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {log.ai || 0}%
                    </span>
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
