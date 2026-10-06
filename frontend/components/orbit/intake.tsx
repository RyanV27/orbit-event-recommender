'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, MapPin, Sparkles, Brain } from 'lucide-react'
import { GOAL_OPTIONS, type Memory } from '@/lib/orbit-types'
import { cn } from '@/lib/utils'

const CITIES = ['San Francisco', 'New York', 'London', 'Berlin', 'Austin']

const DEMO = {
  destination: 'San Francisco',
  brief:
    "I'm visiting San Francisco next week. I'm building an AI tool for small law firms. We're pre-seed, and I'm looking for design partners.",
  goals: ['Design partners', 'Customers'],
}

export type LaunchInput = { destination: string; brief: string; goals: string[] }

type IntakeProps = {
  memory: Memory
  error: string | null
  onLaunch: (input: LaunchInput) => void
}

export function Intake({ memory, error, onLaunch }: IntakeProps) {
  const returning = memory.profile !== null
  const [destination, setDestination] = useState('')
  const [brief, setBrief] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  const canLaunch = destination.trim().length > 0 && (returning || brief.trim().length > 0)

  const submit = () => {
    if (!canLaunch) return
    onLaunch({ destination: destination.trim(), brief: brief.trim(), goals })
  }

  const toggleGoal = (goal: string) =>
    setGoals((g) => (g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]))

  return (
    <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 pb-24 pt-6 md:px-8 lg:grid-cols-[minmax(0,560px)_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-5">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-px w-6 bg-primary" />
            {returning ? `Welcome back · session ${String(memory.sessions).padStart(2, '0')}` : 'Memory-powered networking agent'}
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-tighter md:text-7xl">
            Find your people.
            <br />
            <span className="text-muted-foreground">Build what&apos;s</span>{' '}
            <span className="relative text-primary">
              next
              <span aria-hidden="true" className="ml-1 inline-block h-[0.8em] w-[0.08em] translate-y-[0.08em] animate-blink bg-primary" />
            </span>
          </h1>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            Tell Orbit where you&apos;re headed and what you&apos;re building. It pulls the right cofounders,
            customers, investors and mentors into your orbit — and remembers every swipe.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="relative flex flex-col gap-5 rounded-2xl border border-border bg-card/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-6"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          {returning && memory.profile && (
            <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3.5">
              <Brain className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-foreground/90">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Orbit remembers · </span>
                {memory.profile.startup} — {memory.profile.stage}. Prioritizing{' '}
                {memory.profile.goals.slice(0, 2).join(' & ').toLowerCase()}.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="destination" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              01 · Destination
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-input bg-background/60 px-3.5 transition-colors focus-within:border-primary/60">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you headed?"
                autoComplete="off"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDestination(c)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors',
                    destination === c
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="brief" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              02 · {returning ? 'Anything new? (optional)' : 'What are you building?'}
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={3}
              placeholder={
                returning
                  ? 'e.g. We just closed 3 pilots — now I want to meet seed investors.'
                  : 'Your startup, stage, and who you need to meet next…'
              }
              className="resize-none rounded-xl border border-input bg-background/60 px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              03 · Looking for
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_OPTIONS.map((goal) => {
                const active = goals.includes(goal)
                return (
                  <button
                    key={goal}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs transition-all',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                    )}
                  >
                    {goal}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            {!returning ? (
              <button
                type="button"
                onClick={() => {
                  setDestination(DEMO.destination)
                  setBrief(DEMO.brief)
                  setGoals(DEMO.goals)
                }}
                className="flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Load demo founder
              </button>
            ) : (
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">⌘ + ↵ to launch</span>
            )}
            <button
              type="submit"
              disabled={!canLaunch}
              className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_32px_-4px] hover:shadow-primary/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
            >
              Launch orbit
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
