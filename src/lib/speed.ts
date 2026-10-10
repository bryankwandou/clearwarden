const BASE = 'https://speed.cloudflare.com'
export interface Speed { pingMs: number; jitterMs: number; downMbps: number; upMbps: number }

const mbps = (bytes: number, ms: number) => (bytes * 8) / (ms / 1000) / 1e6

export async function runSpeedTest(onStep: (phase: 'ping' | 'download' | 'upload' | 'done', partial: Partial<Speed>) => void): Promise<Speed> {
  onStep('ping', {})
  const pings: number[] = []
  for (let i = 0; i < 8; i++) {
    const t = performance.now()
    await fetch(`${BASE}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store' })
    pings.push(performance.now() - t)
  }
  const jitterMs = pings.slice(1).reduce((a, p, i) => a + Math.abs(p - pings[i]), 0) / (pings.length - 1)
  const pingMs = [...pings].sort((a, b) => a - b)[Math.floor(pings.length / 2)]
  onStep('download', { pingMs, jitterMs })

  let bytes = 0
  let t0 = performance.now()
  for (const size of [1e6, 5e6, 10e6, 25e6]) {
    const r = await fetch(`${BASE}/__down?bytes=${size}&r=${Math.random()}`, { cache: 'no-store' })
    bytes += (await r.arrayBuffer()).byteLength
    onStep('download', { pingMs, jitterMs, downMbps: mbps(bytes, performance.now() - t0) })
    if (performance.now() - t0 > 8000) break
  }
  const downMbps = mbps(bytes, performance.now() - t0)
  onStep('upload', { pingMs, jitterMs, downMbps })

  bytes = 0
  t0 = performance.now()
  for (const size of [5e5, 2e6, 5e6]) {
    await fetch(`${BASE}/__up`, { method: 'POST', body: new Uint8Array(size) })
    bytes += size
    onStep('upload', { pingMs, jitterMs, downMbps, upMbps: mbps(bytes, performance.now() - t0) })
    if (performance.now() - t0 > 6000) break
  }
  const result = { pingMs, jitterMs, downMbps, upMbps: mbps(bytes, performance.now() - t0) }
  onStep('done', result)
  return result
}
