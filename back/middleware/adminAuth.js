// back/middleware/adminAuth.js
import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "관리자 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET);

    if (decoded.role !== "SUPER") {
      return res.status(403).json({ message: "관리자 권한이 없습니다." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "관리자 인증 실패" });
  }
};
