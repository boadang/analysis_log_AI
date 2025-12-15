export default function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div>Total: {summary.total}</div>
      <div>Suspicious: {summary.suspicious}</div>
      <div>Malicious: {summary.malicious}</div>
    </div>
  );
}