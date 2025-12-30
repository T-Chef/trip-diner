// back/routes/place.js
import express from "express";

import { getPlaces } from "../../services/place/placeListService.js";
import { getPlaceDetail } from "../../services/place/placeDetailService.js";

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

export default router;
