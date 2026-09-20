// Test getBookDimensions across the 5 target viewports
function getBookDimensions(w, h = 800) {
  let baseW = 285;
  let baseH = 190;

  if (w < 380) {
    baseW = 144;
    baseH = 96;
  } else if (w < 480) {
    baseW = 156;
    baseH = 104;
  } else if (w < 640) {
    baseW = 180;
    baseH = 120;
  } else if (w < 768) {
    baseW = 210;
    baseH = 140;
  } else if (w < 1024) {
    baseW = 240;
    baseH = 160;
  } else if (w < 1366) {
    baseW = 264;
    baseH = 176;
  } else if (w < 1440) {
    // 1366px - 1439px desktop/laptop (e.g. 1366x768)
    baseW = 276;
    baseH = 184;
  } else if (w < 1600) {
    // 1440px reference laptop
    baseW = 285;
    baseH = 190;
  } else if (w < 1920) {
    // 1600px desktop
    baseW = 306;
    baseH = 204;
  } else {
    // 1920px+ Full HD desktop
    baseW = 330;
    baseH = 220;
  }

  // Height-constraint protection
  if (w >= 1024 && h < 850) {
    const maxAllowedH = Math.max(140, Math.floor(h * 0.23));
    if (baseH > maxAllowedH) {
      baseH = maxAllowedH;
      baseW = Math.round(baseH * 1.5);
    }
  }

  return { singlePageW: baseW, singlePageH: baseH };
}

const testViewports = [
  { name: '1920x1080 (FHD Desktop)', w: 1920, h: 1080 },
  { name: '1536x864 (Windows 125% Laptop)', w: 1536, h: 864 },
  { name: '1440x900 (Reference Laptop 16:10)', w: 1440, h: 900 },
  { name: '1366x768 (Standard Laptop)', w: 1366, h: 768 },
  { name: '1280x720 (720p HD Laptop/Display)', w: 1280, h: 720 },
];

console.log('=== VERIFYING RESPONSIVE ALBUM DIMENSIONS ===\n');

let allPassed = true;

for (const vp of testViewports) {
  const { singlePageW, singlePageH } = getBookDimensions(vp.w, vp.h);
  const spreadW = singlePageW * 2;
  const ratio = (singlePageW / singlePageH).toFixed(2);
  const fitsSpread = spreadW < vp.w * 0.9;
  const reasonableHeight = singlePageH <= vp.h * 0.25;

  console.log(`Viewport: ${vp.name}`);
  console.log(`  Dimensions: Page ${singlePageW}x${singlePageH}px | Spread ${spreadW}x${singlePageH}px`);
  console.log(`  Aspect ratio: ${ratio} (Target: 1.50)`);
  console.log(`  Spread fits width (< 90%): ${fitsSpread ? 'PASS' : 'FAIL'}`);
  console.log(`  Height fits viewport (< 25%): ${reasonableHeight ? 'PASS' : 'FAIL'}`);
  
  if (!fitsSpread || !reasonableHeight) {
    allPassed = false;
  }
  console.log('');
}

// Check 1440x900 reference consistency
const refDims = getBookDimensions(1440, 900);
if (refDims.singlePageW === 285 && refDims.singlePageH === 190) {
  console.log('PASS: 1440x900 reference dimensions EXACTLY MATCH 285x190px (Existing reference design maintained!)');
} else {
  console.error('FAIL: 1440x900 reference dimensions changed!', refDims);
  allPassed = false;
}

if (allPassed) {
  console.log('\nALL RESPONSIVE CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('\nSOME CHECKS FAILED!');
  process.exit(1);
}
