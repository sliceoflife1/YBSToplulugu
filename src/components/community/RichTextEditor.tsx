"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";

const MenuButton = ({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg p-1.5 transition-all ${
      isActive
        ? "bg-indigo-500/10 text-indigo-500"
        : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
    }`}
    title={title}
  >
    {children}
  </button>
);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  minHeight = "min-h-[150px]",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-5 my-2 space-y-1",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-5 my-2 space-y-1",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-indigo-500 pl-4 my-2 italic text-[var(--color-muted-foreground)]",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-[var(--color-muted)] p-3 rounded-lg font-mono text-xs my-2 overflow-x-auto block",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-500 hover:text-indigo-600 underline font-medium",
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: `focus:outline-none p-4 text-sm text-[var(--color-foreground)] bg-transparent w-full ${minHeight} prose prose-sm dark:prose-invert max-w-none`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col w-full border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-card)]/50 px-3 py-1.5 overflow-x-auto">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Kalın"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="İtalik"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Sola Hizala"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Ortala"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Sağa Hizala"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Yasla"
        >
          <AlignJustify className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Maddeli Liste"
        >
          <List className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numaralı Liste"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Başlık 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Başlık 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Alıntı"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Kod Bloğu"
        >
          <Code className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--color-border)] mx-1 ml-auto" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Geri Al"
        >
          <Undo className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="İleri Al"
        >
          <Redo className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
