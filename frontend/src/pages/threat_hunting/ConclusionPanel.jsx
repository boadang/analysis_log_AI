import { useState } from "react";

export default function ConclusionPanel({ onSave, disabled }) {
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-2">Conclusion</h2>
      <select onChange={(e) => setVerdict(e.target.value)}>
        <option value="">Verdict</option>
        <option value="confirmed_threat">Confirmed Threat</option>
        <option value="false_positive">False Positive</option>
      </select>
      <select onChange={(e) => setConfidence(e.target.value)}>
        <option value="">Confidence</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <textarea onChange={(e) => setNotes(e.target.value)} />
      <button disabled={disabled} onClick={() => onSave({ final_verdict: verdict, confidence, notes })}>
        Save Conclusion
      </button>
    </section>
  );
}