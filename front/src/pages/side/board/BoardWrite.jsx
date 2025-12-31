import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ✅ TiptapEditor 대신 새로 만든 QuillEditor를 가져옵니다 */
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
  const [content, setContent] = useState(""); // Quill의 내용이 저장될 곳
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [mySchedules, setMySchedules] = useState([]);
  const isEdit = Boolean(id);

  useEffect(() => {
    loadMySchedules();
  }, []);

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
          main_image: p.plan_day?.[0]?.plan_item?.[0]?.place?.image_url || "/assets/images/default-placeholder.jpg",
          created_at: (p.created_at || "").slice(0, 10),
          days: (p.plan_day || []).sort((a, b) => a.day_index - b.day_index).map(d => ({
            day: d.day_index,
            places: (d.plan_item || []).sort((a, b) => a.order_index - b.order_index).map(it => ({
              place_name: it.place?.name,
              place_image: it.place?.image_url,
              address: it.place?.address,
              category: it.place?.category || "관광명소"
            }))
          }))
        }));
        setMySchedules(formatted);
      }
    } catch (err) {
      console.error("일정 로드 실패", err);
    }
  };

  /* ✅ 일정 선택 시 Quill 본문에 카드 뉴스 형태로 삽입하는 로직 */
  /* ✅ 일정 선택 시 Quill 본문에 삽입되는 카드 스타일 (가운데 정렬 + 이미지 100px) */
const handleSelectSchedule = (s) => {
  setSelectedSchedule(s);

  const scheduleHTML = s.days.map((day) => `
    <div style="text-align: center; margin: 35px 0 18px 0;">
      <h2 style="font-size: 20px; font-weight: 700; color: #111;">Day ${day.day}</h2>
    </div>

    ${day.places.map((p, idx) => `
      <div style="display: flex; align-items: center; gap: 20px; width: 100%; max-width: 650px; margin: 0 auto 15px auto; padding: 15px; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.03); box-sizing: border-box;">
        
        <div style="width: 100px; height: 100px; flex-shrink: 0; border-radius: 10px; overflow: hidden; position: relative; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
          <img src="${p.place_image || '/assets/images/default-placeholder.jpg'}" 
               style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          <div style="position: absolute; top: 5px; left: 5px; width: 20px; height: 20px; background: #3b73ff; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; z-index: 1;">
            ${idx + 1}
          </div>
        </div>

        <div style="flex: 1; text-align: left;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #1e293b;">${p.place_name}</h3>
          <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${p.category}</span>
            <span style="font-size: 13px; color: #64748b; font-weight: 400;">📍 ${p.address || '주소 정보 없음'}</span>
          </div>
        </div>
      </div>
    `).join('')}
    <p style="text-align: center;"><br></p>
  `).join('');

  setContent(content + scheduleHTML);
  
  Swal.fire({
    icon: 'success',
    title: '일정 삽입 완료',
    text: '선택하신 일정이 본문 가운데에 추가되었습니다.',
    timer: 1500,
    showConfirmButton: false
  });
};

  const handleTagKeyDown = (e) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      const text = tagInput.trim().replace("#", "");
      if (text && !tags.includes(text) && tags.length < 10) {
        setTags([...tags, text]);
        setTagInput("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return Swal.fire("경고", "모두 입력해주세요.", "warning");
    
    const postData = {
      user_id: storedUser.user_id,
      title,
      category,
      content,
      tags: JSON.stringify(tags),
      plan_id: selectedSchedule ? selectedSchedule.schedule_id : null
    };

    try {
      const url = isEdit ? `http://localhost:4000/api/posts/${id}` : "http://localhost:4000/api/posts";
      await axios[isEdit ? "put" : "post"](url, postData);
      Swal.fire("성공", "저장되었습니다.", "success").then(() => navigate("/board"));
    } catch (err) {
      Swal.fire("실패", "저장 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="write-page">
      <div className="write-layout">
        <div className="write-main">
          <h2 className="write-title">{isEdit ? "게시글 수정" : "게시글 작성"}</h2>
          <div className="input-group">
            <label>카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="자유">자유</option>
              <option value="후기">후기</option>
              <option value="질문">질문</option>
            </select>
          </div>

          <div className="input-group">
            <label>제목</label>
            <input type="text" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="editor-box">
            {/* ✅ QuillEditor를 사용하며 content와 setContent를 연결합니다 */}
            <QuillEditor 
              setContent={setContent} 
              initialContent={content} 
            />
          </div>

          <div className="tag-box">
            <div className="tag-list">
              {tags.map(tag => (
                <div key={tag} className="tag-item">
                  #{tag} <span className="tag-remove" onClick={() => setTags(tags.filter(t => t !== tag))}>×</span>
                </div>
              ))}
              <input className="tag-input" placeholder="#태그 입력" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
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
      mySchedules.map(s => (
        <div key={s.schedule_id} className="side-trip-card" onClick={() => handleSelectSchedule(s)}>
          {/* 사진 영역 */}
          <div className="side-card-img">
            <img src={s.main_image} alt="thumb" />
          </div>
          
          {/* 정보 영역: CSS 클래스명(.side-card-title, .side-card-date)을 정확히 일치시킵니다 */}
          <div className="side-card-info">
            <p className="side-card-title">{s.title}</p>
            <p className="side-card-date">
              {/* 기간을 강조하기 위해 strong 태그를 사용하고 클래스를 부여합니다 */}
              <strong className="duration">{s.duration}</strong>
              <span className="divider">|</span>
              <span className="date">{s.created_at}</span>
            </p>
          </div>
          
          <div className="side-hover-msg">본문에 삽입하기</div>
        </div>
      ))
    ) : (
      <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>저장된 일정이 없습니다.</p>
    )}
  </div>
</aside>
      </div>
    </div>
  );
}
