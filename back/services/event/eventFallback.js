import { buildFallbackOverview, stripHtml } from "./eventUtils.js";
import { getOfficialOverview } from "./eventOfficialOverviewService.js";
import {
  naverSearchOnce,
  pickBestNaverItem,
  normalizeNaverCoord,
} from "./eventNaverLocalService.js";

export async function buildEventFallback({
  contentId,
  contentTypeId,
  title,
  address,
  mapX,
  mapY,
  image,
}) {
  let out = {
    contentId,
    contentTypeId,
    title: stripHtml(title) || "이벤트 상세 정보를 불러올 수 없습니다.",
    address: stripHtml(address) || "",
    overview: "",
    homepage: "",
    mapX: mapX || null,
    mapY: mapY || null,
    image: image || null,
    noDetail: true,
    message: "TourAPI 호출 한도 초과/빈상세 상태입니다. (fallback 표시 중)",
  };

  // 1. 웹문서 우선으로 보강
  try {
    const official = await getOfficialOverview({
      title: out.title || title,
      address: out.address || address,
    });
    if (official?.text) {
      out.overview = official.text;
      out.homepage = official.url || out.homepage;
      out.officialUrl = official.url;
    }
  } catch {}

  // 2. 네이버 로컬로 좌표/홈페이지 보강
  try {
    const list = await naverSearchOnce(
      out.title || title,
      out.address || address
    );
    const best = pickBestNaverItem(
      list,
      out.address || address,
      out.title || title
    );

    if (best) {
      const link = best.link || best.searchUrl || "";
      if (link && !out.homepage) out.homepage = link;

      const fixedLng = normalizeNaverCoord(best.lng ?? best.mapx);
      const fixedLat = normalizeNaverCoord(best.lat ?? best.mapy);

      if (!out.mapX && fixedLng) out.mapX = fixedLng;
      if (!out.mapY && fixedLat) out.mapY = fixedLat;

      if (!out.address && best.address) out.address = stripHtml(best.address);

      // 웹문서 overview가 없을 때만 로컬 문장 채우기
      if (!out.overview) {
        out.overview = buildFallbackOverview({
          title: out.title || title,
          address: out.address || best.address || "",
          category: best.category || "",
        });
      }
    }
  } catch {}

  if (!out.overview) {
    out.overview = buildFallbackOverview({
      title: out.title || title,
      address: out.address,
      category: "",
    });
  }

  return out;
}
