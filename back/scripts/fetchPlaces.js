import { PrismaClient } from "@prisma/client";
import { getPlaces } from "../apis/tourApi.js";
import "dotenv/config";

const prisma = new PrismaClient();

const areaCodeMap = { 부산: 6, 서울: 1, 대구: 4, 제주: 39 };
const contentTypes = [12, 39, 14, 28]; 

async function saveCity(cityName) {
  const areaCode = areaCodeMap[cityName];
  console.log(`⏳ ${cityName} 데이터 수집 중...`);
  let total = 0;

  for (const type of contentTypes) {
    const places = await getPlaces(areaCode, type);

    for (const p of places) {
      await prisma.place.upsert({
        where: { external_id: BigInt(p.contentid) },
        update: {},
        create: {
          external_id: BigInt(p.contentid),
          name: p.title,
          address: p.addr1,
          lat: parseFloat(p.mapy) || null,
          lng: parseFloat(p.mapx) || null,
          image_url: p.firstimage || null,
          description: p.overview || null,
          content_type_id: type,
          city: { connect: { name: cityName } },
        },
      });
    }

    total += places.length;
    console.log(`  ✔ 카테고리 ${type} → ${places.length}개 저장`);
  }

  console.log(`🎉 ${cityName} 저장 완료 (총 ${total}개)\n`);
}

(async () => {
  await saveCity("부산");
  process.exit();
})();