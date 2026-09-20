// Test getBookDimensions across all device categories
function getBookDimensions(w, h = 800) {
  let baseW = 345;
  let baseH = 230;

  // 1. MOBILE VIEW: 100% UNTOUCHED ("dont touch mobile")
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
    // Tablet landscape
    baseW = 264;
    baseH = 176;
  } else if (w < 1366) {
    // Compact laptop (e.g. 1280x800)
    baseW = 300;
    baseH = 200;
  } else if (w < 1440) {
    // 1366px laptop (1366x768)
    baseW = 318;
    baseH = 212;
  } else if (w < 1600) {
    // 1440px laptop (1440x900 reference laptop) - ENLARGED (+21%)
    baseW = 345;
    baseH = 230;
  } else if (w < 1920) {
    // 1600px desktop monitor - ENLARGED
    baseW = 375;
    baseH = 250;
  } else {
    // 1920px+ Full HD / QHD desktop computer view - ENLARGED (+23%)
    baseW = 405;
    baseH = 270;
  }

  // Height-constraint protection
  if (w >= 1024 && h < 850) {
    const maxAllowedH = Math.max(150, Math.floor(h * 0.28));
    if (baseH > maxAllowedH) {
      baseH = maxAllowedH;
      baseW = Math.round(baseH * 1.5);
    }
  }

  return { singlePageW: baseW, singlePageH: baseH };
}

const testCases = [
  // Mobile (Must be UNTOUCHED)
  { name: 'Mobile OnePlus/Oppo (360x800)', w: 360, h: 800, expectedW: 144, expectedH: 96, isMobile: true },
  { name: 'Mobile OnePlus Nord (392x872)', w: 392, h: 872, expectedW: 156, expectedH: 104, isMobile: true },
  { name: 'Mobile OnePlus 11/12 (412x915)', w: 412, h: 915, expectedW: 156, expectedH: 104, isMobile: true },
  
  // Laptops (Enlarged)
  { name: 'Standard Laptop (1366x768)', w: 1366, h: 768, isLaptop: true },
  { name: 'Reference Laptop 16:10 (1440x900)', w: 1440, h: 900, isLaptop: true },
  { name: 'Modern Laptop (1536x864)', w: 1536, h: 864, isLaptop: true },
  
  // Computers (Desktop, Enlarged)
  { name: 'Desktop 1600 (1600x900)', w: 1600, h: 900, isComputer: true },
  { name: 'Desktop Full HD (1920x1080)', w: 1920, h: 1080, isComputer: true },
  { name: 'Desktop 2K QHD (2560x1440)', w: 2560, h: 1440, isComputer: true },
];

console.log('=== VERIFYING ENLARGED LAPTOP/COMPUTER BOOK & UNTOUCHED MOBILE ===\n');

let allPassed = true;

for (const tc of testCases) {
  const { singlePageW, singlePageH } = getBookDimensions(tc.w, tc.h);
  const spreadW = singlePageW * 2;
  const ratio = (singlePageW / singlePageH).toFixed(2);

  console.log(`${tc.name}:`);
  console.log(`  Single Page: ${singlePageW}x${singlePageH}px | Spread: ${spreadW}x${singlePageH}px`);
  console.log(`  Aspect Ratio: ${ratio} (Target: 1.50)`);

  if (tc.isMobile) {
    if (singlePageW === tc.expectedW && singlePageH === tc.expectedH) {
      console.log('  Status: PASS (Mobile remains 100% UNTOUCHED)');
    } else {
      console.error(`  Status: FAIL (Mobile was altered! Expected ${tc.expectedW}x${tc.expectedH})`);
      allPassed = false;
    }
  } else if (tc.isLaptop) {
    if (singlePageW >= 300) {
      console.log(`  Status: PASS (Laptop book enlarged successfully: +${Math.round((singlePageW - 285) / 285 * 100)}% over original 285px)`);
    } else {
      console.error('  Status: FAIL (Laptop book not enlarged!)');
      allPassed = false;
    }
  } else if (tc.isComputer) {
    if (singlePageW >= 375) {
      console.log(`  Status: PASS (Computer view book enlarged successfully: +${Math.round((singlePageW - 330) / 330 * 100)}% over original 330px)`);
    } else {
      console.error('  Status: FAIL (Computer view book not enlarged!)');
      allPassed = false;
    }
  }
  console.log('');
}

if (allPassed) {
  console.log('ALL ENLARGEMENT & RESPONSIVE CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
