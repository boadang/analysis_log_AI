import { useState } from "react";
import { Settings as SettingsIcon, Key, Server, Bell } from "lucide-react";

export default function Setting() {
  const [apiKey, setApiKey] = useState("");
  const [syslogEnabled, setSyslogEnabled] = useState(false);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-semibold">Setting</h1>

      {/* System Settings */}
      <div className="bg-white p-6 rounded-xl shadow space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon size={24} className="text-gray-600" />
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>

        {/* API Key */}
        <div>
          <label className="font-medium block mb-2 flex items-center gap-2">
            <Key size={18} /> API Key
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Nhập API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Syslog Settings */}
        <div className="space-y-3">
          <label className="font-medium flex items-center gap-2">
            <Server size={18} /> Syslog Collector
          </label>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={syslogEnabled}
              onChange={(e) => setSyslogEnabled(e.target.checked)}
            />
            <span>Bật / Tắt nhận log từ Syslog</span>
          </div>

          {syslogEnabled && (
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nhập Syslog port (ví dụ: 514)"
            />
          )}
        </div>

        {/* Notifications */}
        <div>
          <label className="font-medium flex items-center gap-2 mb-2">
            <Bell size={18} /> Notifications
          </label>

          <select className="w-full border rounded-lg px-3 py-2">
            <option>Email Alerts</option>
            <option>Telegram Alerts</option>
            <option>None</option>
          </select>
        </div>
      </div>
    </div>
  );
}
