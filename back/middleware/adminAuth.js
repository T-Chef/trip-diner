import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "관리자 인증 필요" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.role !== "ADMIN" && decoded.role !== "SUPER") {
      return res.status(403).json({ message: "관리자 권한 없음" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "관리자 인증 실패" });
  }
};
