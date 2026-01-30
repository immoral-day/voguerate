import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/** Выполняем команду по mousedown и не даём кнопке забирать фокус — иначе H2/H3/списки не применяются. */
function toolbarButton(
  editor: Editor,
  run: () => void,
  isActive: boolean,
  label: string
) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        run();
      }}
      className={`px-2 py-1 rounded border ${isActive ? 'bg-black text-white' : 'bg-white'}`}
    >
      {label}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-black bg-gray-100">
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
        'Ж'
      )}
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
        'К'
      )}
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'),
        'S'
      )}
      <span className="w-px bg-black self-stretch mx-1" />
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
        'H2'
      )}
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive('heading', { level: 3 }),
        'H3'
      )}
      <span className="w-px bg-black self-stretch mx-1" />
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
        '•'
      )}
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
        '1.'
      )}
      {toolbarButton(
        editor,
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote'),
        '"'
      )}
    </div>
  );
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Текст новости...',
  className = '',
  minHeight = '200px',
}) => {
  const lastHtmlRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap-editable',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastHtmlRef.current) {
      editor.commands.setContent(value || '', false);
      lastHtmlRef.current = value || '';
    }
  }, [value, editor]);

  return (
    <div className={className}>
      <style>{`
        .rich-editor .tiptap,
        .rich-editor .ProseMirror,
        .rich-editor .tiptap-editable {
          min-height: ${minHeight};
          outline: none;
          padding: 0.75rem 1rem;
          font-family: inherit;
          cursor: text;
        }
        .rich-editor .tiptap p.is-editor-empty:first-child::before,
        .rich-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-editor .tiptap a,
        .rich-editor .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .rich-editor .tiptap h2,
        .rich-editor .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0 0.25em; }
        .rich-editor .tiptap h3,
        .rich-editor .ProseMirror h3 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; }
        .rich-editor .tiptap p,
        .rich-editor .ProseMirror p { margin: 0.6em 0; }
        .rich-editor .tiptap ul,
        .rich-editor .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor .tiptap ol,
        .rich-editor .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
      `}</style>
      <div className="rich-editor border-2 border-black bg-white rounded overflow-hidden">
        <EditorToolbar editor={editor} />
        {editor ? (
          <div className="min-h-[200px]">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <div className="p-4 text-gray-500 min-h-[200px]">Загрузка редактора...</div>
        )}
      </div>
    </div>
  );
};
