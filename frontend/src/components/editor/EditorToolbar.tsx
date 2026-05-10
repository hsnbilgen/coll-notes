import { Editor as TiptapEditor } from '@tiptap/react'
import { useFocus } from '@/context/FocusContext'

interface Props {
  editor: TiptapEditor | null
}

export function EditorToolbar({ editor }: Props) {
  const { isFocused, toggleFocus } = useFocus()
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-background text-sm flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-accent' : 'hover:bg-muted'}`}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded italic ${editor.isActive('italic') ? 'bg-accent' : 'hover:bg-muted'}`}>I</button>
      <button onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : 'hover:bg-muted'}`}>H1</button>
      <button onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : 'hover:bg-muted'}`}>H2</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-accent' : 'hover:bg-muted'}`}>• List</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 rounded font-mono ${editor.isActive('codeBlock') ? 'bg-accent' : 'hover:bg-muted'}`}>{'</>'}</button>
      <div className="flex-1" />
      <button onClick={toggleFocus}
        className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Focus mode (⌘⇧F)">
        {isFocused ? '⊠ Exit focus' : '⊡ Focus'}
      </button>
    </div>
  )
}