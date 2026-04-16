# diaNN Job Launcher

A web-based job launcher for `diaNN` with a friendly frontend for configuration.

## Features
- Interactive search builder with drag-and-drop-like interface (click to add).
- Real-time command preview.
- Path autocomplete for navigating your filesystem.
- Job tracking with persistent status and live-ish logs.
- Dockerized deployment.

## Running with Docker

1. **Build and Start**:
   ```bash
   docker-compose up -d --build
   ```

2. **Access**:
   Navigate to `http://localhost:3000`

## Configuration
Update the `docker-compose.yml` to mount your data directories:
```yaml
volumes:
  - ./jobs:/jobs
  - /your/scientific/data:/data
```

## diaNN Wrapper
The wrapper in `bin/` handles directory expansion. Use `/data` in the UI to point to your scientific files.
