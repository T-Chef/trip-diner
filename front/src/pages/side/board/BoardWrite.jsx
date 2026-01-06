import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuillEditor from "./TiptapEditor";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardWrite.css";

export default function BoardWrite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("자유");

  const [content, setContent] = useState("");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [mySchedules, setMySchedules] = useState([]);
  const isEdit = Boolean(id);

  useEffect(() => {
    loadMySchedules();
    if (isEdit) {
      loadPostData();
    }
  }, [id]);

  // 내 일정 로드
  const loadMySchedules = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await axios.get("http://localhost:4000/api/plan", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const formatted = res.data.plans.map((p) => ({
          schedule_id: p.plan_id,
          title: p.title || "여행 일정",
          duration: (p.plan_day?.length || 0) + "일",

          main_image:
            p.plan_day?.[0]?.plan_item?.[0]?.place?.image_url ||
            "/assets/images/default-placeholder.jpg",
          created_at: (p.created_at || "").slice(0, 10),
          days: (p.plan_day || [])
            .sort((a, b) => a.day_index - b.day_index)
            .map((d) => ({
              day: d.day_index,
              places: (d.plan_item || [])
                .sort((a, b) => a.order_index - b.order_index)
                .map((it) => ({
                  place_name: it.place?.name,
                  place_image: it.place?.image_url,
                  address: it.place?.address,
                  category: it.place?.category || "관광명소",
                })),
            })),
        }));
        setMySchedules(formatted);
      }
    } catch (err) {
      console.error("일정 로드 실패", err);
    }
  };

  // 수정 모드일 때 기존 데이터 로드
  const loadPostData = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/posts/${id}`);
      const post = res.data;
      setTitle(post.title);
      setCategory(post.category);
      setContent(post.content);
      setTags(post.tags ? JSON.parse(post.tags) : []);
    } catch (err) {
      console.error("게시글 로드 실패", err);
    }
  };

  // 일정 선택 시 본문 삽입
  const handleSelectSchedule = (s) => {
    setSelectedSchedule(s);

    const scheduleHTML = s.days
      .map(
        (day) => `
      <div style="text-align: center; margin: 80px 0 50px 0;">
        <h2 style="font-size: 30px; font-weight: 800; color: #111;">Day ${
          day.day
        }</h2>
        <div style="width: 60px; height: 4px; background: #a68b6a; margin: 15px auto;"></div>
      </div>
      ${day.places
        .map(
          (p) => `
        <div style="width: 100%; max-width: 850px; margin: 0 auto 40px auto; border: 1px solid #f0f0f0; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="width: 100%; height: 500px; overflow: hidden; background: #f8f9fa;">
            <img src="${
              p.place_image || "/assets/images/default-placeholder.jpg"
            }" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${
            p.place_name
          }" />
          </div>
          <div style="padding: 35px; text-align: left;">
            <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 800; color: #1e293b;">${
              p.place_name
            }</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div><span style="font-size: 13px; background: #fdfaf5; color: #a68b6a; padding: 5px 14px; border-radius: 8px; font-weight: 700; border: 1px solid #e9e0d5;">${
                p.category
              }</span></div>
              <span style="font-size: 16px; color: #64748b; font-weight: 400;">📍 ${
                p.address || "주소 정보 없음"
              }</span>
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    `
      )
      .join("");

    setContent(content + scheduleHTML);
    Swal.fire({
      icon: "success",
      title: "일정 삽입 완료",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  // 태그 입력 로직
  const handleTagKeyDown = (e) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      const text = tagInput.trim().replace("#", "");
      if (text && !tags.includes(text) && tags.length < 10) {
        setTags([...tags, text]);
        setTagInput("");
      }
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  // 등록 및 수정 제출
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim())
      return Swal.fire("경고", "모두 입력해주세요.", "warning");

    const postData = {
      user_id: storedUser.user_id,
      title,
      category,
      content,
      tags: JSON.stringify(tags),
      plan_id: selectedSchedule ? selectedSchedule.schedule_id : null,
    };

    try {
      const url = isEdit
        ? `http://localhost:4000/api/posts/${id}`
        : "http://localhost:4000/api/posts";
      await axios[isEdit ? "put" : "post"](url, postData);
      Swal.fire("성공", "저장되었습니다.", "success").then(() =>
        navigate("/board")
      );
    } catch (err) {
      Swal.fire("실패", "저장 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="write-page">
      <div className="write-layout">
        <div className="write-main">
          <h2 className="write-title">
            {isEdit ? "게시글 수정" : "게시글 작성"}
          </h2>

          <div className="input-group">
            <label>카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="자유">자유</option>
              <option value="후기">후기</option>
              <option value="질문">질문</option>
            </select>
          </div>

          <div className="input-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="editor-box">
            <QuillEditor setContent={setContent} initialContent={content} />
          </div>

          <div
            className="tag-box"
            onClick={() => document.querySelector(".tag-input").focus()}
          >
            <div className="tag-list">
              {tags.map((tag) => (
                <div key={tag} className="tag-item">
                  #{tag}{" "}
                  <span
                    className="tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTags(tags.filter((t) => t !== tag));
                    }}
                  >
                    ×
                  </span>
                </div>
              ))}
              <input
                className="tag-input"
                placeholder={tags.length === 0 ? "#태그 입력" : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>

        <aside className="write-sidebar">
          <h3 className="sidebar-header">내 여행 일정</h3>
          <div className="sidebar-list">
            {mySchedules.length > 0 ? (
              mySchedules.map((s) => (
                <div
                  key={s.schedule_id}
                  className="side-trip-card"
                  onClick={() => handleSelectSchedule(s)}
                >
                  <div className="side-card-img">
                    <img src={s.main_image} alt="thumb" />
                  </div>
                  <div className="side-card-info">
                    <p className="side-card-title">{s.title}</p>
                    <p className="side-card-date">
                      <strong className="duration">{s.duration}</strong>
                      <span className="divider">|</span>
                      <span className="date">{s.created_at}</span>
                    </p>
                  </div>
                  <div className="side-hover-msg">본문에 삽입하기</div>
                </div>
              ))
            ) : (
              <p
                style={{ fontSize: "13px", color: "#999", textAlign: "center" }}
              >
                저장된 일정이 없습니다.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
