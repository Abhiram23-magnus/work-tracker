// Ploughed field at dawn: sky, sun, a far hill with a tree, and crop rows running to the horizon.
// Colours come from --scene-* tokens so the scene follows the theme.

const ROWS = Array.from({ length: 17 }, (_, i) => i - 8)

export function FieldScene() {
  return (
    <svg className="field-scene" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <rect width="400" height="160" fill="var(--scene-sky)" />
      <circle cx="262" cy="62" r="18" fill="var(--scene-sun)" />
      <path d="M0 94 C70 70 140 78 205 90 C265 100 320 74 400 84 L400 160 L0 160Z" fill="var(--scene-hill)" />
      <g fill="var(--scene-tree)">
        <rect x="76" y="70" width="3" height="12" />
        <circle cx="77.5" cy="66" r="9" />
      </g>
      <path d="M0 110 C110 98 290 98 400 108 L400 160 L0 160Z" fill="var(--scene-field)" />
      <g stroke="var(--scene-row)" strokeWidth="2.2" strokeLinecap="round" fill="none">
        {ROWS.map((i) => (
          <path key={i} d={`M${200 + i * 7} 104 L${200 + i * 58} 164`} />
        ))}
      </g>
    </svg>
  )
}
