import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Lock,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  isViewer: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, isViewer }) => {
  if (isViewer) {
    return (
      <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-medium">
            You are viewing this document in <strong>Read-Only Mode</strong>. Only the document owner and editors can make changes.
          </span>
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-1.5 flex items-center flex-wrap gap-1 sticky top-[108px] z-10 text-slate-700">
      {/* History */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('paragraph') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Normal Text"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Formatting: Bold, Italic, Underline */}
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lists & Blockquote */}
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Divider */}
      <div className="flex items-center gap-0.5 pl-2">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-slate-100 transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

