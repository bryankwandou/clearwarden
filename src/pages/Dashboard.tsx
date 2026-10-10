import { useState } from 'react'
import { useT, type Key } from '../i18n'
import { AnchorButton, Ring, Tilt } from '../components/kit'
import { WalletCard } from './tools'
import { cleanSiteData, snapshot, type Snapshot } from '../lib/clean'
import { scanFile, EICAR, type ScanResult } from '../lib/scan'
import { formatBytes } from '../lib/hash'

const ICONS: Record<string, string> = {
  clean: 'M4 20h16M7 20l1.5-9h7L17 20M9 11V5a3 3 0 0 1 6 0v6',
  scan: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  boost: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  sweep: 'M3 7h18M6 7l1 13h10l1-13M9 7V4h6v3',
  dupes: 'M8 8h12v12H8zM4 16V4h12',
  speed: 'M12 14l4-4M3 14a9 9 0 0 1 18 0M12 14h.01',
  url: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  vault: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  usage: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  native: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
}
export function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[name]} /></svg>
}

interface Run { clean?: { freed: number; cachesRemoved: number }; scan?: ScanResult; boost?: Snapshot }

export function Dashboard() {
  const { t } = useT()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [run, setRun] = useState<Run>({})
  const oneTap = async () => {
    setBusy(true); setRun({}); setStep(0)
    const r: Run = {}
    await new Promise((x) => setTimeout(x, 300))
    r.clean = await cleanSiteData(); setStep(1); setRun({ ...r })
    // Self-test: proves the scanner is live by catching the EICAR test string in memory.
    r.scan = await scanFile(new File([EICAR], 'self-test.com')); setStep(2); setRun({ ...r })
    r.boost = await snapshot(); setStep(3); setRun({ ...r })
    setBusy(false)
  }
  const label = busy ? t('ring_run') : step === 3 ? t('ring_done') : t('ring_idle')
  const tiles: [string, Key, Key, string][] = [
    ['clean', 'clean', 'clean_d', '#/app/sweep'],
    ['scan', 'scan', 'scan_d', '#/app/scan'],
    ['boost', 'boost', 'boost_d', '#/app/boost'],
  ]
  const adv: [string, Key, Key, string][] = [
    ['sweep', 't_sweep', 't_sweep_d', '#/app/sweep'],
    ['dupes', 't_dupes', 't_dupes_d', '#/app/dupes'],
    ['speed', 't_speed', 't_speed_d', '#/app/speed'],
    ['url', 't_url', 't_url_d', '#/app/scan'],
    ['vault', 't_vault', 't_vault_d', '#/app/vault'],
    ['usage', 't_usage', 't_usage_d', '#/app/speed'],
    ['native', 't_native', 't_native_d', '#/app/native'],
  ]
  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <WalletCard />
      <div className="flex flex-col items-center py-10">
        <Ring size={260} progress={step / 3} label={label} sub={busy ? `${step}/3` : 'one tap'} busy={busy} onClick={oneTap} />
        {step === 3 && run.scan && run.boost && run.clean && (
          <div className="mt-8 w-full max-w-xl card p-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-fog">{t('clean')}</span><span>{run.clean.cachesRemoved} cache stores, {formatBytes(run.clean.freed)} freed</span></div>
            <div className="flex justify-between"><span className="text-fog">{t('scan')}</span><span className={run.scan.verdict === 'malicious' ? 'text-mint' : 'text-rose'}>{run.scan.verdict === 'malicious' ? `Engine live, test caught in ${run.scan.ms.toFixed(0)} ms` : 'Engine self-test failed'}</span></div>
            <div className="flex justify-between"><span className="text-fog">{t('boost')}</span><span>{run.boost.memoryGB ?? '?'} GB RAM, {run.boost.cores ?? '?'} threads, {formatBytes(run.boost.usage)} site data</span></div>
            <p className="text-xs text-fog pt-2">To scan your own files or clear a folder, open Scan or Clean below.</p>
            <div className="pt-2"><AnchorButton kind="checkup" payload={run} summary={`c${run.clean.cachesRemoved}/s${run.scan.verdict[0]}/r${run.boost.memoryGB ?? 'x'}`} /></div>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {tiles.map(([ic, h, d, href], i) => (
          <a key={ic} href={href} className="block reveal in" style={{ transitionDelay: `${i * 80}ms` }}>
            <Tilt className="card card-hover p-6 h-full">
              <span className={`grid place-items-center w-11 h-11 rounded-2xl ${step > i ? 'bg-mint text-ink' : 'bg-mint/10 text-mint'} transition-colors`}><Icon name={ic} /></span>
              <h2 className="mt-4 text-xl font-semibold">{t(h)}</h2>
              <p className="mt-1 text-sm text-fog">{t(d)}</p>
            </Tilt>
          </a>
        ))}
      </div>
      <h2 className="mt-14 mb-4 text-sm font-mono uppercase tracking-widest text-fog">{t('adv_title')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {adv.map(([ic, h, d, href]) => (
          <a key={ic} href={href} className="card card-hover p-4 block">
            <span className={ic === 'native' ? 'text-amber' : 'text-mint'}><Icon name={ic} /></span>
            <h3 className="mt-3 font-semibold">{t(h)}</h3>
            <p className="mt-1 text-xs text-fog leading-relaxed">{t(d)}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
