import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import { SearchBar, AIFilter, WeatherBox } from ".";
import CityList from "./CityList";
import EventList from "./event/EventList.jsx";
import "../../../styles/side/city/CityMain.css";
import useCityWeather from "../../../hooks/useCityWeather.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// 전국이면 area는 무조건 null
const normalizeAreaCode = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s === "0") return null;
  if (s.toLowerCase() === "all") return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// 전국이면 sigungu는 무조건 null
const normalizeSigunguCode = (areaCode, v) => {
  if (areaCode == null) return null;
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = user?.user_id ?? user?.id ?? user?.userId ?? null;
  const [cities, setCities] = useState([]);

  const [filter, setFilter] = useState(() => {
    const areaParam = searchParams.get("area");
    const sigunguParam = searchParams.get("sigungu");
    const keywordParam = searchParams.get("keyword");

    const areaCode = normalizeAreaCode(areaParam);
    const sigunguCode = normalizeSigunguCode(areaCode, sigunguParam);

    return {
      areaCode,
      sigunguCode,
      keyword: keywordParam || "",
    };
  });

  const areaName = useMemo(() => {
    if (filter.areaCode == null) return "전국";
    const hit = cities.find(
      (c) => Number(c.areaCode) === Number(filter.areaCode)
    );
    return hit?.name || "지역";
  }, [cities, filter.areaCode]);

  // 후기 데이터
  const [latestPosts, setLatestPosts] = useState([]);
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const url =
          filter.areaCode == null
            ? `${API_BASE}/posts/latest`
            : `${API_BASE}/posts/latest?areaCode=${filter.areaCode}`;

        const res = await axios.get(url);
        setLatestPosts(res.data);
      } catch (err) {
        console.error("후기 데이터를 불러오지 못했습니다.", err);
      }
    };
    fetchLatestPosts();
  }, [filter.areaCode]);

  useEffect(() => {
    const areaParam = searchParams.get("area");
    const sigunguParam = searchParams.get("sigungu");
    const keywordParam = searchParams.get("keyword");

    const areaCode = normalizeAreaCode(areaParam);
    const sigunguCode = normalizeSigunguCode(areaCode, sigunguParam);

    const next = {
      areaCode,
      sigunguCode,
      keyword: keywordParam || "",
    };

    setFilter((prev) => {
      if (
        prev.areaCode === next.areaCode &&
        prev.sigunguCode === next.sigunguCode &&
        prev.keyword === next.keyword
      )
        return prev;
      return next;
    });
  }, [searchParams]);

  // searchParams 동기화, filter 변경시 호출
  const syncToSearchParams = useCallback(
    (patchOrNext, opts = { replace: false }) => {
      const rawArea =
        patchOrNext.areaCode !== undefined
          ? patchOrNext.areaCode
          : filter.areaCode;
      const areaCode = normalizeAreaCode(rawArea);

      const rawSigungu =
        patchOrNext.sigunguCode !== undefined
          ? patchOrNext.sigunguCode
          : filter.sigunguCode;
      const sigunguCode = normalizeSigunguCode(areaCode, rawSigungu);

      const nextKeyword =
        patchOrNext.keyword !== undefined
          ? patchOrNext.keyword
          : filter.keyword;

      const sp = new URLSearchParams();
      if (areaCode != null) sp.set("area", String(areaCode));
      if (sigunguCode != null) sp.set("sigungu", String(sigunguCode));
      if (nextKeyword && nextKeyword.trim())
        sp.set("keyword", nextKeyword.trim());

      if (sp.toString() === searchParams.toString()) return;
      setSearchParams(sp, opts);
    },
    [
      filter.areaCode,
      filter.sigunguCode,
      filter.keyword,
      searchParams,
      setSearchParams,
    ]
  );

  const handleFilterChangeFromAIFilter = useCallback(
    (patch) => {
      const nextArea =
        patch.areaCode !== undefined
          ? normalizeAreaCode(patch.areaCode)
          : filter.areaCode;

      const nextSigungu =
        patch.sigunguCode !== undefined
          ? normalizeSigunguCode(nextArea, patch.sigunguCode)
          : normalizeSigunguCode(nextArea, filter.sigunguCode);

      const nextKeyword =
        patch.keyword !== undefined ? patch.keyword : filter.keyword;

      const next = {
        areaCode: nextArea,
        sigunguCode: nextSigungu,
        keyword: nextKeyword,
      };

      setFilter((prev) => {
        if (
          prev.areaCode === next.areaCode &&
          prev.sigunguCode === next.sigunguCode &&
          prev.keyword === next.keyword
        )
          return prev;
        return next;
      });

      syncToSearchParams(next, { replace: false });
    },
    [filter.areaCode, filter.sigunguCode, filter.keyword, syncToSearchParams]
  );

  const keywordTimer = useRef(null);
  const handleKeywordChange = useCallback(
    (value) => {
      const v = value ?? "";
      setFilter((prev) =>
        prev.keyword === v ? prev : { ...prev, keyword: v }
      );

      if (keywordTimer.current) clearTimeout(keywordTimer.current);
      keywordTimer.current = setTimeout(() => {
        syncToSearchParams({ keyword: v }, { replace: true });
      }, 300);
    },
    [syncToSearchParams]
  );

  // 날씨 데이터
  const { weather, forecast } = useCityWeather(filter.areaCode ?? undefined);

  const lastWeatherRef = useRef(null);
  const lastForecastRef = useRef(null);

  useEffect(() => {
    if (weather) lastWeatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    if (forecast?.length) lastForecastRef.current = forecast;
  }, [forecast]);

  const shownWeather = weather ?? lastWeatherRef.current;
  const shownForecast =
    (forecast?.length ? forecast : lastForecastRef.current) ?? [];

  // 전체일 때 overview
  const [wxOverview, setWxOverview] = useState([]);
  const [wxOverviewLoading, setWxOverviewLoading] = useState(false);

  useEffect(() => {
    if (filter.areaCode != null) return;

    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        setWxOverviewLoading(true);
        const res = await axios.get(`${API_BASE}/weather/overview`, {
          signal: ctrl.signal,
        });
        if (!alive) return;
        setWxOverview(res.data?.list || []);
      } catch (e) {
        if (!alive) return;
        setWxOverview([]);
      } finally {
        if (alive) setWxOverviewLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [filter.areaCode]);

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <div className="city-page-wrapper">
        <div className="floating-left">
          {filter.areaCode == null ? (
            <WeatherBox
              overview={wxOverview}
              loadingOverview={wxOverviewLoading}
              onPickArea={(ac) =>
                handleFilterChangeFromAIFilter({
                  areaCode: normalizeAreaCode(ac),
                  sigunguCode: null,
                })
              }
            />
          ) : (
            <WeatherBox weather={shownWeather} forecast={shownForecast} />
          )}
        </div>

        <div className="floating-right">
          <AIFilter
            value={{
              areaCode: filter.areaCode,
              sigunguCode: filter.sigunguCode,
            }}
            onChange={handleFilterChangeFromAIFilter}
            onCitiesLoaded={setCities}
          />
        </div>

        <div className="city-content-box">
          <div className="city-hero">
            <h2 className="city-head-title">도시 메뉴</h2>
            <p className="city-head-desc">
              지역을 고르고, 마음에 드는 여행지를 찜해서 나만의 코스를
              만들어보세요.
            </p>
            <div className="city-hero-search">
              <SearchBar onKeywordChange={handleKeywordChange} />
            </div>
          </div>

          <section className="city-section">
            <div className="city-section-head center">
              <h3 className="city-section-title">
                {filter.areaCode == null
                  ? "전국 인기 여행지"
                  : `${areaName} 인기 여행지`}
              </h3>
            </div>

            <div className="city-list-grid">
              <CityList
                areaCode={filter.areaCode}
                sigunguCode={filter.sigunguCode}
                keyword={filter.keyword}
                userId={userId}
              />
            </div>
          </section>

          <section className="city-section city-review-section">
            <div className="city-section-head center">
              <h3 className="city-section-title">
                {filter.areaCode == null
                  ? "전국 베스트 후기"
                  : "지역 베스트 후기"}
              </h3>
            </div>

            <div className="city-review-grid">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => {
                  const pid = post.post_id || post.id;
                  const firstImg = post.image_url
                    ? post.image_url.split(",")[0]
                    : null;

                  const imgSrc = firstImg
                    ? firstImg.startsWith("http")
                      ? firstImg
                      : `http://localhost:4000${firstImg}`
                    : `https://picsum.photos/400/300?random=${pid}`;

                  return (
                    <div
                      key={pid}
                      className="city-post-card"
                      onClick={() => navigate(`/board/${pid}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="city-post-img"
                        style={{ height: "200px" }}
                      >
                        <img
                          src={imgSrc}
                          alt={post.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                            e.target.parentElement.style.backgroundColor =
                              "#ddd";
                          }}
                        />
                      </div>

                      <div className="city-post-body">
                        <h4>{post.title}</h4>
                        <p>{stripHtml(post.content).substring(0, 60)}...</p>
                        <div className="city-post-footer">
                          <span>❤️ {post._count?.post_like || 0}</span> ·{" "}
                          <span>조회 {post.views}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="center">아직 이 지역의 후기가 없습니다.</p>
              )}
            </div>
          </section>

          <section className="city-event-section city-section">
            <div className="city-section-head center">
              <h3 className="city-section-title">
                {filter.areaCode == null
                  ? "전국 축제 · 이벤트"
                  : "축제 · 이벤트"}
              </h3>
            </div>

            <EventList
              areaCode={filter.areaCode}
              sigunguCode={filter.sigunguCode}
            />
          </section>
        </div>
      </div>
    </>
  );
}
