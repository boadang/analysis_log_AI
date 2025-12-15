// frontend/src/pages/ai_analysis/JobDetail.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ThreatTimeline from "./components/ThreatTimeLine";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { getJob } from "../../services/AI/analysisApi";
import { useJobWS } from "../../hooks/useJobWS";

export default function JobDetail() {
  const { jobId } = useParams();

  /* -------------------------
   * DB state (SOURCE OF TRUTH)
   * ------------------------- */
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------------
   * WS patch state (EPHEMERAL)
   * ------------------------- */
  const [wsPatch, setWsPatch] = useState({
    status: null,
    summary: null,
    timeline: null,
    logs: []
  });

  /* -------------------------
   * Fetch job from DB
   * ------------------------- */
  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await getJob(jobId);
      setJob(data);
      setError("");
    } catch {
      setError("Không thể tải job");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  /* -------------------------
   * Enable WS only if running
   * ------------------------- */
  const enableWS =
    job &&
    job.status !== "completed" &&
    job.status !== "failed";

  const { connected, lastMessage, logs: wsLogs } = useJobWS(
    enableWS ? jobId : null
  );

  /* -------------------------
   * Handle WS messages
   * ------------------------- */
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "status":
        setWsPatch(p => ({ ...p, status: lastMessage.status }));
        break;

      case "summary":
        setWsPatch(p => ({
          ...p,
          summary: {
            ...p.summary,
            ...lastMessage.summary
          }
        }));
        break;

      case "timeline":
        setWsPatch(p => ({
          ...p,
          timeline: lastMessage.timeline
        }));
        break;

      case "completed":
        setWsPatch(p => ({ ...p, status: "completed" }));
        loadJob(); // 🔥 SYNC DB
        break;

      case "error":
        setError(lastMessage.message);
        break;

      default:
        break;
    }
  }, [lastMessage, loadJob]);

  /* -------------------------
   * Accumulate WS logs
   * ------------------------- */
  useEffect(() => {
    if (wsLogs.length === 0) return;
    setWsPatch(p => ({
      ...p,
      logs: [...p.logs, ...wsLogs]
    }));
  }, [wsLogs]);

  /* -------------------------
   * MERGED RUNTIME VIEW
   * ------------------------- */
  const mergedJob = useMemo(() => {
    if (!job) return null;

    return {
      ...job,
      status: wsPatch.status ?? job.status,
      summary: {
        ...job.summary,
        ...wsPatch.summary
      },
      timeline: wsPatch.timeline ?? job.timeline,
      liveLogs: wsPatch.logs
    };
  }, [job, wsPatch]);

  /* -------------------------
   * Derived UI data
   * ------------------------- */
  const riskChartData = useMemo(() => {
    const dist = mergedJob?.summary?.risk_distribution;
    if (!dist) return [];
    return [
      { name: "Critical", value: dist.critical || 0, color: "#dc2626" },
      { name: "High", value: dist.high || 0, color: "#ea580c" },
      { name: "Medium", value: dist.medium || 0, color: "#f59e0b" },
      { name: "Low", value: dist.low || 0, color: "#10b981" },
      { name: "None", value: dist.none || 0, color: "#6b7280" }
    ].filter(d => d.value > 0);
  }, [mergedJob]);

  const threatTypeData = useMemo(() => {
    const types = mergedJob?.summary?.threat_types;
    if (!types) return [];
    return Object.entries(types).map(([k, v]) => ({
      name: k.replace(/_/g, " "),
      value: v
    }));
  }, [mergedJob]);

  /* -------------------------
   * Render guards
   * ------------------------- */
  if (loading && !job) return <div className="p-6">Loading…</div>;
  if (error && !job) return <div className="p-6 text-red-600">{error}</div>;
  if (!mergedJob) return null;

  console.log("Detailed view of job:", mergedJob);
  console.log("Details content of job final:", job);

  /* -------------------------
   * UI
   * ------------------------- */
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Job Analysis</h1>
          <div className="text-sm text-gray-600">{mergedJob.job_name}</div>
        </div>

        <div className="flex gap-3 items-center">
          <span className={`text-xs ${connected ? "text-green-600" : "text-gray-400"}`}>
            ● {connected ? "Live" : "Offline"}
          </span>
          <span className="px-3 py-1 rounded text-sm bg-gray-100">
            {mergedJob.status}
          </span>
          <button onClick={loadJob} className="border px-2 py-1 rounded">🔄</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Total Logs" value={mergedJob.total_logs || 0} />
        <Stat label="Threats" value={mergedJob.detected_threats || 0} />
        <Stat label="Threat Rate" value={`${mergedJob.summary?.threat_percentage || 0}%`} />
        <Stat label="Model" value={mergedJob.model_name} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <ChartBox title="Risk Distribution">
          <PieChart>
            <Pie data={riskChartData} dataKey="value" outerRadius={80} label>
              {riskChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartBox>

        <ChartBox title="Threat Types">
          <BarChart data={threatTypeData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ChartBox>
      </div>

      {/* Live Logs */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-xs">
        {mergedJob.liveLogs.length === 0
          ? "No live logs"
          : mergedJob.liveLogs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* Threat Timeline */}
      <ThreatTimeline timeline={job.timeline} />

      <Link to="/ai-analysis" className="text-blue-600 mt-10">← Back</Link>
    </div>
  );
}

/* -------------------------
 * Small components
 * ------------------------- */
function Stat({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={250}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
