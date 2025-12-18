import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../../prisma/prismaClient.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 폴더
const uploadDir = path.join(__dirname, "../../uploads/postImages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.random().toString(36).slice(2) + ext);
  },
});
const upload = multer({ storage });

const safeJson = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );

// 이미지 업로드
router.post("/upload", userAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "업로드 실패" });
  res.json({ url: `/postImages/${req.file.filename}` });
});

// 게시글 작성
router.post("/", userAuth, upload.single("image"), async (req, res) => {
  const { title, content, category } = req.body;
  const user_id = Number(req.user.user_id);

  const imageUrl = req.file ? `/postImages/${req.file.filename}` : null;

  const post = await prisma.post.create({
    data: { user_id, title, content, category, image_url: imageUrl },
  });

  res.json(safeJson(post));
});

// 게시글 목록
router.get("/", async (_, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { created_at: "desc" },
    include: { user: { select: { name: true } } },
  });

  res.json(safeJson(posts));
});

// 게시글 상세
router.get("/:id", async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { post_id: Number(req.params.id) },
    include: { user: { select: { name: true, profile_img: true } } },
  });

  if (!post) return res.status(404).json({ error: "게시글 없음" });
  res.json(safeJson(post));
});

export default router;
