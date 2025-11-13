// src/Pages/Home.jsx
import React from "react";

function Home({ user }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {user ? (
        <h2>환영합니다, {user.name}님!</h2>
      ) : (
        <h2>Trip Diner에 오신 것을 환영합니다!</h2>
      )}
      <p>당신의 여행을 특별하게 만들어드립니다 ✈️</p>
    </div>
  );
}

export default Home;