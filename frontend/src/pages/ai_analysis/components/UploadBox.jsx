// File: frontend/src/pages/ai_analysis/components/UploadBox.jsx
import React, { useRef, useState } from "react";

export default function UploadBox({ onFileSelected, uploading, file }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileSelected(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 rounded-xl p-8 text-center bg-white ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-dashed'} `}
    >
      {uploading ? (
        <div className="text-blue-600 font-semibold">Uploading...</div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".log,.txt,.csv"
            onChange={(e) => onFileSelected(e.target.files[0])}
          />
          <div className="text-gray-600">
            {file ? (
              <div>
                <div className="font-medium text-gray-800">{file.name}</div>
                <div className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</div>
              </div>
            ) : (
              <div>
                <div className="font-medium">Chọn file hoặc kéo thả vào đây</div>
                <button className="mt-3 text-sm text-blue-600" onClick={() => inputRef.current.click()}>Chọn file</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}