// back/services/place/placeLikeService.js
import prisma from "../../prisma/prismaClient.js";

/**
 * BigInt 안전 파서 (Prisma MySQL BigInt 필드용)
 */
function toBigIntOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "bigint") return v;

  // number
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    return BigInt(Math.trunc(v));
  }

  // string
  const s = String(v).trim();
  if (!s) return null;
  if (!/^\d+$/.test(s)) return null;
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

/**
 * TourAPI contentId (문자열) 정리
 */
function normContentId(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}

/**
 * place.content_id 로 place 레코드 가져오기
 */
async function findPlaceByContentId(contentId) {
  return prisma.place.findFirst({
    where: { content_id: contentId },
    select: {
      place_id: true,
      content_id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      image_url: true,
      category: true,
      description: true,
    },
  });
}

/**
 * place 레코드 upsert (content_id 기준)
 * - contentId로 place가 없으면 생성
 * - 있으면 필요한 필드만 업데이트
 */
async function upsertPlaceByContentId(payload) {
  const contentId = normContentId(payload?.contentId);
  if (!contentId) {
    const err = new Error("contentId is required");
    err.status = 400;
    throw err;
  }

  const name = String(payload?.title ?? payload?.name ?? "").trim() || null;
  const address = String(payload?.address ?? "").trim() || null;
  const category = String(payload?.category ?? "").trim() || null;

  const lat =
    payload?.lat === null || payload?.lat === undefined ? null : Number(payload.lat);
  const lng =
    payload?.lng === null || payload?.lng === undefined ? null : Number(payload.lng);

  const imageUrl = String(payload?.image ?? payload?.image_url ?? "").trim() || null;
  const description = String(payload?.description ?? "").trim() || null;

  // ✅ content_id는 String? @unique 라서 upsert 가능
  const place = await prisma.place.upsert({
    where: { content_id: contentId },
    create: {
      content_id: contentId,
      name,
      address,
      category,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      image_url: imageUrl,
      description,
    },
    update: {
      // ✅ 이미 값이 있는데 빈 값으로 덮어쓰지 않도록 "있을 때만" 업데이트
      ...(name ? { name } : {}),
      ...(address ? { address } : {}),
      ...(category ? { category } : {}),
      ...(Number.isFinite(lat) ? { lat } : {}),
      ...(Number.isFinite(lng) ? { lng } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(description ? { description } : {}),
    },
    select: { place_id: true, content_id: true },
  });

  return place;
}

/**
 * ✅ 좋아요 메타
 * - contentId: 필수 (TourAPI contentId)
 * - userId: 옵션
 * 반환: { ok, likesCount, liked }
 */
export async function getLikeMeta(query) {
  const contentId = normContentId(query?.contentId);
  if (!contentId) {
    const err = new Error("contentId is required");
    err.status = 400;
    throw err;
  }

  const userId = toBigIntOrNull(query?.userId);

  // 1) place 찾기 (없으면 아직 저장된 place가 없다는 뜻 → 0/false로 반환)
  const place = await findPlaceByContentId(contentId);
  if (!place) {
    return { ok: true, likesCount: 0, liked: false };
  }

  // 2) likesCount
  const likesCount = await prisma.place_like.count({
    where: { place_id: place.place_id },
  });

  // 3) liked (userId 있을 때만)
  let liked = false;
  if (userId != null) {
    const exists = await prisma.place_like.findUnique({
      where: {
        user_id_place_id: {
          user_id: userId,
          place_id: place.place_id,
        },
      },
      select: { like_id: true },
    });
    liked = !!exists;
  }

  return { ok: true, likesCount, liked };
}

/**
 * ✅ 좋아요 토글
 * payload 예시(프론트에서 보내는 것):
 * {
 *   contentId, userId, liked,
 *   title, address, image, lat, lng, category
 * }
 */
export async function toggleLike(body) {
  const contentId = normContentId(body?.contentId);
  const userId = toBigIntOrNull(body?.userId);
  const liked = !!body?.liked;

  if (!contentId) {
    const err = new Error("contentId is required");
    err.status = 400;
    throw err;
  }
  if (userId == null) {
    const err = new Error("userId is required");
    err.status = 400;
    throw err;
  }

  // ✅ place 확보 (없으면 생성)
  const place = await upsertPlaceByContentId({
    contentId,
    title: body?.title,
    address: body?.address,
    image: body?.image,
    lat: body?.lat,
    lng: body?.lng,
    category: body?.category,
    description: body?.description,
  });

  const whereKey = {
    user_id_place_id: { user_id: userId, place_id: place.place_id },
  };

  if (liked) {
    // ✅ 좋아요 생성 (이미 있으면 아무것도 안 함)
    await prisma.place_like.upsert({
      where: whereKey,
      create: { user_id: userId, place_id: place.place_id },
      update: {}, // 이미 있으면 유지
    });
  } else {
    // ✅ 좋아요 해제 (없으면 무시)
    try {
      await prisma.place_like.delete({ where: whereKey });
    } catch (e) {
      // P2025(없음) 등은 무시
    }
  }

  // ✅ 서버 기준 meta 반환
  const likesCount = await prisma.place_like.count({
    where: { place_id: place.place_id },
  });

  return { ok: true, likesCount, liked };
}

/**
 * ✅ 유저 좋아요 목록
 * - userId: path param (BigInt)
 */
export async function getLikedPlaces(userIdParam) {
  const userId = toBigIntOrNull(userIdParam);
  if (userId == null) {
    const err = new Error("invalid userId");
    err.status = 400;
    throw err;
  }

  const likes = await prisma.place_like.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: {
      place: {
        select: {
          place_id: true,
          content_id: true,
          name: true,
          address: true,
          lat: true,
          lng: true,
          image_url: true,
          category: true,
          description: true,
        },
      },
    },
  });

  // BigInt -> string 변환(프론트 JSON 안전)
  const data = likes.map((l) => ({
    like_id: l.like_id.toString(),
    created_at: l.created_at,
    place: l.place
      ? {
          ...l.place,
          place_id: l.place.place_id.toString(),
          // content_id는 string이라 그대로
        }
      : null,
  }));

  return { ok: true, data };
}

/**
 * ✅ 유저 좋아요 전체 삭제
 */
export async function clearUserLikes(userIdParam) {
  const userId = toBigIntOrNull(userIdParam);
  if (userId == null) {
    const err = new Error("invalid userId");
    err.status = 400;
    throw err;
  }

  const result = await prisma.place_like.deleteMany({
    where: { user_id: userId },
  });

  return { ok: true, deleted: result.count };
}