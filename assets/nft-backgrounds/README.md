# NFT background art

Pre-built **1200×1200** SVG backgrounds used when the agent mints. The executor picks one file from this folder (by decision id + confidence), then adds a small title plate at the bottom.

## Add your own

- Drop any `.svg` here with `viewBox="0 0 1200 1200"` (or same aspect).
- Use a **numeric prefix** so sorting is stable, e.g. `07-my-theme.svg`.
- Keep **gradient/filter IDs unique inside each file** (each SVG is standalone).

## Bundled themes

| File | Vibe |
|------|------|
| `01-aurora-mist` | Teal / violet aurora |
| `02-ember-flow` | Warm orange energy |
| `03-neon-pulse` | Cyber grid + cyan / magenta |
| `04-deep-liquidity` | Ocean blues, flow lines |
| `05-golden-signal` | Black + gold luxury |
| `06-prism-shift` | Iridescent purple / pink / teal |
| `07-midnight-jade` | Deep emerald / jade glow |
| `08-crimson-nebula` | Crimson / magenta nebula |

Higher **confidence** mints bias toward ember, golden, prism, crimson nebula; lower toward aurora, neon, deep liquidity, midnight jade.
