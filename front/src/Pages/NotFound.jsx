// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.contentBox}>
        <h1 style={styles.title}>길을 잃으셨나요?</h1>
        <p style={styles.message}>
          찾으시는 페이지를 발견할 수 없어요. <br />
          하지만 새로운 여행지는 언제나 좋은 발견이죠.
        </p>

        <Link to="/" style={styles.homeLink}>
          Trip-Diner로 돌아가기
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100vh",
    backgroundImage: `url("/images/404.jpg")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  contentBox: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: "40px 50px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    backdropFilter: "blur(4px)",
  },

  title: {
    fontSize: "42px",
    fontWeight: "900",
    color: "#5a2ca0",
    marginBottom: "18px",
  },

  message: {
    fontSize: "18px",
    lineHeight: "1.6",
    color: "#444",
    marginBottom: "28px",
  },

  homeLink: {
    fontSize: "18px",
    color: "#5a2ca0",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: "600",
  },
};
