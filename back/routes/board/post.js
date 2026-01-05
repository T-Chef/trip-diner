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

/* -------------------------------------------------------
   업로드 폴더 세팅
------------------------------------------------------- */
const uploadDir = path.join(__dirname, "../../uploads/postImages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

/* -------------------------------------------------------
   이미지 업로드
------------------------------------------------------- */
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

/* -------------------------------------------------------
   게시글 작성
------------------------------------------------------- */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { user_id, title, content, category, tags } = req.body;
    const imageUrl = req.file ? `/postImages/${req.file.filename}` : null;

    const newPost = await prisma.post.create({
      data: {
        user_id: Number(user_id),
        title,
        content,
        category,
        image_url: imageUrl,
        views: 0,
        tags,
        deleted: 0, // ⭐ 명시
      },
    });

    res.json(safeJson({ success: true, post: newPost }));
  } catch (err) {
    console.error("게시글 작성 오류", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* -------------------------------------------------------
   게시글 목록 (⭐ 삭제된 글 제외)
------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        deleted: 0, // ⭐ 핵심
      },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: { comment: true },
        },
      },
    });

    const safePosts = posts.map((post) => ({
      ...post,
      post_id: post.post_id.toString(),
      user_id: post.user_id.toString(),
      comment_count: post._count?.comment || 0,
    }));

    return res.json(safePosts);
  } catch (err) {
    console.error("게시글 목록 로드 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
});

/* -------------------------------------------------------
   카테고리 '후기' 중 '좋아요' 많은 순 베스트 가져오기
------------------------------------------------------- */
router.get("/latest", async (req, res) => {
  try {
    // 지역 필터링(areaCode)을 무시하고 전체에서 가져옵니다.
    const posts = await prisma.post.findMany({
      where: {
        deleted: 0,
        category: "후기", // ⭐ 카테고리가 '후기'인 글만 필터링
      },
      take: 2, // 상위 2개만
      orderBy: [
        {
          post_like: {
            _count: 'desc' // 1순위: 좋아요 많은 순
          }
        },
        {
          created_at: 'desc' // 2순위: 최신순
        }
      ],
      include: {
        user: { select: { name: true } },
        _count: {
          select: { 
            post_like: true, 
            comment: true 
          },
        },
      },
    });

    return res.json(safeJson(posts));
  } catch (err) {
    console.error("Best 후기 로드 에러:", err.message);
    return res.status(500).json({ error: "데이터 로드 실패" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const myPosts = await prisma.post.findMany({
      where: {
        user_id: userId,
        deleted: 0
      },
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { comment: true } }
      }
    });

    const result = myPosts.map(p => ({
      ...p,
      post_id: p.post_id.toString(),
      user_id: p.user_id.toString(),
      comment_count: p._count?.comment || 0
    }));

    return res.json(result);
  } catch (err) {
    console.error("내 게시글 로드 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    // 🔒 삭제된 글은 조회 불가
    const post = await prisma.post.findFirst({
      where: {
        post_id: postId,
        deleted: 0, // ⭐ 핵심
      },
      include: {
        user: {
          select: { name: true, profile_img: true },
        },
      },
    });

    if (!post) {
      return res
        .status(404)
        .json({ error: "삭제되었거나 존재하지 않는 게시글입니다." });
    }

    // 조회수 증가 (삭제되지 않은 글만)
    await prisma.post.update({
      where: { post_id: postId },
      data: { views: { increment: 1 } },
    });

    const safePost = safeJson(post);

    if (safePost.tags) {
      try {
        safePost.tags = JSON.parse(safePost.tags);
      } catch {
        safePost.tags = safePost.tags.split(",").map((t) => t.trim());
      }
    } else {
      safePost.tags = [];
    }

    res.json(safePost);
  } catch (err) {
    console.error("게시글 상세 조회 오류:", err);
    res.status(500).json({ error: "게시글 조회 실패" });
  }
});

export default router;