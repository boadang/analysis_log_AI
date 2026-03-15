export default function RawLogInput({ rawLines, setRawLines}) {
    return (
        <div className="bg-white rounded-xl shadow-lg border p-6">
            <p className="text-sm text-gray-600 mb-2">
                Hoặc chỉnh sửa raw log:
            </p>
            <textarea
                className="w-full p-3 border rounded-lg h-40"
                value={rawLines.join('\n')}
                onChange={(e) => setRawLines(e.target.value.split('/n').filter(Boolean))}
            />
        </div>
    );
}