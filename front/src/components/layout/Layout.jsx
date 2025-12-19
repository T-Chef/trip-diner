import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../home/Header";
import SideMenu from "../home/SideMenu";
import "../../styles/page/home/SideMenu.css";
import "../../styles/page/home/Header.css";

export default function Layout({ children, user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ✅ 마이페이지 계열: 헤더 숨김
  const hideHeaderPaths = ["/profile", "/like", "/calendar", "/withdraw"];
  const hideHeader = hideHeaderPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <>
      {/* ✅ 마이페이지/좋아요/캘린더/탈퇴에서는 Header 숨김 */}
      {!hideHeader && (
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      )}

      {/* ✅ SideMenu는 항상 렌더 */}
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      {/* 페이지 내용 */}
      <main className="layout-main">{children}</main>
    </>
  );
}
