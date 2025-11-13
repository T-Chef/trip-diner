// back/routes/review.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/review?place_id=1
 *  - 특정 장소(place_id)의 리뷰 목록
 */
router.get('/', async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return res.status(400).json({ message: 'place_id 쿼리 파라미터가 필요합니다.' });
    }

    const reviews = await prisma.review.findMany({
      where: { place_id: Number(place_id) },
      select: {
        review_id: true,
        user_id: true,
        place_id: true,
        rating: true,
        content: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(reviews);
  } catch (err) {
    console.error('리뷰 조회 에러:', err);
    res.status(500).json({ message: '리뷰 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/review
 *  body: { user_id, place_id, rating, content }
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, place_id, rating, content } = req.body;

    if (!user_id || !place_id || !rating || !content) {
      return res.status(400).json({ message: 'user_id, place_id, rating, content는 필수입니다.' });
    }

    const newReview = await prisma.review.create({
      data: {
        user_id: Number(user_id),
        place_id: Number(place_id),
        rating: Number(rating),
        content,
      },
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.error('리뷰 생성 에러:', err);
    res.status(500).json({ message: '리뷰를 저장하는 중 오류가 발생했습니다.' });
  }
});

export default router;