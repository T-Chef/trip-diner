import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "토큰 없음" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = { user_id: BigInt(decoded.user_id) };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "토큰 만료/오류" });
  }
}