import { ReactNode } from 'react'
import { Zap, WifiOff, History } from 'lucide-react'
import { Logo } from '@/components/Logo'

const FEATURES = [
  { icon: Zap, title: 'Real-time, conflict-free', body: 'Edits merge instantly via CRDTs — no locks, no overwrites.' },
  { icon: WifiOff, title: 'Works offline', body: 'Keep writing on a plane. Changes sync the moment you reconnect.' },
  { icon: History, title: 'Every version kept', body: 'Snapshots every few minutes, restore any of them in one click.' },
]

function Cursor({ name, color, className }: { name: string; color: string; className: string }) {
  return (
    <span className={`relative inline-block h-5 w-0.5 align-middle ${className}`} style={{ backgroundColor: color }}>
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded-md rounded-bl-sm px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </span>
  )
}

function EditorPreview() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <div className="flex -space-x-2">
          {['#f05d38', '#3b82f6', '#10b981'].map((c, i) => (
            <span key={c} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-stone-900 text-[9px] font-bold text-white" style={{ backgroundColor: c }}>
              {['AK', 'JL', 'MR'][i]}
            </span>
          ))}
        </div>
      </div>
      <p className="font-serif text-2xl text-white">Q3 product review</p>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/60">
        <p>
          Retention is up 12% since the onboarding redesign<Cursor name="Amara" color="#f05d38" className="ml-0.5" />.
        </p>
        <p>
          Next: ship offline mode to <span className="rounded bg-blue-500/25 px-0.5 text-white/80">every workspace</span>
          <Cursor name="Jonas" color="#3b82f6" className="ml-0.5" />
        </p>
        <div className="space-y-2 pt-1">
          <div className="h-2 w-11/12 rounded-full bg-white/10" />
          <div className="h-2 w-3/4 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#f05d38]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#faf8f5" />
            <path d="M10 9h9l3 3v11H10z" fill="none" stroke="#1c1917" strokeWidth="2" strokeLinejoin="round" />
            <path d="M13.5 15h5M13.5 19h3" stroke="#f05d38" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-serif text-xl">Coll Notes</span>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <h2 className="font-serif text-5xl leading-[1.05] tracking-tight">
            Think together,<br />
            <span className="italic text-[#f7a58f]">on the same page.</span>
          </h2>
          <p className="mt-5 max-w-md text-base text-white/60">
            A calm, fast editor for teams who write. Everyone's cursor, every change, live.
          </p>
          <div className="mt-10">
            <EditorPreview />
          </div>
        </div>

        <ul className="relative grid grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon className="mb-2 h-4 w-4 text-[#f7a58f]" />
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{body}</p>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-pop-in">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
