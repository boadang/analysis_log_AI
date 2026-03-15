// frontend/src/pages/ai_analysis/CreateJob.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadBox from "./components/UploadBox";
import ModelCard from "./components/ModelCard";
import { uploadLog, runAnalysis } from "../../services/AI/analysisApi";

export default function CreateJob() {
  const [file, setFile] = useState(null);
  const [jobName, setJobName] = useState("");
  const [firewallType, setFirewallType] = useState("auto");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setModels([
      { name: "qwen2.5:3b", desc: "Nhanh - Độ chính xác tốt", acc: "94%" },
      { name: "mistral", desc: "Mạnh - Phân tích sâu", acc: "96%" },
      { name: "fortigate-finetuned", desc: "Tối ưu cho Fortigate", acc: "98%" },
    ]);
    // Auto-select first model
    setSelectedModel("qwen2.5:3b");
  }, []);

  const detectFirewall = async (file) => {
    const text = await file.text();
    if (text.includes("date=") && text.includes("type=utm")) return "fortigate";
    if (text.includes("CEF:")) return "paloalto";
    if (text.includes("%ASA-") || text.includes("ASA:")) return "cisco";
    return "unknown";
  };

  const handleFileSelected = async (f) => {
    setError("");
    setFile(f);
    setUploading(true);

    try {
      const detected = await detectFirewall(f);
      setFirewallType(detected || "unknown");
      setJobName(`${(detected || "LOG").toUpperCase()} Analysis ${new Date().toLocaleString()}`);

      const res = await uploadLog(f);
      setUploadedFilePath(res.filepath || null);
    } catch (e) {
      console.error(e);
      setError("Lỗi khi upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async () => {
    if (!uploadedFilePath || !selectedModel) {
      setError("Bạn cần upload file và chọn model trước khi bắt đầu.");
      return;
    }

    try {
      const payload = {
        file_path: uploadedFilePath,
        model_name: selectedModel,
        job_name: jobName,
        firewall_type: firewallType,
      };
      const res = await runAnalysis(payload);
      const jobId = res.job_id || res.id;
      if (jobId) navigate(`/ai-analysis/${jobId}`);
      else navigate("/ai-analysis");
    } catch (e) {
      console.error(e);
      setError("Lỗi khi tạo job phân tích.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create AI Analysis Job</h1>
      
      <UploadBox onFileSelected={handleFileSelected} uploading={uploading} file={file} />

      {file && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          {/* Job Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Name</label>
            <input
              className="w-full border rounded p-2"
              value={jobName}
              onChange={e => setJobName(e.target.value)}
              placeholder="Enter job name"
            />
          </div>

          {/* Detected Firewall */}
          <div>
            <label className="block text-sm font-medium mb-2">Detected Firewall</label>
            <input 
              className="w-full border rounded p-2 bg-gray-50" 
              value={firewallType} 
              disabled 
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select AI Model</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {models.map(m => (
                <ModelCard
                  key={m.name}
                  model={m}
                  selected={selectedModel === m.name}
                  onSelect={() => setSelectedModel(m.name)}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => navigate("/ai-analysis")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Cancel
            </button>
            
            <button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={uploading || !uploadedFilePath || !selectedModel}
            >
              {uploading ? "Uploading..." : "Start Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}