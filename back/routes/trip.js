// back/routes/trip.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/trip/user/1
 *  - user_id=1인 사용자의 전체 여행 일정
 *  - day, order_no 순으로 정렬
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const trips = await prisma.trip.findMany({
      where: { user_id: userId },
      orderBy: [
        { day: 'asc' },
        { order_no: 'asc' },
      ],
      select: {
        trip_id: true,
        user_id: true,
        title: true,
        created_at: true,
        day: true,
        order_no: true,
        place_id: true,
        place_name: true,
        activity: true,
        time_slot: true,
        latitude: true,
        longitude: true,
        keyword_tags: true,
      },
    });

    res.json(trips);
  } catch (err) {
    console.error('여행 일정 조회 에러:', err);
    res.status(500).json({ message: '여행 일정을 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/trip
 *  body: { user_id, title, day, order_no, place_id, place_name, activity, time_slot, latitude, longitude, keyword_tags }
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      title,
      day,
      order_no,
      place_id,
      place_name,
      activity,
      time_slot,
      latitude,
      longitude,
      keyword_tags,
    } = req.body;

    if (!user_id || !title || !day || !order_no) {
      return res.status(400).json({ message: 'user_id, title, day, order_no는 필수입니다.' });
    }

    const newTrip = await prisma.trip.create({
      data: {
        user_id: Number(user_id),
        title,
        day: Number(day),
        order_no: Number(order_no),
        place_id: place_id ? Number(place_id) : null,
        place_name,
        activity,
        time_slot,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        keyword_tags,
      },
    });

    res.status(201).json(newTrip);
  } catch (err) {
    console.error('여행 일정 생성 에러:', err);
    res.status(500).json({ message: '여행 일정을 저장하는 중 오류가 발생했습니다.' });
  }
});

export default router;