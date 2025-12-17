import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { authMiddleware } from "../middleware/Auth.js";

const router = express.Router();

/* ---------------------------
   BigInt + Date 안전 변환
---------------------------- */
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );
}

/* ---------------------------
   댓글 목록 조회 (비로그인 가능)
---------------------------- */
router.get("/:postId", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { post_id: Number(req.params.postId) },
      orderBy: { created_at: "asc" },
      include: {
        user: {
          select: {
            name: true,
            profile_img: true,
          },
        },
      },
    });

    const commentMap = {};
    comments.forEach((c) => (commentMap[c.comment_id] = { ...c, replies: [] }));

    const rootComments = [];

    comments.forEach((c) => {
      if (c.parent_id) {
        commentMap[c.parent_id].replies.push(commentMap[c.comment_id]);
      } else {
        rootComments.push(commentMap[c.comment_id]);
      }
    });

    res.json(safeJson(rootComments));
  } catch (err) {
    console.error("댓글 목록 오류:", err);
    res.status(500).json({ error: "댓글 불러오기 실패" });
  }
});

/* ---------------------------
   댓글 작성 (로그인 + 활성 유저)
---------------------------- */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    const user_id = Number(req.user.user_id); // 🔐 토큰에서만 가져옴

    if (!content?.trim()) {
      return res.status(400).json({ error: "내용을 입력해주세요." });
    }

    const newComment = await prisma.comment.create({
      data: {
        post_id: Number(post_id),
        user_id,
        parent_id: parent_id ? Number(parent_id) : null,
        content,
      },
      include: {
        user: {
          select: {
            name: true,
            profile_img: true,
          },
        },
      },
    });

    res.json(safeJson({ success: true, newComment }));
  } catch (err) {
    console.error("댓글 작성 오류:", err);
    res.status(500).json({ error: "댓글 작성 실패" });
  }
});

/* ---------------------------
   댓글 수정 (로그인 + 활성 유저)
---------------------------- */
router.put("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const user_id = Number(req.user.user_id);

    if (!content?.trim()) {
      return res.status(400).json({ error: "내용을 입력해주세요." });
    }

    // 🔐 본인 댓글만 수정 가능하도록 체크 (권장)
    const comment = await prisma.comment.findUnique({
      where: { comment_id: Number(req.params.commentId) },
    });

    if (!comment || comment.user_id !== user_id) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }

    const updated = await prisma.comment.update({
      where: { comment_id: Number(req.params.commentId) },
      data: { content },
      include: {
        user: {
          select: {
            name: true,
            profile_img: true,
          },
        },
      },
    });

    res.json(safeJson({ success: true, updated }));
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    res.status(500).json({ error: "댓글 수정 실패" });
  }
});

/* ---------------------------
   댓글 삭제 (로그인 + 활성 유저)
---------------------------- */
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const user_id = Number(req.user.user_id);

    // 🔐 본인 댓글만 삭제 가능하도록 체크 (권장)
    const comment = await prisma.comment.findUnique({
      where: { comment_id: Number(req.params.commentId) },
    });

    if (!comment || comment.user_id !== user_id) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }

    await prisma.comment.delete({
      where: { comment_id: Number(req.params.commentId) },
    });

    res.json(safeJson({ success: true, message: "댓글 삭제 완료" }));
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    res.status(500).json({ error: "댓글 삭제 실패" });
  }
});

export default router;
