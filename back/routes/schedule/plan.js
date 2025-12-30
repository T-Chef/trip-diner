import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
const saveLockByUser = new Map(); // key: userId(string) -> true

router.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id; 

    const plans = await prisma.plan.findMany({
      where: { user_id: userId },
      select: { plan_id: true, title: true, start_date: true, end_date: true },
      orderBy: { created_at: "desc" },
    });

    const safe = plans.map(p => ({
      ...p,
      plan_id: p.plan_id.toString(),
    }));

    res.json({ success: true, plans: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "조회 실패" });
  }
});

function toSafePlan(p) {
  return {
    ...p,
    plan_id: p.plan_id.toString(),
    user_id: p.user_id.toString(),
    city_id: p.city_id ? p.city_id.toString() : null,
    plan_day: (p.plan_day || []).map((d) => ({
      ...d,
      plan_day_id: d.plan_day_id.toString(),
      plan_id: d.plan_id.toString(),
      plan_item: (d.plan_item || []).map((it) => ({
        ...it,
        plan_item_id: it.plan_item_id.toString(),
        plan_day_id: it.plan_day_id.toString(),
        place_id: it.place_id ? it.place_id.toString() : null,
        place: it.place
          ? {
              ...it.place,
              place_id: it.place.place_id.toString(),
              city_id: it.place.city_id ? it.place.city_id.toString() : null,
              external_id: it.place.external_id
                ? it.place.external_id.toString()
                : null,
            }
          : null,
      })),
    })),
  };
}

router.post("/", requireAuth, async (req, res) => {
  const userKey = String(req.user.user_id);
  if (saveLockByUser.get(userKey)) {
    return res.status(409).json({
      success: false,
      message: "이미 일정 저장 중입니다. 완료 후 다시 시도해주세요.",
    });
  }

  saveLockByUser.set(userKey, true);
  try {
    const userId = req.user.user_id;
    const { aiPlan, themes, startDate } = req.body;

    if (!aiPlan?.days?.length) {
      return res.status(400).json({ success: false, message: "aiPlan 데이터 없음" });
    }

    const cityName = aiPlan.cityName || "";
    const title = aiPlan.title || "여행 일정";
    let start = null;
    let end = null;

if (startDate) {
  start = new Date(startDate);
  if (!Number.isNaN(start.getTime())) {
    end = new Date(start);
    end.setDate(end.getDate() + (aiPlan.days.length - 1));
  } else {
    start = null;
    end = null;
  }
}

    const peopleType = aiPlan.peopleType || null;
    const finalThemes = aiPlan.themes || themes || [];

    const saved = await prisma.$transaction(async (tx) => {
      

      let city = null;
      if (cityName.trim()) {
        city = await tx.city.findFirst({ where: { name: cityName.trim() } });
        if (!city) city = await tx.city.create({ data: { name: cityName.trim() } });
      }

      const plan = await tx.plan.create({
        data: {
          user_id: userId,
          city_id: city?.city_id ?? null,
          title,
          start_date: start,
          end_date: end,
          memo: JSON.stringify({ peopleType, themes: finalThemes, cityName }),
        },
      });

      for (let d = 0; d < aiPlan.days.length; d++) {
        const dayObj = aiPlan.days[d];
        const dayIndex = Number(dayObj.day ?? d + 1);
        const places = dayObj.places || [];

         let dayDate = null;
if (start) {
  dayDate = new Date(start);
  dayDate.setDate(dayDate.getDate() + (dayIndex - 1));
}

const planDay = await tx.plan_day.create({
  data: { plan_id: plan.plan_id, day_index: dayIndex, date: dayDate },
});

        for (let i = 0; i < places.length; i++) {
          const p = places[i];

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
    console.error("Plan Save Error:", err);
    return res.status(500).json({ success: false, message: "일정 저장 실패" });
  } finally {
    // ✅ 성공/실패/중간 return 모두 포함해서 무조건 락 해제
    saveLockByUser.delete(userKey);
  }
});

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

    res.json({ success: true, plans: plans.map(toSafePlan) });
  } catch (err) {
    console.error("Plan List Error:", err);
    res.status(500).json({ success: false, message: "목록 조회 실패" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    let planId;
    try {
      planId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ success: false, message: "잘못된 plan id" });
    }

    const plan = await prisma.plan.findFirst({
      where: { plan_id: planId, user_id: userId },
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

    if (!plan) return res.status(404).json({ success: false, message: "일정을 찾을 수 없음" });

    res.json({ success: true, plan: toSafePlan(plan) });
  } catch (err) {
    console.error("Plan Detail Error:", err);
    res.status(500).json({ success: false, message: "상세 조회 실패" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const planId = BigInt(req.params.id);

    const plan = await prisma.plan.findFirst({ where: { plan_id: planId, user_id: userId } });
    if (!plan) return res.status(404).json({ success: false, message: "일정 없음" });

    await prisma.$transaction(async (tx) => {
      const days = await tx.plan_day.findMany({ where: { plan_id: planId }, select: { plan_day_id: true } });
      const dayIds = days.map(d => d.plan_day_id);

      if (dayIds.length) await tx.plan_item.deleteMany({ where: { plan_day_id: { in: dayIds } } });
      await tx.plan_day.deleteMany({ where: { plan_id: planId } });
      await tx.plan.delete({ where: { plan_id: planId } });
    });

    res.json({ success: true });
  } catch (e) {
    console.error("Plan Delete Error:", e);
    res.status(500).json({ success: false, message: "삭제 실패" });
  }
});

export default router;
