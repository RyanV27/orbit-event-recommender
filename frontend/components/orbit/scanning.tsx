'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Check, ChevronRight } from 'lucide-react'
import type { Memory } from '@/lib/orbit-types'

type ScanningProps = { destination: string; memory: Memory }

export function Scanning({ destination, memory }: ScanningProps) {
  const lines = useMemo(() => {
    const liked = memory.signals.filter((s) => s.kind === 'liked').length
    const feedback = memory.signals.filter((s) => s.kind === 'feedback').length
    return [
      memory.profile ? 'retrieving long-term memory · mem0' : 'initializing founder memory · mem0',
      memory.profile ? `recalled: ${memory.profile.startup.toLowerCase()}` : 'parsing startup, stage & goals',
      liked || feedback ? `replaying ${liked} likes · ${feedback} feedback notes` : 'establishing preference baseline',
      `scanning founder graph · ${destination.toLowerCase()}`,
      'ranking by stage fit & goal alignment',
      'cross-referencing luma · eventbrite · partiful',
      'writing explanations for each match',
    ]
  }, [destination, memory])

  const [visible, setVisible] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => Math.min(v + 1, lines.length)), 620)
    return () => clearInterval(id)
  }, [lines.length])

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-end px-5 pb-16 md:pb-20" role="status" aria-live="polite">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-5 font-mono text-xs shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
          <span className="text-primary">Computing orbit</span>
          <span className="text-muted-foreground">{destination}</span>
        </div>
        <ul className="flex flex-col gap-2">
          {lines.slice(0, visible).map((line, i) => {
            const done = i < visible - 1
            return (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5"
              >
                {done ? (
                  <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-3 shrink-0 text-foreground" aria-hidden="true" />
                )}
                <span className={done ? 'text-muted-foreground' : 'text-foreground'}>{line}</span>
                {!done && <span aria-hidden="true" className="h-3 w-1.5 animate-blink bg-primary" />}
              </motion.li>
            )
          })}
        </ul>
        <div className="mt-5 h-px overflow-hidden bg-border">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(visible / lines.length) * 92}%` }}
            transition={{ ease: 'easeOut', duration: 0.6 }}
          />
        </div>
      </motion.div>
    </div>
  )
}
