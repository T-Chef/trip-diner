import React, { useState } from "react";
import Swal from "sweetalert2";
import TiptapEditor from "./TiptapEditor";
import "../../../styles/side/board/BoardWrite.css";

export default function BoardWrite() {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 태그
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;

    if (tags.includes(value)) {
      Swal.fire({
        icon: "warning",
        title: "중복된 태그",
        text: "이미 추가된 태그입니다.",
      });
      return;
    }

    if (tags.length >= 10) {
      Swal.fire({
        icon: "error",
        title: "태그 제한",
        text: "태그는 최대 10개까지 가능합니다!",
      });
      return;
    }

    setTags([...tags, value]);
    setTagInput("");
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // 등록
  const handleSubmit = () => {
    if (!title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "제목이 없습니다",
        text: "제목을 입력해주세요!",
      });
      return;
    }

    if (!content.trim()) {
      Swal.fire({
        icon: "warning",
        title: "내용이 없습니다",
        text: "내용을 입력해주세요!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (imageFile) formData.append("image", imageFile);

    console.log("전송 데이터:", [...formData.entries()]);

    Swal.fire({
      icon: "success",
      title: "등록 완료!",
      text: "백엔드 연동 전 테스트 완료되었습니다.",
    });
  };

  return (
    <div className="cafe-write-container">
      <h2 className="write-title">글쓰기</h2>

      <div className="write-layout">

        {/* 왼쪽 영역 */}
        <div className="write-main">

          {/* 게시판/말머리 선택 */}
          <div className="category-box">
            <select className="select-box">
              <option>게시판을 선택해 주세요.</option>
              <option>자유</option>
              <option>후기</option>
              <option>질문</option>
            </select>

            <select className="select-box">
              <option>말머리 선택</option>
              <option>정보</option>
              <option>공지</option>
              <option>후기</option>
            </select>
          </div>

          {/* 제목 */}
          <input
            className="title-input"
            placeholder="제목을 입력해 주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 상단 네이버 스타일 툴바 */}
          <div className="toolbar">
            <label className="tool-item">
              📷 사진
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
            <div className="tool-item">📁 파일</div>
            <div className="tool-item">🔗 링크</div>
            <div className="tool-item">📍 장소</div>
            <div className="tool-item">📅 일정</div>
            <div className="tool-item">📝 표</div>
          </div>

          {/* 이미지 미리보기 */}
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="preview-image" />
          )}

          {/* ★★★ TiptapEditor 딱 1번만! ★★★ */}
          <TiptapEditor setContent={setContent} />

          {/* 태그 */}
          <div className="tag-box">
            <div className="tag-list">
              {tags.map((tag) => (
                <div key={tag} className="tag-item">
                  #{tag}
                  <span className="tag-remove" onClick={() => removeTag(tag)}>×</span>
                </div>
              ))}

              <input
                className="tag-input"
                placeholder="#태그 입력"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>

            <div className="tag-tip">
              #태그는 최대 10개까지 입력할 수 있습니다.
            </div>
          </div>
        </div>

        {/* 오른쪽 설정 영역 */}
        <div className="write-sidebar">
          
          <div className="sidebar-section">
            <strong>공개 설정</strong>
            <div className="sidebar-item">📍 멤버공개</div>
            <div className="sidebar-item">🔍 검색 · 네이버 서비스 공개</div>
          </div>

          <div className="sidebar-section">
            <label><input type="checkbox" defaultChecked /> 댓글 허용</label>
            <label><input type="checkbox" defaultChecked /> 블로그·카페 공유 허용</label>
            <label><input type="checkbox" defaultChecked /> 외부 공유 허용</label>
            <label><input type="checkbox" defaultChecked /> 복사·저장 허용</label>
            <label><input type="checkbox" defaultChecked /> 자동 줄바꿈 사용</label>
            <label><input type="checkbox" /> CCL 사용</label>
          </div>

        </div>
      </div>

      <div className="write-buttons">
        <button className="temp-btn">임시저장</button>
        <button className="submit-btn" onClick={handleSubmit}>
          등록
        </button>
      </div>
    </div>
  );
}
