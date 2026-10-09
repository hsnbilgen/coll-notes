import { Extension, Editor as TiptapEditor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Heading1, Heading2, Heading3, List, ListOrdered, SquareCode, Quote, Minus, Users, Scale, type LucideIcon } from 'lucide-react'

interface CommandItem {
  icon: LucideIcon
  title: string
  description: string
  command: (props: { editor: TiptapEditor; range: { from: number; to: number } }) => void
}

const COMMANDS: CommandItem[] = [
  {
    icon: Heading1,
    title: 'Heading 1',
    description: 'Large section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    icon: Heading2,
    title: 'Heading 2',
    description: 'Medium section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    icon: Heading3,
    title: 'Heading 3',
    description: 'Small section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    icon: List,
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    icon: ListOrdered,
    title: 'Numbered List',
    description: 'Create a numbered list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    icon: SquareCode,
    title: 'Code Block',
    description: 'Capture a code snippet',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    icon: Quote,
    title: 'Quote',
    description: 'Highlight a passage',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    icon: Minus,
    title: 'Divider',
    description: 'Visually separate sections',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    icon: Users,
    title: 'Meeting Note',
    description: 'Template for meeting notes',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertContent([
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Meeting' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Attendees' }] },
          { type: 'paragraph' },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Agenda' }] },
          { type: 'paragraph' },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Action Items' }] },
          { type: 'paragraph' },
        ])
        .run(),
  },
  {
    icon: Scale,
    title: 'Decision Record',
    description: 'Document an architectural decision',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertContent([
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Decision Record' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Context' }] },
          { type: 'paragraph' },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Decision' }] },
          { type: 'paragraph' },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Consequences' }] },
          { type: 'paragraph' },
        ])
        .run(),
  },
]

interface CommandListProps {
  query: string
  editor: TiptapEditor
  range: { from: number; to: number }
  onCommandExecuted: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
const CommandList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, CommandListProps>(
  (props, ref) => {
    const [selected, setSelected] = useState(0)
    const filtered = COMMANDS.filter((c) =>
      c.title.toLowerCase().includes(props.query.toLowerCase())
    )

    function execute(item: CommandItem) {
      item.command({ editor: props.editor, range: props.range })
      props.onCommandExecuted()
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + filtered.length) % filtered.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % filtered.length)
          return true
        }
        if (event.key === 'Enter') {
          if (filtered[selected]) execute(filtered[selected])
          return true
        }
        return false
      },
    }))

    if (!filtered.length) return null

    return (
      <div className="w-72 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-black/10 animate-pop-in scrollbar-thin">
        <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Insert block</p>
        {filtered.map((item, i) => (
          <button
            key={item.title}
            onClick={() => execute(item)}
            onMouseEnter={() => setSelected(i)}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm ${
              i === selected ? 'bg-accent' : ''
            }`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-card ${i === selected ? 'text-brand' : 'text-muted-foreground'}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    const tiptapEditor = this.editor
    let component: ReactRenderer | null = null
    let popup: ReturnType<typeof tippy> | null = null

    function destroyPopup() {
      component?.destroy()
      popup?.[0]?.destroy()
      component = null
      popup = null
    }

    return [
      new Plugin({
        key: new PluginKey('slashCommands'),
        props: {
          handleKeyDown(_view, event) {
            // Only intercept keys when popup is visible
            if (!popup?.[0]?.state.isVisible) return false
            if (event.key === 'Escape') {
              destroyPopup()
              return true
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (component?.ref as any)?.onKeyDown?.({ event }) ?? false
          },
        },
        view(_editorView) {
          return {
            update(view) {
              const { selection, doc } = view.state
              const { from } = selection
              const text = doc.textBetween(Math.max(0, from - 50), from, '\n', '\0')
              const slashMatch = text.match(/\/(\w*)$/)

              if (!slashMatch) {
                popup?.[0]?.hide()
                return
              }

              const range = { from: from - slashMatch[0].length, to: from }
              const query = slashMatch[1]

              if (!component) {
                component = new ReactRenderer(CommandList, {
                  props: { query, editor: tiptapEditor, range, onCommandExecuted: destroyPopup },
                  editor: tiptapEditor,
                })
                popup = tippy('body', {
                  getReferenceClientRect: () => {
                    const coords = view.coordsAtPos(from)
                    return DOMRect.fromRect({ x: coords.left, y: coords.top, width: 0, height: coords.bottom - coords.top })
                  },
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              } else {
                component.updateProps({ query, editor: tiptapEditor, range, onCommandExecuted: destroyPopup })
                popup?.[0]?.setProps({
                  getReferenceClientRect: () => {
                    const coords = view.coordsAtPos(from)
                    return DOMRect.fromRect({ x: coords.left, y: coords.top, width: 0, height: coords.bottom - coords.top })
                  },
                })
                popup?.[0]?.show()
              }
            },
            destroy() {
              destroyPopup()
            },
          }
        },
      }),
    ]
  },
})
