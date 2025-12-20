// ==========================================
// HuntScopePanel.jsx - Dataset-based (same UI format)
// ==========================================
import { useEffect, useState } from "react";
import { getLogDatasets } from "../../services/huntApi";

export default function HuntScopePanel({ onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [env, setEnv] = useState("prod");
  const [loading, setLoading] = useState(false);

  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");

  useEffect(() => {
    getLogDatasets()
      .then(setDatasets)
      .catch(console.error);
  }, []);

  const submit = async () => {
    if (!name || !datasetId || !from || !to) {
      alert("Vui lòng điền đầy đủ thông tin Hunt Scope");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        description,
        dataset_id: Number(datasetId),
        time_range_start: from,
        time_range_end: to,
        environment: env,
      };

      console.log("Paload Detail:", payload)

      onCreate(payload);
    } catch (e) {
      console.error(e);
      alert("Tạo hunt thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hunt Information */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên Hunt <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="VD: Suspicious PowerShell Activity Hunt"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Mô tả chi tiết về mục đích và phạm vi của hunt..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Dataset */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dataset log <span className="text-red-500">*</span>
        </label>

        <select
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={datasetId}
          onChange={(e) => setDatasetId(e.target.value)}
        >
          <option value="">-- Chọn dataset log --</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.source_type} | {d.environment} | {d.log_format})
            </option>
          ))}
        </select>
      </div>

      {/* Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Khoảng thời gian <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Từ</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Đến</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Environment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Môi trường
        </label>
        <select
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={env}
          onChange={(e) => setEnv(e.target.value)}
        >
          <option value="prod">Production</option>
          <option value="lab">Lab</option>
          <option value="dev">Development</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white
                     font-medium rounded-lg hover:bg-blue-700
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     transition-colors shadow-lg hover:shadow-xl"
          disabled={loading}
          onClick={submit}
        >
          {loading ? "Đang tạo..." : "Tạo Hunt Session"}
        </button>
      </div>
    </div>
  );
}
