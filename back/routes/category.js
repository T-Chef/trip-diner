// back/routes/category.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// api/category  → 전체 카테고리고리
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        category_id: true,
        name: true,
      },
      orderBy: {
        category_id: 'asc',
      },
    });

    res.json(categories);
  } catch (err) {
    console.error('카테고리 조회 에러:', err);
    res.status(500).json({ message: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;