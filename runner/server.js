const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Load paths from environment variables for easier hosting outside of Docker
const JOBS_ROOT = process.env.JOBS_ROOT || '/jobs';
const LOGS_DIR = process.env.LOGS_DIR || path.join(JOBS_ROOT, 'logs');
const JOBS_DB = process.env.JOBS_DB || path.join(JOBS_ROOT, 'jobs.json');

const activeProcesses = new Map();

// Ensure log directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

app.post('/start', (req, res) => {
  const { id, command } = req.body;
  if (!id || !command) {
    return res.status(400).send('Missing id or command');
  }

  console.log(`Starting job ${id}: ${command}`);

  // Spawn process
  const child = spawn('/bin/sh', ['-c', command], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  activeProcesses.set(id, child);
  const pid = child.pid;
  console.log(`Job ${id} started with PID ${pid}`);

  // Update PID in jobs.json immediately
  try {
    if (fs.existsSync(JOBS_DB)) {
      const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
      const index = jobs.findIndex(j => j.id === id);
      if (index !== -1) {
        jobs[index].pid = pid;
        fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
      }
    }
  } catch (err) {
    console.error('Failed to update PID in jobs.json', err);
  }

  const stdoutFile = path.join(LOGS_DIR, `${id}.stdout.log`);
  const stderrFile = path.join(LOGS_DIR, `${id}.stderr.log`);

  const stdoutStream = fs.createWriteStream(stdoutFile);
  const stderrStream = fs.createWriteStream(stderrFile);

  child.stdout?.pipe(stdoutStream);
  child.stderr?.pipe(stderrStream);

  child.on('close', (code) => {
    console.log(`Job ${id} finished with code ${code}`);
    activeProcesses.delete(id);
    try {
      if (fs.existsSync(JOBS_DB)) {
        const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
        const index = jobs.findIndex(j => j.id === id);
        if (index !== -1) {
          jobs[index].status = code === 0 ? 'completed' : 'failed';
          jobs[index].endTime = new Date().toISOString();
          jobs[index].exitCode = code;
          fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to update jobs.json', err);
    }
  });

  res.send({ status: 'started' });
});

app.post('/stop/:id', (req, res) => {
  const { id } = req.params;
  const child = activeProcesses.get(id);
  if (child) {
    console.log(`Stopping job ${id} (PID ${child.pid})`);
    try {
      // Kill process group
      process.kill(-child.pid, 'SIGKILL');
    } catch (err) {
      console.error('Failed to kill process group', err);
    }
    activeProcesses.delete(id);
    res.send({ status: 'stopped' });
  } else {
    res.status(404).send('Job not running on this runner');
  }
});

const PORT = process.env.RUNNER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Runner listening on port ${PORT}`);
});
