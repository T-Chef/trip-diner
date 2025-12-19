// back/routes/plan.js
import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

/**
 * POST /api/plan
 * body: { aiPlan, themes? }
 * aiPlan 구조: { title, cityName, peopleType, themes, days:[{day, places:[...]}] }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { aiPlan, themes } = req.body;

    if (!aiPlan?.days?.length) {
      return res.status(400).json({ success: false, message: "aiPlan 데이터 없음" });
    }

    const cityName = aiPlan.cityName || "";
    const title = aiPlan.title || "여행 일정";
    const peopleType = aiPlan.peopleType || null;
    const finalThemes = aiPlan.themes || themes || [];

    const saved = await prisma.$transaction(async (tx) => {
      // 1) city 찾거나 생성
      let city = null;
      if (cityName.trim()) {
        city = await tx.city.findFirst({ where: { name: cityName.trim() } });
        if (!city) {
          city = await tx.city.create({ data: { name: cityName.trim() } });
        }
      }

      // 2) plan 생성 (기존 plan 컬럼에 맞춰 저장)
      const plan = await tx.plan.create({
        data: {
          user_id: userId,
          city_id: city?.city_id ?? null,
          title,
          start_date: null,
          end_date: null,
          // memo에 메타를 JSON 문자열로 저장 (스키마 수정 없이 가능)
          memo: JSON.stringify({
            peopleType,
            themes: finalThemes,
            cityName,
          }),
        },
      });

      // 3) plan_day + plan_item 저장
      for (let d = 0; d < aiPlan.days.length; d++) {
        const dayObj = aiPlan.days[d];
        const dayIndex = Number(dayObj.day ?? d + 1);
        const places = dayObj.places || [];

        const planDay = await tx.plan_day.create({
          data: {
            plan_id: plan.plan_id,
            day_index: dayIndex,
            date: null,
          },
        });

        for (let i = 0; i < places.length; i++) {
          const p = places[i];

          // place 재사용 기준: (city_id, name, lat, lng) 비슷한 걸로 찾기
          // (현재 place에 google placeId 같은 고유 string 컬럼이 없어서 이 방식이 제일 안전함)
          let placeRow = await tx.place.findFirst({
            where: {
              city_id: city?.city_id ?? null,
              name: p.name ?? null,
              lat: p.lat != null ? Number(p.lat) : null,
              lng: p.lng != null ? Number(p.lng) : null,
            },
          });

          if (!placeRow) {
            placeRow = await tx.place.create({
              data: {
                city_id: city?.city_id ?? null,
                name: p.name ?? null,
                category: Array.isArray(p.category) ? p.category[0] : (p.category ?? null),
                address: p.address ?? null,
                lat: p.lat != null ? Number(p.lat) : null,
                lng: p.lng != null ? Number(p.lng) : null,
                image_url: p.image ?? null,
                description: p.description ?? null,
              },
            });
          } else {
            // 이미지/주소가 비어있으면 최신값으로 보강 (선택)
            const needUpdate =
              (!placeRow.image_url && p.image) || (!placeRow.address && p.address);
            if (needUpdate) {
              placeRow = await tx.place.update({
                where: { place_id: placeRow.place_id },
                data: {
                  image_url: placeRow.image_url ?? (p.image ?? null),
                  address: placeRow.address ?? (p.address ?? null),
                },
              });
            }
          }

          const timeStr =
            p.time ??
            (p.startTime || p.endTime ? `${p.startTime ?? ""}-${p.endTime ?? ""}` : null);

          await tx.plan_item.create({
            data: {
              plan_day_id: planDay.plan_day_id,
              place_id: placeRow.place_id,
              order_index: i,
              time: timeStr,
              memo: null,
            },
          });
        }
      }

      return plan;
    });

    return res.json({ success: true, plan_id: saved.plan_id.toString() });
  } catch (err) {
  console.error("Plan Save Error:", err.code, err.meta, err.message);

  return res.status(500).json({
    success: false,
    message: "일정 저장 실패",
    code: err.code,
    meta: err.meta,     // ✅ 여기 중요 (column_name 나옴)
    detail: err.message,
  });
}
});

/** GET /api/plan (내 일정 목록) */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const plans = await prisma.plan.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        city: true,
        plan_day: {
          orderBy: { day_index: "asc" },
          include: {
            plan_item: {
              orderBy: { order_index: "asc" },
              include: { place: true },
            },
          },
        },
      },
    });

    // BigInt JSON 처리
    const safe = plans.map((p) => ({
      ...p,
      plan_id: p.plan_id.toString(),
      user_id: p.user_id.toString(),
      city_id: p.city_id ? p.city_id.toString() : null,
      plan_day: p.plan_day.map((d) => ({
        ...d,
        plan_day_id: d.plan_day_id.toString(),
        plan_id: d.plan_id.toString(),
        plan_item: d.plan_item.map((it) => ({
          ...it,
          plan_item_id: it.plan_item_id.toString(),
          plan_day_id: it.plan_day_id.toString(),
          place_id: it.place_id ? it.place_id.toString() : null,
          place: it.place
            ? {
                ...it.place,
                place_id: it.place.place_id.toString(),
                city_id: it.place.city_id ? it.place.city_id.toString() : null,
                external_id: it.place.external_id ? it.place.external_id.toString() : null,
              }
            : null,
        })),
      })),
    }));

    res.json({ success: true, plans: safe });
  } catch (err) {
    console.error("Plan List Error:", err);
    res.status(500).json({ success: false, message: "목록 조회 실패" });
  }
});

export default router;