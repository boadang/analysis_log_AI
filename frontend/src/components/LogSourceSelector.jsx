export default function LogSourceSelector({ 
    sources,
    selectedSource,
    setSelectedSource,
    setSelectedFile,
    onUpload, 
}) {
    return (
        <>
            <div className="bg-white rounded-xl shadow-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Log Source</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                    {/* Log Source Select */}
                    <div>
                        <p className="text-sm text-gray-600 mb-1">
                            Chọn log trước đó
                        </p>
                        <select 
                            className="w-full p-3 border rounded-lg"
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                        >
                            <option value="new">--Upload mới hoặc nhập raw ---</option>
                            {sources.map((s) => {
                                <option key={s.id} value={s.id}>{s.file_name}</option>
                            })}
                        </select>
                    </div>

                    {/* File Input */}
                    <div>
                        <p className="text-sm text-gray-600 mb-1">
                            Hoặc upload file mới
                        </p>

                        <input 
                            type="file" 
                            accept=".log,.txt"
                            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        />
                    </div>

                    {/* Upload Button */}
                    <div>
                        <button
                            onClick={onUpload}
                            className="w-full p-3 bg-blue-600 text-white rounded-lg"
                        >
                            Upload & Use
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}