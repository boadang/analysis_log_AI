export function InfoItem({ title, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  );
}