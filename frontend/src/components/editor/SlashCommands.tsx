import { Extension, Editor as TiptapEditor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { forwardRef, useImperativeHandle, useState } from 'react'

interface CommandItem {
  title: string
  description: string
  command: (props: { editor: TiptapEditor; range: { from: number; to: number } }) => void
}

const COMMANDS: CommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Code Block',
    description: 'Capture a code snippet',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
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
      <div className="bg-background border rounded-lg shadow-xl p-1 min-w-52 max-h-72 overflow-y-auto">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium uppercase tracking-wide">Blocks</p>
        {filtered.map((item, i) => (
          <button
            key={item.title}
            onClick={() => execute(item)}
            className={`flex flex-col w-full text-left px-3 py-2 rounded text-sm ${
              i === selected ? 'bg-accent' : 'hover:bg-muted'
            }`}
          >
            <span className="font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.description}</span>
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
            return (component?.ref as any)?.onKeyDown?.({ event }) ?? false
          },
        },
        view(editorView) {
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
                  getReferenceClientRect: () => view.coordsAtPos(from) as DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              } else {
                component.updateProps({ query, editor: tiptapEditor, range, onCommandExecuted: destroyPopup })
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
