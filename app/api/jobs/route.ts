import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Job } from '@/types/job';

const JOBS_DB = '/jobs/jobs.json';
const LOGS_DIR = '/jobs/logs';
const RUNNER_URL = process.env.RUNNER_URL || 'http://runner:3001';

// Ensure directories exist
if (!fs.existsSync('/jobs')) {
  fs.mkdirSync('/jobs');
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}
if (!fs.existsSync(JOBS_DB)) {
  fs.writeFileSync(JOBS_DB, JSON.stringify([], null, 2));
}

export async function GET() {
  const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const { command, outputPath } = await req.json();
  const id = uuidv4();
  const startTime = new Date().toISOString();

  const newJob: Job = {
    id,
    command,
    outputPath,
    status: 'running',
    stdout: '',
    stderr: '',
    startTime,
  };

  // Add to persistence
  const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  jobs.push(newJob);
  fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));

  // Forward to runner
  try {
    await fetch(`${RUNNER_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, command }),
    });
  } catch (err) {
    console.error('Failed to contact runner', err);
    // Rollback or mark as failed
    const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8')) as Job[];
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index].status = 'failed';
      jobs[index].stderr = 'Failed to connect to job runner.';
      fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
    }
  }

  return NextResponse.json(newJob);
}
