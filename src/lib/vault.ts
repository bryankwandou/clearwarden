const DB = 'clearwarden-vault', STORE = 'items', META = 'cw.vault.meta'
export interface VaultItem { id: string; name: string; type: string; size: number; iv: number[]; data: ArrayBuffer; added: number }
interface Meta { salt: number[]; check: { iv: number[]; data: number[] }; credId?: string; kind: 'pin' | 'password' | 'pattern' }

function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' })
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db()
  return new Promise((res, rej) => {
    const q = fn(d.transaction(STORE, mode).objectStore(STORE))
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}

async function derive(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 310000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )
}

export function getMeta(): Meta | null {
  try { return JSON.parse(localStorage.getItem(META) || 'null') } catch { return null }
}

export async function setup(secret: string, kind: Meta['kind']): Promise<CryptoKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await derive(secret, salt)
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode('clearwarden'))
  localStorage.setItem(META, JSON.stringify({ kind, salt: [...salt], check: { iv: [...iv], data: [...new Uint8Array(data)] } }))
  return key
}

export async function unlock(secret: string): Promise<CryptoKey> {
  const m = getMeta()
  if (!m) throw new Error('No vault yet')
  const key = await derive(secret, new Uint8Array(m.salt))
  // AES-GCM refuses to decrypt with the wrong key, so this doubles as the secret check.
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(m.check.iv) }, key, new Uint8Array(m.check.data))
  return key
}

export async function add(key: CryptoKey, file: File): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await file.arrayBuffer())
  await tx('readwrite', (s) => s.put({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, iv: [...iv], data, added: Date.now() }))
}
export const list = () => tx<VaultItem[]>('readonly', (s) => s.getAll() as IDBRequest<VaultItem[]>)
export const remove = (id: string) => tx('readwrite', (s) => s.delete(id))
export async function open(key: CryptoKey, it: VaultItem): Promise<Blob> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(it.iv) }, key, it.data)
  return new Blob([plain], { type: it.type || 'application/octet-stream' })
}
export async function wipe() {
  localStorage.removeItem(META)
  await tx('readwrite', (s) => s.clear())
}

// Device biometrics (Face ID, fingerprint, Windows Hello) as a second gate in front of the secret.
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
export async function biometricAvailable(): Promise<boolean> {
  try { return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) } catch { return false }
}
export async function enrollBiometric(): Promise<void> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'Clearwarden Vault' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'vault', displayName: 'Vault owner' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' }, timeout: 60000,
    },
  })) as PublicKeyCredential
  const m = getMeta()!
  m.credId = b64(cred.rawId)
  localStorage.setItem(META, JSON.stringify(m))
}
export async function verifyBiometric(): Promise<void> {
  const m = getMeta()
  if (!m?.credId) return
  await navigator.credentials.get({
    publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: unb64(m.credId) }], userVerification: 'required', timeout: 60000 },
  })
}
