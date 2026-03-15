import { useEffect, useRef, useState } from "react";

export default function LogsPage() {
  const [firewalls] = useState(["FW-001", "FW-002", "FW-003"]);
  const [selectedFW, setSelectedFW] = useState("FW-001");

  const [isLive, setIsLive] = useState(false);
  const [speed, setSpeed] = useState(5); // logs/sec
  const [status, setStatus] = useState("disconnected");

  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll xuống cuối khi log mới
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const connectWS = () => {
    setStatus("connecting");

    const ws = new WebSocket(
      `ws://localhost:8000/ws/logs/${selectedFW}?speed=${speed}`
    );

    ws.onopen = () => {
      setStatus("connected");
      setIsLive(true);
    };

    ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs((prev) => [...prev.slice(-300), log]); // giữ 300 log gần nhất
    };

    ws.onclose = () => {
      setStatus("disconnected");
      setIsLive(false);
    };

    wsRef.current = ws;
  };

  const disconnectWS = () => {
    wsRef.current?.close();
    setStatus("disconnected");
    setIsLive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">

        {/* TITLE */}
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Real‑Time Logs
        </h1>

        {/* CONTROL PANEL */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Firewall Select */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Fake Firewall
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={selectedFW}
                onChange={(e) => setSelectedFW(e.target.value)}
                disabled={isLive}
              >
                {firewalls.map((fw) => (
                  <option key={fw}>{fw}</option>
                ))}
              </select>
            </div>

            {/* Log speed */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Speed (logs / sec)
              </label>
              <select
                className="w-full p-3 border rounded-lg"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                disabled={isLive}
              >
                <option value="1">1</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20 (attack mode)</option>
              </select>
            </div>

            {/* Status + Connect Button */}
            <div className="flex items-end justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    status === "connected"
                      ? "bg-green-500"
                      : status === "connecting"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-gray-700 capitalize">{status}</span>
              </div>

              {!isLive ? (
                <button
                  onClick={connectWS}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={disconnectWS}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Live Log Stream
            </h2>
          </div>

          <div
            ref={containerRef}
            className="overflow-y-auto max-h-[600px] p-3"
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Destination</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Protocol</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{log.timestamp}</td>
                    <td className="px-4 py-2 font-mono">{log.source_ip}</td>
                    <td className="px-4 py-2 font-mono">{log.dest_ip}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          log.action === "block"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">{log.protocol}</td>
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
