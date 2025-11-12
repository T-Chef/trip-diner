import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 데모 라우트: 투어 목록
app.get('/api/tours', (req, res) => {
  res.json([
    { id: 1, title: '부산 야경 투어', price: 39000 },
    { id: 2, title: '경주 역사 투어', price: 49000 }
  ]);
});

// 데모 라우트: 로그인 흉내
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'user@example.com' && password === 'pass1234') {
    return res.json({ user: { name: '드림워커', email } });
  }
  return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});