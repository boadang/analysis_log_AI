// frontend/src/services/ai/threatApi.js
const BASE = "http://127.0.0.1:8000/api/v1/threat";

export async function getLogSources() {
  console.log("Fetching log sources with token:", localStorage.getItem('authToken'));
  const res = await fetch(`${BASE}/log-sources`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  if (!res.ok) throw new Error("Failed to get log sources");
  return res.json();
}

export async function loadLog(analysisId) {
  console.log("Loading log for analysisId:", analysisId);
  console.log("Using token:", localStorage.getItem('authToken'));
  const res = await fetch(`${BASE}/load-log/${analysisId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  if (!res.ok) throw new Error("Failed to load log");
  return res.json();
}

export async function uploadLog(file) {
  console.log("File content:", file)
  console.log("Using token:", localStorage.getItem('authToken'));
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/upload-log`, {
    method: "POST",
    body: fd,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function postHunt({ analysis_id = null, logs = null, model = "qwen2.5:3b", query = "" }) {
  console.log("Starting hunt with analysis_id:", analysis_id, "model:", model);
  console.log("Using token:", localStorage.getItem('authToken'));
  const res = await fetch(`${BASE}/hunt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ analysis_id, logs, model, query }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Hunt failed");
  }
  return res.json();
}
