export interface Entry { path: string; name: string; size: number; modified: number; handle: FileSystemFileHandle; parent: FileSystemDirectoryHandle }

export const supportsFolders = typeof window !== 'undefined' && 'showDirectoryPicker' in window

export async function pickFolder(): Promise<FileSystemDirectoryHandle> {
  const w = window as unknown as { showDirectoryPicker: (o: { mode: string }) => Promise<FileSystemDirectoryHandle> }
  return w.showDirectoryPicker({ mode: 'readwrite' })
}

type IterDir = FileSystemDirectoryHandle & { entries(): AsyncIterable<[string, FileSystemHandle]> }

export async function walk(dir: FileSystemDirectoryHandle, onEntry: (e: Entry) => void, prefix = '', depth = 0): Promise<void> {
  if (depth > 12) return
  for await (const [name, h] of (dir as IterDir).entries()) {
    const path = prefix ? `${prefix}/${name}` : name
    if (h.kind === 'directory') await walk(h as FileSystemDirectoryHandle, onEntry, path, depth + 1)
    else {
      const fh = h as FileSystemFileHandle
      const f = await fh.getFile()
      onEntry({ path, name, size: f.size, modified: f.lastModified, handle: fh, parent: dir })
    }
  }
}

export async function removeEntry(e: Entry) { await e.parent.removeEntry(e.name) }

export const PRESETS = {
  junk: (e: Entry) =>
    /\.(tmp|temp|log|bak|old|crdownload|part|dmp|chk)$/i.test(e.name) ||
    /^(thumbs\.db|\.ds_store|desktop\.ini)$/i.test(e.name) ||
    /(^|\/)(\.thumbnails|cache|\.cache|temp)(\/|$)/i.test(e.path),
  whatsapp: (e: Entry) => /\.(opus|jpe?g|mp4|webp|3gp|aac|m4a|pdf)$/i.test(e.name),
  apk: (e: Entry) => /\.(apk|apks|xapk)$/i.test(e.name),
  large: (e: Entry) => e.size > 50 * 1024 * 1024,
} as const
export type Preset = keyof typeof PRESETS
