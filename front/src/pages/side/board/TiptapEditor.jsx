import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function TiptapEditor({ setContent, initialContent }) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['image', 'link'],
      ['clean']
    ],
  };

  return (
    <div className="quill-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: '15px', overflow: 'hidden', background: '#fff' }}>
      <ReactQuill 
        theme="snow"
        value={initialContent || ""}
        onChange={setContent} 
        modules={modules}
        placeholder="여행의 추억을 기록해보세요..."
      />
      
      <style>{`
        /* 에디터 내부의 불필요한 테두리 제거 */
        .ql-container.ql-snow {
          border: none !important;
          min-height: 600px;
          font-family: 'Pretendard', sans-serif;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
          background: #f8f9fa;
        }
        .ql-editor {
          padding: 30px !important;
        }
        /* 카드 레이아웃 정렬 보정 */
        .ql-editor div {
          display: flex !important;
        }
      `}</style>
    </div>
  );
}
