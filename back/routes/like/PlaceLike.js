import express from "express";
import { userAuth } from "../../middleware/userAuth.js"; 
import {
  toggleLike,
  getLikedPlaces,
  getLikeMeta,
  clearUserLikes,
} from "../../services/place/placeLikeService.js";

const router = express.Router();

// 좋아요 메타
router.get("/likes/meta", async (req, res) => {
  try {
    const result = await getLikeMeta(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, message: e.message });
  }
});

// 유저 좋아요 목록 (이건 공개로 둬도 되고, 보호하고 싶으면 userAuth 추가 가능)
router.get("/likes/user/:userId", async (req, res) => {
  try {
    const result = await getLikedPlaces(req.params.userId);
    return res.json(result);
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, error: e.message || "조회 실패" });
  }
});

// ✅ 전체 삭제 (반드시 userAuth 필요)
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
    return res.status(e.status || 500).json({ ok: false, message: e.message || "삭제 실패" });
  }
});

// 좋아요 토글
router.post("/likes", async (req, res) => {
  try {
    const result = await toggleLike(req.body);
    return res.json(result);
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message || "Like 저장 실패" });
  }
});

export default router;
