import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicons() {
  const srcLogo = 'src/assets/kpr_productions_logo.png';
  if (!fs.existsSync(srcLogo)) {
    throw new Error('Source logo not found: ' + srcLogo);
  }

  // 1. Copy exact logo to public/kpr-productions-logo.png and public/logo.png
  fs.copyFileSync(srcLogo, 'public/kpr-productions-logo.png');
  fs.copyFileSync(srcLogo, 'public/logo.png');
  console.log('1. Copied kpr-productions-logo.png and logo.png');

  // 2. Generate crisp 512x512 square logo on solid white background
  const logoBuf = fs.readFileSync(srcLogo);
  const logoResized = await sharp(logoBuf)
    .resize(472, null, { fit: 'inside' })
    .toBuffer();

  const square512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: logoResized,
    gravity: 'center'
  }])
  .png({ compressionLevel: 9 })
  .toBuffer();

  fs.writeFileSync('public/favicon.png', square512);
  console.log('2. Created public/favicon.png (512x512)');

  // 3. Generate 192x192, 180x180, 48x48, 32x32, 16x16
  const s192 = await sharp(square512).resize(192, 192).png().toBuffer();
  fs.writeFileSync('public/favicon-192x192.png', s192);

  const s180 = await sharp(square512).resize(180, 180).png().toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', s180);

  const s48 = await sharp(square512).resize(48, 48).png().toBuffer();

  const s32 = await sharp(square512).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon-32x32.png', s32);

  const s16 = await sharp(square512).resize(16, 16).png().toBuffer();
  fs.writeFileSync('public/favicon-16x16.png', s16);
  console.log('3. Created 192x192, 180x180, 32x32, 16x16 PNGs');

  // 4. Create multi-resolution favicon.ico (16, 32, 48)
  const sizes = [16, 32, 48];
  const pngBuffers = [s16, s32, s48];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(sizes.length, 4); // count

  let offset = 6 + (16 * sizes.length);
  const dirEntries = [];
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  const icoBuf = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync('public/favicon.ico', icoBuf);
  console.log('4. Created public/favicon.ico (multi-resolution 16, 32, 48)');

  // 5. Create public/favicon.svg embedding the square logo
  const b64 = square512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#FFFFFF"/>
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgContent);
  console.log('5. Created public/favicon.svg');
}

generateFavicons()
  .then(() => console.log('All favicons generated successfully!'))
  .catch(err => {
    console.error('Error generating favicons:', err);
    process.exit(1);
  });
