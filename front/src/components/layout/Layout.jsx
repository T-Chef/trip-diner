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
  const isProfile = location.pathname.startsWith("/profile");
  return (
    <>
      {/* 프로필 페이지일 때 Header 완전히 숨기기 */}
      {!isProfile && (
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      )}
      {/* 공통 Side Menu (프로필에서도 필요하므로 항상 렌더) */}
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
