export default function HuntControls({query, setQuery, startHunt, isHunting}) {
    return (
        <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Query AI (tuỳ chọn: brute force, C2, scan...)"
                    value={(query)}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 p-3 border rounded-lg"
                />
                <button
                    onClick={startHunt}
                    disabled={isHunting}
                    className="w-40 p-3 bg-emerald-600 text-white rounded-lg"
                >
                    {isHunting ? "Hunting...": "Start Hunting"}
                </button>
            </div>
        </div>
    );
}