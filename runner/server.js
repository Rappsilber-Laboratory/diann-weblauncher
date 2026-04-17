const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const JOBS_DB = '/jobs/jobs.json';
const LOGS_DIR = '/jobs/logs';

app.post('/start', (req, res) => {
  const { id, command } = req.json || req.body;
  if (!id || !command) {
    return res.status(400).send('Missing id or command');
  }

  console.log(`Starting job ${id}: ${command}`);

  // Spawn process
  const child = spawn('/bin/sh', ['-c', command], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

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

app.listen(3001, () => {
  console.log('Runner listening on port 3001');
});
