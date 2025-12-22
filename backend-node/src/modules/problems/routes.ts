import { Router } from 'express';
import { prisma } from '../../config/database';

export const problemRoutes = Router();

// 문제 목록
problemRoutes.get('/', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        number: true,
        title: true,
        difficulty: true
      },
      orderBy: { number: 'asc' }
    });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// 문제 상세
problemRoutes.get('/:id', async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: req.params.id }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});
