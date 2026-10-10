import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useT } from '../i18n'
import { anchor, explorer, type Receipt } from '../lib/solana'
import { sha256Hex } from '../lib/hash'

export function Ring({ progress, label, sub, onClick, busy, size = 260 }: { progress: number; label: string; sub?: string; onClick?: () => void; busy?: boolean; size?: number }) {
  const r = 46, c = 2 * Math.PI * r
  return (
    <button onClick={onClick} disabled={busy} aria-label={label}
      className="group relative grid place-items-center rounded-full outline-none transition-transform active:scale-[.97] disabled:cursor-progress"
      style={{ width: size, height: size }}>
      <span className="absolute inset-4 rounded-full bg-mint/10 animate-pulse-ring" />
      <span className="absolute inset-4 rounded-full bg-mint/10 animate-pulse-ring [animation-delay:1.2s]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7CF5C4" /><stop offset="1" stopColor="#0E9F8A" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="#0E1513" stroke="#1E2B27" strokeWidth="5" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <svg viewBox="0 0 100 100" className={`absolute inset-6 ${busy ? 'animate-spin-slow [animation-duration:2.5s]' : 'animate-spin-slow'}`}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#34E0A1" strokeOpacity=".25" strokeWidth=".6" strokeDasharray="1 4" />
        <path d="M50 10 A40 40 0 0 1 90 50" fill="none" stroke="#34E0A1" strokeOpacity=".7" strokeWidth="1" />
      </svg>
      <span className="relative z-10 text-center">
        <span className="block text-[13px] font-mono uppercase tracking-[.2em] text-fog">{sub}</span>
        <span className="block text-3xl font-semibold tracking-tight mt-1 group-hover:text-mint transition-colors">{label}</span>
      </span>
    </button>
  )
}

export function Panel({ title, desc, children, back }: { title: string; desc?: string; children: ReactNode; back?: () => void }) {
  const { t } = useT()
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      {back && <button className="btn btn-ghost h-9 mb-6 text-sm" onClick={back}>&larr; {t('back')}</button>}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      {desc && <p className="mt-2 text-fog max-w-2xl">{desc}</p>}
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-fog">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-fog">{hint}</div>}
    </div>
  )
}

// Hash the result object locally, then write only that digest to devnet.
export function AnchorButton({ kind, payload, summary }: { kind: Receipt['kind']; payload: unknown; summary: string }) {
  const { t } = useT()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'err'>('idle')
  const [sig, setSig] = useState('')
  const [err, setErr] = useState('')
  const go = async () => {
    setState('busy'); setErr('')
    try {
      const digest = (await sha256Hex(new TextEncoder().encode(JSON.stringify(payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))))).slice(0, 32)
      setSig(await anchor({ kind, digest, summary }))
      setState('done')
    } catch (e) {
      const m = String((e as Error).message || e)
      setErr(/insufficient|no record|debit|0x1/i.test(m) ? 'The devnet wallet is empty. Fund it from the wallet card first.' : m.slice(0, 160))
      setState('err')
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {state !== 'done' && <button className="btn btn-ghost" onClick={go} disabled={state === 'busy'}>{state === 'busy' ? t('anchoring') : t('anchor')}</button>}
      {state === 'done' && (
        <a className="btn btn-ghost text-mint" href={explorer(sig)} target="_blank" rel="noreferrer">{t('anchored')} &middot; {t('view_tx')} &#8599;</a>
      )}
      {sig && <code className="text-xs text-fog font-mono break-all">{sig.slice(0, 22)}&hellip;</code>}
      {err && <span className="text-sm text-rose">{err}</span>}
    </div>
  )
}

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = root.querySelectorAll('.reveal')
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

export function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const leave = () => { if (ref.current) ref.current.style.transform = '' }
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave}
      className={`relative transition-transform duration-300 ease-out [transform-style:preserve-3d] ${className}`}
      style={{ backgroundImage: 'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), #34E0A114, transparent 60%)' }}>
      {children}
    </div>
  )
}
