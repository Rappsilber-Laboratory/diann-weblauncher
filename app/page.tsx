'use client';
import { useState, useEffect } from 'react';
import SearchForm from '@/components/SearchForm';
import JobList from '@/components/JobList';
import { Job } from '@/types/job';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<any[] | undefined>(undefined);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStartJob = async (command: string, outputPath: string, options: any[]) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, outputPath, options }),
      });
      if (res.ok) {
        setIsFormOpen(false);
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 
          onClick={() => setIsFormOpen(false)} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Go back to job list"
        >
          diaNN Job Launcher
        </h1>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)}>Start New Search</button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card">
          <SearchForm 
            onStartJob={handleStartJob} 
            onCancel={() => { setIsFormOpen(false); setTemplateOptions(undefined); }} 
            initialOptions={templateOptions}
          />
        </div>
      ) : (
        <JobList 
          jobs={jobs} 
          onRefresh={fetchJobs} 
          onClone={(job) => {
            setTemplateOptions(job.options);
            setIsFormOpen(true);
          }}
        />
      )}
    </main>
  );
}
