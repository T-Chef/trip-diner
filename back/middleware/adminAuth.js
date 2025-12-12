import jwt from "jsonwebtoken";

export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "관리자 인증 토큰이 없습니다."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET);

    if (decoded.role !== "SUPER") {
      return res.status(403).json({
        success: false,
        message: "접근 권한이 없습니다."
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "유효하지 않은 토큰입니다."
    });
  }
}
