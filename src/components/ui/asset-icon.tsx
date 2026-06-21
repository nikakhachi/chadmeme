/** Solana + USDC brand icons, plus a small labeled chip used across the app. */

export function SolIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 397.7 311.7" className={className} aria-label="SOL" role="img">
      <defs>
        <linearGradient id="sol-g" x1="360.9" y1="-37.5" x2="141.2" y2="383.3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00ffa3" />
          <stop offset="1" stopColor="#dc1fff" />
        </linearGradient>
      </defs>
      <g fill="url(#sol-g)">
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
      </g>
    </svg>
  );
}

export function UsdcIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-label="USDC" role="img">
      <circle cx="16" cy="16" r="16" fill="#2775ca" />
      <path
        fill="#fff"
        d="M15.75 27.5A11.5 11.5 0 1 1 27.5 16 11.54 11.54 0 0 1 15.75 27.5Zm.9-6.06c2-.34 3.18-1.45 3.18-3.18 0-1.5-.92-2.4-2.93-2.86l-1.36-.32c-1.05-.25-1.46-.6-1.46-1.2 0-.7.6-1.16 1.5-1.16.86 0 1.45.38 1.6 1.1a.43.43 0 0 0 .43.34h.86a.36.36 0 0 0 .36-.42c-.2-1.2-1.04-1.98-2.36-2.22V10.2a.4.4 0 0 0-.4-.4h-.8a.4.4 0 0 0-.4.4v1.14c-1.86.32-3.02 1.46-3.02 3.06 0 1.42.9 2.36 2.78 2.8l1.34.33c1.18.28 1.62.66 1.62 1.3 0 .76-.7 1.28-1.7 1.28-1 0-1.66-.42-1.84-1.16a.42.42 0 0 0-.42-.32h-.9a.36.36 0 0 0-.36.42c.2 1.3 1.1 2.1 2.6 2.32v1.16a.4.4 0 0 0 .4.4h.8a.4.4 0 0 0 .4-.4v-1.18Z"
      />
    </svg>
  );
}

/** Small inline icon for an asset by name. */
export function AssetIcon({ asset, className }: { asset: "SOL" | "USDC"; className?: string }) {
  return asset === "SOL" ? <SolIcon className={className} /> : <UsdcIcon className={className} />;
}
