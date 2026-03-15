export default function FindingsTable({ findings }) {
  return (
    <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Event</th>
            <th className="px-4 py-2">Verdict</th>
            <th className="px-4 py-2">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {findings.map((f, i) => (
            <tr key={i} className={f.confidence > 0.9 ? "bg-red-50" : ""}>
              <td className="px-4 py-2">{f.timestamp}</td>
              <td className="px-4 py-2">{f.event}</td>
              <td className="px-4 py-2">{f.verdict}</td>
              <td className="px-4 py-2">{Math.round(f.confidence * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
