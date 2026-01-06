import express from "express";
import { userAuth } from "../../middleware/userAuth.js";

import {
  toggleLike,
  getLikedPlaces,
  getLikeMeta,
  clearUserLikes,
} from "../../services/place/placeLikeService.js";

const router = express.Router();

function logErr(req, e, tag = "PLACE_LIKE") {
  const status = e?.status || e?.response?.status || 500;
  console.error(`[${tag}]`, {
    method: req.method,
    path: req.originalUrl,
    status,
    message: e?.message,
    query: req.query,
    params: req.params,
  });
}

// 좋아요 정보 조회
router.get("/likes/meta", async (req, res) => {
  try {
    const contentId = String(req.query?.contentId ?? "").trim();
    if (!contentId) {
      return res
        .status(400)
        .json({ ok: false, message: "contentId is required" });
    }

    const result = await getLikeMeta(req.query);
    return res.json(result);
  } catch (e) {
    logErr(req, e, "LIKE_META_FAIL");
    return res.status(e.status || 400).json({ ok: false, message: e.message });
  }
});

// 유저 좋아요 목록 조회
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

// 유저 좋아요 전체 삭제
router.delete("/likes/user/:userId", userAuth, async (req, res) => {
  try {
    const targetUserId = String(req.params.userId);
    const authUserId = String(req.user?.user_id);

    if (!authUserId) {
      return res
        .status(401)
        .json({ ok: false, message: "로그인이 필요합니다." });
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

// 좋아요 토글 (좋아요/좋아요 취소) -> 하트 버튼 클릭 시
router.post("/likes", async (req, res) => {
  try {
    const contentId = String(req.body?.contentId ?? "").trim();
    const userId = req.body?.userId;

    if (!contentId) {
      return res
        .status(400)
        .json({ ok: false, error: "contentId is required" });
    }
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ""
    ) {
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
