import { spawn } from 'child_process';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Shankara Admin Panel (Server + Client)...\n');

// Start Express Backend Server
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true,
});

// Start Vite Client Dev Server
const client = spawn('npm', ['run', 'dev', '--prefix', 'client'], {
  stdio: 'inherit',
  shell: true,
});

server.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', '[Server Error]:', err);
});

client.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', '[Client Error]:', err);
});

process.on('SIGINT', () => {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down server and client...');
  server.kill();
  client.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit(0);
});
