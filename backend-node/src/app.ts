import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { problemRoutes } from './modules/problems/routes';
import { memoryRoutes } from './modules/memory/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'COSLAB Backend API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/api/problems', problemRoutes);
app.use('/api/memory', memoryRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
