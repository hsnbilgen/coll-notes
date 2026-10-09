import { Editor as TiptapEditor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Underline, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, SquareCode, Minus, RemoveFormatting, Maximize2, Minimize2,
  type LucideIcon,
} from 'lucide-react'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'

interface Props {
  editor: TiptapEditor | null
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />
}

function ToolBtn({
  onClick,
  active,
  title,
  icon: Icon,
}: {
  onClick: () => void
  active?: boolean
  title: string
  icon: LucideIcon
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      aria-pressed={active}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-brand-soft text-brand'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} />
    </button>
  )
}

export function EditorToolbar({ editor }: Props) {
  const { isFocused, toggleFocus } = useFocus()
  if (!editor) return <div className="h-11 flex-1" />

  const chain = () => editor.chain().focus()

  return (
    <div className="scrollbar-thin flex h-11 flex-1 items-center gap-0.5 overflow-x-auto">
      <ToolBtn icon={Bold} title="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} />
      <ToolBtn icon={Italic} title="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ToolBtn icon={Underline} title="Underline (⌘U)" active={editor.isActive('underline')} onClick={() => (chain() as any).toggleUnderline().run()} />
      <ToolBtn icon={Strikethrough} title="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()} />
      <ToolBtn icon={Code} title="Inline code" active={editor.isActive('code')} onClick={() => chain().toggleCode().run()} />

      <Divider />

      <ToolBtn icon={Heading1} title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => chain().toggleHeading({ level: 1 }).run()} />
      <ToolBtn icon={Heading2} title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolBtn icon={Heading3} title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()} />

      <Divider />

      <ToolBtn icon={List} title="Bullet list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} />
      <ToolBtn icon={ListOrdered} title="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} />
      <ToolBtn icon={Quote} title="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()} />
      <ToolBtn icon={SquareCode} title="Code block" active={editor.isActive('codeBlock')} onClick={() => chain().toggleCodeBlock().run()} />
      <ToolBtn icon={Minus} title="Divider" onClick={() => chain().setHorizontalRule().run()} />

      <Divider />

      <ToolBtn icon={RemoveFormatting} title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()} />

      <div className="flex-1" />

      <button
        onMouseDown={(e) => { e.preventDefault(); toggleFocus() }}
        title="Focus mode (⌘⇧F)"
        className="btn-ghost h-8 shrink-0 px-2 text-xs"
      >
        {isFocused ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        <span className="hidden md:inline">{isFocused ? 'Exit focus' : 'Focus'}</span>
      </button>
    </div>
  )
}
