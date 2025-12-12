import React from "react";

export default function ResultsTable({
    logs = [],
    filters,
    sort,
    setSort,
    page,
    setPage,
}) {
    const PAGE_SIZE = 50;

    // ─────────────────────────────────────
    // 1) FILTERING
    // ─────────────────────────────────────
    const filteredLogs = logs.filter((l) => {
        const search = filters.search.toLowerCase();

        const okSearch =
            !search ||
            l.source_ip?.toLowerCase().includes(search) ||
            l.dest_ip?.toLowerCase().includes(search) ||
            l.threat_type?.toLowerCase().includes(search);

        const okAction =
            filters.action === "all" || l.action === filters.action;

        const okProtocol =
            filters.protocol === "all" || l.protocol === filters.protocol;

        const okThreat =
            filters.threat === "all" || l.threat_type === filters.threat;

        const okConfidence =
            filters.conf === "all" ||
            (l.ai_confidence >= Number(filters.conf));

        const okTime =
            (!filters.start || new Date(l.timestamp) >= new Date(filters.start)) &&
            (!filters.end || new Date(l.timestamp) <= new Date(filters.end));

        return (
            okSearch &&
            okAction &&
            okProtocol &&
            okThreat &&
            okConfidence &&
            okTime
        );
    });

    // ─────────────────────────────────────
    // 2) SORTING
    // ─────────────────────────────────────
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        if (!sort.field) return 0;
        const x = a[sort.field] ?? "";
        const y = b[sort.field] ?? "";
        return sort.dir === "asc"
            ? String(x).localeCompare(String(y))
            : String(y).localeCompare(String(x));
    });

    // ─────────────────────────────────────
    // 3) PAGINATION
    // ─────────────────────────────────────
    const paginated = sortedLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (field) => {
        if (sort.field === field) {
            setSort({ field, dir: sort.dir === "asc" ? "desc" : "asc" });
        } else {
            setSort({ field, dir: "asc" });
        }
    };

    const columns = [
        ["timestamp", "Time"],
        ["source_ip", "Source IP"],
        ["dest_ip", "Destination IP"],
        ["threat_type", "Threat Type"],
        ["action", "Action"],
        ["protocol", "Protocol"],
        ["ai_confidence", "AI Confidence"],
        ["evidence", "Evidence"],
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg border">
            {/* HEADER */}
            <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Kết quả Threat Hunting</h2>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            {columns.map(([field, label]) => (
                                <th
                                    key={field}
                                    className="px-6 py-3 text-xs uppercase font-medium cursor-pointer"
                                    onClick={() => toggleSort(field)}
                                >
                                    {label}{" "}
                                    {sort.field === field &&
                                        (sort.dir === "asc" ? "▲" : "▼")}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {paginated.length > 0 ? (
                            paginated.map((log, idx) => (
                                <tr
                                    key={idx}
                                    className={
                                        log.ai_confidence > 90
                                            ? "bg-red-50"
                                            : ""
                                    }
                                >
                                    <td className="px-6 py-4">
                                        {log.timestamp}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.source_ip}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.dest_ip}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.threat_type || "N/A"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 text-xs rounded ${
                                                log.action === "block"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-green-100 text-green-700"
                                            }`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.protocol}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.ai_confidence
                                            ? `${log.ai_confidence}%`
                                            : "N/A"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.evidence
                                            ? `${log.evidence}%`
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Không có dữ liệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center py-4 gap-3">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border rounded-lg bg-gray-100"
                >
                    Prev
                </button>

                <span className="px-4 py-2">{page}</span>

                <button
                    onClick={() =>
                        setPage((p) =>
                            paginated.length === PAGE_SIZE ? p + 1 : p
                        )
                    }
                    className="px-4 py-2 border rounded-lg bg-gray-100"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
