import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toJsonSafe = (data) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)));

export async function toggleLike(body) {
  const { contentId, liked, userId, title, address, image, lat, lng, category, cityId } = body;

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

  return { success: true };
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
