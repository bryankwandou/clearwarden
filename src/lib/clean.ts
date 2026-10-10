export interface Snapshot {
  usage: number; quota: number; caches: number; memoryGB?: number; heapMB?: number; cores?: number; net?: string; battery?: number; charging?: boolean
}

type Nav = Navigator & {
  deviceMemory?: number
  connection?: { effectiveType?: string; downlink?: number }
  getBattery?: () => Promise<{ level: number; charging: boolean }>
}

export async function snapshot(): Promise<Snapshot> {
  const est = (await navigator.storage?.estimate?.()) ?? {}
  const keys = 'caches' in window ? await caches.keys() : []
  const nav = navigator as Nav
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } }
  let battery: number | undefined, charging: boolean | undefined
  try { const b = await nav.getBattery?.(); battery = b?.level; charging = b?.charging } catch { /* unsupported */ }
  return {
    usage: est.usage ?? 0, quota: est.quota ?? 0, caches: keys.length, memoryGB: nav.deviceMemory,
    heapMB: perf.memory ? perf.memory.usedJSHeapSize / 1048576 : undefined, cores: navigator.hardwareConcurrency,
    net: nav.connection ? `${nav.connection.effectiveType ?? '?'} / ${nav.connection.downlink ?? '?'} Mbps` : undefined,
    battery, charging,
  }
}

// A web page may only clear its own storage. This clears Cache Storage,
// service workers and session data for this site; the vault and receipts stay.
export async function cleanSiteData(): Promise<{ freed: number; cachesRemoved: number }> {
  const before = (await navigator.storage?.estimate?.())?.usage ?? 0
  let cachesRemoved = 0
  if ('caches' in window) for (const k of await caches.keys()) { await caches.delete(k); cachesRemoved++ }
  for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister()
  sessionStorage.clear()
  performance.clearResourceTimings()
  const after = (await navigator.storage?.estimate?.())?.usage ?? 0
  return { freed: Math.max(0, before - after), cachesRemoved }
}

export function sessionTraffic(): { bytes: number; requests: number; byHost: [string, number][] } {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const map = new Map<string, number>()
  let bytes = 0
  for (const e of entries) {
    const b = e.transferSize || e.encodedBodySize || 0
    bytes += b
    try { const h = new URL(e.name).host; map.set(h, (map.get(h) ?? 0) + b) } catch { /* ignore */ }
  }
  return { bytes, requests: entries.length, byHost: [...map].sort((a, b) => b[1] - a[1]).slice(0, 6) }
}
