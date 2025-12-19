// back/routes/city.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// api/city  → 전체 도시 목록
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      select: {
        city_id: true,
        city_name: true,
        province_name: true,
        description: true,
      },
      orderBy: {
        city_id: 'asc',
      },
    });

    res.json(cities);
  } catch (err) {
    console.error('도시 목록 조회 에러:', err);
    res.status(500).json({ message: '도시 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 필요하면 단일 도시 조회도 추가 가능 (옵션)
// api/city -> 단일 도시
router.get('/:id', async (req, res) => {
  try {
    const cityId = Number(req.params.id);
    const city = await prisma.city.findUnique({
      where: { city_id: cityId },
    });

    if (!city) {
      return res.status(404).json({ message: '해당 도시를 찾을 수 없습니다.' });
    }

    res.json(city);
  } catch (err) {
    console.error('도시 정보 조회 에러:', err);
    res.status(500).json({ message: '도시 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;