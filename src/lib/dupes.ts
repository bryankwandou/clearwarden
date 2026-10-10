// 64-bit difference hash: shrink to 9x8 grayscale and compare neighbours.
// Survives resizing and recompression, so WhatsApp copies of the same photo match.
export async function dHash(file: Blob): Promise<bigint> {
  const bmp = await createImageBitmap(file)
  const c = document.createElement('canvas')
  c.width = 9; c.height = 8
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, 9, 8)
  bmp.close()
  const d = ctx.getImageData(0, 0, 9, 8).data
  let h = 0n
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const i = (y * 9 + x) * 4, j = i + 4
      const a = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
      const b = d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114
      h = (h << 1n) | (a > b ? 1n : 0n)
    }
  return h
}

export function hamming(a: bigint, b: bigint): number {
  let x = a ^ b, n = 0
  while (x) { n += Number(x & 1n); x >>= 1n }
  return n
}

export function group<T extends { hash: bigint }>(items: T[], threshold = 5): T[][] {
  const used = new Set<number>(), groups: T[][] = []
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue
    const g = [items[i]]
    for (let j = i + 1; j < items.length; j++)
      if (!used.has(j) && hamming(items[i].hash, items[j].hash) <= threshold) { g.push(items[j]); used.add(j) }
    if (g.length > 1) groups.push(g)
  }
  return groups
}
