import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7', className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M10 9h9l3 3v11H10z" fill="none" className="stroke-primary-foreground" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.5 15h5M13.5 19h3" className="stroke-brand" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-serif text-xl font-medium tracking-tight">Coll Notes</span>
    </div>
  )
}
