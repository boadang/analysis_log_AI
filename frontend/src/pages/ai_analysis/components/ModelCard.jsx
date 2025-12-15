import React from "react";

export default function ModelCard({ model, selected, onSelect }) {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer ${selected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold">{model.name}</div>
        <div className="text-xs text-gray-500">{model.acc}</div>
      </div>
      <div className="text-sm text-gray-600 mt-2">{model.desc}</div>
    </div>
  );
}