import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../../prisma/prismaClient.js";
import { authMiddleware } from "../middleware/Auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 저장 폴더 생성
const uploadDir = path.join(__dirname, "../../uploads/postImages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e5) + ext);
  },
});
const upload = multer({ storage });

// BigInt & Date 변환
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );
}

/* ---------------------------------------------
   1) Tiptap 이미지 업로드 (로그인 + 활성 유저만)
---------------------------------------------- */
router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "파일 업로드 실패" });
      }

      const imageUrl = `/postImages/${req.file.filename}`;
      return res.json({ success: true, url: imageUrl });
    } catch (err) {
      console.error("이미지 업로드 오류:", err);
      return res.status(500).json({ error: "서버 오류" });
    }
  }
);

/* ---------------------------------------------
   2) 게시글 작성 (로그인 + 활성 유저만)
---------------------------------------------- */
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content, category } = req.body;

      // 🔐 user_id는 토큰에서 가져오는 게 정석
      const user_id = Number(req.user.user_id);

      const imageUrl = req.file ? `/postImages/${req.file.filename}` : null;

      const newPost = await prisma.post.create({
        data: {
          user_id,
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
      res.status(500).json({ error: "서버 오류" });
    }
  }
);

/* ---------------------------------------------
   3) 게시글 목록 (비로그인 가능)
---------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    res.json(safeJson(posts));
  } catch (err) {
    console.error("게시글 목록 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ---------------------------------------------
   4) 게시글 단일 조회 (비로그인 가능)
---------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const post_id = Number(req.params.id);

    if (isNaN(post_id)) {
      return res.status(400).json({ error: "잘못된 요청" });
    }

    const post = await prisma.post.findUnique({
      where: { post_id },
      include: {
        user: { select: { name: true, profile_img: true } },
      },
    });

    if (!post) return res.status(404).json({ error: "게시글 없음" });

    res.json(safeJson(post));
  } catch (err) {
    console.error("게시글 상세 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;