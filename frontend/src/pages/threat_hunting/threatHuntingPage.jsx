// frontend/src/pages/threat_hunting/ThreatHuntingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createHuntSession,
  saveHypothesis,
  executeHunt,
  saveConclusion,
  pauseExecution,
  stopExecution,
} from "../../services/huntApi";

import { WorkflowCard } from "./components/WorkflowCard";

import {ViewHuntScope, ViewConclusion, ViewHypothesis } from "./components/ViewComponents";

import HuntScopePanel from "./HuntScopePanel";
import HypothesisPanel from "./HypothesisPanel";
import ExecutePanel from "./ExecutePanel";
import FindingsPanel from "./FindingsPanel";
import ConclusionPanel from "./ConclusionPanel";

export default function ThreatHuntingPage() {
  const { huntId: urlHuntId } = useParams();
  const navigate = useNavigate();
  
  const [huntId, setHuntId] = useState(urlHuntId && urlHuntId !== "new" ? urlHuntId : null);
  const [hypothesis, setHypothesis] = useState(null);
  const [huntData, setHuntData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [execution, setExecution] = useState({
    id: null,
    status: "idle",
    processed: 0,
    total: 0,
  });

  const [findings, setFindings] = useState([]);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const wsRef = useRef(null);

  // Determine mode: view existing hunt or create new
  const isViewMode = urlHuntId && urlHuntId !== "new";

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
  // LOAD EXISTING HUNT (View Mode)
  // =========================
  useEffect(() => {
    if (!isViewMode) return;

    const loadHuntData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/threat_hunt/hunts/${urlHuntId}/detail`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("[VIEW MODE] Loaded hunt data:", data);

          setHuntData(data);
          setHuntId(data.id);
          
          if (data.hypothesis) {
            setHypothesis(data.hypothesis);
          }

          if (data.latest_execution) {
            setExecution({
              id: data.latest_execution.id,
              status: data.latest_execution.status,
              processed: 0,
              total: 0,
            });
          }
        } else {
          console.error("❌ Failed to load hunt");
          alert("Không thể tải hunt session này");
          navigate("/threat-hunting");
        }
      } catch (error) {
        console.error("❌ [VIEW MODE] Failed to load hunt:", error);
        alert("Lỗi khi tải hunt session");
        navigate("/threat-hunting");
      } finally {
        setLoading(false);
      }
    };

    loadHuntData();
  }, [isViewMode, urlHuntId, navigate]);

  // =========================
  // EXECUTE / PAUSE / STOP
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
    setExecution(prev => ({ ...prev, status: "paused" }));
  };

  const handleStop = async () => {
    if (!execution.id) return;
    await stopExecution(huntId, execution.id);
    setExecution(prev => ({ ...prev, status: "stopped" }));
  };

  // =========================
  // LOAD FINDINGS
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
              Authorization: `Bearer ${token}`,
            },
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
        console.error("❌ [API] Failed to load findings:", err);
      }
    };

    loadFindings();
  }, [huntId]);

  // =========================
  // WEBSOCKET
  // =========================
  useEffect(() => {
    if (!huntId) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ [WS] No auth token found");
      return;
    }

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
          if (msg.items && msg.items.length > 0) {
            setFindings(msg.items);
          }
          break;

        case "execution_created":
          setExecution(prev => ({ ...prev, id: msg.execution_id }));
          break;

        case "status":
          setExecution(prev => ({ ...prev, status: msg.status }));
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

        case "completed":
          setExecution(prev => ({ ...prev, status: "completed" }));
          alert(
            `✅ Hunt hoàn thành!\nLogs: ${msg.summary.total_logs}\nThreats: ${msg.summary.detected_threats}`
          );
          break;

        case "error":
          setExecution(prev => ({ ...prev, status: "failed" }));
          alert(`❌ Lỗi: ${msg.error}`);
          break;

        default:
          console.warn(`[WS] Unknown message type: ${msg.type}`);
      }
    };

    ws.onerror = () => setWsStatus("error");
    ws.onclose = () => setWsStatus("disconnected");

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [huntId]);

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-700 text-lg">Đang tải dữ liệu hunt...</p>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button
              onClick={() => navigate("/threat-hunting")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Quay lại History"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isViewMode ? `Hunt Session #${huntId}` : "Tạo Threat Hunt Mới"}
              </h1>
              <p className="text-lg opacity-90">
                {isViewMode
                  ? huntData?.name || "Xem chi tiết hunt session"
                  : "Chủ động săn lùng và phát hiện mối đe dọa tiềm ẩn"}
              </p>
            </div>
          </div>

          {/* WebSocket Status */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Step 1: Hunt Scope */}
        <WorkflowCard
          step="1"
          title="Phạm vi Hunt"
          description="Khởi tạo phiên hunt"
          isActive={!huntId && !isViewMode}
          isDisabled={isViewMode}
        >
          {isViewMode && huntData ? (
            <ViewHuntScope data={huntData} />
          ) : (
            <HuntScopePanel
              onCreate={async (payload) => {
                const res = await createHuntSession(payload);
                console.log("✅ [Step 1] Hunt created:", res);
                setHuntId(res.hunt_id);
                setFindings([]);
                setExecution({ id: null, status: "idle", processed: 0, total: 0 });
              }}
            />
          )}
        </WorkflowCard>

        {/* Step 2: Hypothesis */}
        <WorkflowCard
          step="2"
          title="Giả thuyết"
          description="Xây dựng giả thuyết"
          isActive={huntId && !hypothesis && !isViewMode}
          isDisabled={!huntId || isViewMode}
        >
          {isViewMode && hypothesis ? (
            <ViewHypothesis data={hypothesis} />
          ) : (
            <HypothesisPanel
              disabled={!huntId}
              onSave={async (payload) => {
                await saveHypothesis(huntId, payload);
                console.log("✅ [Step 2] Hypothesis saved");
                setHypothesis(payload);
              }}
            />
          )}
        </WorkflowCard>

        {/* Step 3: Execute */}
        <WorkflowCard
          step="3"
          title="Thực thi Hunt"
          description="Chạy hunt"
          isActive={hypothesis && execution.status !== "completed" && !isViewMode}
          isDisabled={!hypothesis?.hypothesis}
        >
          <ExecutePanel
            disabled={!hypothesis?.hypothesis || isViewMode}
            execution={execution}
            onExecute={handleExecute}
            onPause={handlePause}
            onStop={handleStop}
            viewMode={isViewMode}
          />
        </WorkflowCard>

        {/* Step 4: Findings */}
        <WorkflowCard step="4" title="Kết quả" description="Findings">
          <FindingsPanel findings={findings} summary={summary} />
        </WorkflowCard>

        {/* Step 5: Conclusion */}
        <WorkflowCard
          step="5"
          title="Kết luận"
          description="Đóng hunt"
          isActive={execution.status === "completed" && !isViewMode}
          isDisabled={execution.status !== "completed" || isViewMode}
        >
          {isViewMode && huntData?.conclusion ? (
            <ViewConclusion data={huntData.conclusion} />
          ) : (
            <ConclusionPanel
              disabled={execution.status !== "completed"}
              onSave={async (payload) => {
                console.log("[THREAT HUNTING PAGE] Saving conclusion:", payload);
                await saveConclusion(huntId, payload);
                alert("✅ Hunt đã được đóng");
                // Optionally navigate back to history
                // navigate("/threat-hunting");
              }}
            />
          )}
        </WorkflowCard>
      </div>
    </div>
  );
}