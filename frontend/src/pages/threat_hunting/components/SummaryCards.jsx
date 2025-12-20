export default function SummaryCards({ summary }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-blue-50 text-blue-700 p-4 rounded-xl shadow-sm text-center">
        Total: {summary.total}
      </div>
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl shadow-sm text-center">
        Suspicious: {summary.suspicious}
      </div>
      <div className="bg-red-50 text-red-700 p-4 rounded-xl shadow-sm text-center">
        Malicious: {summary.malicious}
      </div>
    </section>
  );
}
