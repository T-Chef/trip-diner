import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads 경로
const uploadPath = path.join(__dirname, "../../uploads");

console.log("UPLOAD PATH:", uploadPath);

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "_" + Math.round(Math.random() * 1e5);
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({ storage });

// 프로필 업로드
router.post("/upload", upload.single("profile"), async (req, res) => {
  try {
    const { userId } = req.body;

    console.log("REQ.FILE:", req.file);
    console.log("REQ.BODY:", req.body);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "파일 없음" });
    }

    const imgPath = `/uploads/${req.file.filename}`;

    
    await prisma.user.update({
      where: { user_id: Number(userId) },
      data: { profile_img: imgPath },
    });

    return res.json({
      success: true,
      imageUrl: imgPath,
    });
  } catch (err) {
    console.error("업로드 오류 발생:", err);
    return res.status(500).json({
      success: false,
      message: "서버 오류",
    });
  }
});

export default router;
