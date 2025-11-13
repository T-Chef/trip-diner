// src/Components/AdminHeader.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminHeader({ user, setUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        setUser(null);
        navigate("/"); // 로그아웃하면 일반 App.js 홈으로 이동
    }

    return (
        <header>
            <div className="logo">Travel - Chef (Admin)</div>
            <nav>
                <ul>
                    <li><Link to="/admin">홈</Link></li>
                    <li><span>{user.name}님 (관리자)</span></li>
                    <li>
                        <button onClick={handleLogout} style={{ border: "none", background: "none", cursor: "pointer" }}>
                            로그아웃
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}