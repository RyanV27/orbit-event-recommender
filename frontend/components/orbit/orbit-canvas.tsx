'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const ACCENT = '214, 250, 82'
const WHITE = '240, 242, 246'
const TAU = Math.PI * 2
const TILT = -0.26
const SQUASH = 0.36
const LABELS = [
  'design partner',
  'investor',
  'cofounder',
  'early hire',
  'mentor',
  'customer',
  'operator',
  'angel',
  'advisor',
]

type OrbitNode = {
  ring: number
  angle: number
  speed: number
  size: number
  accent: boolean
  label: string
  labelled: boolean
  x: number
  y: number
  depth: number
}

type Beam = { node: OrbitNode; born: number; strong: boolean }
type Wave = { born: number; strong: boolean }

type OrbitCanvasProps = {
  className?: string
  scanning?: boolean
  pulseKey?: number
  compact?: boolean
  showLabels?: boolean
  /** Horizontal shift of the system's center (fraction of width), applied on wide screens only. */
  offsetX?: number
}

export function OrbitCanvas({
  className,
  scanning = false,
  pulseKey = 0,
  compact = false,
  showLabels = true,
  offsetX = 0,
}: OrbitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanningRef = useRef(scanning)
  const pulseRef = useRef(pulseKey)

  useEffect(() => {
    scanningRef.current = scanning
  }, [scanning])

  useEffect(() => {
    pulseRef.current = pulseKey
  }, [pulseKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx: CanvasRenderingContext2D = context

    const mono = `${getComputedStyle(document.documentElement).getPropertyValue('--font-geist-mono').trim() || 'ui-monospace'}, monospace`
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0

    const rings = compact ? [0.28, 0.48, 0.7, 0.94] : [0.18, 0.32, 0.48, 0.66, 0.86, 1.08]

    const nodes: OrbitNode[] = []
    rings.forEach((_, i) => {
      const count = compact ? 2 + (i % 2) : 3 + (i % 2)
      const phase = Math.random() * TAU
      for (let k = 0; k < count; k++) {
        nodes.push({
          ring: i,
          angle: phase + (k / count) * TAU + Math.random() * 0.6,
          speed: (0.32 / (i + 1.4)) * (0.8 + Math.random() * 0.4),
          size: 1.4 + Math.random() * 2.2,
          accent: Math.random() < 0.3,
          label: LABELS[nodes.length % LABELS.length],
          labelled: Math.random() < 0.55,
          x: 0,
          y: 0,
          depth: 0,
        })
      }
    })

    const stars = Array.from({ length: compact ? 50 : 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.3,
      p: Math.random() * TAU,
    }))

    const beams: Beam[] = []
    const waves: Wave[] = []
    let seenPulse = pulseRef.current
    let nextBeam = 0.6
    let nextWave = 0
    let sweep = 0
    let mx = 0
    let my = 0
    let tmx = 0
    let tmy = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduceMotion) draw(performance.now(), true)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }

    const cosT = Math.cos(TILT)
    const sinT = Math.sin(TILT)

    const project = (a: number, rx: number, cx: number, cy: number) => {
      const x = Math.cos(a) * rx
      const y = Math.sin(a) * rx * SQUASH
      return { x: cx + x * cosT - y * sinT, y: cy + x * sinT + y * cosT, depth: Math.sin(a) }
    }

    const geometry = () => {
      const R = compact ? Math.min(w * 0.5, h * 1.25) : Math.min(w * 0.52, h * 0.82)
      const shift = !compact && w >= 1024 ? offsetX * w : 0
      return { cx: w / 2 + shift + mx * 18, cy: h / 2 + my * 12, R }
    }

    const drawNode = (n: OrbitNode, cx: number, cy: number, R: number, highlight: number) => {
      const rx = rings[n.ring] * R
      const front = (n.depth + 1) / 2
      const seg = 0.03
      const trailColor = n.accent ? ACCENT : WHITE
      for (let j = 0; j < 14; j++) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, rx * SQUASH, TILT, n.angle - (j + 1) * seg, n.angle - j * seg)
        ctx.strokeStyle = `rgba(${trailColor}, ${(1 - j / 14) * 0.4 * (0.35 + front * 0.65)})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      const scale = 0.6 + front * 0.6
      const r = n.size * scale
      const alpha = 0.35 + front * 0.65

      if (n.accent || highlight > 0) {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 7)
        glow.addColorStop(0, `rgba(${ACCENT}, ${0.35 * alpha + highlight * 0.4})`)
        glow.addColorStop(1, `rgba(${ACCENT}, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 7, 0, TAU)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, TAU)
      ctx.fillStyle = n.accent || highlight > 0 ? `rgba(${ACCENT}, ${alpha})` : `rgba(${WHITE}, ${alpha})`
      ctx.fill()

      if (highlight > 0) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6 + (1 - highlight) * 10, 0, TAU)
        ctx.strokeStyle = `rgba(${ACCENT}, ${highlight * 0.8})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      if (showLabels && n.labelled && n.depth > 0.15) {
        const a = Math.min(1, (n.depth - 0.15) * 2.5) * 0.75
        const lx = n.x + 10
        const ly = n.y - 14
        ctx.beginPath()
        ctx.moveTo(n.x + r + 1, n.y - r - 1)
        ctx.lineTo(lx, ly)
        ctx.lineTo(lx + 8, ly)
        ctx.strokeStyle = `rgba(${WHITE}, ${a * 0.4})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.font = `500 9.5px ${mono}`
        ctx.fillStyle = n.accent ? `rgba(${ACCENT}, ${a})` : `rgba(${WHITE}, ${a * 0.7})`
        ctx.fillText(n.label.toUpperCase(), lx + 11, ly + 3)
      }
    }

    function draw(now: number, still = false) {
      const dt = still ? 0 : Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      const isScanning = scanningRef.current
      const speedMul = isScanning ? 3 : 1

      mx += (tmx - mx) * 0.04
      my += (tmy - my) * 0.04

      ctx.clearRect(0, 0, w, h)
      const { cx, cy, R } = geometry()

      for (const s of stars) {
        const a = 0.12 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.9 + s.p))
        ctx.fillStyle = `rgba(${WHITE}, ${a})`
        ctx.fillRect(s.x * w - mx * 4 * s.r, s.y * h - my * 4 * s.r, s.r, s.r)
      }

      rings.forEach((f, i) => {
        ctx.beginPath()
        ctx.ellipse(cx, cy, f * R, f * R * SQUASH, TILT, 0, TAU)
        ctx.setLineDash(i % 2 ? [2, 7] : [])
        ctx.strokeStyle = `rgba(${WHITE}, ${i % 2 ? 0.16 : 0.08})`
        ctx.lineWidth = 1
        ctx.stroke()
      })
      ctx.setLineDash([])

      const tickRing = rings[rings.length - 2] * R
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * TAU + t * 0.02
        const p1 = project(a, tickRing, cx, cy)
        const p2 = project(a, tickRing * (i % 8 === 0 ? 1.035 : 1.015), cx, cy)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(${WHITE}, ${0.06 + ((p1.depth + 1) / 2) * 0.14})`
        ctx.stroke()
      }

      if (isScanning || sweep > 0) {
        sweep += dt * 2.4
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(TILT)
        ctx.scale(1, SQUASH)
        const outer = rings[rings.length - 1] * R
        const g = ctx.createConicGradient(sweep, 0, 0)
        g.addColorStop(0, `rgba(${ACCENT}, 0)`)
        g.addColorStop(0.8, `rgba(${ACCENT}, 0)`)
        g.addColorStop(1, `rgba(${ACCENT}, ${isScanning ? 0.22 : 0})`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, outer, 0, TAU)
        ctx.fill()
        ctx.restore()
        if (isScanning) {
          const edge = project(sweep, rings[rings.length - 1] * R, cx, cy)
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(edge.x, edge.y)
          ctx.strokeStyle = `rgba(${ACCENT}, 0.55)`
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          sweep = 0
        }
      }

      for (const n of nodes) {
        n.angle += n.speed * dt * speedMul
        const p = project(n.angle, rings[n.ring] * R, cx, cy)
        n.x = p.x
        n.y = p.y
        n.depth = p.depth
      }

      if (!still) {
        if (pulseRef.current !== seenPulse) {
          seenPulse = pulseRef.current
          waves.push({ born: t, strong: true })
          const candidates = nodes.filter((n) => n.depth > -0.2)
          const target = candidates[Math.floor(Math.random() * candidates.length)] ?? nodes[0]
          beams.push({ node: target, born: t, strong: true })
        }
        if (t > nextBeam) {
          nextBeam = t + (isScanning ? 0.25 : 1.4 + Math.random() * 1.2)
          const target = nodes[Math.floor(Math.random() * nodes.length)]
          beams.push({ node: target, born: t, strong: false })
        }
        if (t > nextWave) {
          nextWave = t + (isScanning ? 0.9 : 3.2)
          waves.push({ born: t, strong: false })
        }
      }

      const highlights = new Map<OrbitNode, number>()
      for (const b of beams) {
        const life = b.strong ? 1.6 : 1.1
        const age = (t - b.born) / life
        if (age < 1) highlights.set(b.node, Math.max(highlights.get(b.node) ?? 0, 1 - age))
      }

      const outerR = rings[rings.length - 1] * R
      for (let i = waves.length - 1; i >= 0; i--) {
        const wv = waves[i]
        const life = wv.strong ? 1.8 : 2.8
        const age = (t - wv.born) / life
        if (age >= 1) {
          waves.splice(i, 1)
          continue
        }
        const eased = 1 - Math.pow(1 - age, 3)
        const rx = 8 + eased * outerR
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, rx * SQUASH, TILT, 0, TAU)
        ctx.strokeStyle = `rgba(${ACCENT}, ${(1 - age) * (wv.strong ? 0.7 : 0.18)})`
        ctx.lineWidth = wv.strong ? 1.5 : 1
        ctx.stroke()
      }

      const back = nodes.filter((n) => n.depth < 0)
      const front = nodes.filter((n) => n.depth >= 0).sort((a, b) => a.depth - b.depth)
      for (const n of back) drawNode(n, cx, cy, R, highlights.get(n) ?? 0)

      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i]
        const life = b.strong ? 1.6 : 1.1
        const age = (t - b.born) / life
        if (age >= 1) {
          beams.splice(i, 1)
          continue
        }
        const fade = 1 - age
        const grad = ctx.createLinearGradient(cx, cy, b.node.x, b.node.y)
        grad.addColorStop(0, `rgba(${ACCENT}, 0)`)
        grad.addColorStop(1, `rgba(${ACCENT}, ${fade * (b.strong ? 0.9 : 0.45)})`)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(b.node.x, b.node.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = b.strong ? 1.5 : 1
        ctx.stroke()
        const prog = Math.min(1, age * 2.2)
        const px = cx + (b.node.x - cx) * prog
        const py = cy + (b.node.y - cy) * prog
        ctx.beginPath()
        ctx.arc(px, py, b.strong ? 2.4 : 1.6, 0, TAU)
        ctx.fillStyle = `rgba(${ACCENT}, ${fade})`
        ctx.fill()
      }

      const coreR = compact ? R * 0.12 : R * 0.14
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * (1.6 + pulse * 0.3))
      glow.addColorStop(0, `rgba(${ACCENT}, 0.45)`)
      glow.addColorStop(0.35, `rgba(${ACCENT}, 0.12)`)
      glow.addColorStop(1, `rgba(${ACCENT}, 0)`)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * 2, 0, TAU)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, 9 + pulse * 2, 0, TAU)
      ctx.strokeStyle = `rgba(${ACCENT}, 0.7)`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 15, t * 1.4, t * 1.4 + Math.PI * 0.6)
      ctx.strokeStyle = `rgba(${WHITE}, 0.5)`
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5, 0, TAU)
      ctx.fillStyle = `rgba(${WHITE}, 1)`
      ctx.fill()

      if (showLabels) {
        ctx.font = `600 9px ${mono}`
        ctx.fillStyle = `rgba(${ACCENT}, 0.9)`
        ctx.fillText('YOU', cx + 20, cy + 4)
      }

      for (const n of front) drawNode(n, cx, cy, R, highlights.get(n) ?? 0)

      if (!still && !reduceMotion) raf = requestAnimationFrame((ts) => draw(ts))
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    window.addEventListener('pointermove', onPointer, { passive: true })
    if (reduceMotion) {
      draw(performance.now(), true)
    } else {
      raf = requestAnimationFrame((ts) => draw(ts))
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [compact, showLabels, offsetX])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('block size-full', className)} />
}
