import OpenAI from "openai";
import "dotenv/config";

console.log(
  "OPENAI KEY:",
  process.env.OPENAI_API_KEY ? "LOADED" : "NOT LOADED"
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cleanText = (text) => text?.replace(/\n/g, " ").trim() ?? "";

export async function generateDescription(title, address) {
  try {
    const safeAddress = cleanText(address);

    console.log("AI 요청:", title, safeAddress);

    const prompt = `
당신은 여행지 설명을 짧고 자연스럽게 요약하는 전문가입니다.

조건:
- 설명은 반드시 **한 문장만 작성**
- 장소명을 문장에 그대로 넣지 말기
- "~에 위치한" 표현 금지
- 홍보 문구 금지
- 과장 금지

장소 정보: ${title}, ${safeAddress}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 50,
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("AI 설명 생성 오류:", err);
    return ""; 
  }
}
