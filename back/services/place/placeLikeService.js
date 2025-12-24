// back/services/place/placeLikeService.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toJsonSafe = (data) =>
  JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );

export async function toggleLike(body) {
  const {
    contentId,
    liked,
    userId,
    title,
    address,
    image,
    lat,
    lng,
    category,
    cityId,
    contentTypeId,
  } = body || {};

  if (!contentId || !userId) {
    const err = new Error("contentId, userId 필요");
    err.status = 400;
    throw err;
  }

  let uid, extId;
  try {
    uid = BigInt(userId);
    extId = BigInt(contentId);
  } catch {
    const err = new Error("userId/contentId 형식 오류");
    err.status = 400;
    throw err;
  }

  const ct = contentTypeId != null ? Number(contentTypeId) : undefined;

  const place = await prisma.place.upsert({
    where: { external_id: extId },
    update: {
      name: title ?? undefined,
      address: address ?? undefined,
      image_url: image ?? undefined,
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      category: category ?? undefined,
      city_id: cityId ? BigInt(cityId) : undefined,
      content_type_id: Number.isFinite(ct) ? ct : undefined,
    },
    create: {
      external_id: extId,
      name: title ?? null,
      address: address ?? null,
      image_url: image ?? null,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      category: category ?? null,
      city_id: cityId ? BigInt(cityId) : null,
      content_type_id: Number.isFinite(ct) ? ct : null,
    },
  });

  if (liked) {
    await prisma.place_like.upsert({
      where: { user_id_place_id: { user_id: uid, place_id: place.place_id } },
      update: {},
      create: { user_id: uid, place_id: place.place_id },
    });
  } else {
    await prisma.place_like.deleteMany({
      where: { user_id: uid, place_id: place.place_id },
    });
  }

  return toJsonSafe({ ok: true });
}

export async function getLikedPlaces(userIdParam) {
  let uid;
  try {
    uid = BigInt(userIdParam);
  } catch {
    const err = new Error("잘못된 userId 형식");
    err.status = 400;
    throw err;
  }

  const result = await prisma.place_like.findMany({
    where: { user_id: uid },
    include: { place: true },
    orderBy: { created_at: "desc" },
  });

  return toJsonSafe(result);
}

export async function getLikeMeta(query) {
  const { contentId, userId } = query || {};

  if (!contentId) {
    const err = new Error("contentId 필요");
    err.status = 400;
    throw err;
  }

  let extId;
  try {
    extId = BigInt(contentId);
  } catch {
    const err = new Error("contentId 형식 오류");
    err.status = 400;
    throw err;
  }

  const place = await prisma.place.findUnique({
    where: { external_id: extId },
    select: { place_id: true, content_type_id: true },
  });

  if (!place) {
    return toJsonSafe({ likesCount: 0, liked: false, contentTypeId: null });
  }

  const likesCount = await prisma.place_like.count({
    where: { place_id: place.place_id },
  });

  let liked = false;
  if (userId) {
    try {
      const uid = BigInt(userId);
      const exists = await prisma.place_like.findUnique({
        where: { user_id_place_id: { user_id: uid, place_id: place.place_id } },
        select: { like_id: true },
      });
      liked = !!exists;
    } catch {
      liked = false;
    }
  }

  return toJsonSafe({
    likesCount,
    liked,
    contentTypeId: place.content_type_id ?? null,
  });
}


export async function clearUserLikes(userIdParam) {
  let uid;
  try {
    uid = BigInt(userIdParam);
  } catch {
    const err = new Error("잘못된 userId 형식");
    err.status = 400;
    throw err;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const r = await tx.place_like.deleteMany({ where: { user_id: uid } });
    return r.count;
  });

  return toJsonSafe({ ok: true, deleted });
}
