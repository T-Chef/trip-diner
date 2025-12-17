// back/routes/middleware/auth.js
import jwt from "jsonwebtoken";
import prisma from "../../prisma/prismaClient.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 없습니다.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 1️⃣ accessToken 검증
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 2️⃣ DB에서 유저 상태 재확인 (5단계 핵심)
    const user = await prisma.user.findUnique({
      where: { user_id: BigInt(decoded.user_id) },
      select: {
        user_id: true,
        deleted: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "존재하지 않는 유저입니다.",
      });
    }

    // 🚫 관리자에 의해 비활성화된 유저 차단
    if (user.deleted === 1) {
      return res.status(403).json({
        success: false,
        message: "관리자에 의해 차단된 계정입니다.",
      });
    }

    // 3️⃣ 다음 라우트에서 사용할 유저 정보 주입
    req.user = {
      user_id: user.user_id.toString(),
    };

    next();
  } catch (err) {
    console.error("authMiddleware 오류:", err);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};
