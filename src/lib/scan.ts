import { sha256Hex } from './hash'

// Known-bad SHA-256 list. The EICAR entries are the industry test file, so the
// scanner can be proven end to end without handling live malware.
export const KNOWN_BAD: Record<string, string> = {
  '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f': 'EICAR-Test-File',
  '131f95c51cc819465fa1797f6ccacf9d494aaaff46fa3eac73ae63ffbdfd8267': 'EICAR-Test-File',
}

export type Verdict = 'clean' | 'suspicious' | 'malicious'
export interface Finding { rule: string; detail: string; weight: number }
export interface ScanResult {
  name: string; size: number; sha256: string; verdict: Verdict; findings: Finding[]; ms: number
}

const EXEC_EXT = /\.(exe|scr|bat|cmd|com|pif|vbs|js|jse|wsf|ps1|msi|hta|lnk|apk|jar|dll)$/i
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|mp4|mp3|txt|zip|rar)$/i

function bytesHas(hay: Uint8Array, needle: string): boolean {
  const n = new TextEncoder().encode(needle)
  const first = n[0]
  for (let i = hay.indexOf(first); i !== -1 && i <= hay.length - n.length; i = hay.indexOf(first, i + 1)) {
    let ok = true
    for (let j = 1; j < n.length; j++) if (hay[i + j] !== n[j]) { ok = false; break }
    if (ok) return true
  }
  return false
}

export async function scanFile(file: File): Promise<ScanResult> {
  const t0 = performance.now()
  const buf = new Uint8Array(await file.arrayBuffer())
  const sha256 = await sha256Hex(buf)
  const findings: Finding[] = []
  const name = file.name
  const parts = name.split('.')
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''

  if (KNOWN_BAD[sha256]) findings.push({ rule: 'hash-match', detail: KNOWN_BAD[sha256], weight: 100 })
  else if (bytesHas(buf.subarray(0, 512), 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE'))
    findings.push({ rule: 'signature', detail: 'EICAR test signature in file body', weight: 100 })

  if (parts.length > 2 && EXEC_EXT.test(name) && DOC_EXT.test('.' + parts[parts.length - 2]))
    findings.push({ rule: 'double-extension', detail: `Looks like .${parts[parts.length - 2]} but runs as .${ext}`, weight: 60 })

  const isMZ = buf[0] === 0x4d && buf[1] === 0x5a
  const isELF = buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46
  if ((isMZ || isELF) && !EXEC_EXT.test(name) && !/\.(so|bin|elf|sys|node)$/i.test(name))
    findings.push({ rule: 'disguised-binary', detail: `${isMZ ? 'Windows' : 'Linux'} program hidden behind a .${ext || 'no-extension'} name`, weight: 70 })

  const isZip = buf[0] === 0x50 && buf[1] === 0x4b
  if (isZip && bytesHas(buf, 'vbaProject.bin'))
    findings.push({ rule: 'office-macro', detail: 'Document carries VBA macros', weight: 35 })
  if (isZip && bytesHas(buf, 'AndroidManifest.xml') && !/\.(apk|apks|xapk)$/i.test(name))
    findings.push({ rule: 'hidden-apk', detail: 'Android package renamed to something else', weight: 60 })
  if (/\.pdf$/i.test(name) && (bytesHas(buf, '/JavaScript') || bytesHas(buf, '/Launch')))
    findings.push({ rule: 'pdf-active', detail: 'PDF contains JavaScript or a launch action', weight: 40 })
  if (/\.(html?|svg)$/i.test(name) && bytesHas(buf, 'eval(atob('))
    findings.push({ rule: 'obfuscated-script', detail: 'Base64 payload passed straight to eval', weight: 45 })
  if (/\.apk$/i.test(name))
    findings.push({ rule: 'sideload', detail: 'Installer from outside an app store. Keep it only if you trust where it came from.', weight: 15 })

  const score = findings.reduce((a, f) => a + f.weight, 0)
  const verdict: Verdict = score >= 100 ? 'malicious' : score >= 30 ? 'suspicious' : 'clean'
  return { name, size: file.size, sha256, verdict, findings, ms: performance.now() - t0 }
}

// The standard EICAR test string, split so this source file is not itself flagged.
export const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$' + 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

// Cloudflare's malware-filtering resolver answers 0.0.0.0 for domains on its threat feeds.
export async function checkDomain(input: string): Promise<{ host: string; blocked: boolean; resolves: boolean; error?: string }> {
  let host = input.trim()
  try { host = new URL(/^https?:\/\//.test(host) ? host : `https://${host}`).hostname } catch { /* keep raw */ }
  const q = (base: string) =>
    fetch(`${base}?name=${encodeURIComponent(host)}&type=A`, { headers: { accept: 'application/dns-json' } }).then((r) => r.json())
  try {
    const [sec, plain] = await Promise.all([q('https://security.cloudflare-dns.com/dns-query'), q('https://cloudflare-dns.com/dns-query')])
    const ips: string[] = (sec.Answer ?? []).map((a: { data: string }) => a.data)
    const resolves = (plain.Answer ?? []).length > 0
    return { host, resolves, blocked: ips.includes('0.0.0.0') }
  } catch (e) {
    return { host, blocked: false, resolves: false, error: String(e) }
  }
}
