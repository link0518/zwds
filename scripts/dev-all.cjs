const { spawn } = require('child_process');

const processes = new Map();
let shuttingDown = false;

const spawnCommand = (name, command, args) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  processes.set(name, child);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const [, proc] of processes) {
      if (proc !== child && proc.pid) {
        proc.kill('SIGTERM');
      }
    }
    const exitCode = typeof code === 'number' ? code : signal ? 1 : 0;
    process.exit(exitCode);
  });

  child.on('error', (error) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[dev:all] ${name} failed to start:`, error);
    for (const [, proc] of processes) {
      if (proc.pid) {
        proc.kill('SIGTERM');
      }
    }
    process.exit(1);
  });
};

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const [, proc] of processes) {
    if (proc.pid) {
      proc.kill(signal);
    }
  }
  setTimeout(() => process.exit(0), 1000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => shutdown('SIGTERM'));

spawnCommand('frontend', 'npm', ['run', 'dev']);
spawnCommand('backend', 'npm', ['run', 'server']);
