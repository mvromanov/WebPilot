import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`WebPilot API listening on http://localhost:${env.port}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received; shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
