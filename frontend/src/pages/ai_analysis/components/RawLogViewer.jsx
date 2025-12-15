import React, { useState } from "react";

export default function RawLogViewer({ lines = [] }) {
  const [filter, setFilter] = useState("");
  const filtered = filter ? lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase())) : lines;

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input className="border p-2 rounded flex-1" placeholder="Filter lines..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="text-sm text-gray-500">{filtered.length} / {lines.length}</div>
      </div>

      <div className="h-64 overflow-auto font-mono text-sm bg-black text-green-400 p-3 rounded">
        {filtered.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

