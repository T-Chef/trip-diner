// back/routes/auth.js (미들웨어)
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "토큰 없음" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ✅ access 토큰 payload에서 user_id는 string으로 넣을 예정 → BigInt로 변환 가능
    req.user = { user_id: BigInt(decoded.user_id) };
    next();
  } catch (e) {
    // ✅ 만료면 프론트가 refresh 트리거하기 좋게 구분(선택)
    if (e?.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "ACCESS_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "토큰 오류" });
  }
}
