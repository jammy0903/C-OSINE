import { Router } from 'express';
import { prisma } from '../../config/database';

export const userRoutes = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: 전체 사용자 목록 (Admin용)
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/User'
 *                   - type: object
 *                     properties:
 *                       totalSubmissions:
 *                         type: integer
 *                       solvedCount:
 *                         type: integer
 *                       draftsCount:
 *                         type: integer
 */
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
      role: user.role,
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

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: 사용자 등록 또는 조회
 *     description: Firebase 로그인 후 호출. 이미 존재하면 조회, 없으면 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firebaseUid, email]
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 필수 필드 누락
 */
userRoutes.post('/register', async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

/**
 * @swagger
 * /api/users/{firebaseUid}:
 *   get:
 *     tags: [Users]
 *     summary: 사용자 정보 조회
 *     parameters:
 *       - in: path
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자 없음
 */
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

/**
 * @swagger
 * /api/users/{firebaseUid}/role:
 *   get:
 *     tags: [Users]
 *     summary: 사용자 role 조회 (Admin 체크용)
 *     parameters:
 *       - in: path
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                 isAdmin:
 *                   type: boolean
 *       404:
 *         description: 사용자 없음
 */
userRoutes.get('/:firebaseUid/role', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.params.firebaseUid },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ role: user.role, isAdmin: user.role === 'admin' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user role' });
  }
});
