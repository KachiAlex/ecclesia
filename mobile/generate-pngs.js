const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG as base64
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, 'assets');

// Ensure directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write PNG files
fs.writeFileSync(path.join(assetsDir, 'icon.png'), minimalPNG);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), minimalPNG);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), minimalPNG);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), minimalPNG);
fs.writeFileSync(path.join(assetsDir, 'logo.png'), minimalPNG);

console.log('✅ All PNG files created successfully');
