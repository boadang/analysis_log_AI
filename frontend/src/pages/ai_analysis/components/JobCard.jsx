import React from "react";
import { Link } from "react-router-dom";

export default function JobCard({ job }) {

  console.log("Rendering JobCard for job:", job.id);
  console.log("Job details:", job);

  return (
    <div className="border rounded p-4 flex items-center justify-between bg-gray-50">
      <div>
        <div className="font-semibold">{job.job_name || job.id}</div>
        <div className="text-xs text-gray-500">Model: {job.model_name} • {new Date(job.created_at).toLocaleString()}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm">Status: <strong>{job.status}</strong></div>
        <Link to={`/ai-analysis/${job.id}`} className="text-blue-600 text-sm">View</Link>
      </div>
    </div>
  );
}