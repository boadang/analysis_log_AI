import React from "react";

export default function LogTimeline({ events }) {
  if (!events || events.length === 0) return <div className="text-gray-500">No timeline events.</div>;

  return (
    <div className="space-y-2">
      {events.map((ev, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="w-32 text-xs text-gray-500">{new Date(ev.ts || ev.time).toLocaleString()}</div>
          <div className="flex-1 bg-gray-50 p-2 rounded">{ev.text || JSON.stringify(ev)}</div>
        </div>
      ))}
    </div>
  );
}