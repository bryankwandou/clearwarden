import { useEffect, useState, type ReactNode } from 'react'
import { useT, type Key } from '../i18n'
import { Ring, Tilt, useReveal } from '../components/kit'
import { Mark } from '../components/Logo'
import { Icon } from './Dashboard'

const APK_URL = 'https://github.com/bryankwandou/clearwarden/raw/main/release/clearwarden-debug.apk'

function DownloadGlyph({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
    </svg>
  )
}

function ApkLink({ className = '' }: { className?: string }) {
  return (
    <a href={APK_URL} className={`btn btn-ghost btn-lift ${className}`} rel="noopener" download>
      <DownloadGlyph />Download APK
    </a>
  )
}

function Eyebrow({ children, tone = 'mint' }: { children: ReactNode; tone?: 'mint' | 'amber' }) {
  return (
    <span className={`eyebrow reveal ${tone === 'amber' ? 'text-amber' : 'text-mint'}`}>
      <span className={`h-px w-6 ${tone === 'amber' ? 'bg-amber/60' : 'bg-mint/60'}`} />{children}
    </span>
  )
}

function PhoneDemo() {
  const { t } = useT()
  const [p, setP] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle')
  const play = () => {
    if (phase === 'run') return
    setPhase('run'); setP(0)
    let v = 0
    const id = setInterval(() => {
      v += 0.025; setP(v)
      if (v >= 1) { clearInterval(id); setPhase('done') }
    }, 40)
  }
  useEffect(() => { const id = setTimeout(play, 900); return () => clearTimeout(id) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const rows: [Key, number][] = [['clean', 0.33], ['scan', 0.66], ['boost', 1]]
  return (
    <div className="animate-float">
      <div className="tilt-wrap">
        <Tilt className="rounded-[44px]">
          <div className="relative mx-auto w-[288px] h-[580px] sm:w-[300px] sm:h-[600px] rounded-[44px] border border-line bg-ink-2 p-3 shadow-[0_40px_120px_-40px_#34E0A166,inset_0_1px_0_#ffffff10]">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-ink z-10" />
            <div className="relative h-full rounded-[34px] bg-ink overflow-hidden flex flex-col items-center pt-14 px-5">
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-mint/10 to-transparent" />
              {phase === 'run' && <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-mint/10 to-transparent [animation:scanline_1.6s_linear_infinite]" />}
              <Ring size={200} progress={p} label={phase === 'done' ? t('ring_done') : phase === 'run' ? t('ring_run') : t('ring_idle')} sub="demo" onClick={play} busy={phase === 'run'} />
              <div className="mt-8 w-full space-y-2">
                {rows.map(([k, at]) => (
                  <div key={k} className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-500 ${p >= at ? 'border-mint/50 bg-mint/10' : 'border-line'}`}>
                    <span className="flex items-center gap-3 text-sm"><span className={p >= at ? 'text-mint' : 'text-fog'}><Icon name={k} className="w-4 h-4" /></span>{t(k)}</span>
                    <span className={`text-xs font-mono ${p >= at ? 'text-mint' : 'text-fog'}`}>{p >= at ? 'OK' : '--'}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-4 w-full rounded-2xl border border-amber/40 bg-amber/5 px-4 py-3 text-xs font-mono transition-all duration-700 ${phase === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <span className="text-amber">receipt</span> 4kZq&hellip;9fTn <span className="text-fog">devnet</span>
              </div>
            </div>
          </div>
        </Tilt>
      </div>
    </div>
  )
}

const MARQUEE = ['SHA-256 hashing', 'EICAR self-test', 'AES-256-GCM vault', 'WebAuthn biometrics', 'Perceptual photo hashing', 'Malware-filtering DNS', 'Cloudflare speed edge', 'Solana Memo receipts', 'No account needed', 'Nothing uploaded']
const HERO_FACTS = ['No account needed', 'Nothing uploaded', 'Solana Memo receipts']

export function Landing() {
  const { t } = useT()
  const ref = useReveal()
  const [open, setOpen] = useState<number | null>(0)
  const features: [string, Key, Key][] = [['sweep', 't_sweep', 't_sweep_d'], ['dupes', 't_dupes', 't_dupes_d'], ['speed', 't_speed', 't_speed_d'], ['url', 't_url', 't_url_d'], ['vault', 't_vault', 't_vault_d'], ['usage', 't_usage', 't_usage_d']]
  const web = ['Scan files and whole folders', 'Delete junk, WhatsApp media, APKs', 'Find duplicate photos', 'Encrypted vault with biometrics', 'Speed test and link check', 'Receipts on Solana devnet']
  const apk = ['Clear other apps’ caches', 'Block spam calls', 'Hide installed apps', 'Always-on DNS filter', 'Game mode overlay', 'Root detection']
  const faqs: [Key, Key][] = [['f1q', 'f1a'], ['f2q', 'f2a'], ['f3q', 'f3a'], ['f4q', 'f4a']]
  const d = (ms: number) => ({ transitionDelay: `${ms}ms` })

  return (
    <div ref={ref} className="overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-[min(1100px,180vw)] aspect-square rounded-full bg-[radial-gradient(circle,#34E0A11f,transparent_60%)] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/3 -right-40 w-[520px] aspect-square rounded-full bg-[radial-gradient(circle,#F6C4530d,transparent_65%)] pointer-events-none hidden lg:block" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.15fr_.85fr] gap-14 lg:gap-10 items-center">
          <div className="min-w-0">
            <span className="reveal inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-ink-2/70 backdrop-blur px-3 py-1.5 text-xs font-mono text-fog">
              <span className="relative flex w-1.5 h-1.5 shrink-0"><span className="absolute inset-0 rounded-full bg-mint animate-ping opacity-60" /><span className="relative w-1.5 h-1.5 rounded-full bg-mint" /></span>
              <span className="truncate">{t('hero_kicker')}</span>
            </span>
            <h1 className="reveal mt-6 text-[2.35rem] sm:text-5xl lg:text-[3.6rem] font-semibold tracking-[-0.03em] leading-[1.06] text-balance lg:text-pretty" style={d(80)}>{t('hero_title')}</h1>
            <p className="reveal mt-6 text-base sm:text-lg text-fog max-w-xl leading-relaxed text-pretty" style={d(160)}>{t('hero_sub')}</p>
            <div className="reveal mt-9 flex flex-col sm:flex-row sm:flex-wrap gap-3" style={d(240)}>
              <a href="#/app" className="btn btn-primary btn-lift btn-lg group">{t('hero_cta')}<span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span></a>
              <ApkLink className="btn-lg" />
            </div>
            <a href="#proof" className="reveal link-underline mt-5 inline-flex items-center gap-2 text-sm text-fog hover:text-paper" style={d(300)}>{t('hero_cta2')}<span aria-hidden="true">&darr;</span></a>
            <ul className="reveal mt-10 pt-6 border-t border-line/70 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-fog" style={d(360)}>
              {HERO_FACTS.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-mint" aria-hidden="true">&#10003;</span>{f}</li>)}
            </ul>
          </div>
          <div className="reveal flex justify-center lg:justify-end" style={d(200)}><PhoneDemo /></div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-line bg-ink-2/40 py-4 overflow-hidden marquee-mask" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-10 font-mono text-sm text-fog hover:[animation-play-state:paused]">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} className="flex items-center gap-10 whitespace-nowrap">{m}<span className="text-mint/70">/</span></span>)}
        </div>
      </div>

      {/* How + features */}
      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-24 lg:py-32">
        <Eyebrow>{t('nav_how')}</Eyebrow>
        <h2 className="reveal mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.025em] leading-[1.08] max-w-2xl text-balance">{t('how_title')}</h2>
        <p className="reveal mt-4 text-fog max-w-xl leading-relaxed">{t('how_sub')}</p>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {(['clean', 'scan', 'boost'] as const).map((k, i) => (
            <div key={k} className="reveal" style={d(i * 90)}>
              <div className="tilt-wrap h-full">
                <Tilt className="card card-hover h-full">
                  <div className="p-7">
                    <div className="flex items-center justify-between">
                      <span className="icon-tile w-12 h-12"><Icon name={k} className="w-6 h-6" /></span>
                      <span className="font-mono text-xs text-fog">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold tracking-tight">{t(k)}</h3>
                    <p className="mt-2 text-fog text-sm leading-relaxed">{t(`${k}_d` as Key)}</p>
                  </div>
                </Tilt>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(([ic, h, dd], i) => (
            <div key={ic} className="reveal" style={d((i % 3) * 70)}>
              <div className="card card-hover h-full p-6">
                <span className="icon-tile w-10 h-10"><Icon name={ic} /></span>
                <h3 className="mt-5 font-semibold text-lg tracking-tight">{t(h)}</h3>
                <p className="mt-1.5 text-sm text-fog leading-relaxed">{t(dd)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section id="proof" className="scroll-mt-20 relative border-y border-line bg-ink-2/60">
        <div className="hero-grid absolute inset-0 pointer-events-none opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 lg:py-32 grid lg:grid-cols-2 gap-14 items-center">
          <div className="min-w-0">
            <Eyebrow tone="amber">{t('nav_proof')}</Eyebrow>
            <h2 className="reveal mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.025em] leading-[1.08] text-balance">{t('proof_title')}</h2>
            <p className="reveal mt-5 text-fog leading-relaxed">{t('proof_sub')}</p>
            <ol className="relative mt-10 space-y-7">
              <span className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-mint/50 via-line to-transparent" aria-hidden="true" />
              {([['proof_1', 'proof_1d'], ['proof_2', 'proof_2d'], ['proof_3', 'proof_3d']] as [Key, Key][]).map(([h, dd], i) => (
                <li key={h} className="reveal relative flex gap-4" style={d(i * 100)}>
                  <span className="shrink-0 w-8 h-8 rounded-full border border-mint/50 bg-ink text-mint grid place-items-center font-mono text-sm">{i + 1}</span>
                  <div className="pt-1"><h3 className="font-semibold">{t(h)}</h3><p className="text-sm text-fog mt-1 leading-relaxed">{t(dd)}</p></div>
                </li>
              ))}
            </ol>
            <a href="#/verify" className="reveal btn btn-ghost btn-lift mt-10 group">{t('nav_verify')}<span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span></a>
          </div>
          <div className="reveal min-w-0" style={d(120)}>
            <ReceiptFlow />
          </div>
        </div>
      </section>

      {/* Web vs APK */}
      <section className="mx-auto max-w-6xl px-4 py-24 lg:py-32">
        <Eyebrow>{t('nav_android')}</Eyebrow>
        <h2 className="reveal mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.025em] leading-[1.08] max-w-3xl text-balance">{t('honest_title')}</h2>
        <p className="reveal mt-4 text-fog max-w-2xl leading-relaxed">{t('honest_sub')}</p>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="reveal">
            <div className="card card-accent-mint h-full p-7">
              <h3 className="flex items-center gap-2 text-mint font-mono text-sm uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-mint" />{t('honest_web')}</h3>
              <ul className="mt-6 space-y-3.5">{web.map((w) => <li key={w} className="flex gap-3 text-sm"><span className="text-mint" aria-hidden="true">&#10003;</span>{w}</li>)}</ul>
              <a href="#/app" className="link-underline mt-7 inline-block text-sm text-mint">{t('nav_app')} &rarr;</a>
            </div>
          </div>
          <div className="reveal" style={d(100)}>
            <div className="card card-accent-amber h-full p-7">
              <h3 className="flex items-center gap-2 text-amber font-mono text-sm uppercase tracking-widest"><span className="w-2 h-2 rounded-full border border-amber" />{t('honest_apk')}</h3>
              <ul className="mt-6 space-y-3.5">{apk.map((w) => <li key={w} className="flex gap-3 text-sm text-fog"><span className="text-amber" aria-hidden="true">&#9675;</span>{w}</li>)}</ul>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a href={APK_URL} className="link-underline inline-flex items-center gap-2 text-sm text-amber" rel="noopener" download><DownloadGlyph />Download APK</a>
                <a href="#/app/native" className="link-underline text-sm text-fog hover:text-paper">How each one works on Android</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24 lg:pb-32">
        <h2 className="reveal text-3xl md:text-4xl font-semibold tracking-[-0.025em]">{t('faq_title')}</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className="reveal" style={d(i * 60)}>
                <div className={`card faq-card ${isOpen ? 'is-open' : ''}`}>
                  <button id={`faq-q-${i}`} className="w-full flex justify-between items-center gap-4 px-5 sm:px-6 py-5 text-left font-medium rounded-[20px]" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-a-${i}`}>
                    <span>{t(q)}</span>
                    <span className={`shrink-0 grid place-items-center w-8 h-8 rounded-full border text-lg leading-none transition-all duration-300 ${isOpen ? 'rotate-45 border-mint/60 text-mint bg-mint/10' : 'border-line text-fog'}`} aria-hidden="true">+</span>
                  </button>
                  <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`grid transition-[grid-template-rows] duration-500 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <p className="overflow-hidden px-5 sm:px-6 text-fog text-sm leading-relaxed">{t(a)}<span className="block h-5" /></p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 lg:pb-32">
        <div className="reveal card relative overflow-hidden px-6 py-12 sm:p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#34E0A133,transparent_60%)]" aria-hidden="true" />
          <div className="hero-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto w-fit animate-float"><Mark size={64} /></div>
            <h2 className="mt-6 text-3xl md:text-5xl font-semibold tracking-[-0.025em] shimmer-text">{t('hero_cta')}</h2>
            <p className="mt-4 text-fog max-w-md mx-auto leading-relaxed">No sign-up. Nothing leaves your device except a hash you choose to publish.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <a href="#/app" className="btn btn-primary btn-lift btn-lg btn-wide group">{t('nav_app')}<span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span></a>
              <ApkLink className="btn-lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ReceiptFlow() {
  const [i, setI] = useState(0)
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % 4), 1600); return () => clearInterval(id) }, [])
  const steps = [
    ['Result', '{ files: 214, flagged: 1 }'],
    ['SHA-256', '9c1e5b0f4a7d22e8…'],
    ['Memo tx', 'cw1|scan|9c1e5b0f…|214f/1flag'],
    ['Devnet', 'slot 412,883,190 confirmed'],
  ]
  return (
    <div className="card p-5 sm:p-6 font-mono text-sm shadow-[0_40px_100px_-50px_#34E0A155]">
      <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-widest text-fog">
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber" />receipt flow</span>
        <span>{i + 1}/4</span>
      </div>
      {steps.map(([h, v], k) => (
        <div key={h}>
          <div className={`rounded-xl border px-4 py-3 transition-all duration-500 ${k <= i ? 'border-mint/50 bg-mint/[.06]' : 'border-line opacity-50'} ${k === i ? 'shadow-[0_0_0_4px_#34E0A112]' : ''}`}>
            <div className="text-[11px] uppercase tracking-widest text-fog">{h}</div>
            <div className={`mt-1 truncate ${k <= i ? 'text-paper' : 'text-fog'}`}>{v}</div>
          </div>
          {k < steps.length - 1 && <div className="ml-6 h-6 w-px bg-line relative overflow-hidden"><span className={`absolute inset-x-0 top-0 h-full bg-mint transition-transform duration-500 origin-top ${k < i ? 'scale-y-100' : 'scale-y-0'}`} /></div>}
        </div>
      ))}
      <p className="mt-5 text-xs text-fog font-sans">Illustration. Real receipts show up on the Verify page after you save one.</p>
    </div>
  )
}
