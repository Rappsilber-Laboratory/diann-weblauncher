import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Job } from '@/types/job';

const JOBS_DB = '/jobs/jobs.json';
const LOGS_DIR = '/jobs/logs';

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
  // Update jobs with partial logs if needed or just return metadata
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

  // Spawn process
  const child = spawn('/bin/sh', ['-c', command], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const stdoutFile = path.join(LOGS_DIR, `${id}.stdout.log`);
  const stderrFile = path.join(LOGS_DIR, `${id}.stderr.log`);

  const stdoutStream = fs.createWriteStream(stdoutFile);
  const stderrStream = fs.createWriteStream(stderrFile);

  child.stdout?.pipe(stdoutStream);
  child.stderr?.pipe(stderrStream);

  child.on('close', (code) => {
    const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8')) as Job[];
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index].status = code === 0 ? 'completed' : 'failed';
      jobs[index].endTime = new Date().toISOString();
      jobs[index].exitCode = code;
      fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
    }
  });

  return NextResponse.json(newJob);
}
