import {useState, useEffect} from "react";

export default function FilterPanel({filters, setFilters, logs}) {
    const [search, setSearch] = useState(filters.search);

    //Debounce Search
    useEffect(() => {
        const t = setTimeout(() => {
            setFilters((prev) => {setFilters({...filters, search })}, 300);
            return () => clearTimeout(t);
        })
    }, [search]);

    return(
        <>
            <div className="bg-white rounded-xl shadow-lg border p-6 grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Search */}
                <div>
                    <label className="text-sm text-gray-500">Search</label>
                    <input 
                        className="w-full p-2 border rounded-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="IP, Threat, ..." 
                    />
                </div>

                {/* Actions */}
                <div>
                    <label className="text-sm">Action</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filters.threat}
                        onChange={(e) => setFilters({...filters, threat: e.target.value})}
                    >
                        <option value="all">Tất cả</option>
                        {[...new Set(logs.map((l) => l.threat_type).filter(Boolean))].map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Protocols */}
                <div>
                    <label className="text-sm">Protocol</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filters.protocol}
                        onChange={(e) => setFilters({...filters, protocol: e.target.value})}
                    >
                        <option value="all">Tất cả</option>
                        {[...new Set(logs.map((l) => l.protocol).filter(Boolean))].map((p) => (
                            <option key={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* Confidence */}
                <div>
                    <label className="text-sm">Confidence</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filters.conf}
                        onChange={(e) => setFilters({...filters, conf: e.target.value})}
                    >
                        <option value="all">Tất cả</option>
                        <option value="high">90%</option>
                        <option value="medium">70%</option>
                        <option value="low">50%</option>
                    </select>
                </div>

                {/* Time range */}
                <div>
                    <label className="text-sm">Từ</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 border rounded-lg"
                        value={filters.start}
                        onChange={(e) => setFilters({...filters, start: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-sm">Từ</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 border rounded-lg"
                        value={filters.end}
                        onChange={(e) => setFilters({...filters, end: e.target.value})}
                    />
                </div>
            </div>
        </>
    )
}