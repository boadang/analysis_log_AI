export default function ExecutePanel({ onExecute, execution, disabled }) {
  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-2">Execute Hunt</h2>
      <button disabled={disabled || execution.status === "running"} onClick={() => onExecute({ mode: "ai-assisted", strategy: "behavioral", depth: "standard" })}>
        Start Hunt
      </button>
      <p>Status: {execution.status}</p>
    </section>
  );
}