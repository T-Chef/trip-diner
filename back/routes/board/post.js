import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/postImages");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e5) + ext);
  },
});
const upload = multer({ storage });

// BigInt + Date 변환용
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

/* -----------------------------
   게시글 작성
----------------------------- */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { user_id, title, content, category } = req.body;
    const imageUrl = req.file ? `/postImages/${req.file.filename}` : null;

    const newPost = await prisma.post.create({
      data: {
        user_id: Number(user_id),
        title,
        content,
        category,
        image_url: imageUrl,
        views: 0,
      },
    });

    res.json(safeJson({ success: true, post: newPost }));
  } catch (err) {
    console.error("게시글 작성 오류", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

/* -----------------------------
   게시글 목록
----------------------------- */
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { created_at: "desc" },
      include: { user: { select: { name: true } } }
    });

    res.json(safeJson(posts));
  } catch (err) {
    console.error("게시글 목록 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* -----------------------------
   게시글 단일 조회
----------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { post_id: Number(req.params.id) },
      include: { user: { select: { name: true } } },
    });

    if (!post) return res.status(404).json({ error: "게시글 없음" });

    res.json(safeJson(post));
  } catch (err) {
    console.error("게시글 상세 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* -----------------------------
   조회수 증가
----------------------------- */
router.patch("/:id/view", async (req, res) => {
  try {
    const updated = await prisma.post.update({
      where: { post_id: Number(req.params.id) },
      data: { views: { increment: 1 } }
    });

    res.json(safeJson(updated));
  } catch (err) {
    console.error("조회수 증가 오류", err);
    res.status(500).json({ error: "조회수 증가 실패" });
  }
});

export default router;
