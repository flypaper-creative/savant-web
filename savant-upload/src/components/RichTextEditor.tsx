import React from 'react';
import { motion } from 'motion/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('bold') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        BOLD
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('italic') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        ITALIC
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('strike') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        STRIKE
      </button>
      <div className="w-px h-6 bg-white/10 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('bulletList') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        BULLETS
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('orderedList') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        NUMBERS
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 text-xs font-mono tracking-widest transition-colors ${
          editor.isActive('blockquote') ? 'bg-gold text-obsidian' : 'text-white/70 hover:bg-white/10'
        }`}
      >
        QUOTE
      </button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder = 'ENTER_CONTENT...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[16rem] p-4 text-white/90 font-mono text-sm',
      },
    },
  });

  // Update editor content when the prop changes (e.g., when editing a different post)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full bg-white/5 border border-white/10 focus-within:border-gold transition-colors duration-300 flex flex-col relative overflow-hidden">
      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 w-full h-[1px] bg-white/5 z-0 pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
