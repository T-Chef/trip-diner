import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "관리자 인증이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "관리자 토큰이 유효하지 않습니다." });
    }

    if (
      !decoded.role ||
      (decoded.role !== "ADMIN" && decoded.role !== "SUPER")
    ) {
      return res.status(403).json({ message: "관리자 권한이 없습니다." });
    }

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res
        .status(401)
        .json({ message: "세션이 만료되었습니다. 다시 로그인해주세요." });
    }

    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "관리자 인증 실패" });
  }
};
