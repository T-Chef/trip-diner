import express from "express";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

/* ---------------------------
   BigInt + Date 안전 변환
---------------------------- */
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "bigint") return value.toString();
        if (value instanceof Date) return value.toISOString();
        return value;
      }
    )
  );
}

/* ---------------------------
   댓글 목록 조회
---------------------------- */
router.get("/:postId", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { post_id: Number(req.params.postId) },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { name: true } },
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
   댓글 작성
---------------------------- */
router.post("/", async (req, res) => {
  try {
    const { post_id, user_id, content, parent_id } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "내용을 입력해주세요." });
    }

    const newComment = await prisma.comment.create({
      data: {
        post_id: Number(post_id),
        user_id: Number(user_id),
        parent_id: parent_id ? Number(parent_id) : null,
        content,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(safeJson({ success: true, newComment }));
  } catch (err) {
    console.error("댓글 작성 오류:", err);
    res.status(500).json({ error: "댓글 작성 실패" });
  }
});

/* ---------------------------
   댓글 수정
---------------------------- */
router.put("/:commentId", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "내용을 입력해주세요." });
    }

    const updated = await prisma.comment.update({
      where: { comment_id: Number(req.params.commentId) },
      data: { content },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(safeJson({ success: true, updated }));
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    res.status(500).json({ error: "댓글 수정 실패" });
  }
});

/* ---------------------------
   댓글 삭제
---------------------------- */
router.delete("/:commentId", async (req, res) => {
  try {
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
