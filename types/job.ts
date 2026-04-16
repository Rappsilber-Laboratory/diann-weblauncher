export interface Job {
  id: string;
  command: string;
  outputPath: string;
  status: 'running' | 'completed' | 'failed' | 'starting';
  stdout: string;
  stderr: string;
  startTime: string;
  endTime?: string;
  exitCode?: number | null;
}

export interface SearchOption {
  flag: string;
  type: 'string' | 'number' | 'boolean' | 'path';
  description: string;
  required?: boolean;
}
