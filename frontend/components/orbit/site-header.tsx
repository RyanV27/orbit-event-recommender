type SiteHeaderProps = {
  sessions: number
  memoryCount: number
  onHome?: () => void
  children?: React.ReactNode
}

export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(-18 16 16)" stroke="currentColor" strokeOpacity="0.45" />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      <circle cx="28.4" cy="11.6" r="2" className="fill-primary" />
    </svg>
  )
}

export function SiteHeader({ sessions, memoryCount, onHome, children }: SiteHeaderProps) {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-4 md:px-8">
      <button
        type="button"
        onClick={onHome}
        className="flex items-center gap-2.5 rounded-md focus-visible:outline-2"
        aria-label="ORBIT home"
      >
        <OrbitMark className="size-7 text-foreground" />
        <span className="font-mono text-sm font-semibold tracking-[0.32em]">ORBIT</span>
      </button>

      <div className="flex items-center gap-2 md:gap-3">
        {children}
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur sm:flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          MEMORY · {memoryCount} {memoryCount === 1 ? 'TRACE' : 'TRACES'}
        </div>
        <div className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
          SESSION {String(sessions).padStart(2, '0')}
        </div>
      </div>
    </header>
  )
}
