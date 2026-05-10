import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { forwardRef, useImperativeHandle, useState } from 'react'

const commands = [
  { title: 'Heading 1', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run() },
  { title: 'Heading 2', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run() },
  { title: 'Heading 3', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run() },
  { title: 'Bullet List', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Code Block', command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  {
    title: 'Meeting Note',
    command: ({ editor, range }: any) =>
      editor.chain().focus().deleteRange(range)
        .setHeading({ level: 2 }).insertContent('Meeting\n')
        .setHeading({ level: 3 }).insertContent('Attendees\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Agenda\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Action Items\n')
        .run(),
  },
  {
    title: 'Decision Record',
    command: ({ editor, range }: any) =>
      editor.chain().focus().deleteRange(range)
        .setHeading({ level: 2 }).insertContent('Decision\n')
        .setHeading({ level: 3 }).insertContent('Context\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Decision\n')
        .setParagraph().insertContent('\n')
        .setHeading({ level: 3 }).insertContent('Consequences\n')
        .run(),
  },
]

const CommandList = forwardRef((props: any, ref) => {
  const [selected, setSelected] = useState(0)
  const filtered = commands.filter((c) => c.title.toLowerCase().includes(props.query.toLowerCase()))

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') { setSelected((s) => (s - 1 + filtered.length) % filtered.length); return true }
      if (event.key === 'ArrowDown') { setSelected((s) => (s + 1) % filtered.length); return true }
      if (event.key === 'Enter') { filtered[selected]?.command(props); return true }
      return false
    },
  }))

  if (!filtered.length) return null

  return (
    <div className="bg-background border rounded shadow-lg p-1 min-w-40">
      {filtered.map((item, i) => (
        <button
          key={item.title}
          onClick={() => item.command(props)}
          className={`block w-full text-left px-3 py-1.5 text-sm rounded ${i === selected ? 'bg-accent' : 'hover:bg-muted'}`}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
})

CommandList.displayName = 'CommandList'

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    let component: ReactRenderer | null = null
    let popup: any = null
    return [
      new Plugin({
        key: new PluginKey('slashCommands'),
        props: {
          handleKeyDown(_view, event) {
            if (event.key === 'Escape' && popup?.[0]?.isVisible) { popup?.[0]?.hide(); return true }
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

              if (!slashMatch) { popup?.[0]?.hide(); return }

              const range = { from: from - slashMatch[0].length, to: from }

              if (!component) {
                component = new ReactRenderer(CommandList, {
                  props: { query: slashMatch[1], editor: view, range },
                  editor: (editorView as any).editor,
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
                component.updateProps({ query: slashMatch[1], editor: view, range })
                popup?.[0]?.show()
              }
            },
            destroy() { component?.destroy(); popup?.[0]?.destroy() },
          }
        },
      }),
    ]
  },
})