export default function FindingsTable({ findings }) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Time</th>
          <th>Event</th>
          <th>Verdict</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((f, i) => (
          <tr key={i}>
            <td>{f.timestamp}</td>
            <td>{f.event}</td>
            <td>{f.verdict}</td>
            <td>{Math.round(f.confidence * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}