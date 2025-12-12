//frontend/src/pages/ai_analysis.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AIAnalysisPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [uploadedLogId, setUploadedLogId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [firewallType, setFirewallType] = useState('fortigate');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [jobName, setJobName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // =================================
  // 1. Check login
  // =================================
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // =================================
  // 2. Load available models
  // =================================
  useEffect(() => {
    setAvailableModels([
      { id: 1, name: 'qwen2.5:3b', description: 'Model mặc định', accuracy: 94.7 },
      { id: 2, name: 'phi3', description: 'Model nhỏ gọn', accuracy: 89.2 },
      { id: 3, name: 'mistral', description: 'Model mạnh', accuracy: 96.3 },
      { id: 4, name: 'fortigate-finetuned', description: 'fine-tuned cho FortiGate', accuracy: 98.1 },
    ]);
  }, []);

  // =================================
  // 3. Fetch recent jobs (có reason_stats)
  // =================================
  useEffect(() => {
    async function fetchRecentJobs() {
      try {
        const res = await axios.get("http://localhost:8000/api/v1/analysis/jobs?limit=10");
        setRecentJobs(res.data);
      } catch (err) {
        console.error("[UI] Fetch recent jobs error:", err);
      }
    }

    fetchRecentJobs();
  }, [isAnalyzing]); // refresh khi tạo job mới

  // =================================
  // 4. Upload file
  // =================================
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const form = new FormData();
    form.append("file", file);
    form.append("firewall_type", firewallType);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/v1/analysis/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadedLogId(res.data.file_path);
      // if (res.data.suggested_job_name) setJobName(res.data.suggested_job_name);
    } catch (err) {
      console.error("[UI] Upload error:", err);
      alert("Lỗi upload file.");
    }
  };

  // =================================
  // 5. Start analysis
  // =================================
  const handleStartAnalysis = async () => {
    if (!uploadedLogId || !jobName) {
      alert("Bạn phải upload file và có job name!");
      return;
    }

    setIsAnalyzing(true);

    console.log("[UI] Starting analysis with:", {
        file_path: uploadedLogId,
        model_name: selectedModel,
        job_name: jobName,
        time_range_from: null,
        time_range_to: null,
        device_ids: []
      });
    try {
      await axios.post("http://localhost:8000/api/v1/analysis/run-analysis", {
        file_path: uploadedLogId,
        model_name: selectedModel,
        job_name: jobName,
        time_range_from: null,
        time_range_to: null,
        device_ids: [],
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      }
    );
      setIsAnalyzing(false);
      setSelectedFile(null);
      setJobName("");
      setUploadedLogId(null);
    } catch (err) {
      console.error("[UI] run-analysis ERROR:", err);
      alert("Lỗi khi tạo job phân tích.");
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <p className="text-gray-700 text-lg">Loading...</p>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">AI Log Analysis</h1>
          <p className="text-lg opacity-90">Upload file log → AI phân tích mối đe dọa</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {/* UPLOAD */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Log File</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer">
              <input
                type="file"
                id="logFile"
                accept=".log,.txt,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="logFile" className="cursor-pointer">
                <p className="mt-2 text-sm text-gray-600">
                  {selectedFile ? (
                    <span className="font-medium text-blue-600">{selectedFile.name}</span>
                  ) : (
                    <>Click để chọn file hoặc kéo thả vào đây</>
                  )}
                </p>
              </label>
            </div>

            {/* JOB NAME */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Tên Job</label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Ví dụ: Fortigate Morning Scan"
                className="w-full border p-3 rounded-md"
              />
            </div>

            {/* FIREWALL TYPE */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Loại Firewall</label>
              <select
                value={firewallType}
                onChange={(e) => setFirewallType(e.target.value)}
                className="w-full border p-3 rounded-md"
              >
                <option value="fortigate">FortiGate</option>
                <option value="paloalto">Palo Alto</option>
                <option value="cisco">Cisco ASA</option>
                <option value="checkpoint">Check Point</option>
              </select>
            </div>
          </div>

          {/* MODELS */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Chọn Model</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.name)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selectedModel === model.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <h3 className="font-semibold">{model.name}</h3>
                  <p className="text-sm text-gray-600">{model.description}</p>
                </div>
              ))}
            </div>
          </div>

         {/* START ANALYSIS */}
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || !uploadedLogId}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold "
          >
            {isAnalyzing ? "Đang xử lý..." : "Bắt đầu phân tích"}
          </button>

          {/* Recent Jobs + Reason Stats */}
          <div className="bg-white rounded-xl shadow-lg border p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Recent Analysis Jobs</h2>
            {recentJobs.length === 0 ? (
              <p className="text-gray-500">Không có job nào.</p>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 bg-gray-50">
                    <p><strong>ID:</strong> {job.id} | <strong>Status:</strong> {job.status}</p>
                    <p><strong>Total Logs:</strong> {job.total_logs} | <strong>Threats:</strong> {job.detected_threats}</p>
                    {job.reason_stats && Object.keys(job.reason_stats).length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700">Threat Reasons:</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {Object.entries(job.reason_stats).map(([reason, count]) => (
                            <li key={reason}>{reason}: {count}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Thống kê nhanh</h3>
            <StatItem label="Total Jobs" value={recentJobs.length} color="blue" />
            <StatItem label="Active Models" value={availableModels.length} color="green" />
            <StatItem label="Avg Accuracy" value="94.7%" color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
  };
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
}