import React from "react";
import { Link } from "react-router-dom";
import "../../styles/page/404.css";

export default function NotFound() {
  return (
    <div className="notfound-wrapper">
      <div className="notfound-box">
        <h1 className="notfound-title">길을 잃으셨나요?</h1>

        <p className="notfound-message">
          찾으시는 페이지를 발견할 수 없어요. <br />
          하지만 새로운 여행지는 언제나 좋은 발견이죠.
        </p>

        <Link to="/" className="notfound-home">
          Trip-Diner로 돌아가기
        </Link>
      </div>
    </div>
  );
}
