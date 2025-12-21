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

    console.log("✅ [ThreatHuntingPage] Execution created:", res);

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
  // Load existing findings from API (fallback)
  // =========================
  useEffect(() => {
    if (!huntId) return;
    
    const loadFindings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/threat_hunt/${huntId}/findings`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            console.log(`✅ [API] Loaded ${data.items.length} existing findings`);
            setFindings(data.items);
          }
        }
      } catch (err) {
        console.error('❌ [API] Failed to load findings:', err);
      }
    };
    
    loadFindings();
  }, [huntId]);

  // =========================
  // WebSocket Lifecycle - FIXED
  // =========================
  useEffect(() => {
    if (!huntId) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ [WS] No auth token found");
      return;
    }

    // FIX 1: Đảm bảo URL đúng với backend route
    const wsUrl = `ws://127.0.0.1:8000/api/v1/hunt_ws/hunts/${huntId}?token=${token}`;
    console.log(`🔌 [WS] Connecting to: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      console.log(`✅ [WS] Connected to hunt ${huntId}`);
      setWsStatus("connected");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log(`📨 [WS] Message received:`, msg);

      switch (msg.type) {
        case "initial":
          // Load initial findings khi connect
          console.log(`[WS] Initial data: ${msg.items?.length || 0} findings`);
          if (msg.items && msg.items.length > 0) {
            setFindings(msg.items);
          }
          break;

        case "execution_created":
          console.log(`[WS] Execution created: ${msg.execution_id}`);
          setExecution(prev => ({
            ...prev,
            id: msg.execution_id,
          }));
          break;

        case "status":
          console.log(`[WS] Status update: ${msg.status}`);
          setExecution(prev => ({
            ...prev,
            status: msg.status,
          }));
          break;

        case "progress":
          console.log(`[WS] Progress: ${msg.processed}/${msg.total}`);
          setExecution(prev => ({
            ...prev,
            processed: msg.processed,
            total: msg.total,
          }));
          break;

        case "finding":
          console.log(`[WS] New finding:`, msg.item);
          setFindings(prev => [msg.item, ...prev]);
          break;

        case "completed":
          console.log(`[WS] Hunt completed:`, msg.summary);
          setExecution(prev => ({
            ...prev,
            status: "completed",
          }));
          // Có thể show notification
          alert(`✅ Hunt hoàn thành!\nLogs: ${msg.summary.total_logs}\nThreats: ${msg.summary.detected_threats}`);
          break;

        case "error":
          console.error(`[WS] Error:`, msg.error);
          setExecution(prev => ({
            ...prev,
            status: "failed",
          }));
          alert(`❌ Lỗi: ${msg.error}`);
          break;

        default:
          console.warn(`[WS] Unknown message type: ${msg.type}`);
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ [WS] Connection error:`, error);
      setWsStatus("error");
    };

    ws.onclose = (event) => {
      console.log(`🔌 [WS] Disconnected (code: ${event.code}, reason: ${event.reason})`);
      setWsStatus("disconnected");
    };

    // Cleanup khi unmount hoặc huntId thay đổi
    return () => {
      console.log(`🔌 [WS] Cleaning up connection for hunt ${huntId}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
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

          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-3">
            <span className="text-sm opacity-75">WebSocket:</span>
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
              {wsStatus === "connected" && "🟢 Connected"}
              {wsStatus === "connecting" && "🟡 Connecting..."}
              {wsStatus === "error" && "🔴 Error"}
              {wsStatus === "disconnected" && "⚪ Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Step 1 */}
        <WorkflowCard step="1" title="Phạm vi Hunt" description="Khởi tạo phiên hunt" isActive={!huntId}>
          <HuntScopePanel
            onCreate={async (payload) => {
              const res = await createHuntSession(payload);
              console.log("✅ [Step 1] Hunt created:", res);
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
              console.log("✅ [Step 2] Hypothesis saved");
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