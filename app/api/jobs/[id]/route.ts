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
