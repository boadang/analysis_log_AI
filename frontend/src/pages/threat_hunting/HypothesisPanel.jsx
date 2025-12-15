import { useState } from "react";

export default function HypothesisPanel({ onSave, disabled }) {
  const [text, setText] = useState("");
  const [techniqueId, setTechniqueId] = useState("");
  const [rationale, setRationale] = useState("");

  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-2">Hypothesis</h2>
      <textarea onChange={(e) => setText(e.target.value)} />
      <input placeholder="MITRE Txxxx" onChange={(e) => setTechniqueId(e.target.value)} />
      <textarea onChange={(e) => setRationale(e.target.value)} />
      <button disabled={disabled} onClick={() => onSave({ hypothesis: text, technique_id: techniqueId, rationale })}>
        Save Hypothesis
      </button>
    </section>
  );
}