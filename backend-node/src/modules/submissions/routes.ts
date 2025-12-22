import { Router } from 'express';
import { prisma } from '../../config/database';

export const submissionRoutes = Router();

// 제출 기록 생성
submissionRoutes.post('/', async (req, res) => {
  try {
    const { firebaseUid, problemId, code, verdict, executionTime } = req.body;

    if (!firebaseUid || !problemId || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Firebase UID로 사용자 찾기 (없으면 자동 생성)
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

// 사용자의 제출 기록 조회
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

// 사용자가 푼 문제 ID 목록 (accepted만)
submissionRoutes.get('/solved/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return res.json({ solved: [], attempted: [] });
    }

    // 정답 처리된 문제들
    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        verdict: 'accepted'
      },
      select: { problemId: true },
      distinct: ['problemId']
    });

    // 시도했지만 아직 못 푼 문제들
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
