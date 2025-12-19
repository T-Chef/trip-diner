// back/routes/place.js
import express from "express";

import { getPlaces } from "../../services/place/placeListService.js";
import { getPlaceDetail } from "../../services/place/placeDetailService.js";
import { toggleLike, getLikedPlaces } from "../../services/place/placeLikeService.js";

const router = express.Router();

router.get("/places", async (req, res) => {
  try {
    const { fromCache, quotaBlocked, data } = await getPlaces(req.query);
    if (fromCache) res.setHeader("X-From-Cache", "1");
    if (quotaBlocked) res.setHeader("X-Quota-Blocked", "1");
    return res.json(data);
  } catch (e) {
    const status = e.status || 502;
    return res.status(status).json({
      ok: false,
      error: e.code || "PLACE_LIST_FAILED",
      message: e.message || "여행지 목록을 불러오지 못했습니다.",
    });
  }
});

router.get("/detail", async (req, res) => {
  try {
    const { fromCache, quotaBlocked, data } = await getPlaceDetail(req.query);
    if (fromCache) res.setHeader("X-From-Cache", "1");
    if (quotaBlocked) res.setHeader("X-Quota-Blocked", "1");
    return res.json(data);
  } catch (e) {
    const status = e.status || 502;
    return res.status(status).json({
      ok: false,
      error: e.code || "PLACE_DETAIL_FAILED",
      message: e.message || "상세 정보를 불러오지 못했습니다.",
    });
  }
});

router.post("/like", async (req, res) => {
  try {
    const result = await toggleLike(req.body);
    return res.json(result);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ ok: false, error: e.message || "Like 저장 실패" });
  }
});

router.get("/like/:userId", async (req, res) => {
  try {
    const result = await getLikedPlaces(req.params.userId);
    return res.json(result);
  } catch (e) {
    const status = e.status || 400;
    return res.status(status).json({ ok: false, error: e.message || "조회 실패" });
  }
});

export default router;
