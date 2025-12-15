import { useState } from "react";

export default function HuntScopePanel({ onCreate }) {
  const [logSourceId, setLogSourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const submit = () => {
    onCreate({
      log_source_id: Number(logSourceId),
      time_range: { from, to },
    });
  };

  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-2">Hunt Scope</h2>
      <input placeholder="Log Source ID" onChange={(e) => setLogSourceId(e.target.value)} />
      <input type="datetime-local" onChange={(e) => setFrom(e.target.value)} />
      <input type="datetime-local" onChange={(e) => setTo(e.target.value)} />
      <button onClick={submit}>Create Hunt</button>
    </section>
  );
}