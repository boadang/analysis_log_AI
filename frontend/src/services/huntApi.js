// src/services/huntApi.js

const API_PREFIX = "http://127.0.0.1:8000/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("Chưa đăng nhập hoặc token bị mất");
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }

  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      throw new Error("API error");
    }

    console.error("API error detail:", err);

    throw err; // <-- QUAN TRỌNG
  }

    return res.json();
}

/* ===============================
   HUNT FLOW
================================ */
export function getLogDatasets() {
  return request("/threat_hunt/log_datasets");
}

export function createHuntSession(scope) {
  print("Creating hunt session with scope:", scope);
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

export function pauseExecution(huntId, executionId) {
  return request(`/threat_hunt/${huntId}/executions/${executionId}/pause`, {
    method: "POST",
  });
}

export function stopExecution(huntId, executionId) {
  return request(`/threat_hunt/${huntId}/executions/${executionId}/stop`, {
    method: "POST",
  });
}