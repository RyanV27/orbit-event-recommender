'use client'

import { motion } from 'motion/react'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import type { OrbitEvent, Person } from '@/lib/orbit-types'
import { OrbitCanvas } from './orbit-canvas'

type EventsPanelProps = {
  events: OrbitEvent[]
  people: Person[]
  destination: string
  connections: number
  pulseKey: number
}

export function EventsPanel({ events, people, destination, connections, pulseKey }: EventsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Live orbit" className="relative h-52 overflow-hidden rounded-2xl border border-border bg-card/50">
        <OrbitCanvas compact showLabels={false} pulseKey={pulseKey} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-muted-foreground">Live orbit · {destination}</span>
          <span className="text-primary">{connections} locked</span>
        </div>
      </section>

      <section aria-labelledby="events-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
        <h2 id="events-title" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
          <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
          Where to meet them
        </h2>
        <ul className="flex flex-col gap-2.5">
          {events.map((e, i) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="group rounded-xl border border-border bg-background/40 p-3.5 transition-colors hover:border-primary/40"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {e.source}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{e.date}</span>
              </div>
              <h3 className="text-sm font-medium leading-snug">{e.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                {e.venue}
              </p>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-foreground/75">{e.why}</p>
              <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                <Users className="size-3" aria-hidden="true" />
                {e.matchesAttending} of your matches likely there
              </p>
              {!!e.attendees?.length && (
                <ul className="mt-2 flex flex-col gap-1.5" aria-label={`People likely at ${e.name}`}>
                  {e.attendees.map((name) => {
                    const person = people.find((p) => p.name === name)
                    return (
                      <li key={name} className="flex items-center gap-2 text-xs">
                        <span
                          aria-hidden="true"
                          className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card font-mono text-[10px]"
                        >
                          {name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <span className="min-w-0 truncate">
                          <span className="font-medium">{name}</span>
                          {person && <span className="text-muted-foreground"> · {person.role}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  )
}
