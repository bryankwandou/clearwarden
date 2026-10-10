import { useEffect, useState } from 'react'
import { I18nProvider, useT } from './i18n'
import { Wordmark } from './components/Logo'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { BoostTool, DupesTool, NativeTool, ScanTool, SpeedTool, SweepTool, VaultTool, VerifyPage } from './pages/tools'

function useRoute() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => {
    const on = () => { setH(location.hash || '#/'); if (!location.hash.startsWith('#/') || location.hash === '#/') return; window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return h.split('?')[0]
}

function Shell() {
  const { t, toggle } = useT()
  const route = useRoute()
  const page = (() => {
    switch (route) {
      case '#/app': return <Dashboard />
      case '#/app/scan': return <ScanTool />
      case '#/app/sweep': return <SweepTool />
      case '#/app/dupes': return <DupesTool />
      case '#/app/speed': return <SpeedTool />
      case '#/app/vault': return <VaultTool />
      case '#/app/boost': return <BoostTool />
      case '#/app/native': return <NativeTool />
      case '#/verify': return <VerifyPage />
      default: return <Landing />
    }
  })()
  const inApp = route.startsWith('#/app') || route === '#/verify'
  return (
    <div className="grain min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/75 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <a href="#/" aria-label="Clearwarden home"><Wordmark /></a>
          <nav className="flex items-center gap-1 text-sm">
            {!inApp && <a href="#how" className="hidden md:inline px-3 py-2 text-fog hover:text-paper">{t('nav_how')}</a>}
            {!inApp && <a href="#proof" className="hidden md:inline px-3 py-2 text-fog hover:text-paper">{t('nav_proof')}</a>}
            <a href="#/verify" className="hidden sm:inline px-3 py-2 text-fog hover:text-paper">{t('nav_verify')}</a>
            <button onClick={toggle} className="px-3 py-2 text-fog hover:text-paper font-mono text-xs" aria-label="Switch language">{t('lang') === 'English' ? 'EN' : 'ID'}</button>
            {route !== '#/app' && <a href="#/app" className="btn btn-primary h-9 text-sm ml-1">{t('nav_app')}</a>}
          </nav>
        </div>
      </header>
      <main key={route} className="flex-1 [animation:fadein_.5s_ease]">{page}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-wrap gap-6 justify-between text-sm text-fog">
          <div><Wordmark /><p className="mt-3 max-w-xs">{t('footer')}</p></div>
          <div className="flex flex-col gap-2">
            <a href="#/app" className="hover:text-paper">{t('nav_app')}</a>
            <a href="#/verify" className="hover:text-paper">{t('nav_verify')}</a>
            <a href="https://github.com/bryankwandou/clearwarden" className="hover:text-paper" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <p className="w-full font-mono text-xs">Solana devnet only. Devnet tokens have no value.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return <I18nProvider><Shell /></I18nProvider>
}
