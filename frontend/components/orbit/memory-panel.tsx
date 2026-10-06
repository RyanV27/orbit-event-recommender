'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Brain, Heart, MessageSquareText, X, Compass } from 'lucide-react'
import type { Memory, SignalKind } from '@/lib/orbit-types'
import { cn } from '@/lib/utils'

const SIGNAL_META: Record<SignalKind, { icon: typeof Heart; label: string; className: string }> = {
  liked: { icon: Heart, label: 'Liked', className: 'text-primary' },
  passed: { icon: X, label: 'Passed', className: 'text-destructive' },
  feedback: { icon: MessageSquareText, label: 'Feedback', className: 'text-foreground' },
  context: { icon: Compass, label: 'Context', className: 'text-muted-foreground' },
}

export function MemoryPanel({ memory }: { memory: Memory }) {
  const { profile, signals } = memory
  const liked = signals.filter((s) => s.kind === 'liked').length
  const passed = signals.filter((s) => s.kind === 'passed').length
  const notes = signals.filter((s) => s.kind === 'feedback').length

  return (
    <section aria-labelledby="memory-title" className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 id="memory-title" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
          <Brain className="size-3.5 text-primary" aria-hidden="true" />
          Memory
        </h2>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">mem0</span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {[
          ['Liked', liked],
          ['Passed', passed],
          ['Notes', notes],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background/40 p-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {profile && (
        <dl className="flex flex-col gap-3 text-sm">
          <MemoryRow label="Startup" value={profile.startup} />
          <MemoryRow label="Stage" value={profile.stage} />
          <MemoryRow label="Background" value={profile.background} />
          <div>
            <dt className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Goals</dt>
            <dd className="flex flex-wrap gap-1.5">
              {profile.goals.map((g) => (
                <span key={g} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  {g}
                </span>
              ))}
            </dd>
          </div>
          {profile.preferences.length > 0 && (
            <div>
              <dt className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Learned preferences</dt>
              <dd className="flex flex-col gap-1">
                {profile.preferences.map((p) => (
                  <span key={p} className="text-xs leading-relaxed text-foreground/80">
                    — {p}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Signal log</p>
        {signals.length === 0 ? (
          <p className="text-xs text-muted-foreground">Swipe to start teaching Orbit.</p>
        ) : (
          <ol className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {[...signals].reverse().slice(0, 30).map((s) => {
                const meta = SIGNAL_META[s.kind]
                const Icon = meta.icon
                return (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -10, backgroundColor: 'oklch(0.93 0.2 122 / 0.12)' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'oklch(0.93 0.2 122 / 0)' }}
                    transition={{ duration: 0.6 }}
                    className="flex gap-2 rounded-lg px-2 py-1.5"
                  >
                    <Icon className={cn('mt-0.5 size-3 shrink-0', meta.className)} aria-hidden="true" />
                    <span className="text-xs leading-relaxed text-foreground/80">
                      <span className="sr-only">{meta.label}: </span>
                      {s.text}
                    </span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </section>
  )
}

function MemoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-pretty text-sm leading-snug text-foreground/90">{value}</dd>
    </div>
  )
}
