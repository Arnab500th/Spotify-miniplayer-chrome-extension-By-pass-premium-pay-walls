#!/usr/bin/env node
// generate-icons.js — Generates PNG icons from SVG for the extension
// Run: node generate-icons.js
// Requires: npm install canvas (or use the pre-made SVGs directly)

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

// SVG template for the icon
function makeSVG(size) {
  const r = size * 0.12;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0a0a0f"/>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1db954"/>
      <stop offset="100%" stop-color="#0a8a3a"/>
    </linearGradient>
  </defs>
  <!-- Music note icon -->
  <g transform="translate(${size*0.18}, ${size*0.15})">
    <rect x="${size*0.22}" y="${size*0.08}" width="${size*0.06}" height="${size*0.38}" rx="${size*0.03}" fill="white"/>
    <rect x="${size*0.36}" y="0" width="${size*0.06}" height="${size*0.32}" rx="${size*0.03}" fill="white"/>
    <line x1="${size*0.25}" y1="${size*0.08}" x2="${size*0.39}" y2="0" stroke="white" stroke-width="${size*0.055}" stroke-linecap="round"/>
    <circle cx="${size*0.25}" cy="${size*0.46}" r="${size*0.09}" fill="white"/>
    <circle cx="${size*0.39}" cy="${size*0.38}" r="${size*0.09}" fill="white"/>
  </g>
</svg>`;
}

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = makeSVG(size);
  const outPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(outPath, svg);
  console.log(`✓ Generated icon${size}.svg`);
});

console.log('\nNote: For production, convert SVGs to PNGs using:');
console.log('  npx svgexport icons/icon16.svg icons/icon16.png');
console.log('  npx svgexport icons/icon48.svg icons/icon48.png');
console.log('  npx svgexport icons/icon128.svg icons/icon128.png');
console.log('\nOr simply rename the .svg files to .png — Chrome accepts SVG icons.');
