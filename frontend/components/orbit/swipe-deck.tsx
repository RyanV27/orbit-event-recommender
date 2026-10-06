'use client'

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { MapPin, Sparkles } from 'lucide-react'
import type { Person } from '@/lib/orbit-types'

export type SwipeDirection = 1 | -1

const CATEGORY_LABEL: Record<Person['category'], string> = {
  customer: 'Potential customer',
  investor: 'Investor',
  founder: 'Founder',
  operator: 'Operator',
  mentor: 'Mentor',
  hire: 'Early hire',
}

type SwipeDeckProps = {
  people: Person[]
  index: number
  direction: SwipeDirection
  onSwipe: (dir: SwipeDirection) => void
}

export function SwipeDeck({ people, index, direction, onSwipe }: SwipeDeckProps) {
  const visible = people.slice(index, index + 3)

  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[400px]">
      <AnimatePresence custom={direction}>
        {visible
          .map((person, depth) => (
            <DeckCard
              key={person.id}
              person={person}
              depth={depth}
              position={index + depth + 1}
              total={people.length}
              onSwipe={onSwipe}
            />
          ))
          .reverse()}
      </AnimatePresence>
    </div>
  )
}

type DeckCardProps = {
  person: Person
  depth: number
  position: number
  total: number
  onSwipe: (dir: SwipeDirection) => void
}

function DeckCard({ person, depth, position, total, onSwipe }: DeckCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const likeOpacity = useTransform(x, [24, 130], [0, 1])
  const passOpacity = useTransform(x, [-130, -24], [1, 0])
  const isTop = depth === 0

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 650) onSwipe(1)
    else if (info.offset.x < -120 || info.velocity.x < -650) onSwipe(-1)
  }

  return (
    <motion.article
      aria-hidden={!isTop}
      aria-label={isTop ? `${person.name}, ${person.role} at ${person.company}` : undefined}
      className="absolute inset-0 touch-pan-y select-none"
      style={{ x, rotate, zIndex: 10 - depth }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ scale: 0.88, y: 60, opacity: 0 }}
      animate={{
        scale: 1 - depth * 0.05,
        y: depth * 18,
        opacity: depth > 1 ? 0.5 : 1,
        transition: { type: 'spring', stiffness: 260, damping: 26 },
      }}
      exit={'exit'}
      variants={{
        exit: (dir: SwipeDirection) => ({
          x: dir * 680,
          rotate: dir * 26,
          opacity: 0,
          transition: { duration: 0.45, ease: [0.32, 0, 0.67, 0] },
        }),
      }}
    >
      <div className="relative flex h-full cursor-grab flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/60">
        <div aria-hidden="true" className="tech-grid pointer-events-none absolute inset-x-0 top-0 h-56 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-5 top-5 z-10 -rotate-12 rounded-lg border-2 border-primary px-3 py-1 font-mono text-sm font-bold tracking-widest text-primary"
        >
          CONNECT
        </motion.div>
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute right-5 top-5 z-10 rotate-12 rounded-lg border-2 border-destructive px-3 py-1 font-mono text-sm font-bold tracking-widest text-destructive"
        >
          PASS
        </motion.div>

        <div className="relative flex items-start justify-between p-6 pb-0">
          <Avatar name={person.name} />
          <MatchRing score={person.matchScore} />
        </div>

        <div className="relative flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              {CATEGORY_LABEL[person.category] ?? person.category}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">{person.name}</h2>
            <p className="text-sm text-muted-foreground">
              {person.role} · <span className="text-foreground/80">{person.company}</span>
            </p>
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <MapPin className="size-3" aria-hidden="true" />
              {person.neighborhood}
            </p>
          </div>

          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {person.tags.map((tag) => (
              <li key={tag} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                {tag}
              </li>
            ))}
          </ul>

          <div className="relative rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3" aria-hidden="true" />
              Why Orbit picked them
            </p>
            <p className="text-pretty text-sm leading-relaxed text-foreground/90">{person.why}</p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5" title={person.signal}>
              <span className="size-1.5 shrink-0 rotate-45 bg-primary" aria-hidden="true" />
              <span className="truncate">{person.signal}</span>
            </span>
            <span className="shrink-0">
              {String(position).padStart(2, '0')}/{String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return (
    <div className="relative grid size-16 place-items-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-foreground/20" />
      <div className="absolute inset-0 animate-orbit">
        <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
      </div>
      <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-secondary to-background ring-1 ring-border">
        <span className="font-mono text-sm font-semibold tracking-wider">{initials}</span>
      </div>
    </div>
  )
}

function MatchRing({ score }: { score: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-16 place-items-center" aria-label={`${score}% match`} role="img">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="2" className="stroke-border" />
        <motion.circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="font-mono text-base font-semibold">{score}</span>
        <span className="mt-0.5 font-mono text-[8px] tracking-widest text-muted-foreground">MATCH</span>
      </div>
    </div>
  )
}
