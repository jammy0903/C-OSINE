import { Router } from 'express';
import { simulateCode } from './simulator';

export const memoryRoutes = Router();

memoryRoutes.post('/trace', (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = simulateCode(code);
  res.json(result);
});
