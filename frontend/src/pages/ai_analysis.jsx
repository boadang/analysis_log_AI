import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AIAnalysisPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [firewallType, setFirewallType] = useState('fortigate');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [jobName, setJobName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // Check auth
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load available models
  useEffect(() => {
    // Giả lập API call để lấy danh sách models
    setAvailableModels([
      { id: 1, name: 'llama3.2', base: 'llama3.2', description: 'Model mặc định, cân bằng tốc độ và độ chính xác', accuracy: 94.7, speed: 'fast' },
      { id: 2, name: 'phi3', base: 'phi3', description: 'Model nhỏ gọn, xử lý nhanh', accuracy: 89.2, speed: 'very fast' },
      { id: 3, name: 'mistral', base: 'mistral', description: 'Model mạnh mẽ, độ chính xác cao', accuracy: 96.3, speed: 'medium' },
      { id: 4, name: 'fortigate-finetuned', base: 'llama3.2', description: 'Fine-tuned cho FortiGate logs', accuracy: 98.1, speed: 'fast' },
    ]);

    // Load recent jobs
    setRecentJobs([
      { id: 7, name: 'Morning Analysis', model: 'llama3.2', status: 'completed', threats: 87, total: 12540, time: '2h ago' },
      { id: 6, name: 'Security Scan', model: 'phi3', status: 'completed', threats: 42, total: 8320, time: '5h ago' },
      { id: 5, name: 'Weekly Check', model: 'fortigate-finetuned', status: 'failed', threats: 0, total: 0, time: '1d ago' },
    ]);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!jobName) {
        setJobName(`Analysis ${new Date().toLocaleDateString('vi-VN')}`);
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile || !jobName) {
      alert('Vui lòng chọn file và nhập tên job!');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Giả lập quá trình phân tích
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          alert('Phân tích hoàn tất! Kiểm tra tab "Recent Jobs" để xem kết quả.');
          // Reset form
          setSelectedFile(null);
          setJobName('');
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // TODO: Thay bằng API call thật
    // const formData = new FormData();
    // formData.append('file', selectedFile);
    // formData.append('firewall_type', firewallType);
    // formData.append('model_name', selectedModel);
    // formData.append('job_name', jobName);
    // const response = await axios.post('/api/v1/analysis/upload', formData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">AI Log Analysis</h1>
          <p className="text-lg opacity-90">Phân tích log tường lửa bằng AI - Phát hiện mối đe dọa tự động</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Log File</h2>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="logFile"
                  accept=".log,.txt,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="logFile" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedFile ? (
                      <span className="font-medium text-blue-600">{selectedFile.name}</span>
                    ) : (
                      <>Click để chọn file hoặc kéo thả vào đây</>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Hỗ trợ: .log, .txt, .csv (Max 100MB)</p>
                </label>
              </div>

              {/* Job Name */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Job</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="Ví dụ: Morning Security Scan"
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Firewall Type */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Firewall</label>
                <select
                  value={firewallType}
                  onChange={(e) => setFirewallType(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fortigate">FortiGate</option>
                  <option value="paloalto">Palo Alto</option>
                  <option value="cisco">Cisco ASA</option>
                  <option value="checkpoint">Check Point</option>
                </select>
              </div>
            </div>

            {/* Model Selection Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Chọn AI Model</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.name)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedModel === model.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{model.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        model.speed === 'very fast' ? 'bg-green-100 text-green-800' :
                        model.speed === 'fast' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {model.speed}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">Accuracy:</span>
                      <div className="flex-1 ml-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${model.accuracy}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium">{model.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Analysis Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !selectedFile}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
            </button>

            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiến trình phân tích</span>
                  <span className="text-sm font-medium text-blue-600">{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-700 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {analysisProgress < 30 ? 'Đang đọc log...' :
                   analysisProgress < 60 ? 'AI đang phân tích...' :
                   analysisProgress < 90 ? 'Đang phát hiện mối đe dọa...' :
                   'Hoàn tất!'}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Recent Jobs & Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê nhanh</h3>
              <div className="space-y-3">
                <StatItem label="Total Jobs" value="127" color="blue" />
                <StatItem label="Active Models" value="4" color="green" />
                <StatItem label="Avg Accuracy" value="94.7%" color="purple" />
                <StatItem label="Processing" value="2" color="orange" />
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Jobs</h3>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-800">{job.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Model: <span className="font-medium">{job.model}</span></p>
                      <p>Threats: <span className="font-medium text-red-600">{job.threats}</span> / {job.total} logs</p>
                      <p className="text-gray-500">{job.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component nhỏ cho stat item
function StatItem({ label, value, color }) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
}