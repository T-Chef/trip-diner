import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// 간단한 SSRF 방지(최소한의 로컬 대역 차단)
function isBlockedHost(hostname = "") {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (h.startsWith("127.")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  // 172.16.0.0 ~ 172.31.255.255
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  return false;
}

router.get("/image", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("url required");

    let u;
    try {
      u = new URL(String(url));
    } catch {
      return res.status(400).send("invalid url");
    }

    if (!["http:", "https:"].includes(u.protocol)) {
      return res.status(400).send("only http/https allowed");
    }
    if (isBlockedHost(u.hostname)) {
      return res.status(400).send("blocked host");
    }

    const r = await fetch(u.toString(), {
      headers: {
        // 일부 서버는 UA 없으면 차단하니까 조심
        "User-Agent": "Trip-Diner/1.0",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: u.origin,
      },
    });

    if (!r.ok) {
      return res.status(502).send(`fetch failed: ${r.status}`);
    }

    const contentType = r.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    res.send(buf);
  } catch (e) {
    console.error("proxy image error:", e);
    res.status(500).send("proxy error");
  }
});

export default router;
