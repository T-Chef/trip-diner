import { getCache, setCache } from "../../utils/cache.js";
import { cleanText } from "../../utils/textUtils.js";
import { mapWithConcurrency } from "../../utils/asyncUtils.js";

import { isQuotaBlocked } from "../tour/quotaGuard.js";
import { fetchPlaceList } from "./placeTourApi.js";

import { generateDescription } from "../../utils/aiDescription.js";
import { enhanceImage } from "../imageService.js";

const AREA_CODE_TO_REGION_KR = {
  1: "서울",
  2: "인천",
  3: "대전",
  4: "대구",
  5: "광주",
  6: "부산",
  7: "울산",
  8: "세종",
  31: "경기",
  32: "강원",
  33: "충북",
  34: "충남",
  35: "경북",
  36: "경남",
  37: "전북",
  38: "전남",
  39: "제주",
};

// 금지 장소 정규식
const BANNED_PLACE_REGEX =
  /(pc방|피시방|피씨방|노래방|학원|고시원|독서실|스터디카페|원룸|부동산|대리운전|세차장|정비소|주유소|약국|병원|치과|한의원|점집|사무실|창고|사우나|찜질방|키즈몰|백화점|아울렛|쇼핑센터|쇼핑몰|마트|이마트|홈플러스|롯데마트|신세계|롯데백화점|현대백화점|르네시떼)/i;

function isBannedPlaceRaw(p) {
  const s = `${p?.title ?? ""} ${p?.addr1 ?? ""} ${p?.addr2 ?? ""}`;
  return BANNED_PLACE_REGEX.test(s);
}

// 위도/경도 필수 및 한국 내
function hasValidGeo(p) {
  const lat = Number(p?.mapy);
  const lng = Number(p?.mapx);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  if (lat < 33.0 || lat > 39.8) return false;
  if (lng < 124.0 || lng > 132.2) return false;

  return true;
}

function hasAddress(p) {
  const a = cleanText(p?.addr1);
  return Boolean(a && a.trim().length >= 3);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mixPopularRandom(list, topBucket = 50) {
  const sorted = [...list].sort(
    (a, b) => Number(b.readcount ?? 0) - Number(a.readcount ?? 0)
  );
  const top = sorted.slice(0, topBucket);
  const rest = sorted.slice(topBucket);
  return [...shuffle(top), ...rest];
}

function postProcessLocal(baseList, { keyword, random, topBucket }) {
  const hasKeyword = Boolean((keyword ?? "").trim());
  if (hasKeyword) {
    return [...baseList].sort(
      (a, b) => Number(b.readcount ?? 0) - Number(a.readcount ?? 0)
    );
  }

  const randomOff = random == null || String(random) === "0";
  if (randomOff) {
    return [...baseList].sort(
      (a, b) => Number(b.readcount ?? 0) - Number(a.readcount ?? 0)
    );
  }

  const bucket = Math.max(10, Math.min(Number(topBucket ?? 50), 100));
  return mixPopularRandom(baseList, bucket);
}

function roundRobinMerge(grouped, limit) {
  const codes = Object.keys(grouped)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);

  const buckets = codes.map((ac) => ({
    ac,
    list: [...grouped[ac]].sort(
      (a, b) => Number(b.readcount ?? 0) - Number(a.readcount ?? 0)
    ),
  }));

  const out = [];
  let guard = 0;

  while (out.length < limit && guard < 20000) {
    guard++;
    let progressed = false;

    for (const b of buckets) {
      if (out.length >= limit) break;
      while (b.list.length) {
        const it = b.list.shift();
        if (!it) continue;
        out.push(it);
        progressed = true;
        break;
      }
    }

    if (!progressed) break;
  }

  return out;
}

function postProcessNational(baseList, { keyword, random, topBucket }, rows) {
  const hasKeyword = Boolean((keyword ?? "").trim());

  // 키워드 있으면 그냥 조회수 순
  if (hasKeyword) {
    return [...baseList].sort(
      (a, b) => Number(b.readcount ?? 0) - Number(a.readcount ?? 0)
    );
  }

  // 기본: 전국은 골고루 인기
  const grouped = {};
  for (const it of baseList) {
    const ac = Number(it?._areaCode);
    if (!Number.isFinite(ac)) continue;
    if (!grouped[ac]) grouped[ac] = [];
    grouped[ac].push(it);
  }

  const balanced = roundRobinMerge(grouped, Math.max(rows * 3, 80));

  const randomOn = String(random) === "1";
  if (!randomOn) return balanced;

  const bucket = Math.max(10, Math.min(Number(topBucket ?? 50), 100));
  const top = balanced.slice(0, bucket);
  const rest = balanced.slice(bucket);
  return [...shuffle(top), ...rest];
}

// 전국 모드용 상수
const NATIONAL_AREA_CODES = [
  1, 2, 3, 4, 5, 6, 7, 8, 31, 32, 33, 34, 35, 36, 37, 38, 39,
];
const NATIONAL_MAX_ROWS = 80;
const NATIONAL_PER_AREA_ROWS = 12;

function uniqByContentId(items) {
  const map = new Map();
  for (const it of items) {
    const id = String(it?.contentid ?? it?.contentId ?? "");
    if (!id) continue;
    if (!map.has(id)) map.set(id, it);
  }
  return [...map.values()];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry(fn, { retries = 2, baseDelay = 250 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e?.status || e?.response?.status;
      const retryable = status === 429 || (status >= 500 && status <= 599);
      if (!retryable || i === retries) throw e;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
  throw lastErr;
}

function failPayload(message) {
  return { ok: false, message, data: [] };
}

export async function getPlaces(reqQuery) {
  const {
    areaCode,
    sigunguCode,
    contentTypeId,
    keyword,
    numOfRows,
    pageNo,
    ai,
    enhance,
    arrange,

    random,
    topBucket,

    requireImage = "1",
    requireAddress = "1",
    requireRegionMatch = "1",
  } = reqQuery;

  const hasArea = areaCode != null && String(areaCode).trim() !== "";
  const safeSigungu = hasArea ? sigunguCode : null;

  const askedRows = Math.min(Number(numOfRows || 50), 200);
  const rows = hasArea ? askedRows : Math.min(askedRows, NATIONAL_MAX_ROWS);
  const page = Math.max(Number(pageNo || 1), 1);

  const useAI = String(ai) === "1";
  const useEnhance = String(enhance) === "1";

  const arrangeMode = String(arrange || "D");

  const mustHaveImage = String(requireImage) === "1";
  const mustHaveAddr = String(requireAddress) === "1";
  const mustMatchRegion = String(requireRegionMatch) === "1";

  const cacheKey = [
    "places:v10",
    hasArea ? String(areaCode) : "all",
    safeSigungu || "",
    contentTypeId || "",
    (keyword || "").trim(),
    rows,
    hasArea ? page : 1,
    `arr:${arrangeMode}`,
    useAI ? "ai1" : "ai0",
    useEnhance ? "e1" : "e0",
    mustHaveImage ? "img1" : "img0",
    mustHaveAddr ? "addr1" : "addr0",
    mustMatchRegion ? "reg1" : "reg0",
    hasArea ? "" : `per:${NATIONAL_PER_AREA_ROWS}`,
    `rnd:${random == null ? "" : String(random)}`,
    `tb:${topBucket == null ? "" : String(topBucket)}`,
  ].join("|");

  const cachedBase = getCache(cacheKey);
  if (cachedBase) {
    return { fromCache: true, data: cachedBase };
  }

  if (isQuotaBlocked()) {
    return {
      quotaBlocked: true,
      data: failPayload(
        "현재 TourAPI 호출 한도 초과 상태입니다. 잠시 후 다시 시도해 주세요."
      ),
    };
  }

  let items = [];

  if (hasArea) {
    try {
      items = await fetchPlaceList({
        areaCode,
        sigunguCode: safeSigungu,
        contentTypeId,
        numOfRows: rows,
        pageNo: page,
        arrange: arrangeMode,
      });
    } catch (e) {
      const msg =
        e?.code === "TOUR_API_QUOTA_EXCEEDED"
          ? "TourAPI 호출 한도 초과로 여행지 목록을 불러올 수 없습니다. 잠시 후 재시도해 주세요."
          : "여행지 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

      setCache(cacheKey, failPayload(msg), 15 * 1000);

      return { data: failPayload(msg) };
    }
  } else {
    const per = NATIONAL_PER_AREA_ROWS;
    const chunks = await mapWithConcurrency(
      NATIONAL_AREA_CODES,
      3,
      async (ac) => {
        try {
          const list = await fetchPlaceList({
            areaCode: ac,
            sigunguCode: null,
            contentTypeId,
            numOfRows: per,
            pageNo: 1,
            arrange: arrangeMode,
          });
          const arr = Array.isArray(list) ? list : [];
          return arr.map((it) => ({ ...it, __areaCode: ac }));
        } catch {
          return [];
        }
      }
    );

    items = uniqByContentId(chunks.flat());
  }

  // 1) 품질 필터
  items = items
    .filter((p) => p && p.title)
    .filter((p) => !isBannedPlaceRaw(p))
    .filter((p) => hasValidGeo(p))
    .filter((p) => (mustHaveAddr ? hasAddress(p) : true));

  // 2) 지역명 포함 체크(지역 모드만)
  if (hasArea && mustMatchRegion) {
    const region = AREA_CODE_TO_REGION_KR[String(areaCode)];
    if (region) {
      items = items.filter((p) => String(p.addr1 || "").includes(region));
    }
  }

  // 3) 키워드 필터
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    items = items.filter((i) => {
      const t = (i.title || "").toLowerCase();
      const a = (i.addr1 || "").toLowerCase();
      return t.includes(kw) || a.includes(kw);
    });
  }

  // 4) 향상 대상 개수
  const ENHANCE_LIMIT = mustHaveImage ? 30 : 10;

  // 5) 기본 데이터 생성
  const baseList = await mapWithConcurrency(items, 5, async (i) => {
    const title = cleanText(i.title);
    const address = cleanText(i.addr1);

    if (!title) return null;
    if (mustHaveAddr && !address) return null;

    let overview = "";
    if (address && title)
      overview = `${address}에 위치한 "${title}" 장소입니다.`;
    else if (title)
      overview = `"${title}"에 대한 소개가 아직 준비 중인 장소입니다.`;
    else overview = "이 장소에 대한 소개가 아직 준비 중입니다.";

    const finalImage = i.firstimage || i.firstimage2 || null;

    return {
      contentId: i.contentid,
      contentTypeId: i.contenttypeid,
      title,
      address,
      tel: cleanText(i.tel),
      latitude: i.mapy,
      longitude: i.mapx,
      image: finalImage,
      overview,
      readcount: Number(i.readcount ?? 0),
      _areaCode: i.__areaCode ?? null,
    };
  });

  let cleaned = baseList.filter(Boolean);

  // 6) enhance: 상위 n개만
  if (useEnhance) {
    const targets = cleaned.slice(0, Math.min(ENHANCE_LIMIT, cleaned.length));
    await mapWithConcurrency(targets, 3, async (p) => {
      if (p.image) return;
      try {
        const enhancedImg = await enhanceImage(
          p.title,
          p.latitude,
          p.longitude
        );
        if (enhancedImg) p.image = enhancedImg;
      } catch {}
    });
  }

  // 7) image 필수면 제거
  if (mustHaveImage) {
    cleaned = cleaned.filter((p) => Boolean(p.image));
  }

  // 8) 최종 정렬/섞기
  let finalList = hasArea
    ? postProcessLocal(cleaned, { keyword, random, topBucket })
    : postProcessNational(cleaned, { keyword, random, topBucket }, rows);

  // 9) rows만 자르기
  finalList = finalList.slice(0, rows);

  // 10) AI 설명: 상위 10개만
  const AI_LIMIT = 10;
  const AI_CONCURRENCY = 2;
  let aiFailCount = 0;

  if (useAI) {
    const targets = finalList.slice(0, Math.min(AI_LIMIT, finalList.length));

    await mapWithConcurrency(targets, AI_CONCURRENCY, async (p) => {
      try {
        const aiText = await retry(
          () => generateDescription(p.title, p.address),
          {
            retries: 2,
            baseDelay: 250,
          }
        );

        if (aiText && aiText.trim()) p.overview = aiText.trim();
        else aiFailCount++;
      } catch (e) {
        aiFailCount++;
        console.warn("[AI_DESC_FAIL]", p.title, {
          status: e?.status || e?.response?.status,
          message: e?.message || e,
        });
      }
    });
  }

  // 11) 캐시 저장
  if (useAI && aiFailCount > 0) setCache(cacheKey, finalList, 20 * 1000);
  else setCache(cacheKey, finalList, 5 * 60 * 1000);

  return { data: finalList };
}
