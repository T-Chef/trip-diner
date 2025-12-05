import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";  // ⬅ 수정됨!
import Color from "@tiptap/extension-color";           // ⬅ 오타 수정됨!

export default function TiptapEditor({ setContent }) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        TextStyle: false,
      }),
      TextStyle,
      Color,
      Image,
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


    return (
        <div className="tiptap-wrap">

            {/* 툴바 */}
            <div className="tiptap-toolbar">

                <button onClick={() => editor.chain().focus().toggleBold().run()}>
                <b>B</b>
                </button>

                <button onClick={() => editor.chain().focus().toggleItalic().run()}>
                <span>/</span>
                </button>

                <button onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                <span>≡</span>
                </button>

                <button onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                <span>≣</span>
                </button>

                <button onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                <span>☰</span>
                </button>

                {/* 색상 */}
                <label className="color-picker">
                <div
                    className="color-preview"
                    style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000" }}
                ></div>

                <input
                    type="color"
                    onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
                />
                </label>
            </div>

            {/* 에디터 */}
            <EditorContent editor={editor} className="tiptap-editor" />
            
        </div>
    );
}
