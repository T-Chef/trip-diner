// back/routes/place.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 *  api/place
 * 
 *  - 전체 장소 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const { city_id, category_id } = req.query;

    const where = {};

    if (city_id) {
      where.city_id = Number(city_id);
    }
    if (category_id) {
      where.category_id = Number(category_id);
    }

    const places = await prisma.place.findMany({
      where,
      select: {
        place_id: true,
        city_id: true,
        category_id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
        image_url: true,
        rating: true,
      },
      orderBy: {
        place_id: 'asc',
      },
    });

    res.json(places);
  } catch (err) {
    console.error('장소 목록 조회 에러:', err);
    res.status(500).json({ message: '장소 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 *  api/place/:id
 * 
 *  - 특정 place 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const placeId = Number(req.params.id);

    const place = await prisma.place.findUnique({
      where: { place_id: placeId },
      select: {
        place_id: true,
        city_id: true,
        category_id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
        image_url: true,
        rating: true,
      },
    });

    if (!place) {
      return res.status(404).json({ message: '해당 장소를 찾을 수 없습니다.' });
    }

    res.json(place);
  } catch (err) {
    console.error('장소 상세 조회 에러:', err);
    res.status(500).json({ message: '장소 상세를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;