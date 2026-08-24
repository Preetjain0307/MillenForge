/**
 * svgPlaceholder.js — Deterministic, offline, zero-network SVG placeholder generator
 *
 * Prevents broken images, failed external placehold.co calls, and "Image Error" badges.
 */

export const getSvgPlaceholder = (label = 'Visual Asset', width = 600, height = 400) => {
  const cleanLabel = String(label || 'Visual Asset')
    .replace(/[<>&"]/g, '')
    .slice(0, 40);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#11111a"/>
      <stop offset="50%" stop-color="#181826"/>
      <stop offset="100%" stop-color="#23213a"/>
    </linearGradient>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="none" stroke="rgba(139, 92, 246, 0.2)" stroke-width="1.5"/>
  <g transform="translate(${width / 2}, ${height / 2 - 16})">
    <circle cx="0" cy="0" r="28" fill="rgba(139, 92, 246, 0.12)" stroke="rgba(139, 92, 246, 0.3)" stroke-width="1"/>
    <path d="M-10 6 L-2 -8 L6 2 L12 -4 L16 6 Z" fill="url(#iconGrad)"/>
    <circle cx="6" cy="-10" r="3.5" fill="#fbbf24"/>
  </g>
  <text x="50%" y="${height / 2 + 32}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="0.02em">${cleanLabel}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export default getSvgPlaceholder;
