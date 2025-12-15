// frontend/src/pages/threat_hunting/threatHuntingPage.jsx
import { useState, useEffect } from "react";
import {
  createHuntSession,
  saveHypothesis,
  executeHunt,
  getFindings,
  saveConclusion,
} from "../../services/huntApi";

import HuntScopePanel from "./HuntScopePanel";
import HypothesisPanel from "./HypothesisPanel";
import ExecutePanel from "./ExecutePanel";
import FindingsPanel from "./FindingsPanel";
import ConclusionPanel from "./ConclusionPanel";

export default function ThreatHuntingPage() {
  const [huntId, setHuntId] = useState(null);
  const [scope, setScope] = useState({});
  const [hypothesis, setHypothesis] = useState({});
  const [execution, setExecution] = useState({ status: "idle" });
  const [findings, setFindings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [conclusion, setConclusion] = useState({});

  useEffect(() => {
    if (execution.status !== "running" || !huntId) return;

    const timer = setInterval(async () => {
      try {
        const res = await getFindings(huntId);
        setFindings(res.findings || []);
        setSummary(res.summary || null);
        if (res.summary) {
          setExecution({ status: "completed" });
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [execution.status, huntId]);

  return (
    <div className="space-y-8 p-6">
      <HuntScopePanel
        onCreate={async (payload) => {
          const res = await createHuntSession(payload);
          setHuntId(res.hunt_id);
          setScope(payload);
        }}
      />

      <HypothesisPanel
        disabled={!huntId}
        onSave={async (payload) => {
          await saveHypothesis(huntId, payload);
          setHypothesis(payload);
        }}
      />

      <ExecutePanel
        disabled={!hypothesis?.text}
        execution={execution}
        onExecute={async (payload) => {
          setExecution({ status: "running" });
          await executeHunt(huntId, payload);
        }}
      />

      <FindingsPanel findings={findings} summary={summary} />

      <ConclusionPanel
        disabled={execution.status !== "completed"}
        onSave={async (payload) => {
          await saveConclusion(huntId, payload);
          setConclusion(payload);
        }}
      />
    </div>
  );
}