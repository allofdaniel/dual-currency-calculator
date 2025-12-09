const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');

async function generateIcons() {
  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}.png`);
  }

  // Feature graphic (1024x500) for Play Store
  const featureGraphicSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1F2937"/>
          <stop offset="100%" style="stop-color:#111827"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#bg)"/>
      <text x="512" y="180" font-family="Arial, sans-serif" font-size="60" fill="#3B82F6" text-anchor="middle" font-weight="bold">환율 듀얼 계산기</text>
      <text x="512" y="250" font-family="Arial, sans-serif" font-size="30" fill="#9CA3AF" text-anchor="middle">Dual Currency Calculator</text>
      <text x="350" y="380" font-family="Arial, sans-serif" font-size="80" fill="#3B82F6" text-anchor="middle">$</text>
      <text x="512" y="380" font-family="Arial, sans-serif" font-size="60" fill="#10B981" text-anchor="middle">⇄</text>
      <text x="674" y="380" font-family="Arial, sans-serif" font-size="80" fill="#10B981" text-anchor="middle">₩</text>
    </svg>
  `;

  await sharp(Buffer.from(featureGraphicSvg))
    .resize(1024, 500)
    .png()
    .toFile(path.join(publicDir, 'feature-graphic.png'));

  console.log('Generated: feature-graphic.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
