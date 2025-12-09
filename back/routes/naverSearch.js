import express from "express";
import axios from "axios";
const router = express.Router();

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

router.get("/naverSearch", async (req, res) => {
  try {
    const { query } = req.query;

    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=5`;

    const response = await axios.get(url, {
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("NAVER IMAGE SEARCH ERROR", err);
    res.status(500).json({ items: [] });
  }
});

export default router;
