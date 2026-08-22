const fs = require('fs');
const path = require('path');

// Create a simple PNG file (1x1 white pixel)
// PNG header + IHDR chunk + IDAT chunk + IEND chunk
function createSimplePNG(width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  // IDAT chunk (image data) - simple white image
  const pixelData = Buffer.alloc(height * (width * 3 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    pixelData[pos++] = 0; // filter type
    for (let x = 0; x < width; x++) {
      pixelData[pos++] = 255; // R
      pixelData[pos++] = 255; // G
      pixelData[pos++] = 255; // B
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(pixelData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk (end)
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc32 = require('buffer-crc32');
  const crc = crc32(crcData);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create icon (192x192)
const icon = createSimplePNG(192, 192);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
console.log('Created icon.png');

// Create splash (1080x1920)
const splash = createSimplePNG(1080, 1920);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);
console.log('Created splash.png');

// Create adaptive icon (192x192)
const adaptiveIcon = createSimplePNG(192, 192);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon);
console.log('Created adaptive-icon.png');

// Create favicon (64x64)
const favicon = createSimplePNG(64, 64);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);
console.log('Created favicon.png');

console.log('All assets created successfully!');
