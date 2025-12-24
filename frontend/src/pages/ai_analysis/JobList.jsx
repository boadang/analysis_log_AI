// frontend/src/pages/ai_analysis/JobList.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import JobCard from "./components/JobCard";
import { fetchJobs } from "../../services/AI/analysisApi";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const isMountedRef = useRef(true);  
  const prevJobsRef = useRef([]);

  const loadJobs = useCallback(async () => {
    const isInitialLoad = jobs.length === 0;
    if (isInitialLoad) setLoading(true);
    
    setError("");
    
    try {
      const data = await fetchJobs();
      
      if (!isMountedRef.current) return;
      
      const dataChanged = JSON.stringify(data) !== JSON.stringify(prevJobsRef.current);
      
      if (dataChanged) {
        setJobs(data);
        prevJobsRef.current = data;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError("Không thể tải danh sách jobs.");
      }
    } finally {
      if (isMountedRef.current && isInitialLoad) {
        setLoading(false);
      }
    }
  }, [jobs.length]);

  useEffect(() => {
    isMountedRef.current = true;
    loadJobs();
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadJobs();
      }
    }, 10000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => filterStatus === "all" || j.status === filterStatus);
  }, [jobs, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts = { all: jobs.length, queued: 0, running: 0, completed: 0, failed: 0 };
    jobs.forEach(j => {
      if (counts.hasOwnProperty(j.status)) {
        counts[j.status]++;
      }
    });
    return counts;
  }, [jobs]);

  if (loading && jobs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analysis Jobs</h1>
          <div className="text-sm text-gray-600 mt-1">
            {statusCounts.all} total, {statusCounts.running} running
          </div>
        </div>
        <Link 
          to="/ai-analysis/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Create New Job
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 p-2 border-b overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "queued", label: "Queued" },
            { value: "running", label: "Running" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                filterStatus === value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label} ({statusCounts[value] || 0})
            </button>
          ))}
          <button 
            onClick={loadJobs} 
            className="ml-auto px-3 py-2 border rounded text-sm hover:bg-gray-50 transition flex-shrink-0"
          >
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4">
            {error}
          </div>
        )}

        {/* Job List */}
        <div className="p-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              {filterStatus === "all" ? (
                <>
                  No jobs yet. <Link to="/ai-analysis/create" className="text-blue-600 hover:underline">Create your first job</Link>.
                </>
              ) : (
                `No ${filterStatus} jobs found.`
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}