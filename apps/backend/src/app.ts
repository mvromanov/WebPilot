import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { projectsRouter } from './routes/projects.js';
import { stepsRouter } from './routes/steps.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/steps', stepsRouter);
app.use('/steps', stepsRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});
