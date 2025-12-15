// frontend/src/services/AI/analysisApi.js
import axios from "axios";

const API_AI_URL = "http://127.0.0.1:8000/api/v1/ai_analysis";

// -------------------------
// Jobs
// -------------------------
export async function fetchJobs(limit = 50) {
  try {
    const res = await axios.get(`${API_AI_URL}/jobs?limit=${limit}`,{
            headers: {'authorization': `Bearer ${localStorage.getItem('authToken')}`}
        }
    );
    return res.data || [];
  } catch (err) {
    console.error("fetchJobs error", err);
    throw err;
  }
}

export async function getJob(jobId) {
  if (!jobId) return null;
  try {
    const res = await axios.get(`${API_AI_URL}/jobs/${jobId}`,{
            headers: {'authorization': `Bearer ${localStorage.getItem('authToken')}`}
        }
    );
    return res.data;
  } catch (err) {
    console.error("getJob error", err);
    throw err;
  }
}

export async function createJob(jobData) {
  try {
    const res = await axios.post(`${API_AI_URL}/jobs`, 
        jobData,
        {
            headers: {'authorization': `Bearer ${localStorage.getItem('authToken')}`}
        }
    );
    return res.data;
  } catch (err) {
    console.error("createJob error", err);
    throw err;
  }
}

// -------------------------
// Upload log
// -------------------------
export async function uploadLog(file) {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await axios.post(`${API_AI_URL}/upload`, form, {
      headers: { 
        "Content-Type": "multipart/form-data",
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
    });
    return res.data;
  } catch (err) {
    console.error("uploadLog error", err);
    throw err;
  }
}

// -------------------------
// Run Analysis
// -------------------------
export async function runAnalysis(payload, token = null) {
  try {
    const res = await axios.post(`${API_AI_URL}/run-analysis`, 
        payload, 
        {
            headers: {'authorization': `Bearer ${localStorage.getItem('authToken')}`}
        }
    );
    return res.data;
  } catch (err) {
    console.error("runAnalysis error", err);
    throw err;
  }
}

// -------------------------
// Logs
// -------------------------
export async function fetchJobLogs(jobId) {
  try {
    const res = await axios.get(`${API_AI_URL}/jobs/${jobId}/logs`,{
            headers:{ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }
    );
    return res.data || [];
  } catch (err) {
    console.error("fetchJobLogs error", err);
    throw err;
  }
}
