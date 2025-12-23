import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TiptapEditor from "./TiptapEditor";
import api from "../../../api/axiosInstance";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardWrite.css";

export default function BoardWrite() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("자유");
  const [content, setContent] = useState("");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(id);

  const handleTagKeyDown = (e) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const text = tagInput.trim();
    if (!text) return;

    if (tags.includes(text)) {
      return Swal.fire({
        icon: "warning",
        title: "중복 태그",
        text: "이미 존재하는 태그입니다.",
      });
    }

    if (tags.length >= 10) {
      return Swal.fire({
        icon: "error",
        title: "태그 제한",
        text: "태그는 최대 10개까지 입력할 수 있습니다.",
      });
    }

    setTags([...tags, text]);
    setTagInput("");
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  useEffect(() => {
    if (!isEdit) return;

    api
      .get(`/api/posts/${id}`)
      .then((res) => {
        const p = res.data.post;
        setTitle(p?.title ?? "");
        setCategory(p?.category ?? "자유");
        setContent(p?.content ?? "");
        setTags(p?.tags ?? []);
      })
      .catch(() =>
        Swal.fire({
          icon: "error",
          title: "불러오기 실패",
          text: "게시글을 불러오지 못했습니다.",
        })
      );
  }, [isEdit, id]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!title.trim() || !content.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "입력 필요",
        text: "제목과 내용을 모두 입력해주세요.",
      });
    }

    setIsSubmitting(true);

    const payload = {
      title,
      category,
      content,
      image_url: null,
      // tags는 백엔드 준비되면 같이 붙이면 됨:
      // tags: JSON.stringify(tags),
    };

    try {
      if (isEdit) {
        await api.put(`/api/posts/${id}`, payload);
        await Swal.fire({ icon: "success", title: "수정 완료" });
      } else {
        await api.post("/api/posts", payload);
        await Swal.fire({ icon: "success", title: "등록 완료" });
      }
      navigate("/board");
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "저장 실패" });
    } finally {
      setIsSubmitting(false);
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
              <option value="Q&A">Q&A</option>
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

          {/* ⭐ 에디터 박스 */}
          <div className="editor-box">
            <TiptapEditor setContent={setContent} initialContent={content} />
          </div>

          {/* 태그 입력 */}
          <div className="tag-box">
            <div className="tag-list">
              {tags.map((tag) => (
                <div key={tag} className="tag-item">
                  #{tag}
                  <span className="tag-remove" onClick={() => removeTag(tag)}>
                    ×
                  </span>
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
            <div className="tag-tip"># 태그는 최대 10개까지 입력할 수 있습니다.</div>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="write-sidebar">
          <div className="sidebar-section">
            <strong>공개 설정</strong>
            <label>
              <input type="radio" name="open" defaultChecked /> 전체공개
            </label>
            <label>
              <input type="radio" name="open" /> 나만보기
            </label>
          </div>

          <div className="sidebar-section">
            <strong>댓글 허용</strong>
            <label>
              <input type="checkbox" defaultChecked /> 댓글 허용
            </label>
            <label>
              <input type="checkbox" defaultChecked /> 외부 공유 허용
            </label>
            <label>
              <input type="checkbox" /> 자동 숨김 허용
            </label>
            <label>
              <input type="checkbox" /> CCL 사용
            </label>
          </div>
        </div>
      </div>

      <div className="write-buttons">
        <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : isEdit ? "수정 완료" : "등록"}
        </button>
      </div>
    </div>
  );
}
