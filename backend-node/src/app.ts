import express from 'express';
import cors from 'cors';
import { env, corsOrigins } from './config/env';
import { problemRoutes } from './modules/problems/routes';
import { memoryRoutes } from './modules/memory/routes';
import { submissionRoutes } from './modules/submissions/routes';
import { userRoutes } from './modules/users/routes';
import { cRoutes } from './modules/c/routes';

const app = express();

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'C-OSINE Backend API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/api/problems', problemRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/c', cRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

export default app;
