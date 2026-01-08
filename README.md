🗺️ Trip-Dinner

여행 계획 · 장소 정보 · 커뮤니티를 하나로 담은 종합 여행 플랫폼

사용자는 도시를 선택하고 여행 일정을 생성하며,
날짜별로 세분화된 일정 관리가 가능합니다.

장소 저장, 리뷰, Q&A, 게시판 등 실제 서비스와 유사한 기능을 통해
‘실제 운영 가능한 여행 서비스 아키텍처’를 목표로 설계한 프로젝트입니다.

🎯 프로젝트 목적

이 프로젝트는 단순 CRUD가 아니라,

실제 서비스 구조를 염두에 둔 데이터 설계 + 사용자 경험 + 확장 가능성을 목표로 개발되었습니다.

✔ 실사용 가능한 여행 일정 플랫폼 구현

✔ 구조적이고 유지보수 가능한 DB / 백엔드 설계 경험

✔ 커뮤니티 + 여행 데이터 + AI 기록까지 통합된 서비스 구조 구현

✔ 확장성을 고려한 기능 및 테이블 설계

🚀 주요 기능
🧭 여행 계획 (PLAN)

도시 선택 후 여행 일정 생성

PLAN → DAY → ITEM 구조로 일정 세분화

장소 연결 / 정렬 / 메모 / 시간 기록 가능

공유 URL 지원 (확장 가능)

🏙️ 도시 & 장소

CITY 기반 데이터 구조화

PLACE(관광지 / 맛집 / 명소 등) 관리

좌표(lat, lng)를 활용한 지도 기능 고려

장소 리뷰 & 좋아요 기능 지원

💬 커뮤니티

게시글 작성 기능

댓글 / 대댓글 (Self Relation)

좋아요 / 신고 시스템

❓ Q&A

사용자 문의 등록

관리자 답변 시스템

상태 관리: 대기 / 완료

🤖 AI 기록 (확장 기능)

AI 추천 키워드 저장

사용자별 AI 사용 기록 관리

이후 AI 기반 여행 추천 확장 기반 마련

🏗️ 기술 스택
분야 기술
Backend Node.js / Express
ORM Prisma
DB MySQL
Auth JWT + Refresh Token
Frontend React
Infra(옵션) AWS / Railway / PlanetScale
🗂️ 데이터 구조 핵심

Trip-Dinner는
도메인 구조 기반 설계를 목표로 했습니다.

USER 중심 흐름
User
├─ Plan
│ ├─ Plan_Day
│ └─ Plan_Item → Place
├─ Post
│ └─ Comment (대댓글 지원)
├─ QnA
│ └─ Qna_Answer (Admin)
├─ Review
└─ Like / Report

CITY 중심 연결
City
├─ Place
├─ Event
├─ Weather
└─ Plan

📦 설치 & 실행
1️⃣ 패키지 설치
npm install

2️⃣ 환경 변수 설정 (.env)
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME"
ADMIN_JWT_SECRET=...
USER_JWT_SECRET=...

3️⃣ Prisma 설정
npx prisma migrate dev
npx prisma generate

4️⃣ 서버 실행
npm run dev

📁 프로젝트 구조 (예상)
/back
├─ src
│ ├─ routes
│ ├─ controllers
│ ├─ middlewares
│ ├─ prisma
│ └─ utils
├─ prisma
│ └─ schema.prisma
├─ package.json
└─ README.md

👤 관리자 기능

관리자 계정 지원

Q&A 답변 기능

일부 서비스 데이터 관리 가능

🔐 인증 설계

JWT Access Token

Refresh Token 기반 세션 관리

토큰 만료 및 재발급 구조 설계

✨ 프로젝트 가치

✔ 실서비스 아키텍처 기반 설계

✔ 복잡한 관계형 데이터 설계 경험

✔ 유지보수와 확장을 고려한 구조

✔ 실제 “사용 가능한” 수준의 서비스 구현 목표

📌 Portfolio Note

이 프로젝트는
여행 플랫폼 설계 + 커뮤니티 + 인증 시스템 + 확장형 AI 기능까지 결합된 풀스택 실전 프로젝트입니다.

서비스 설계 능력, 데이터 구조 이해, 확장 가능성을 보여주는 포트폴리오 프로젝트입니다.
