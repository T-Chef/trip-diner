import express from "express";
import { userAuth } from "../../middleware/userAuth.js";

import {
  toggleLike,
  getLikedPlaces,
  getLikeMeta,
  clearUserLikes,
} from "../../services/place/placeLikeService.js";

const router = express.Router();

/**
 * 간단 에러 로거 (원인 추적용)
 */
function logErr(req, e, tag = "PLACE_LIKE") {
  const status = e?.status || e?.response?.status || 500;
  console.error(`[${tag}]`, {
    method: req.method,
    path: req.originalUrl,
    status,
    message: e?.message,
    query: req.query,
    params: req.params,
    // body는 개인정보 있을 수 있으니 필요하면 주석 해제해서 제한적으로 쓰기
    // body: req.body,
  });
}

// 좋아요 메타
// GET /api/place/likes/meta?contentId=1037020&userId=1 (userId는 optional)
router.get("/likes/meta", async (req, res) => {
  try {
    // ✅ contentId 필수 (없으면 프론트가 잘못 호출한 것)
    const contentId = String(req.query?.contentId ?? "").trim();
    if (!contentId) {
      return res.status(400).json({ ok: false, message: "contentId is required" });
    }

    const result = await getLikeMeta(req.query);
    return res.json(result);
  } catch (e) {
    logErr(req, e, "LIKE_META_FAIL");
    return res.status(e.status || 400).json({ ok: false, message: e.message });
  }
});

// 유저 좋아요 목록
// GET /api/place/likes/user/:userId
router.get("/likes/user/:userId", async (req, res) => {
  try {
    const result = await getLikedPlaces(req.params.userId);
    return res.json(result);
  } catch (e) {
    logErr(req, e, "LIKE_LIST_FAIL");
    return res.status(e.status || 400).json({
      ok: false,
      error: e.message || "조회 실패",
    });
  }
});

// ✅ 전체 삭제 (반드시 userAuth 필요)
// DELETE /api/place/likes/user/:userId
router.delete("/likes/user/:userId", userAuth, async (req, res) => {
  try {
    const targetUserId = String(req.params.userId);
    const authUserId = String(req.user?.user_id);

    if (!authUserId) {
      return res.status(401).json({ ok: false, message: "로그인이 필요합니다." });
    }
    if (authUserId !== targetUserId) {
      return res.status(403).json({ ok: false, message: "권한이 없습니다." });
    }

    const result = await clearUserLikes(targetUserId);
    return res.json(result);
  } catch (e) {
    logErr(req, e, "LIKE_CLEAR_FAIL");
    return res.status(e.status || 500).json({
      ok: false,
      message: e.message || "삭제 실패",
    });
  }
});

// 좋아요 토글
// POST /api/place/likes
router.post("/likes", async (req, res) => {
  try {
    // ✅ 최소 필수값 체크(프론트에서 payload 누락 시 바로 잡기)
    const contentId = String(req.body?.contentId ?? "").trim();
    const userId = req.body?.userId;

    if (!contentId) {
      return res.status(400).json({ ok: false, error: "contentId is required" });
    }
    if (userId === undefined || userId === null || String(userId).trim() === "") {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }

    const result = await toggleLike(req.body);
    return res.json(result);
  } catch (e) {
    logErr(req, e, "LIKE_TOGGLE_FAIL");
    return res.status(e.status || 500).json({
      ok: false,
      error: e.message || "Like 저장 실패",
    });
  }
});

export default router;
