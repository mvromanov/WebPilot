import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const parsedPort = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error('PORT must be a positive integer');
}

export const env = {
  port: parsedPort,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : fileURLToPath(new URL('../../data/webpilot.db', import.meta.url)),
};
