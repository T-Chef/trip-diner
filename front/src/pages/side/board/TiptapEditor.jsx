
import React, { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import axios from "axios";
import Swal from "sweetalert2";

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default:
          "display:block; margin:0 auto; max-width:90%; height:auto;",
      },
    };
  },
});

export default function TiptapEditor({ setContent }) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ TextStyle: false }),
      TextStyle,
      Color,
      CustomImage, 
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    onUpdate({ editor }) {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  if (!editor) return null;

  const handleUploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/posts/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = res.data.url;

      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "업로드 실패",
        text: "이미지 업로드 중 오류가 발생했습니다.",
      });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUploadImage(file);
  };

  return (
    <div className="tiptap-wrap">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div className="tiptap-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span>/</span>
        </button>

        <button onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          ≡
        </button>

        <button onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          ≣
        </button>

        <button onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          ☰
        </button>

        <button onClick={openFileDialog}>📷</button>

        <label className="color-picker">
          <div
            className="color-preview"
            style={{
              backgroundColor:
                editor.getAttributes("textStyle").color || "#000",
            }}
          />
          <input
            type="color"
            onInput={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
          />
        </label>
      </div>

      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
}
