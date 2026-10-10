import { Buffer } from 'buffer'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js'

;(globalThis as unknown as { Buffer: typeof Buffer }).Buffer ??= Buffer

export const MEMO = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
export const conn = new Connection(clusterApiUrl('devnet'), 'confirmed')
const KEY = 'cw.devnet.burner'

// A throwaway devnet key generated in this browser. Devnet SOL has no value,
// and the key never leaves the device.
export function burner(): Keypair {
  const s = localStorage.getItem(KEY)
  if (s) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(s)))
  const k = Keypair.generate()
  localStorage.setItem(KEY, JSON.stringify([...k.secretKey]))
  return k
}

export const balance = async () => (await conn.getBalance(burner().publicKey)) / LAMPORTS_PER_SOL

export async function airdrop(): Promise<string> {
  const sig = await conn.requestAirdrop(burner().publicKey, 0.5 * LAMPORTS_PER_SOL)
  const bh = await conn.getLatestBlockhash()
  await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
  return sig
}

export type ReceiptKind = 'scan' | 'clean' | 'sweep' | 'dupes' | 'vault' | 'speed' | 'checkup' | 'url'
export interface Receipt { kind: ReceiptKind; digest: string; summary: string }
export interface StoredReceipt extends Receipt { sig: string; at: number }

// Only a digest and a short count go on chain. File names, paths and contents never do.
export async function anchor(r: Receipt): Promise<string> {
  const kp = burner()
  const memo = `cw1|${r.kind}|${r.digest}|${r.summary}`.slice(0, 400)
  const tx = new Transaction().add(
    new TransactionInstruction({ programId: MEMO, keys: [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }], data: Buffer.from(memo, 'utf8') }),
  )
  const bh = await conn.getLatestBlockhash()
  tx.feePayer = kp.publicKey
  tx.recentBlockhash = bh.blockhash
  tx.sign(kp)
  const sig = await conn.sendRawTransaction(tx.serialize())
  await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
  const log = receipts()
  log.unshift({ sig, ...r, at: Date.now() })
  localStorage.setItem('cw.receipts', JSON.stringify(log.slice(0, 50)))
  return sig
}

export async function readReceipt(sig: string): Promise<{ memo: string; slot: number; time?: number; signer: string } | null> {
  const tx = await conn.getParsedTransaction(sig.trim(), { maxSupportedTransactionVersion: 0, commitment: 'confirmed' })
  if (!tx) return null
  const ix = tx.transaction.message.instructions.find((i) => i.programId.equals(MEMO)) as { parsed?: string } | undefined
  return { memo: String(ix?.parsed ?? ''), slot: tx.slot, time: tx.blockTime ?? undefined, signer: tx.transaction.message.accountKeys[0].pubkey.toBase58() }
}

export const explorer = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`
export const addressUrl = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`
export function receipts(): StoredReceipt[] {
  try { return JSON.parse(localStorage.getItem('cw.receipts') || '[]') } catch { return [] }
}
