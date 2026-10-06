'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Heart, RefreshCw, RotateCcw, Trash2, X } from 'lucide-react'
import type { Memory, OrbitEvent, Person, RecommendResponse, Signal, SignalKind } from '@/lib/orbit-types'
import { OrbitCanvas } from './orbit-canvas'
import { SiteHeader } from './site-header'
import { Intake, type LaunchInput } from './intake'
import { Scanning } from './scanning'
import { SwipeDeck, type SwipeDirection } from './swipe-deck'
import { FeedbackStrip } from './feedback-strip'
import { MemoryPanel } from './memory-panel'
import { EventsPanel } from './events-panel'

type Phase = 'intake' | 'scanning' | 'deck'

const MIN_SCAN_MS = 4200
const TICKER = [
  'Cofounders',
  'Design partners',
  'Angels',
  'Early hires',
  'Operators',
  'Mentors',
  'Customers',
  'Seed funds',
]

const USER_KEY = 'orbit-user-id'
const getUserId = () => {
  try {
    let id = localStorage.getItem(USER_KEY)
    if (!id) {
      id = `founder-${crypto.randomUUID().slice(0, 8)}`
      localStorage.setItem(USER_KEY, id)
    }
    return id
  } catch {
    return 'founder-demo'
  }
}

const post = (path: string, body: unknown) =>
  fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})

const makeSignal = (kind: SignalKind, text: string): Signal => ({
  id: crypto.randomUUID(),
  kind,
  text,
  at: Date.now(),
})

export function OrbitApp() {
  const [phase, setPhase] = useState<Phase>('intake')
  const [memory, setMemory] = useState<Memory>({ profile: null, signals: [], sessions: 1, cities: [] })
  const [destination, setDestination] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [events, setEvents] = useState<OrbitEvent[]>([])
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<SwipeDirection>(1)
  const [last, setLast] = useState<{ person: Person; dir: SwipeDirection } | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [userId, setUserId] = useState('')

  // Hydrate from the backend (mem0) so a returning founder is remembered across reloads.
  useEffect(() => {
    const id = getUserId()
    setUserId(id)
    fetch(`/api/memory?user_id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || (!d.profile && !d.signals?.length)) return
        setMemory({
          profile: d.profile ?? null,
          cities: d.cities ?? [],
          sessions: (d.sessions ?? 0) + 1,
          signals: (d.signals ?? []).map((s: { kind: SignalKind; text: string }) => makeSignal(s.kind, s.text)),
        })
      })
      .catch(() => {})
  }, [])

  const addSignal = useCallback((kind: SignalKind, text: string) => {
    setMemory((m) => ({ ...m, signals: [...m.signals, makeSignal(kind, text)] }))
  }, [])

  const compute = async (input: LaunchInput, mem: Memory) => {
    setError(null)
    setDestination(input.destination)
    setPhase('scanning')
    const started = Date.now()
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...input,
          memory: {
            profile: mem.profile,
            signals: mem.signals.slice(-100).map(({ kind, text }) => ({ kind, text })),
            cities: mem.cities,
          },
        }),
      })
      const data = (await res.json()) as RecommendResponse & { error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Something went wrong')
      const remaining = MIN_SCAN_MS - (Date.now() - started)
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))

      setMemory((m) => ({
        ...m,
        profile: data.profile,
        cities: m.cities.includes(input.destination) ? m.cities : [...m.cities, input.destination],
      }))
      setPeople(data.people)
      setEvents(data.events)
      setIndex(0)
      setLast(null)
      setPhase('deck')
      setPulseKey((k) => k + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase(people.length ? 'deck' : 'intake')
    }
  }

  const launch = (input: LaunchInput) => {
    const additions: Signal[] = []
    if (input.brief) additions.push(makeSignal('context', `"${input.brief}"`))
    if (input.goals.length) additions.push(makeSignal('context', `Goals: ${input.goals.join(', ')}`))
    additions.push(makeSignal('context', `Heading to ${input.destination}`))
    const next = { ...memory, signals: [...memory.signals, ...additions] }
    setMemory(next)
    compute(input, next)
  }

  const refine = () => compute({ destination, brief: '', goals: [] }, memory)

  const newSession = () => {
    setMemory((m) => ({ ...m, sessions: m.sessions + 1 }))
    setPeople([])
    setEvents([])
    setIndex(0)
    setLast(null)
    setError(null)
    setPhase('intake')
  }

  // Wipe this founder's mem0 memory and all local state so the demo can start over.
  const resetDemo = async () => {
    if (!window.confirm('Reset the demo? This erases everything Orbit remembers about you.')) return
    await fetch(`/api/memory?user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' }).catch(() => {})
    setMemory({ profile: null, signals: [], sessions: 1, cities: [] })
    setPeople([])
    setEvents([])
    setIndex(0)
    setLast(null)
    setError(null)
    setDestination('')
    setPhase('intake')
  }

  const swipe = useCallback(
    (dir: SwipeDirection) => {
      const person = people[index]
      if (!person) return
      setDirection(dir)
      setIndex((i) => i + 1)
      setLast({ person, dir })
      post('/api/swipe', { user_id: userId, direction: dir === 1 ? 'liked' : 'passed', person })
      addSignal(dir === 1 ? 'liked' : 'passed', `${person.name} — ${person.role}, ${person.company} (${person.category})`)
      if (dir === 1) setPulseKey((k) => k + 1)
    },
    [people, index, addSignal, userId],
  )

  useEffect(() => {
    if (phase !== 'deck') return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea')) return
      if (e.key === 'ArrowRight') swipe(1)
      if (e.key === 'ArrowLeft') swipe(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, swipe])

  const connections = memory.signals.filter((s) => s.kind === 'liked').length
  const remaining = people.length - index

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <AnimatePresence>
        {phase !== 'deck' && (
          <motion.div
            key="hero-orbit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 1 }}
            className="pointer-events-none absolute inset-0"
          >
            <OrbitCanvas scanning={phase === 'scanning'} pulseKey={pulseKey} offsetX={phase === 'intake' ? 0.2 : 0} />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent lg:via-background/40" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'deck' && (
        <div aria-hidden="true" className="tech-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      )}

      <SiteHeader
        sessions={memory.sessions}
        memoryCount={memory.signals.length}
        onHome={phase === 'deck' ? newSession : undefined}
      >
        <button
          type="button"
          onClick={resetDemo}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          <Trash2 className="size-3" aria-hidden="true" />
          RESET DEMO
        </button>
      </SiteHeader>

      {phase === 'intake' && <Intake memory={memory} error={error} onLaunch={launch} />}
      {phase === 'scanning' && <Scanning destination={destination} memory={memory} />}

      {phase === 'deck' && (
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 pb-12 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end"
          >
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Your orbit · {destination}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                {remaining > 0 ? (
                  <>
                    {remaining} {remaining === 1 ? 'person' : 'people'} worth meeting
                  </>
                ) : (
                  'Orbit complete'
                )}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refine}
                className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card/60 px-4 text-sm transition-colors hover:border-primary/50 hover:text-primary"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Refine with memory
              </button>
              <button
                type="button"
                onClick={newSession}
                className="flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                New session
              </button>
            </div>
          </motion.div>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
            <div className="order-3 lg:order-1">
              <MemoryPanel memory={memory} />
            </div>

            <div className="order-1 flex flex-col gap-5 lg:order-2">
              {remaining > 0 ? (
                <SwipeDeck people={people} index={index} direction={direction} onSwipe={swipe} />
              ) : (
                <CompleteState connections={connections} onRefine={refine} onNewSession={newSession} />
              )}

              {remaining > 0 && (
                <div className="flex items-center justify-center gap-6">
                  <SwipeButton label="Pass" hint="←" onClick={() => swipe(-1)} tone="pass">
                    <X className="size-6" aria-hidden="true" />
                  </SwipeButton>
                  <SwipeButton label="Connect" hint="→" onClick={() => swipe(1)} tone="like">
                    <Heart className="size-6" aria-hidden="true" />
                  </SwipeButton>
                </div>
              )}

              <FeedbackStrip
                last={last}
                onDismiss={() => setLast(null)}
                onFeedback={(text) => {
                  if (!last) return
                  const full = `${text} (${last.dir === 1 ? 'liked' : 'passed on'} ${last.person.name}, ${last.person.category})`
                  post('/api/feedback', { user_id: userId, text: full })
                  addSignal('feedback', full)
                }}
              />
            </div>

            <div className="order-2 lg:order-3">
              <EventsPanel events={events} people={people} destination={destination} connections={connections} pulseKey={pulseKey} />
            </div>
          </div>
        </main>
      )}

      {phase === 'intake' && (
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-border bg-background/60 py-3 backdrop-blur">
          <div className="flex w-max animate-marquee gap-10 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                {t}
                <span className="size-1 rounded-full bg-primary" />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SwipeButton({
  label,
  hint,
  tone,
  onClick,
  children,
}: {
  label: string
  hint: string
  tone: 'like' | 'pass'
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        aria-label={label}
        className={
          tone === 'like'
            ? 'grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary/70'
            : 'grid size-16 place-items-center rounded-full border border-border bg-card text-destructive transition-colors hover:border-destructive/50'
        }
      >
        {children}
      </motion.button>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {tone === 'pass' ? `${hint} ${label}` : `${label} ${hint}`}
      </span>
    </div>
  )
}

function CompleteState({
  connections,
  onRefine,
  onNewSession,
}: {
  connections: number
  onRefine: () => void
  onNewSession: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex h-[540px] w-full max-w-[400px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center"
    >
      <span className="font-mono text-5xl font-semibold text-primary">{String(connections).padStart(2, '0')}</span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Connections locked in</h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Orbit learned from every swipe. Refine for a sharper set here, or start a new session somewhere else — no need
          to repeat yourself.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRefine}
          className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Refine with memory
        </button>
        <button type="button" onClick={onNewSession} className="h-10 rounded-xl border border-border px-4 text-sm">
          New city
        </button>
      </div>
    </motion.div>
  )
}
