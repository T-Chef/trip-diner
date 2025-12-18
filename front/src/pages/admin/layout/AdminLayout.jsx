import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSideMenu from "./AdminSideMenu";
import "../../../styles/page/home/Header.css";
import "../../../styles/page/home/SideMenu.css";

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <AdminHeader setMenuOpen={setMenuOpen} />
      <AdminSideMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="layout-main">
        <Outlet />
      </main>
    </>
  );
}
