import SummaryCards from "./components/SummaryCards";
import FindingsTable from "./components/FindingsTable";
import FilterPanel from "./components/FilterPanel";

export default function FindingsPanel({ findings, summary }) {
  if (!summary) return null;

  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-2">Findings</h2>
      <p>Total: {summary.total_events}</p>
      <table>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id}>
              <td>{f.timestamp}</td>
              <td>{f.event}</td>
              <td>{f.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}