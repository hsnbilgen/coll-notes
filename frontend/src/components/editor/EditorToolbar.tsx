import { Editor as TiptapEditor } from '@tiptap/react'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'


interface Props {
  editor: TiptapEditor | null
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />
}

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded text-sm transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor }: Props) {
  const { isFocused, toggleFocus } = useFocus()
  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 flex-1">
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (⌘B)"
      >
        <span className="font-bold text-[13px]">B</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (⌘I)"
      >
        <span className="italic text-[13px]">I</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleStrike?.().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <span className="line-through text-[13px]">S</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (⌘U)"
      >
        <span className="underline text-[13px]">U</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        <span className="font-mono text-[12px]">`</span>
      </ToolBtn>

      <Divider />

      <ToolBtn
        onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <span className="text-[11px] font-bold">H1</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="text-[11px] font-bold">H2</span>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="text-[11px] font-bold">H3</span>
      </ToolBtn>

      <Divider />

      <ToolBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="2.5" cy="4.5" r="1.5" fill="currentColor"/>
          <rect x="5" y="3.75" width="9" height="1.5" rx="0.75" fill="currentColor"/>
          <circle cx="2.5" cy="10.5" r="1.5" fill="currentColor"/>
          <rect x="5" y="9.75" width="9" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M1 2h1.5v4H1V2zm0 6h1.5v4H1V8z" fill="currentColor" opacity="0.7"/>
          <rect x="4.5" y="3.75" width="9" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="4.5" y="9.75" width="9" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="1.5" y="2.5" width="2" height="10" rx="1" fill="currentColor"/>
          <path d="M5.5 5h8M5.5 7.5h6M5.5 10h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M5 4L1 7.5L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 4L14 7.5L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 2L6.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M1.5 7.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        active={false}
        title="Clear formatting"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3 3l9 9M5 2h7l-2 5h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <div className="flex-1" />

      <button
        onMouseDown={(e) => { e.preventDefault(); toggleFocus() }}
        title="Focus mode (⌘⇧F)"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 h-8 rounded hover:bg-muted transition-colors"
      >
        {isFocused ? (
          <>
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 1.5L5.5 5.5M13.5 1.5L9.5 5.5M1.5 13.5L5.5 9.5M13.5 13.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Exit focus
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 5.5V1.5H5.5M9.5 1.5H13.5V5.5M13.5 9.5V13.5H9.5M5.5 13.5H1.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Focus
          </>
        )}
      </button>
    </div>
  )
}
