import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { AnchorButton, Panel, Stat } from '../components/kit'
import { formatBytes } from '../lib/hash'
import { EICAR, checkDomain, scanFile, type ScanResult } from '../lib/scan'
import { PRESETS, pickFolder, removeEntry, supportsFolders, walk, type Entry, type Preset } from '../lib/sweep'
import { dHash, group } from '../lib/dupes'
import { runSpeedTest, type Speed } from '../lib/speed'
import { cleanSiteData, sessionTraffic, snapshot, type Snapshot } from '../lib/clean'
import * as V from '../lib/vault'
import { addressUrl, airdrop, balance, burner, explorer, readReceipt, receipts } from '../lib/solana'

const go = (h: string) => { location.hash = h }

export function WalletCard() {
  const { t } = useT()
  const [bal, setBal] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const pk = burner().publicKey.toBase58()
  const refresh = () => balance().then(setBal).catch(() => setBal(null))
  useEffect(() => { refresh() }, [])
  const fund = async () => {
    setBusy(true); setMsg('')
    try { await airdrop(); await refresh() } catch {
      setMsg('The public devnet faucet is rate limited right now. Paste the address into faucet.solana.com and try again.')
    }
    setBusy(false)
  }
  return (
    <div className="card p-4 flex flex-wrap items-center gap-4 justify-between">
      <div className="min-w-0">
        <div className="text-xs font-mono uppercase tracking-widest text-fog">{t('wallet')}</div>
        <a className="font-mono text-sm hover:text-mint break-all" href={addressUrl(pk)} target="_blank" rel="noreferrer">{pk.slice(0, 6)}&hellip;{pk.slice(-6)}</a>
        <span className="ml-3 text-sm tabular-nums">{bal === null ? '...' : `${bal.toFixed(3)} SOL`}</span>
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn btn-ghost h-9 text-sm" onClick={() => navigator.clipboard?.writeText(pk)}>Copy</button>
        <button className="btn btn-primary h-9 text-sm" onClick={fund} disabled={busy}>{busy ? t('funding') : t('fund')}</button>
      </div>
      {msg && <p className="w-full text-sm text-amber">{msg} <a className="underline" href="https://faucet.solana.com" target="_blank" rel="noreferrer">faucet.solana.com</a></p>}
    </div>
  )
}

function VerdictPill({ v }: { v: ScanResult['verdict'] }) {
  const { t } = useT()
  const cls = v === 'clean' ? 'bg-mint/15 text-mint' : v === 'suspicious' ? 'bg-amber/15 text-amber' : 'bg-rose/15 text-rose'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{t(`verdict_${v}`)}</span>
}

export function ScanResults({ results }: { results: ScanResult[] }) {
  if (!results.length) return null
  const bad = results.filter((r) => r.verdict !== 'clean').length
  return (
    <div className="card divide-y divide-line">
      <div className="p-4 flex justify-between text-sm"><span>{results.length} files</span><span className={bad ? 'text-rose' : 'text-mint'}>{bad} flagged</span></div>
      {results.map((r) => (
        <div key={r.sha256 + r.name} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-medium">{r.name}</span><VerdictPill v={r.verdict} />
          </div>
          <div className="mt-1 text-xs font-mono text-fog break-all">{formatBytes(r.size)} &middot; {r.ms.toFixed(0)} ms &middot; sha256 {r.sha256.slice(0, 16)}&hellip;</div>
          {r.findings.map((f) => <div key={f.rule} className="mt-2 text-sm text-fog"><span className="font-mono text-amber">{f.rule}</span> {f.detail}</div>)}
        </div>
      ))}
    </div>
  )
}

export function ScanTool() {
  const { t } = useT()
  const [results, setResults] = useState<ScanResult[]>([])
  const [busy, setBusy] = useState(false)
  const scan = async (files: File[]) => {
    setBusy(true)
    const out: ScanResult[] = []
    for (const f of files) { out.push(await scanFile(f)); setResults([...out]) }
    setBusy(false)
  }
  const scanFolder = async () => {
    let dir: FileSystemDirectoryHandle
    try { dir = await pickFolder() } catch { return }
    const handles: Entry[] = []
    setBusy(true)
    await walk(dir, (e) => handles.push(e))
    const files = await Promise.all(handles.slice(0, 2000).map((e) => e.handle.getFile()))
    await scan(files)
  }
  return (
    <Panel title={t('scan')} desc={t('scan_d')} back={() => go('#/app')}>
      <div className="flex flex-wrap gap-3">
        <label className="btn btn-primary cursor-pointer">{t('pick_files')}<input type="file" multiple hidden onChange={(e) => scan([...(e.target.files ?? [])])} /></label>
        {supportsFolders && <button className="btn btn-ghost" onClick={scanFolder} disabled={busy}>{t('pick_folder')}</button>}
        <button className="btn btn-ghost" onClick={() => scan([new File([EICAR], 'eicar-test.com')])} disabled={busy}>{t('eicar')}</button>
      </div>
      {busy && <p className="text-fog text-sm">{t('running')}&hellip; {results.length}</p>}
      <ScanResults results={results} />
      {results.length > 0 && !busy && <AnchorButton kind="scan" payload={results.map((r) => [r.sha256, r.verdict])} summary={`${results.length}f/${results.filter((r) => r.verdict !== 'clean').length}flag`} />}
      <UrlCheck />
    </Panel>
  )
}

function UrlCheck() {
  const { t } = useT()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Awaited<ReturnType<typeof checkDomain>> | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="card p-5" id="url">
      <h2 className="font-semibold text-lg">{t('t_url')}</h2>
      <p className="text-sm text-fog mt-1">{t('t_url_d')}</p>
      <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!q) return; setBusy(true); setRes(await checkDomain(q)); setBusy(false) }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="example.com or a full link"
          className="flex-1 min-w-0 h-11 rounded-full bg-ink border border-line px-4 outline-none focus:border-mint" />
        <button className="btn btn-primary" disabled={busy}>{busy ? '...' : t('run')}</button>
      </form>
      <p className="mt-2 text-xs text-fog">Try <button className="underline" onClick={() => setQ('malware.testcategory.com')}>malware.testcategory.com</button>, a domain Cloudflare keeps on its block list for testing.</p>
      {res && (
        <div className="mt-4 text-sm">
          {res.error ? <span className="text-amber">Lookup failed: {res.error}</span>
            : res.blocked ? <span className="text-rose font-semibold">{res.host} is on a malware block list. Do not open it.</span>
            : res.resolves ? <span className="text-mint">{res.host} is not on the threat list Cloudflare uses.</span>
            : <span className="text-amber">{res.host} does not resolve. It may not exist.</span>}
          {!res.error && <div className="mt-3"><AnchorButton kind="url" payload={res} summary={res.blocked ? 'blocked' : 'ok'} /></div>}
        </div>
      )}
    </div>
  )
}

export function SweepTool({ preset: initial = 'junk' }: { preset?: Preset }) {
  const { t } = useT()
  const [preset, setPreset] = useState<Preset>(initial)
  const [entries, setEntries] = useState<Entry[]>([])
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [freed, setFreed] = useState(0)
  const [cleaned, setCleaned] = useState<{ freed: number; cachesRemoved: number } | null>(null)
  const all = useRef<Entry[]>([])
  const filtered = entries.filter(PRESETS[preset])
  const total = filtered.reduce((a, e) => a + e.size, 0)

  const open = async () => {
    let dir: FileSystemDirectoryHandle
    try { dir = await pickFolder() } catch { return }
    setBusy(true); all.current = []; setEntries([]); setSel(new Set())
    let n = 0
    await walk(dir, (e) => { all.current.push(e); if (++n % 200 === 0) setEntries([...all.current]) })
    setEntries([...all.current]); setBusy(false)
  }
  const del = async () => {
    setBusy(true)
    let f = 0
    const keep: Entry[] = []
    for (const e of entries) {
      if (sel.has(e.path)) { try { await removeEntry(e); f += e.size; continue } catch { /* locked file, keep it */ } }
      keep.push(e)
    }
    setEntries(keep); setSel(new Set()); setFreed((x) => x + f); setBusy(false)
  }
  const labels: Record<Preset, string> = { junk: 'Junk & temp', whatsapp: 'WhatsApp media', apk: 'APK installers', large: 'Over 50 MB' }

  return (
    <Panel title={t('t_sweep')} desc={t('t_sweep_d')} back={() => go('#/app')}>
      <div className="card p-5">
        <h2 className="font-semibold">This site&rsquo;s cache</h2>
        <p className="text-sm text-fog mt-1">Cache Storage, service workers and session data. Your vault and receipts stay.</p>
        <button className="btn btn-ghost mt-4" onClick={async () => setCleaned(await cleanSiteData())}>{t('clean')}</button>
        {cleaned && <p className="mt-3 text-sm text-mint">Removed {cleaned.cachesRemoved} cache stores, freed {formatBytes(cleaned.freed)}.</p>}
      </div>
      {!supportsFolders && <p className="card p-4 text-sm text-amber">{t('no_folder_api')}</p>}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button key={p} onClick={() => { setPreset(p); setSel(new Set()) }}
            className={`btn h-9 text-sm ${p === preset ? 'btn-primary' : 'btn-ghost'}`}>{labels[p]}</button>
        ))}
      </div>
      {supportsFolders && <button className="btn btn-primary" onClick={open} disabled={busy}>{busy ? `${t('running')}... ${entries.length}` : t('pick_folder')}</button>}
      {preset === 'whatsapp' && <p className="text-sm text-fog">On Android, pick <span className="font-mono">Android/media/com.whatsapp/WhatsApp/Media</span>. On desktop, pick your WhatsApp download folder.</p>}
      {entries.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Scanned" value={entries.length} />
            <Stat label="Matches" value={filtered.length} hint={formatBytes(total)} />
            <Stat label="Freed" value={formatBytes(freed)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost h-9 text-sm" onClick={() => setSel(new Set(filtered.map((e) => e.path)))}>Select all {filtered.length}</button>
            <button className="btn btn-ghost h-9 text-sm" onClick={() => setSel(new Set())}>Clear</button>
            <button className="btn h-9 text-sm bg-rose text-ink" disabled={!sel.size || busy} onClick={del}>{t('delete_sel')} ({sel.size})</button>
          </div>
          <div className="card max-h-[420px] overflow-auto divide-y divide-line">
            {filtered.slice(0, 500).sort((a, b) => b.size - a.size).map((e) => (
              <label key={e.path} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[.03] cursor-pointer">
                <input type="checkbox" className="accent-[#34E0A1]" checked={sel.has(e.path)}
                  onChange={() => setSel((s) => { const n = new Set(s); if (n.has(e.path)) n.delete(e.path); else n.add(e.path); return n })} />
                <span className="truncate flex-1 font-mono text-xs">{e.path}</span>
                <span className="tabular-nums text-fog">{formatBytes(e.size)}</span>
              </label>
            ))}
            {!filtered.length && <p className="p-4 text-sm text-fog">Nothing in this folder matches.</p>}
          </div>
          {freed > 0 && <AnchorButton kind="sweep" payload={{ preset, freed, scanned: entries.length }} summary={`${preset}/${freed}B`} />}
        </>
      )}
    </Panel>
  )
}

interface Pic { name: string; size: number; hash: bigint; url: string; entry?: Entry }
export function DupesTool() {
  const { t } = useT()
  const [groups, setGroups] = useState<Pic[][]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [removed, setRemoved] = useState(0)
  const hashAll = async (items: { file: File; entry?: Entry }[]) => {
    setBusy(true); setDone(0); setGroups([])
    const pics: Pic[] = []
    for (const { file, entry } of items) {
      if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) continue
      try { pics.push({ name: entry?.path ?? file.name, size: file.size, hash: await dHash(file), url: URL.createObjectURL(file), entry }) } catch { /* unreadable image */ }
      setDone((d) => d + 1)
    }
    setGroups(group(pics).map((g) => g.sort((a, b) => b.size - a.size)))
    setBusy(false)
  }
  const fromFolder = async () => {
    let dir: FileSystemDirectoryHandle
    try { dir = await pickFolder() } catch { return }
    const es: Entry[] = []
    await walk(dir, (e) => es.push(e))
    await hashAll(await Promise.all(es.filter((e) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(e.name)).slice(0, 3000).map(async (entry) => ({ file: await entry.handle.getFile(), entry }))))
  }
  const dropExtras = async (g: Pic[], gi: number) => {
    let n = 0
    for (const p of g.slice(1)) if (p.entry) { try { await removeEntry(p.entry); n++ } catch { /* skip */ } }
    setRemoved((r) => r + n)
    setGroups((gs) => gs.filter((_, i) => i !== gi))
  }
  const wasted = groups.reduce((a, g) => a + g.slice(1).reduce((b, p) => b + p.size, 0), 0)
  return (
    <Panel title={t('t_dupes')} desc={t('t_dupes_d')} back={() => go('#/app')}>
      <div className="flex flex-wrap gap-3">
        {supportsFolders && <button className="btn btn-primary" onClick={fromFolder} disabled={busy}>{t('pick_folder')}</button>}
        <label className="btn btn-ghost cursor-pointer">{t('pick_files')}<input type="file" accept="image/*" multiple hidden onChange={(e) => hashAll([...(e.target.files ?? [])].map((file) => ({ file })))} /></label>
      </div>
      {busy && <p className="text-sm text-fog">{t('running')}&hellip; {done}</p>}
      {!busy && done > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Photos" value={done} /><Stat label="Groups" value={groups.length} /><Stat label="Reclaimable" value={formatBytes(wasted)} hint={removed ? `${removed} removed` : undefined} />
        </div>
      )}
      {groups.map((g, gi) => (
        <div key={gi} className="card p-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {g.map((p, i) => (
              <figure key={p.name} className="shrink-0 w-32">
                <img src={p.url} alt="" className={`w-32 h-32 object-cover rounded-xl border ${i ? 'border-rose/50 opacity-70' : 'border-mint'}`} />
                <figcaption className="mt-1 text-[11px] font-mono text-fog truncate">{i ? 'copy' : 'keep'} &middot; {formatBytes(p.size)}</figcaption>
              </figure>
            ))}
          </div>
          {g.some((p) => p.entry) && <button className="btn btn-ghost h-9 text-sm mt-3" onClick={() => dropExtras(g, gi)}>Keep the largest, delete {g.length - 1}</button>}
        </div>
      ))}
      {!busy && done > 0 && <AnchorButton kind="dupes" payload={groups.map((g) => g.map((p) => p.hash))} summary={`${done}p/${groups.length}g`} />}
    </Panel>
  )
}

export function SpeedTool() {
  const { t } = useT()
  const [phase, setPhase] = useState<string>('')
  const [s, setS] = useState<Partial<Speed>>({})
  const [err, setErr] = useState('')
  const run = async () => {
    setErr(''); setS({})
    try { await runSpeedTest((p, part) => { setPhase(p); setS(part) }) } catch (e) { setErr(String(e)); setPhase('') }
  }
  const n = (v?: number, d = 1) => (v === undefined ? '--' : v.toFixed(d))
  const running = phase && phase !== 'done'
  return (
    <Panel title={t('t_speed')} desc={t('t_speed_d')} back={() => go('#/app')}>
      <button className="btn btn-primary" onClick={run} disabled={!!running}>{running ? `${t('running')}: ${phase}` : t('run')}</button>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Ping" value={`${n(s.pingMs, 0)} ms`} /><Stat label="Jitter" value={`${n(s.jitterMs, 0)} ms`} />
        <Stat label="Download" value={`${n(s.downMbps)} Mbps`} /><Stat label="Upload" value={`${n(s.upMbps)} Mbps`} />
      </div>
      {err && <p className="text-rose text-sm">{err}</p>}
      {phase === 'done' && <AnchorButton kind="speed" payload={s} summary={`d${n(s.downMbps, 0)}/u${n(s.upMbps, 0)}/p${n(s.pingMs, 0)}`} />}
      <UsageInline />
    </Panel>
  )
}

function UsageInline() {
  const { t } = useT()
  const [u, setU] = useState(sessionTraffic())
  useEffect(() => { const i = setInterval(() => setU(sessionTraffic()), 1500); return () => clearInterval(i) }, [])
  return (
    <div className="card p-5" id="usage">
      <h2 className="font-semibold text-lg">{t('t_usage')}</h2>
      <p className="text-sm text-fog mt-1">{t('t_usage_d')} Per-app totals for the whole phone need the Android app.</p>
      <div className="mt-4 text-2xl font-semibold tabular-nums">{formatBytes(u.bytes)} <span className="text-sm text-fog font-normal">over {u.requests} requests</span></div>
      <div className="mt-4 space-y-2">
        {u.byHost.map(([h, b]) => (
          <div key={h} className="text-sm">
            <div className="flex justify-between"><span className="font-mono text-xs truncate">{h}</span><span className="tabular-nums text-fog">{formatBytes(b)}</span></div>
            <div className="h-1.5 mt-1 rounded-full bg-line overflow-hidden"><div className="h-full bg-mint" style={{ width: `${(b / (u.bytes || 1)) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VaultTool() {
  const { t } = useT()
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [items, setItems] = useState<V.VaultItem[]>([])
  const [secret, setSecret] = useState('')
  const [kind, setKind] = useState<'pin' | 'password' | 'pattern'>('pin')
  const [err, setErr] = useState('')
  const [bio, setBio] = useState(false)
  const meta = V.getMeta()
  useEffect(() => { V.biometricAvailable().then(setBio) }, [])
  const load = () => V.list().then(setItems)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    try {
      if (meta) { await V.verifyBiometric(); setKey(await V.unlock(secret)) }
      else {
        if (kind === 'pin' && !/^\d{6,}$/.test(secret)) return setErr('Use at least 6 digits.')
        if (kind !== 'pin' && secret.length < 8) return setErr('Use at least 8 characters.')
        setKey(await V.setup(secret, kind))
      }
      setSecret(''); load()
    } catch { setErr('That did not unlock the vault.') }
  }
  const k = meta?.kind ?? kind
  if (!key) return (
    <Panel title={t('t_vault')} desc={t('t_vault_d')} back={() => go('#/app')}>
      <form onSubmit={submit} className="card p-6 max-w-md space-y-4">
        <h2 className="font-semibold text-lg">{meta ? t('vault_open') : t('vault_new')}</h2>
        {!meta && (
          <div className="flex gap-2">
            {(['pin', 'password', 'pattern'] as const).map((x) => (
              <button type="button" key={x} onClick={() => setKind(x)} className={`btn h-9 text-sm ${kind === x ? 'btn-primary' : 'btn-ghost'}`}>{t(`kind_${x}`)}</button>
            ))}
          </div>
        )}
        {k === 'pattern'
          ? <PatternPad onDone={setSecret} value={secret} />
          : <input type="password" inputMode={k === 'pin' ? 'numeric' : 'text'} autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)}
              placeholder={t('vault_secret')} className="w-full h-12 rounded-xl bg-ink border border-line px-4 outline-none focus:border-mint tracking-widest" />}
        {meta?.credId && <p className="text-xs text-fog">Your device will ask for Face ID, fingerprint or Windows Hello first.</p>}
        {err && <p className="text-sm text-rose">{err}</p>}
        <button className="btn btn-primary w-full" disabled={!secret}>{meta ? t('vault_open') : t('vault_new')}</button>
        <p className="text-xs text-fog">Files are encrypted with AES-256-GCM using a key derived from your secret (PBKDF2, 310,000 rounds). There is no recovery. If you forget it, the files cannot be opened.</p>
      </form>
    </Panel>
  )
  return (
    <Panel title={t('t_vault')} desc={`${items.length} files, encrypted on this device.`} back={() => go('#/app')}>
      <div className="flex flex-wrap gap-2">
        <label className="btn btn-primary cursor-pointer">{t('vault_add')}<input type="file" multiple hidden onChange={async (e) => { for (const f of e.target.files ?? []) await V.add(key, f); load() }} /></label>
        {bio && !V.getMeta()?.credId && <button className="btn btn-ghost" onClick={async () => { try { await V.enrollBiometric(); setErr('') } catch { setErr('Biometric setup was cancelled.') } }}>{t('vault_bio')}</button>}
        <button className="btn btn-ghost" onClick={() => { setKey(null); setItems([]) }}>{t('vault_lock')}</button>
        <button className="btn btn-ghost text-rose" onClick={async () => { if (confirm('Erase every file in the vault? This cannot be undone.')) { await V.wipe(); setKey(null) } }}>{t('vault_wipe')}</button>
      </div>
      {err && <p className="text-sm text-rose">{err}</p>}
      <div className="card divide-y divide-line">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="truncate flex-1">{it.name}</span><span className="text-fog tabular-nums">{formatBytes(it.size)}</span>
            <button className="text-mint hover:underline" onClick={async () => { const b = await V.open(key, it); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = it.name; a.click() }}>Open</button>
            <button className="text-rose hover:underline" onClick={async () => { await V.remove(it.id); load() }}>Remove</button>
          </div>
        ))}
        {!items.length && <p className="p-4 text-sm text-fog">Empty. Add photos or documents you want out of sight.</p>}
      </div>
      {items.length > 0 && <AnchorButton kind="vault" payload={items.map((i) => [i.id, i.size])} summary={`${items.length}items`} />}
    </Panel>
  )
}

function PatternPad({ onDone, value }: { onDone: (s: string) => void; value: string }) {
  const [path, setPath] = useState<number[]>([])
  const down = useRef(false)
  const add = (i: number) => setPath((p) => (p.includes(i) ? p : [...p, i]))
  const end = () => { down.current = false; if (path.length >= 4) onDone(path.join('-')); else setPath([]) }
  const pos = (i: number) => [(i % 3) * 80 + 40, Math.floor(i / 3) * 80 + 40]
  return (
    <div className="mx-auto w-60 touch-none select-none" onPointerUp={end} onPointerLeave={() => down.current && end()}>
      <svg viewBox="0 0 240 240" className="w-60 h-60">
        <polyline points={path.map((i) => pos(i).join(',')).join(' ')} fill="none" stroke="#34E0A1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {Array.from({ length: 9 }, (_, i) => {
          const [x, y] = pos(i)
          return <circle key={i} cx={x} cy={y} r={path.includes(i) ? 14 : 10} fill={path.includes(i) ? '#34E0A1' : '#22302C'}
            onPointerDown={(e) => { (e.target as Element).releasePointerCapture?.(e.pointerId); down.current = true; setPath([i]) }}
            onPointerEnter={() => down.current && add(i)} className="cursor-pointer transition-all" />
        })}
      </svg>
      <p className="text-center text-xs text-fog">{value ? 'Pattern captured' : 'Connect at least 4 dots'}</p>
    </div>
  )
}

export function BoostTool() {
  const { t } = useT()
  const [s, setS] = useState<Snapshot | null>(null)
  useEffect(() => { snapshot().then(setS) }, [])
  if (!s) return null
  const pct = s.quota ? s.usage / s.quota : 0
  const tips: string[] = []
  if (s.memoryGB !== undefined && s.memoryGB <= 4) tips.push('This device reports 4 GB of RAM or less. Close tabs and apps you are not using; that frees more than any cleaner can.')
  if (s.battery !== undefined && s.battery < 0.2 && !s.charging) tips.push('Battery is under 20%. Many phones throttle the processor here. Plug in before gaming.')
  if (s.net && /2g|3g/.test(s.net)) tips.push('Your connection reports as slow. Run the speed test to see whether it is the network or the device.')
  if (pct > 0.8) tips.push('Browser storage is nearly full. Run Clean.')
  if (!tips.length) tips.push('Nothing here is slowing the device down. If it still feels slow, the cause is likely another app; the Android build can show which one.')
  return (
    <Panel title={t('boost')} desc={t('boost_d')} back={() => go('#/app')}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Device RAM" value={s.memoryGB ? `${s.memoryGB} GB` : 'hidden'} hint="as reported by the browser" />
        <Stat label="CPU threads" value={s.cores ?? '--'} />
        <Stat label="Battery" value={s.battery !== undefined ? `${Math.round(s.battery * 100)}%` : 'hidden'} hint={s.charging ? 'charging' : undefined} />
        <Stat label="Network" value={<span className="text-lg">{s.net ?? 'hidden'}</span>} />
        <Stat label="Site storage" value={formatBytes(s.usage)} hint={`of ${formatBytes(s.quota)}`} />
        <Stat label="Page memory" value={s.heapMB ? `${s.heapMB.toFixed(0)} MB` : 'hidden'} />
        <Stat label="Cache stores" value={s.caches} />
      </div>
      <div className="card p-5 space-y-2">{tips.map((x) => <p key={x} className="text-sm">{x}</p>)}</div>
      <AnchorButton kind="checkup" payload={s} summary={`ram${s.memoryGB ?? 'x'}/c${s.cores ?? 'x'}`} />
    </Panel>
  )
}

const NATIVE = [
  ['Spam call blocking', 'CallScreeningService checks incoming numbers against a community list and your own blocks.'],
  ['Hide apps', 'Moves apps into a work profile you can lock, the only method Android allows without root.'],
  ['DNS filter and private DNS', 'A local VpnService that only answers DNS, sending queries to a malware-filtering resolver over HTTPS. No traffic cap, because nothing but DNS goes through it.'],
  ['App caches', 'Opens the system storage screen per app. Android 11 and newer only let the system clear another app’s cache.'],
  ['Game mode', 'Turns on Do Not Disturb, closes background apps you choose, and shows a frame and temperature overlay.'],
  ['Wi-Fi and mobile together', 'Uses Android’s network API to send downloads over both links where the phone supports it.'],
  ['Root status', 'Detects whether the device is rooted and tells you what that exposes. It does not root or unroot the phone.'],
  ['Installed app scan', 'Hashes every installed APK and checks permissions that do not match what the app claims to do.'],
]
export function NativeTool() {
  const { t } = useT()
  return (
    <Panel title={t('t_native')} desc="These need system permissions a web page will never get. The Android build wraps this same app and adds them one by one. The list below is the plan, with the Android API each one depends on." back={() => go('#/app')}>
      <div className="grid md:grid-cols-2 gap-3">
        {NATIVE.map(([h, d]) => (
          <div key={h} className="card p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{h}</h3><span className="text-[11px] font-mono text-amber border border-amber/40 rounded-full px-2 py-0.5">ANDROID</span></div><p className="text-sm text-fog mt-2">{d}</p></div>
        ))}
      </div>
    </Panel>
  )
}

export function VerifyPage() {
  const { t } = useT()
  const [sig, setSig] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('sig') ?? '')
  const [res, setRes] = useState<Awaited<ReturnType<typeof readReceipt>> | 'none' | null>(null)
  const [busy, setBusy] = useState(false)
  const mine = receipts()
  const look = async (s = sig) => { setBusy(true); try { setRes((await readReceipt(s)) ?? 'none') } catch { setRes('none') } setBusy(false) }
  useEffect(() => { if (sig) look() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const parts = res && res !== 'none' ? res.memo.replace(/^\[\d+\]\s*/, '').split('|') : []
  return (
    <Panel title={t('verify_title')} desc={t('verify_sub')} back={() => go('#/')}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); look() }}>
        <input value={sig} onChange={(e) => setSig(e.target.value)} placeholder="Transaction signature" className="flex-1 min-w-0 h-11 rounded-full bg-ink border border-line px-4 font-mono text-sm outline-none focus:border-mint" />
        <button className="btn btn-primary" disabled={!sig || busy}>{busy ? '...' : t('verify_btn')}</button>
      </form>
      {res === 'none' && <p className="text-amber text-sm">{t('not_found')}</p>}
      {res && res !== 'none' && (
        <div className="card p-5 space-y-2 text-sm">
          <div className="text-mint font-semibold">Found on Solana devnet, slot {res.slot.toLocaleString()}</div>
          {parts[0] === 'cw1' ? (
            <dl className="grid grid-cols-[110px_1fr] gap-y-1 font-mono text-xs">
              <dt className="text-fog">tool</dt><dd>{parts[1]}</dd>
              <dt className="text-fog">digest</dt><dd className="break-all">{parts[2]}</dd>
              <dt className="text-fog">summary</dt><dd>{parts[3]}</dd>
              <dt className="text-fog">signer</dt><dd className="break-all">{res.signer}</dd>
              <dt className="text-fog">time</dt><dd>{res.time ? new Date(res.time * 1000).toLocaleString() : '--'}</dd>
            </dl>
          ) : <p className="text-amber">This transaction exists but is not a Clearwarden receipt.</p>}
          <a className="text-mint underline" href={explorer(sig.trim())} target="_blank" rel="noreferrer">{t('view_tx')}</a>
        </div>
      )}
      <h2 className="text-xl font-semibold pt-4">{t('receipts')}</h2>
      <div className="card divide-y divide-line">
        {mine.map((r) => (
          <button key={r.sig} onClick={() => { setSig(r.sig); look(r.sig) }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/[.03]">
            <span className="font-mono text-mint w-16">{r.kind}</span><span className="flex-1 font-mono text-xs text-fog truncate">{r.sig}</span><span className="text-xs text-fog">{new Date(r.at).toLocaleDateString()}</span>
          </button>
        ))}
        {!mine.length && <p className="p-4 text-sm text-fog">{t('none_yet')}</p>}
      </div>
    </Panel>
  )
}
