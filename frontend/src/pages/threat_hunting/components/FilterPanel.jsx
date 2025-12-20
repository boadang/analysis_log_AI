export default function FilterPanel({ onChange }) {
  return (
    <section className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-4">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Search findings"
        onChange={(e) => onChange?.(e.target.value)}
      />
    </section>
  );
}
