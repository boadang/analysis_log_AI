import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  getLogSources,
  loadLog,
  uploadLog,
  postHunt
} from "../services/AI/threatApi";

// Components
import LogSourceSelector from "../components/LogSourceSelector";
import RawLogInput from "../components/RawLogInput";
import HuntControls from "../components/HuntControls";
import FilterPanel from "../components/FilterPanel";
import ResultsTable from "../components/ResultsTable";
import ChatBot from "../components/chatbot";

export default function ThreatHuntingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // CORE STATES
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("new");
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawLines, setRawLines] = useState([]);

  const [query, setQuery] = useState("");   // AI query
  const [logs, setLogs] = useState([]);     // AI results

  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    threat: "all",
    protocol: "all",
    conf: "all",
    start: "",
    end: ""
  });

  const [sort, setSort] = useState({ field: null, dir: "asc" });
  const [page, setPage] = useState(1);

  // UI
  const [loadingData, setLoadingData] = useState(true);
  const [isHunting, setIsHunting] = useState(false);

  // ------------------------------
  // AUTH REDIRECT
  // ------------------------------
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user]);

  // ------------------------------
  // LOAD LOG SOURCES
  // ------------------------------
  useEffect(() => {
    async function load() {
      try {
        const src = await getLogSources();
        setSources(src || []);
      } catch (err) {
        console.error("Load source error", err);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  // ------------------------------
  // LOAD LOG WHEN SELECTED
  // ------------------------------
  useEffect(() => {
    if (!selectedSource || selectedSource === "new") {
      setRawLines([]);
      return;
    }

    (async () => {
      try {
        const res = await loadLog(selectedSource);
        setRawLines(res.lines || []);
      } catch (err) {
        console.error("Load log failed", err);
        setRawLines([]);
      }
    })();
  }, [selectedSource]);

  // ------------------------------
  // HANDLE FILE UPLOAD + AUTO LOAD
  // ------------------------------
  const handleUploadFile = async () => {
    if (!selectedFile) return alert("Chọn file để upload");

    setLoadingData(true);
    try {
      const res = await uploadLog(selectedFile);

      // Select this source immediately
      setSelectedSource(res.id.toString());

      // Auto-load lines
      const loaded = await loadLog(res.id);
      setRawLines(loaded.lines || []);

      // Reload sources list
      const src = await getLogSources();
      setSources(src || []);

      setLogs([]);  // clear previous results

    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload thất bại");
    } finally {
      setLoadingData(false);
    }
  };

  // ------------------------------
  // START HUNT
  // ------------------------------
  const startHunt = async () => {
  // if (!query.trim()) {
  //   return alert("Nhập truy vấn AI trước khi hunting");
  // }

  // Không có log → stop
  if (
    selectedSource === "new" &&
    rawLines.length === 0 &&
    !selectedFile
  ) {
    return alert("Chưa có log để hunting");
  }

  // Nếu user upload file nhưng rawLines chưa load → upload trước
  if (selectedSource === "new" && selectedFile && rawLines.length === 0) {
    await handleUploadFile();
  }

  // -------------------------
  // TẠO BODY GỬI BACKEND
  // -------------------------
  const body = {
    query: query,
    logs: null,          // chuẩn bị override
    analysis_id: null,   // chuẩn bị override
  };

  // Case 1: user chọn log source đã lưu trong DB
  if (selectedSource !== "new") {
    body.analysis_id = Number(selectedSource);
  }

  // Case 2: user upload log mới
  if (selectedSource === "new") {
    body.logs = rawLines;
  }

  // Xóa field null để tránh 422
  if (body.logs === null) delete body.logs;
  if (body.analysis_id === null) delete body.analysis_id;

  console.log("Starting hunt with body:", body);

  // -------------------------
  // CALL API
  // -------------------------
  setIsHunting(true);
  try {
    const res = await postHunt(body);
    setLogs(res.items || []);
    setPage(1);
  } catch (err) {
    console.error(err);
    alert("Hunt thất bại:\n" + JSON.stringify(err?.message || err));
  } finally {
    setIsHunting(false);
  }
};

  // ------------------------------
  // MAIN UI
  // ------------------------------
  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700">Loading Threat Hunting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Threat Hunting</h1>
          <p className="opacity-90">
            Chủ động săn tìm mối đe dọa dựa trên AI.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">

        {/* SELECT SOURCE & UPLOAD */}
        <LogSourceSelector
          sources={sources}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          setSelectedFile={setSelectedFile}
          onUpload={handleUploadFile}
        />

        {/* RAW LOG INPUT */}
        <RawLogInput rawLines={rawLines} setRawLines={setRawLines} />

        {/* AI QUERY + BUTTON */}
        <HuntControls
          query={query}
          setQuery={setQuery}
          startHunt={startHunt}
          isHunting={isHunting}
        />

        {/* FILTER PANEL */}
        <FilterPanel filters={filters} setFilters={setFilters} logs={logs} />

        {/* RESULTS TABLE */}
        <ResultsTable
          logs={logs}
          filters={filters}
          sort={sort}
          setSort={setSort}
          page={page}
          setPage={setPage}
        />

        <ChatBot analysisData={logs} />

      </div>
    </div>
  );
}
