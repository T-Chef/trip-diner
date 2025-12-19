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


/* ---------------------------------------------
   1) Tiptap 이미지 업로드  (라우트 충돌 방지: 반드시 위쪽!)
---------------------------------------------- */
router.post("/upload", upload.single("image"), (req, res) => {
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
});

/* ---------------------------------------------
   2) 게시글 작성
---------------------------------------------- */
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
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ---------------------------------------------
   3) 게시글 목록
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
   4) 게시글 단일 조회 (조회수 1 증가 포함)
---------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    // [수정된 부분] 조회수(views)를 1 증가시키면서 동시에 데이터를 가져옵니다.
    const post = await prisma.post.update({
      where: { post_id: postId },
      data: {
        views: { increment: 1 } // 기존 값에서 1 증가
      },
      include: { 
        user: { 
          select: { name: true, profile_img: true } 
        } 
      },
    });

    if (!post) return res.status(404).json({ error: "게시글 없음" });
    
    res.json(safeJson(post));
  } catch (err) {
    console.error("게시글 상세 조회 오류:", err);
    // 만약 게시글이 없어서 에러가 난 경우 처리
    res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }
});

export default router;
