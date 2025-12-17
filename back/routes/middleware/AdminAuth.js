import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "관리자 인증 실패" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET // 🔥 반드시 동일
    );

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "관리자 권한 없음" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("adminAuth 오류:", err);
    return res.status(401).json({ message: "관리자 인증 실패" });
  }
};