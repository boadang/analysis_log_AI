import React from "react";

export default function ThreatSummary({ summary }) {
  // expected summary = { critical: N, high: N, medium: N, low: N, top_ips: [...], top_rules: [...] }
  const critical = summary.critical || 0;
  const high = summary.high || 0;
  const medium = summary.medium || 0;
  const low = summary.low || 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 border rounded">
        <div className="text-xs text-gray-500">Critical</div>
        <div className="text-2xl font-bold text-red-600">{critical}</div>
      </div>

      <div className="p-3 border rounded">
        <div className="text-xs text-gray-500">High</div>
        <div className="text-2xl font-bold text-orange-600">{high}</div>
      </div>

      <div className="p-3 border rounded">
        <div className="text-xs text-gray-500">Medium</div>
        <div className="text-2xl font-bold text-yellow-600">{medium}</div>
      </div>

      <div className="p-3 border rounded">
        <div className="text-xs text-gray-500">Low</div>
        <div className="text-2xl font-bold text-green-600">{low}</div>
      </div>
    </div>
  );
}
