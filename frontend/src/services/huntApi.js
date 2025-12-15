// src/services/huntApi.js

const API_PREFIX = "http://127.0.0.1:8000/api/v1/threat_hunt";

async function request(path, options = {}) {
  const res = await fetch(`${API_PREFIX}${path}`, {
    credentials: "include", // dùng nếu auth cookie
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let msg = "API error";
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/* ===============================
   HUNT FLOW
================================ */

export function createHuntSession(scope) {
  return request("/threat_hunt/sessions", {
    method: "POST",
    body: JSON.stringify(scope),
  });
}

export function saveHypothesis(huntId, hypothesis) {
  return request(`/threat_hunt/${huntId}/hypothesis`, {
    method: "POST",
    body: JSON.stringify(hypothesis),
  });
}

export function executeHunt(huntId, execution) {
  return request(`/threat_hunt/${huntId}/execute`, {
    method: "POST",
    body: JSON.stringify(execution),
  });
}

export function getFindings(huntId) {
  return request(`/threat_hunt/${huntId}/findings`);
}

export function saveConclusion(huntId, conclusion) {
  return request(`/threat_hunt/${huntId}/conclusion`, {
    method: "POST",
    body: JSON.stringify(conclusion),
  });
}
