// frontend/src/pages/ai_analysis/JobDetail.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
    logs: [],
    total_logs: null,
    detected_threats: null
  });

  // 🔥 Track if job is completed to prevent reset
  const isCompletedRef = useRef(false);

  /* -------------------------
   * Fetch job from DB
   * ------------------------- */
  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await getJob(jobId);
      setJob(data);
      
      console.log("[JobDetail] Loaded job from DB:", data.status);
      
      // 🔥 FIX: Only reset wsPatch if job is actually completed in DB
      // Don't reset if we just received completed message
      if (data.status === "completed" || data.status === "failed") {
        console.log("[JobDetail] Job finished in DB, keeping final state");
        isCompletedRef.current = true;
        // Keep the wsPatch data, just mark as completed
        setWsPatch(p => ({
          ...p,
          status: data.status
        }));
      } else if (!isCompletedRef.current) {
        // Only reset if we're not in completed state
        console.log("[JobDetail] Job still running, resetting wsPatch");
        setWsPatch({
          status: null,
          summary: null,
          timeline: null,
          logs: []
        });
      }
      
      setError("");
    } catch (err) {
      console.error("[JobDetail] Load job error:", err);
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
  const enableWS = useMemo(() => {
    // 🔥 FIX: Check BOTH job status and wsPatch status
    const jobStatus = job?.status;
    const patchStatus = wsPatch.status;
    const effectiveStatus = patchStatus || jobStatus;
    
    const shouldEnable = 
      job && 
      effectiveStatus !== "completed" && 
      effectiveStatus !== "failed";
    
    console.log("[JobDetail] enableWS check:", {
      jobStatus,
      patchStatus,
      effectiveStatus,
      shouldEnable
    });
    
    return shouldEnable;
  }, [job, wsPatch.status]);

  const { connected, lastMessage, logs: wsLogs } = useJobWS(
    enableWS ? jobId : null
  );

  /* -------------------------
   * Handle WS messages
   * ------------------------- */
  useEffect(() => {
    if (!lastMessage) return;

    console.log("[JobDetail] Processing WS message:", lastMessage.type);

    switch (lastMessage.type) {
      case "status":
        console.log("[JobDetail] Status update:", lastMessage.status);
        setWsPatch(p => ({ ...p, status: lastMessage.status }));
        break;

      case "summary":
        console.log("[JobDetail] Summary update");
        setWsPatch(p => ({
          ...p,
          summary: {
            ...p.summary,
            ...lastMessage.summary
          }
        }));
        break;

      case "timeline":
        console.log("[JobDetail] Timeline update");
        setWsPatch(p => ({
          ...p,
          timeline: lastMessage.timeline
        }));
        break;

      case "completed":
        console.log("[JobDetail] 🎉 Job COMPLETED message received!");
        console.log("[JobDetail] Completed data:", lastMessage);
        
        // 🔥 FIX: Mark as completed IMMEDIATELY
        isCompletedRef.current = true;
        
        setWsPatch(p => {
          const newPatch = { 
            ...p, 
            status: "completed",
            summary: lastMessage.summary || p.summary,
            timeline: lastMessage.timeline || p.timeline,
            total_logs: lastMessage.stats?.total_logs ?? p.total_logs,
            detected_threats: lastMessage.stats?.detected_threats ?? p.detected_threats,
          };
          console.log("[JobDetail] New wsPatch after completed:", newPatch);
          return newPatch;
        });
        
        // 🔥 FIX: Load job with longer delay to ensure DB commit
        console.log("[JobDetail] Scheduling DB sync in 2 seconds...");
        setTimeout(() => {
          console.log("[JobDetail] Loading final job state from DB...");
          loadJob();
        }, 2000);
        break;

      case "error":
        console.error("[JobDetail] Error:", lastMessage.message);
        setError(lastMessage.message);
        setWsPatch(p => ({ ...p, status: "failed" }));
        isCompletedRef.current = true;
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

    const merged = {
      ...job,
      status: wsPatch.status ?? job.status,
      summary: {
        ...job.summary,
        ...wsPatch.summary
      },
      timeline: wsPatch.timeline ?? job.timeline,
      liveLogs: wsPatch.logs,
      total_logs: wsPatch.total_logs ?? job.total_logs,
      detected_threats: wsPatch.detected_threats ?? job.detected_threat,
    };

    console.log("[JobDetail] Merged job:", {
      jobStatus: job.status,
      wsPatchStatus: wsPatch.status,
      mergedStatus: merged.status
    });

    return merged;
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
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            mergedJob.status === "completed" ? "bg-green-100 text-green-800" :
            mergedJob.status === "failed" ? "bg-red-100 text-red-800" :
            mergedJob.status === "running" ? "bg-blue-100 text-blue-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {mergedJob.status}
          </span>
          <button 
            onClick={loadJob} 
            className="border px-2 py-1 rounded hover:bg-gray-50 text-sm"
          >
            🔄
          </button>
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
          {riskChartData.length > 0 ? (
            <PieChart>
              <Pie data={riskChartData} dataKey="value" outerRadius={80} label>
                {riskChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-400">
              No data available
            </div>
          )}
        </ChartBox>

        <ChartBox title="Threat Types">
          {threatTypeData.length > 0 ? (
            <BarChart data={threatTypeData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-400">
              No threats detected
            </div>
          )}
        </ChartBox>
      </div>

      {/* Live Logs */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
        {mergedJob.liveLogs.length === 0
          ? <div className="text-gray-500">No live logs</div>
          : mergedJob.liveLogs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* Threat Timeline */}
      <ThreatTimeline timeline={mergedJob.timeline} />

      <Link to="/ai-analysis" className="text-blue-600 mt-10 inline-block hover:underline">
        ← Back to Jobs
      </Link>
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