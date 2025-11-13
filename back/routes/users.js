// back/routes/users.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/users/register
 * body: { username, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1) 필수 입력값 확인
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'username, email, password는 필수입니다.' });
    }

    // 2) email 중복 확인
    const existing = await prisma.users.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 3) DB 저장
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password, // ※ 나중에 bcrypt로 암호화 권장
      },
    });

    res.status(201).json({
      message: '회원가입 완료',
      user: newUser,
    });
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(500).json({ message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

export default router;