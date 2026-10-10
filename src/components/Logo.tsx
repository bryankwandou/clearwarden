// Mark: a shield cut by a sweep arc. The arc is the "clear", the notch is the "warden".
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="cw-g" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7CF5C4" />
          <stop offset="0.55" stopColor="#2FD69B" />
          <stop offset="1" stopColor="#0E9F8A" />
        </linearGradient>
      </defs>
      <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill="url(#cw-g)" />
      <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill="none" stroke="#0B1412" strokeOpacity=".25" strokeWidth="1.5" />
      <path d="M20 36 A14 14 0 0 1 44 24" fill="none" stroke="#0B1412" strokeWidth="5" strokeLinecap="round" />
      <circle cx="44" cy="24" r="4.2" fill="#F6C453" stroke="#0B1412" strokeWidth="2" />
      <path d="M24 44 L40 44" stroke="#0B1412" strokeWidth="5" strokeLinecap="round" opacity=".85" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-[17px]">
      <Mark size={28} />
      <span>Clear<span className="text-mint">warden</span></span>
    </span>
  )
}
