'use client';
import { useState, useEffect } from 'react';
import { Job } from '@/types/job';

export default function JobList({ jobs, onRefresh }: { jobs: Job[], onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ [id: string]: { stdout: string, stderr: string } }>({});

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    // Fetch latest logs
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      setLogs(prev => ({ ...prev, [id]: { stdout: data.stdout, stderr: data.stderr } }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const intv = setInterval(onRefresh, 5000);
    return () => clearInterval(intv);
  }, [onRefresh]);

  return (
    <div>
      <h3>Recent Jobs</h3>
      {jobs.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No jobs found.</p>}
      {jobs.sort((a,b) => b.startTime.localeCompare(a.startTime)).map(job => (
        <div key={job.id} className="job-item">
          <div className="job-header" onClick={() => toggleExpand(job.id)}>
            <div>
              <span style={{ fontWeight: 700, marginRight: '1rem' }}>ID: {job.id.slice(0,8)}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.outputPath}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(job.startTime).toLocaleString()}
              </span>
              <span className={`status-badge ${job.status}`}>{job.status}</span>
            </div>
          </div>
          {expanded === job.id && (
            <div className="job-content">
              <div style={{ marginBottom: '0.5rem', opacity: 0.6 }}>Command: {job.command}</div>
              {logs[job.id]?.stdout && (
                <div style={{ color: '#0f0' }}>--- STDOUT ---<br />{logs[job.id].stdout}</div>
              )}
              {logs[job.id]?.stderr && (
                <div style={{ color: '#f00', marginTop: '1rem' }}>--- STDERR ---<br />{logs[job.id].stderr}</div>
              )}
              {!logs[job.id] && <p>Loading logs...</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
