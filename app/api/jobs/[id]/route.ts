import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JOBS_DB = '/jobs/jobs.json';
const LOGS_DIR = '/jobs/logs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  const job = jobs.find((j: any) => j.id === id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const stdoutFile = path.join(LOGS_DIR, `${id}.stdout.log`);
  const stderrFile = path.join(LOGS_DIR, `${id}.stderr.log`);

  let stdout = '';
  let stderr = '';

  if (fs.existsSync(stdoutFile)) {
    stdout = fs.readFileSync(stdoutFile, 'utf-8');
  }
  if (fs.existsSync(stderrFile)) {
    stderr = fs.readFileSync(stderrFile, 'utf-8');
  }

  return NextResponse.json({ ...job, stdout, stderr });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to stop the job first
  const RUNNER_URL = process.env.RUNNER_URL || 'http://runner:3001';
  try {
    await fetch(`${RUNNER_URL}/stop/${id}`, { method: 'POST' });
  } catch (err) {
    console.log('Job might not be running or runner unreachable', err);
  }

  // Remove from DB
  const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  const filteredJobs = jobs.filter((j: any) => j.id !== id);
  fs.writeFileSync(JOBS_DB, JSON.stringify(filteredJobs, null, 2));

  // Remove logs
  const stdoutFile = path.join(LOGS_DIR, `${id}.stdout.log`);
  const stderrFile = path.join(LOGS_DIR, `${id}.stderr.log`);
  if (fs.existsSync(stdoutFile)) fs.unlinkSync(stdoutFile);
  if (fs.existsSync(stderrFile)) fs.unlinkSync(stderrFile);

  return NextResponse.json({ success: true });
}
