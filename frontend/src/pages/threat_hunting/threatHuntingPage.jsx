// frontend/src/pages/ThreatHunting/ThreatHuntingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createHuntSession,
  saveHypothesis,
  executeHunt,
  saveConclusion,
  pauseExecution,
  stopExecution,
} from "../../services/huntApi";

import HuntScopePanel from "./HuntScopePanel";
import HypothesisPanel from "./HypothesisPanel";
import ExecutePanel from "./ExecutePanel";
import FindingsPanel from "./FindingsPanel";
import ConclusionPanel from "./ConclusionPanel";

export default function ThreatHuntingPage() {
  // =========================
  // Core States
  // =========================
  const [huntId, setHuntId] = useState(null);
  const [hypothesis, setHypothesis] = useState(null);

  const [execution, setExecution] = useState({
    id: null,
    status: "idle", // idle | running | paused | stopped | completed | failed
    processed: 0,
    total: 0,
  });

  const [findings, setFindings] = useState([]);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const wsRef = useRef(null);

  // =========================
  // Derived Summary
  // =========================
  const summary = useMemo(() => {
    if (!findings.length) return null;
    const s = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
    findings.forEach(f => {
      s.total++;
      if (s[f.severity] !== undefined) s[f.severity]++;
    });
    return s;
  }, [findings]);

  // =========================
  // Execute / Pause / Stop
  // =========================
  const handleExecute = async (payload) => {
    const res = await executeHunt(huntId, payload);

    console.log("Excution:", execution.id)

    setExecution({
      id: res.execution_id || res.id,
      status: "running",
      processed: 0,
      total: res.total || 0,
    });
  };

  const handlePause = async () => {
    if (!execution.id) return;
    await pauseExecution(huntId, execution.id);

    setExecution(prev => ({
      ...prev,
      status: "paused",
    }));
  };

  const handleStop = async () => {
    if (!execution.id) return;
    await stopExecution(huntId, execution.id);

    setExecution(prev => ({
      ...prev,
      status: "stopped",
    }));
  };

  // =========================
  // WebSocket Lifecycle
  // =========================
  useEffect(() => {
    if (!huntId) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const wsUrl = `ws://127.0.0.1:8000/api/v1/hunt_ws/hunts/${huntId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("connected");

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "execution_created":
          setExecution(prev => ({
            ...prev,
            id: msg.execution_id,
          }));
          break;

        case "status":
          setExecution(prev => ({
            ...prev,
            status: msg.status,
          }));
          break;

        case "progress":
          setExecution(prev => ({
            ...prev,
            processed: msg.processed,
            total: msg.total,
          }));
          break;

        case "finding":
          setFindings(prev => [msg.item, ...prev]);
          break;

        default:
          console.warn("Unknown WS message:", msg);
      }
    };

    ws.onerror = () => setWsStatus("error");
    ws.onclose = () => setWsStatus("disconnected");

    return () => ws.close();
  }, [huntId]);

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HERO ===== */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Threat Hunting</h1>
            <p className="text-lg opacity-90">
              Chủ động săn lùng và phát hiện mối đe dọa tiềm ẩn
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              wsStatus === "connected"
                ? "bg-green-500"
                : wsStatus === "connecting"
                ? "bg-yellow-500"
                : wsStatus === "error"
                ? "bg-red-500"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {wsStatus}
          </span>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Step 1 */}
        <WorkflowCard step="1" title="Phạm vi Hunt" description="Khởi tạo phiên hunt" isActive={!huntId}>
          <HuntScopePanel
            onCreate={async (payload) => {
              const res = await createHuntSession(payload);
              setHuntId(res.hunt_id);
              setFindings([]);
              setExecution({ id: null, status: "idle", processed: 0, total: 0 });
            }}
          />
        </WorkflowCard>

        {/* Step 2 */}
        <WorkflowCard
          step="2"
          title="Giả thuyết"
          description="Xây dựng giả thuyết"
          isActive={huntId && !hypothesis}
          isDisabled={!huntId}
        >
          <HypothesisPanel
            disabled={!huntId}
            onSave={async (payload) => {
              await saveHypothesis(huntId, payload);
              setHypothesis(payload);
            }}
          />
        </WorkflowCard>

        {/* Step 3 */}
        <WorkflowCard
          step="3"
          title="Thực thi Hunt"
          description="Chạy hunt"
          isActive={hypothesis && execution.status !== "completed"}
          isDisabled={!hypothesis?.hypothesis}
        >
          <ExecutePanel
            disabled={!hypothesis?.hypothesis}
            execution={execution}
            onExecute={handleExecute}
            onPause={handlePause}
            onStop={handleStop}
          />
        </WorkflowCard>

        {/* Step 4 */}
        <WorkflowCard step="4" title="Kết quả" description="Findings">
          <FindingsPanel findings={findings} summary={summary} />
        </WorkflowCard>

        {/* Step 5 */}
        <WorkflowCard
          step="5"
          title="Kết luận"
          description="Đóng hunt"
          isActive={execution.status === "completed"}
          isDisabled={execution.status !== "completed"}
        >
          <ConclusionPanel
            disabled={execution.status !== "completed"}
            onSave={async (payload) => {
              await saveConclusion(huntId, payload);
              alert("✅ Hunt đã được đóng");
            }}
          />
        </WorkflowCard>
      </div>
    </div>
  );
}

// Component cho Summary Cards
function SummaryCard({ title, value, iconColor, icon }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
  };

  const icons = {
    total: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    alert: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    warning: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    info: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    check: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[iconColor]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </div>
      </div>
    </div>
  );
}

// Component cho Workflow Cards
function WorkflowCard({ step, title, description, children, isActive, isDisabled }) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
        isActive 
          ? "border-blue-500 shadow-blue-100" 
          : isDisabled 
          ? "border-gray-200 opacity-60" 
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${
        isActive ? "bg-blue-50" : "bg-gray-50"
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            isActive 
              ? "bg-blue-600 text-white" 
              : isDisabled 
              ? "bg-gray-300 text-gray-500" 
              : "bg-gray-400 text-white"
          }`}>
            {step}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          {isActive && (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Đang hoạt động
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}