import axios from "axios";
import { getCache, setCache } from "../../utils/cache.js";
import {
  naverSearchOnce,
  pickBestNaverItem,
  normalizeNaverCoord,
} from "./eventNaverLocalService.js";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

export async function enrichEventLocation({ title = "", address = "" }) {
  const cacheKey = ["event|enrich", title, address].join("|");
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    let google = null;

    // 1) Google Geocode
    if (address && GOOGLE_API_KEY) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&language=ko&key=${GOOGLE_API_KEY}`;

      const g = await axios.get(geocodeUrl);
      const loc = g.data.results?.[0]?.geometry?.location;
      if (loc) google = { lat: loc.lat, lng: loc.lng };
    }

    // 2) Places TextSearch
    if (!google && GOOGLE_API_KEY) {
      const q = [title, address].filter(Boolean).join(" ");
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        q
      )}&language=ko&key=${GOOGLE_API_KEY}`;

      const g = await axios.get(textUrl);
      const p = g.data.results?.[0];
      if (p?.geometry?.location) {
        google = {
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        };
      }
    }

    // 3) Naver 로컬(좌표 보강)
    let naver = null;
    try {
      const list = await naverSearchOnce(title, address);
      const best = pickBestNaverItem(list, address, title);

      if (best) {
        const fixedLng = normalizeNaverCoord(best.lng ?? best.mapx);
        const fixedLat = normalizeNaverCoord(best.lat ?? best.mapy);

        naver = {
          title: best.title,
          address: best.address || null,
          lat: fixedLat,
          lng: fixedLng,
          searchUrl: best.searchUrl || null,
        };
      }
    } catch {}

    const result = {
      title,
      address,
      google: google ?? null,
      naver: naver ?? null,
      lat: google?.lat ?? naver?.lat ?? null,
      lng: google?.lng ?? naver?.lng ?? null,
    };

    setCache(cacheKey, result, 10 * 60 * 1000);
    return result;
  } catch {
    const result = {
      title,
      address,
      google: null,
      naver: null,
      lat: null,
      lng: null,
    };
    setCache(cacheKey, result, 60 * 1000);
    return result;
  }
}
