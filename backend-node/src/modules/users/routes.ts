import { Router } from 'express';
import { prisma } from '../../config/database';

export const userRoutes = Router();

// 전체 사용자 목록 (Admin용)
userRoutes.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            submissions: true,
            drafts: true
          }
        },
        submissions: {
          where: { verdict: 'accepted' },
          select: { problemId: true },
          distinct: ['problemId']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firebaseUid: user.firebaseUid,
      createdAt: user.createdAt,
      totalSubmissions: user._count.submissions,
      solvedCount: user.submissions.length,
      draftsCount: user._count.drafts
    }));

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 사용자 등록 또는 조회 (Firebase 로그인 후 호출)
userRoutes.post('/register', async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 이미 존재하면 조회, 없으면 생성
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      update: { email, name: name || email.split('@')[0] },
      create: {
        firebaseUid,
        email,
        name: name || email.split('@')[0]
      }
    });

    res.json(user);
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// 사용자 정보 조회
userRoutes.get('/:firebaseUid', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.params.firebaseUid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
