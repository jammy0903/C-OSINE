import { Router } from 'express';
import { prisma } from '../../config/database';

export const submissionRoutes = Router();

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: 제출 기록 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firebaseUid, problemId, code]
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               problemId:
 *                 type: string
 *               code:
 *                 type: string
 *               verdict:
 *                 type: string
 *                 enum: [accepted, wrong_answer, compile_error, runtime_error]
 *               executionTime:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 제출 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Submission'
 *       400:
 *         description: 필수 필드 누락
 *       401:
 *         description: 사용자 없음
 */
submissionRoutes.post('/', async (req, res) => {
  try {
    const { firebaseUid, problemId, code, verdict, executionTime } = req.body;

    if (!firebaseUid || !problemId || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please login first.' });
    }

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId,
        code,
        verdict: verdict || 'judging',
        executionTime
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * @swagger
 * /api/submissions/user/{firebaseUid}:
 *   get:
 *     tags: [Submissions]
 *     summary: 사용자의 제출 기록 조회
 *     parameters:
 *       - in: path
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 제출 기록 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Submission'
 */
submissionRoutes.get('/user/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return res.json([]);
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        problem: {
          select: { number: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * @swagger
 * /api/submissions/solved/{firebaseUid}:
 *   get:
 *     tags: [Submissions]
 *     summary: 사용자가 푼 문제 ID 목록
 *     description: solved(정답), attempted(시도중) 분리 반환
 *     parameters:
 *       - in: path
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 문제 ID 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 solved:
 *                   type: array
 *                   items:
 *                     type: string
 *                 attempted:
 *                   type: array
 *                   items:
 *                     type: string
 */
submissionRoutes.get('/solved/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return res.json({ solved: [], attempted: [] });
    }

    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        verdict: 'accepted'
      },
      select: { problemId: true },
      distinct: ['problemId']
    });

    const allSubmissions = await prisma.submission.findMany({
      where: { userId: user.id },
      select: { problemId: true },
      distinct: ['problemId']
    });

    const solvedIds = solvedSubmissions.map(s => s.problemId);
    const attemptedIds = allSubmissions
      .map(s => s.problemId)
      .filter(id => !solvedIds.includes(id));

    res.json({
      solved: solvedIds,
      attempted: attemptedIds
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch solved problems' });
  }
});
