import fs from "fs";
import path from "path";
import type { Decision } from "../shared/types";

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function listNftBackgrounds(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".svg"))
    .sort()
    .map((f) => path.join(dir, f));
}

export function hashDecisionId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

/** Warmer / bolder palettes when confidence is higher; cooler liquidity tones when lower. */
export function pickBackgroundIndex(decision: Decision, count: number): number {
  if (count <= 0) return 0;
  const h = hashDecisionId(decision.id);
  const high = [1, 4, 5, 7]; // ember, golden, prism, crimson nebula
  const low = [0, 2, 3, 6]; // aurora, neon, deep liquidity, midnight jade
  const pool = decision.confidence >= 0.55 ? high : low;
  return pool[h % pool.length] % count;
}

export function truncateSignalSubtitle(s: string, max = 96): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Minimal glass-style plate so the artwork stays the hero. */
export function buildSignalArtOverlay(
  titleXml: string,
  subtitleXml: string,
  isoXml: string
): string {
  return `
<g id="signalmint-plate" aria-label="Signal metadata">
  <defs>
    <linearGradient id="sm-plate-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="35%" stop-color="#000000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.88"/>
    </linearGradient>
    <filter id="sm-text-legible" x="-5%" y="-15%" width="110%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.9"/>
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect x="0" y="560" width="1200" height="640" fill="url(#sm-plate-fade)"/>
  <rect x="40" y="820" width="1120" height="320" rx="32" fill="rgba(3,7,18,0.88)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  <text x="600" y="940" text-anchor="middle" fill="#ffffff" font-size="56" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-weight="800" letter-spacing="-0.02em" filter="url(#sm-text-legible)">${titleXml}</text>
  <text x="600" y="1015" text-anchor="middle" fill="#f1f5f9" font-size="28" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-weight="600" filter="url(#sm-text-legible)">${subtitleXml}</text>
  <text x="600" y="1085" text-anchor="middle" fill="#cbd5e1" font-size="20" font-family="ui-monospace, monospace" font-weight="500" letter-spacing="0.03em" filter="url(#sm-text-legible)">${isoXml}</text>
</g>`;
}

export function fallbackSignalSvgBackground(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="fb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <radialGradient id="fb-glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
    <filter id="fb-blur"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>
  <rect width="1200" height="1200" fill="url(#fb-bg)"/>
  <ellipse cx="600" cy="400" rx="500" ry="400" fill="url(#fb-glow)" filter="url(#fb-blur)"/>
</svg>`;
}

export interface WriteSignalArtOptions {
  cwd?: string;
  /** Defaults to \`\${decision.id}.svg\` */
  fileName?: string;
  /** Subdir under cwd/logs, default nft-images */
  imageSubdir?: string;
  /** If set, use this background index (0-based) instead of confidence-based pick */
  forceBackgroundIndex?: number;
}

/**
 * Compose pre-built background + overlay and write SVG. Same output as Executor mint art.
 */
export function writeSignalArtToFile(
  decision: Decision,
  nftName: string,
  options: WriteSignalArtOptions = {}
): string {
  const cwd = options.cwd ?? process.cwd();
  const sub = options.imageSubdir ?? path.join("logs", "nft-images");
  const imageDir = path.join(cwd, sub);
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const fileName = options.fileName ?? `${decision.id}.svg`;
  const filePath = path.join(imageDir, fileName);
  const condition = decision.conditionCheck;
  const confidencePct = (decision.confidence * 100).toFixed(1);

  const bgDir = path.join(cwd, "assets", "nft-backgrounds");
  const backgrounds = listNftBackgrounds(bgDir);
  const bgIndex =
    options.forceBackgroundIndex !== undefined && backgrounds.length > 0
      ? ((options.forceBackgroundIndex % backgrounds.length) + backgrounds.length) %
        backgrounds.length
      : pickBackgroundIndex(decision, backgrounds.length);
  const bgFile = backgrounds.length > 0 ? backgrounds[bgIndex % backgrounds.length] : null;

  let baseSvg: string;
  if (bgFile && fs.existsSync(bgFile)) {
    baseSvg = fs.readFileSync(bgFile, "utf-8").trim();
    if (!baseSvg.startsWith("<?xml")) {
      baseSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${baseSvg}`;
    }
  } else {
    console.warn(
      "[signal-art] No assets in assets/nft-backgrounds — using fallback gradient."
    );
    baseSvg = fallbackSignalSvgBackground();
  }

  const subtitle = truncateSignalSubtitle(
    `${condition?.metric ?? "SIGNAL"} ${condition?.operator ?? ""} ${condition?.threshold ?? "—"} · observed ${condition?.currentValue ?? "—"} · ${confidencePct}% conf`
  );

  const overlay = buildSignalArtOverlay(
    escapeXml(nftName),
    escapeXml(subtitle),
    escapeXml(new Date().toISOString())
  );

  const combined = baseSvg.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);
  fs.writeFileSync(filePath, combined, { encoding: "utf-8" });
  return filePath;
}
