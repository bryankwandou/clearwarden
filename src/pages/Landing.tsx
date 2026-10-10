import { useEffect, useState } from 'react'
import { useT, type Key } from '../i18n'
import { Ring, Tilt, useReveal } from '../components/kit'
import { Mark } from '../components/Logo'
import { Icon } from './Dashboard'

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
    <Tilt className="animate-float">
      <div className="relative mx-auto w-[300px] h-[600px] rounded-[44px] border border-line bg-ink-2 p-3 shadow-[0_40px_120px_-40px_#34E0A166]">
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
  )
}

const MARQUEE = ['SHA-256 hashing', 'EICAR self-test', 'AES-256-GCM vault', 'WebAuthn biometrics', 'Perceptual photo hashing', 'Malware-filtering DNS', 'Cloudflare speed edge', 'Solana Memo receipts', 'No account needed', 'Nothing uploaded']

export function Landing() {
  const { t } = useT()
  const ref = useReveal()
  const [open, setOpen] = useState<number | null>(0)
  const features: [string, Key, Key][] = [['sweep', 't_sweep', 't_sweep_d'], ['dupes', 't_dupes', 't_dupes_d'], ['speed', 't_speed', 't_speed_d'], ['url', 't_url', 't_url_d'], ['vault', 't_vault', 't_vault_d'], ['usage', 't_usage', 't_usage_d']]
  const web = ['Scan files and whole folders', 'Delete junk, WhatsApp media, APKs', 'Find duplicate photos', 'Encrypted vault with biometrics', 'Speed test and link check', 'Receipts on Solana devnet']
  const apk = ['Clear other apps’ caches', 'Block spam calls', 'Hide installed apps', 'Always-on DNS filter', 'Game mode overlay', 'Root detection']
  const faqs: [Key, Key][] = [['f1q', 'f1a'], ['f2q', 'f2a'], ['f3q', 'f3a'], ['f4q', 'f4a']]

  return (
    <div ref={ref}>
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,#34E0A122,transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
          <div>
            <span className="reveal inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-mono text-fog"><span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />{t('hero_kicker')}</span>
            <h1 className="reveal mt-6 text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.04]" style={{ transitionDelay: '80ms' }}>{t('hero_title')}</h1>
            <p className="reveal mt-6 text-lg text-fog max-w-xl leading-relaxed" style={{ transitionDelay: '160ms' }}>{t('hero_sub')}</p>
            <div className="reveal mt-8 flex flex-wrap gap-3" style={{ transitionDelay: '240ms' }}>
              <a href="#/app" className="btn btn-primary h-12 px-6 text-base">{t('hero_cta')} &rarr;</a>
              <a href="#proof" className="btn btn-ghost h-12 px-6 text-base">{t('hero_cta2')}</a>
            </div>
          </div>
          <div className="reveal" style={{ transitionDelay: '200ms' }}><PhoneDemo /></div>
        </div>
      </section>

      <div className="border-y border-line py-4 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 font-mono text-sm text-fog">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} className="flex items-center gap-10">{m}<span className="text-mint">/</span></span>)}
        </div>
      </div>

      <section id="how" className="mx-auto max-w-6xl px-4 py-28">
        <h2 className="reveal text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl">{t('how_title')}</h2>
        <p className="reveal mt-4 text-fog max-w-xl">{t('how_sub')}</p>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {(['clean', 'scan', 'boost'] as const).map((k, i) => (
            <Tilt key={k} className="reveal card card-hover p-7" >
              <span className="font-mono text-xs text-fog">0{i + 1}</span>
              <span className="mt-6 grid place-items-center w-12 h-12 rounded-2xl bg-mint/10 text-mint"><Icon name={k} className="w-6 h-6" /></span>
              <h3 className="mt-5 text-2xl font-semibold">{t(k)}</h3>
              <p className="mt-2 text-fog text-sm leading-relaxed">{t(`${k}_d` as Key)}</p>
            </Tilt>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(([ic, h, d], i) => (
            <div key={ic} className="reveal card card-hover p-6" style={{ transitionDelay: `${i * 60}ms` }}>
              <span className="text-mint"><Icon name={ic} /></span>
              <h3 className="mt-4 font-semibold text-lg">{t(h)}</h3>
              <p className="mt-1 text-sm text-fog leading-relaxed">{t(d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="proof" className="relative border-y border-line bg-ink-2/60">
        <div className="mx-auto max-w-6xl px-4 py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="reveal text-3xl md:text-5xl font-semibold tracking-tight">{t('proof_title')}</h2>
            <p className="reveal mt-5 text-fog leading-relaxed">{t('proof_sub')}</p>
            <div className="mt-10 space-y-6">
              {([['proof_1', 'proof_1d'], ['proof_2', 'proof_2d'], ['proof_3', 'proof_3d']] as [Key, Key][]).map(([h, d], i) => (
                <div key={h} className="reveal flex gap-4" style={{ transitionDelay: `${i * 100}ms` }}>
                  <span className="shrink-0 w-8 h-8 rounded-full border border-mint/50 text-mint grid place-items-center font-mono text-sm">{i + 1}</span>
                  <div><h3 className="font-semibold">{t(h)}</h3><p className="text-sm text-fog mt-1">{t(d)}</p></div>
                </div>
              ))}
            </div>
            <a href="#/verify" className="reveal btn btn-ghost mt-10">{t('nav_verify')} &rarr;</a>
          </div>
          <div className="reveal">
            <ReceiptFlow />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-28">
        <h2 className="reveal text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl">{t('honest_title')}</h2>
        <p className="reveal mt-4 text-fog max-w-2xl">{t('honest_sub')}</p>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="reveal card p-7">
            <h3 className="text-mint font-mono text-sm uppercase tracking-widest">{t('honest_web')}</h3>
            <ul className="mt-5 space-y-3">{web.map((w) => <li key={w} className="flex gap-3 text-sm"><span className="text-mint">&#10003;</span>{w}</li>)}</ul>
          </div>
          <div className="reveal card p-7" style={{ transitionDelay: '100ms' }}>
            <h3 className="text-amber font-mono text-sm uppercase tracking-widest">{t('honest_apk')}</h3>
            <ul className="mt-5 space-y-3">{apk.map((w) => <li key={w} className="flex gap-3 text-sm text-fog"><span className="text-amber">&#9675;</span>{w}</li>)}</ul>
            <a href="#/app/native" className="mt-6 inline-block text-sm text-amber underline underline-offset-4">How each one works on Android</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-28">
        <h2 className="reveal text-3xl font-semibold tracking-tight">{t('faq_title')}</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map(([q, a], i) => (
            <div key={q} className="reveal">
              <button className="w-full flex justify-between items-center py-5 text-left font-medium" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {t(q)}<span className={`text-mint text-xl transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-500 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <p className="overflow-hidden text-fog text-sm leading-relaxed pb-0">{t(a)}<span className="block h-5" /></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-28">
        <div className="reveal card relative overflow-hidden p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#34E0A133,transparent_60%)]" />
          <div className="relative">
            <div className="mx-auto w-fit animate-float"><Mark size={64} /></div>
            <h2 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight shimmer-text">{t('hero_cta')}</h2>
            <p className="mt-4 text-fog">No sign-up. Nothing leaves your device except a hash you choose to publish.</p>
            <a href="#/app" className="btn btn-primary h-12 px-8 text-base mt-8">{t('nav_app')} &rarr;</a>
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
    <div className="card p-6 font-mono text-sm">
      {steps.map(([h, v], k) => (
        <div key={h}>
          <div className={`rounded-xl border px-4 py-3 transition-all duration-500 ${k <= i ? 'border-mint/50 bg-mint/[.06]' : 'border-line opacity-50'}`}>
            <div className="text-[11px] uppercase tracking-widest text-fog">{h}</div>
            <div className={`mt-1 truncate ${k <= i ? 'text-paper' : 'text-fog'}`}>{v}</div>
          </div>
          {k < steps.length - 1 && <div className="ml-6 h-6 w-px bg-line relative overflow-hidden"><span className={`absolute inset-x-0 top-0 h-full bg-mint transition-transform duration-500 origin-top ${k < i ? 'scale-y-100' : 'scale-y-0'}`} /></div>}
        </div>
      ))}
      <p className="mt-4 text-[11px] text-fog font-sans">Illustration. Real receipts show up on the Verify page after you save one.</p>
    </div>
  )
}
