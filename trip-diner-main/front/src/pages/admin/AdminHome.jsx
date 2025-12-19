import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminHeader from "./layout/AdminHeader";
import AdminSideMenu from "./layout/AdminSideMenu";
import "../../styles/page/home/Header.css";
import "../../styles/page/home/SideMenu.css";

export default function AdminHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const bgUrl = `${process.env.PUBLIC_URL}/assets/images/admin-home.jpg`;

  return (
    <>
      <AdminHeader setMenuOpen={setMenuOpen} />
      <AdminSideMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main className="layout-main" style={{ padding: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ paddingLeft: 60, paddingRight: 24, color: "white" }}>
            <h1 style={{ fontSize: 56, margin: 0, lineHeight: 1.1 }}>
              관리자 페이지
            </h1>
            <p style={{ marginTop: 14, fontSize: 18, maxWidth: 520 }}>
              햄버거 메뉴에서 회원 관리, 게시글 관리, 1:1 문의 답변으로 이동할
              수 있습니다.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
