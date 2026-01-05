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

  // ✅ 마이페이지 계열: 헤더 숨김 + QnA 추가
  const hideHeaderPaths = [
    "/profile",
    "/like",
    "/calendar",
    "/withdraw",
    "/qna",
  ];
  const hideHeader = hideHeaderPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <>
      {!hideHeader && (
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      )}

      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <main className="layout-main">{children}</main>
    </>
  );
}