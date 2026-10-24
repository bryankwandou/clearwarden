import { Capacitor } from '@capacitor/core'

// Chrome fires beforeinstallprompt once, often before the landing page mounts, so it is caught at startup.
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export type InstallState = 'native' | 'installed' | 'prompt' | 'ios' | 'manual'

let deferred: PromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())

export function initInstall() {
  if (Capacitor.isNativePlatform()) return
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as PromptEvent; emit() })
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit() })
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* app still works online */ }) })
  }
}

export function installState(): InstallState {
  if (Capacitor.isNativePlatform()) return 'native'
  if (installed || matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone) return 'installed'
  if (deferred) return 'prompt'
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  return 'manual'
}

export function onInstallChange(f: () => void) { listeners.add(f); return () => { listeners.delete(f) } }

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const e = deferred
  deferred = null
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') installed = true
  emit()
  return outcome === 'accepted'
}
