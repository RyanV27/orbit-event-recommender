'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, CornerDownLeft, X } from 'lucide-react'
import type { Person } from '@/lib/orbit-types'
import type { SwipeDirection } from './swipe-deck'

const LIKE_REASONS = ['Exactly my stage', 'Right industry', 'Potential customer', 'Want a warm intro']
const PASS_REASONS = ['Not raising yet', 'Wrong industry', 'Too late-stage', 'Already know them']

type FeedbackStripProps = {
  last: { person: Person; dir: SwipeDirection } | null
  onFeedback: (text: string) => void
  onDismiss: () => void
}

export function FeedbackStrip({ last, onFeedback, onDismiss }: FeedbackStripProps) {
  return (
    <div className="min-h-[132px]">
      <AnimatePresence mode="wait">
        {last && <FeedbackCard key={last.person.id} last={last} onFeedback={onFeedback} onDismiss={onDismiss} />}
      </AnimatePresence>
    </div>
  )
}

function FeedbackCard({
  last,
  onFeedback,
  onDismiss,
}: {
  last: { person: Person; dir: SwipeDirection }
  onFeedback: (text: string) => void
  onDismiss: () => void
}) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const firstName = last.person.name.split(' ')[0]
  const reasons = last.dir === 1 ? LIKE_REASONS : PASS_REASONS

  const send = (value: string) => {
    const v = value.trim()
    if (!v) return
    onFeedback(v)
    setSent(true)
    setText('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mx-auto w-full max-w-[400px] rounded-2xl border border-border bg-card/60 p-4 backdrop-blur"
    >
      {sent ? (
        <p className="flex items-center gap-2 font-mono text-xs text-primary">
          <Check className="size-3.5" aria-hidden="true" />
          Saved to memory — Orbit will use this next time.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm">
              <span className="text-muted-foreground">{last.dir === 1 ? 'Connected with' : 'Passed on'}</span>{' '}
              <span className="font-medium">{firstName}</span>
              <span className="text-muted-foreground">. Tell Orbit why?</span>
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss feedback"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => send(r)}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {r}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
            className="flex items-center gap-2 rounded-lg border border-input bg-background/60 px-3 focus-within:border-primary/60"
          >
            <label htmlFor="feedback" className="sr-only">
              Feedback
            </label>
            <input
              id="feedback"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I'm focused on customers before fundraising"
              className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
            />
            <button type="submit" aria-label="Save feedback" className="text-muted-foreground hover:text-primary">
              <CornerDownLeft className="size-3.5" />
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}
