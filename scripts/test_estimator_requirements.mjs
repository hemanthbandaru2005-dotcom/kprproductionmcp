import { generateEstimatePdf } from '../src/utils/estimatorPdfService.js';
import { getApplicableCatalogPackages } from '../src/utils/catalogService.js';
import { OFFICIAL_PHOTOGRAPHY_PACKAGES } from '../src/utils/packagesService.js';
import assert from 'assert';
import zlib from 'zlib';

function extractPdfText(doc) {
  const raw = doc.output();
  let textParts = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(raw)) !== null) {
    try {
      const buf = Buffer.from(match[1], 'binary');
      const uncompressed = zlib.inflateSync(buf).toString('latin1');
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(uncompressed)) !== null) {
        textParts.push(tjMatch[1].replace(/\\/g, ''));
      }
    } catch (e) {
    }
  }
  return textParts.join(' ');
}

console.log('=== RUNNING ESTIMATOR VERIFICATION TESTS ===\n');

// ── TEST 1: Single Event (Wedding) ──
console.log('--- TEST 1: Single Event (Wedding) ---');
const singleEventCatalog = getApplicableCatalogPackages(['Wedding'], OFFICIAL_PHOTOGRAPHY_PACKAGES);
console.log(`Applicable packages for ['Wedding']: ${singleEventCatalog.length}`);
assert(singleEventCatalog.length > 0, 'Catalog should return packages for Wedding');

const estimateData1 = {
  customerName: 'Ananya Sharma',
  customerPhone: '9849443648',
  eventDate: '2026-11-20',
  eventTime: '10:00',
  eventLocation: 'Hyderabad, Telangana',
  selectedEvents: ['Wedding'],
  selectedPackages: singleEventCatalog.slice(0, 2),
  album: { needAlbum: true, sheets: 30, price: 7500 },
  deliverables: ['High-res cloud gallery'],
  addOns: [],
  servicesSubtotal: singleEventCatalog.slice(0, 2).reduce((s, p) => s + p.price, 0),
  albumSubtotal: 7500,
  addOnsSubtotal: 0,
  grandTotal: singleEventCatalog.slice(0, 2).reduce((s, p) => s + p.price, 0) + 7500
};

const pdfDoc1 = generateEstimatePdf(estimateData1, false);
const pdfText1 = extractPdfText(pdfDoc1);
assert(pdfText1.includes('Wedding'), 'PDF must include Wedding');
console.log('✓ Test 1 Passed: Single event appears in catalog and PDF\n');

// ── TEST 2: Multiple Events (Wedding + Reception + Mehendi) ──
console.log('--- TEST 2: Multiple Events (Wedding + Reception + Mehendi) ---');
const multiEvents = ['Wedding', 'Reception', 'Mehendi'];
const multiEventCatalog = getApplicableCatalogPackages(multiEvents, OFFICIAL_PHOTOGRAPHY_PACKAGES);
console.log(`Applicable packages for [${multiEvents.join(', ')}]: ${multiEventCatalog.length}`);
assert(multiEventCatalog.length > 0, 'Catalog should return packages for multi events');

// Verify no duplicates in catalog
const pkgIds = multiEventCatalog.map(p => p.id);
const uniqueIds = new Set(pkgIds);
assert.strictEqual(pkgIds.length, uniqueIds.size, 'No duplicate catalog package entries allowed');

const estimateData2 = {
  customerName: 'Rahul & Sneha',
  customerPhone: '9849443648',
  eventDate: '2026-12-15',
  eventTime: '18:00',
  eventLocation: 'Warangal, Telangana',
  selectedEvents: multiEvents,
  selectedPackages: multiEventCatalog.filter(p => p.id === 'pkg-1' || p.id === 'pkg-2' || p.id === 'pkg-3'),
  album: { needAlbum: true, sheets: 40, price: 10000 },
  deliverables: ['Cloud link', 'Teaser'],
  addOns: [],
  servicesSubtotal: 24000,
  albumSubtotal: 10000,
  addOnsSubtotal: 0,
  grandTotal: 34000
};

const pdfDoc2 = generateEstimatePdf(estimateData2, false);
const pdfText2 = extractPdfText(pdfDoc2);
multiEvents.forEach(ev => {
  assert(pdfText2.includes(ev), `PDF must include selected event: ${ev}`);
});
console.log('✓ Test 2 Passed: All 3 selected events appear in catalog logic and PDF\n');

// ── TEST 3: Multiple Events + Multiple Packages ──
console.log('--- TEST 3: Multiple Events + Multiple Packages ---');
const test3Events = ['Wedding', 'Reception', 'Mehendi', 'Bridal Portraits'];
const test3Catalog = getApplicableCatalogPackages(test3Events, OFFICIAL_PHOTOGRAPHY_PACKAGES);
const test3Packages = test3Catalog.filter(p => ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4'].includes(p.id));

const estimateData3 = {
  customerName: 'Priya & Vikram',
  customerPhone: '9849443648',
  eventDate: '2026-10-05',
  eventTime: '09:00',
  eventLocation: 'Hyderabad, Telangana',
  selectedEvents: test3Events,
  selectedPackages: test3Packages,
  album: { needAlbum: true, sheets: 50, price: 12500 },
  deliverables: ['Full master archive', 'Cinematic highlight film'],
  addOns: [{ id: 'addon-led-screen', name: 'LED Video Wall', price: 16000, quantity: 1, scope: '6 hours' }],
  servicesSubtotal: test3Packages.reduce((s, p) => s + p.price, 0),
  albumSubtotal: 12500,
  addOnsSubtotal: 16000,
  grandTotal: test3Packages.reduce((s, p) => s + p.price, 0) + 12500 + 16000
};

const pdfDoc3 = generateEstimatePdf(estimateData3, false);
const pdfText3 = extractPdfText(pdfDoc3);
test3Events.forEach(ev => {
  assert(pdfText3.includes(ev), `PDF must include event: ${ev}`);
});
test3Packages.forEach(pkg => {
  assert(pdfText3.includes(pkg.name), `PDF must include package: ${pkg.name}`);
});
console.log('✓ Test 3 Passed: Multiple events and packages properly reflected in PDF\n');

// ── TEST 4: Custom Sheets = 250 ──
console.log('--- TEST 4: Custom Sheets = 250 ---');
const customSheets = 250;
const customSheetsPrice = 250 * 250; // 62,500
const estimateData4 = {
  customerName: 'Kavitha Rao',
  customerPhone: '9849443648',
  eventDate: '2026-12-25',
  eventTime: '11:00',
  eventLocation: 'Secunderabad',
  selectedEvents: ['Wedding', 'Reception'],
  selectedPackages: [
    { id: 'pkg-3', name: 'Candid Photography', category: 'Photography', duration: '6 hours', price: 12000 }
  ],
  album: { needAlbum: true, sheets: customSheets, price: customSheetsPrice },
  deliverables: ['Color graded photos'],
  addOns: [],
  servicesSubtotal: 12000,
  albumSubtotal: customSheetsPrice,
  addOnsSubtotal: 0,
  grandTotal: 12000 + customSheetsPrice
};

const pdfDoc4 = generateEstimatePdf(estimateData4, false);
const pdfText4 = extractPdfText(pdfDoc4);
assert(pdfText4.includes('250 Custom Sheets') || pdfText4.includes('250 Sheets'), 'PDF must include 250 Sheets');
assert(pdfText4.includes('500 Pages') || (pdfText4.includes('500') && pdfText4.includes('Pages')), 'PDF must include 500 Pages');
assert(pdfText4.includes('62,500'), 'PDF must include 62,500 for album price');
console.log('✓ Test 4 Passed: 250 custom sheets correctly calculated and displayed in PDF\n');

// ── TEST 5: PDF Content Checks ──
console.log('--- TEST 5: Strict PDF Content Checks ---');
// 1. Must say Photography, not FOTOGRAPY in Category or Studio
assert(!pdfText4.includes('FOTOGRAPY'), 'PDF must NEVER contain FOTOGRAPY');
assert(pdfText4.includes('Photography'), 'PDF must contain "Photography" for table category');
assert(pdfText4.includes('Event Fotography'), 'PDF must contain "Event Fotography" in studio subtitle');

// 2. Must NOT contain Colourlab / Colorlab anywhere
assert(!pdfText4.toLowerCase().includes('colourlab'), 'PDF must NEVER contain "Colourlab"');
assert(!pdfText4.toLowerCase().includes('colorlab'), 'PDF must NEVER contain "Colorlab"');
assert(!pdfText4.toLowerCase().includes('color lab'), 'PDF must NEVER contain "Color Lab"');

// 3. Must NOT contain 9849390876
assert(!pdfText4.includes('9849390876'), 'PDF must NEVER contain "9849390876"');

// 4. Must keep other existing phone number: 98494 43648
assert(pdfText4.includes('98494 43648') || pdfText4.includes('9849443648'), 'PDF must keep phone number 98494 43648');

// 5. Check calculation accuracy
assert(pdfText4.includes('74,500'), 'Grand total 12000 + 62500 = 74,500 must be in PDF');

console.log('✓ Test 5 Passed: All content restrictions and requirements 100% verified!\n');

// ── TEST 6: Celebration Schedules without Step 1 eventDate / eventTime ──
console.log('--- TEST 6: Per-Celebration Dates (Step 1 dates omitted) ---');
const estimateData6 = {
  customerName: 'Hemanth Bandaru',
  customerPhone: '9849443648',
  eventDate: '',
  eventTime: '',
  eventLocation: 'Warangal, Telangana',
  selectedEvents: ['Wedding', 'Pre-Wedding', 'Engagement', 'Reception'],
  eventSchedules: {
    'Wedding': { date: '2026-11-20', time: '09:00', serviceIds: ['pkg-1'] },
    'Pre-Wedding': { date: '2026-11-15', time: '16:00', serviceIds: ['pkg-3'] },
    'Engagement': { date: '2026-10-10', time: '10:30', serviceIds: ['pkg-2'] },
    'Reception': { date: '2026-11-21', time: '18:30', serviceIds: ['pkg-4'] }
  },
  selectedPackages: [
    { id: 'pkg-1', name: 'Traditional Photography', category: 'Photography', duration: '6 hours', price: 8000, eventDate: '2026-11-20', eventTime: '09:00', eventTag: 'Wedding' },
    { id: 'pkg-3', name: 'Candid Photography', category: 'Photography', duration: '6 hours', price: 12000, eventDate: '2026-11-15', eventTime: '16:00', eventTag: 'Pre-Wedding' }
  ],
  album: { needAlbum: false, sheets: 0, price: 0 },
  deliverables: ['Cloud delivery'],
  addOns: [],
  servicesSubtotal: 20000,
  albumSubtotal: 0,
  addOnsSubtotal: 0,
  grandTotal: 20000
};

const pdfDoc6 = generateEstimatePdf(estimateData6, false);
const pdfText6 = extractPdfText(pdfDoc6);
assert(pdfText6.includes('2026-11-20'), 'PDF must include Wedding date');
assert(pdfText6.includes('2026-11-15'), 'PDF must include Pre-Wedding date');
assert(pdfText6.includes('Wedding'), 'PDF must include Wedding celebration');
assert(pdfText6.includes('Pre-Wedding'), 'PDF must include Pre-Wedding celebration');
assert(!pdfText6.includes('Date to be confirmed'), 'PDF should not say Date to be confirmed when celebrations are scheduled');
console.log('✓ Test 6 Passed: Per-celebration dates properly rendered without Step 1 primary dates\n');

// ── TEST 7: Multiple Event Dates, Start/End Time, and Area Label in PDF ──
console.log('--- TEST 7: Multiple Event Dates, Start/End Time, and Area in PDF ---');
const estimateData7 = {
  customerName: 'Suresh Reddy',
  customerPhone: '9849443648',
  eventDates: ['2026-11-20', '2026-11-21', '2026-11-22'],
  eventDate: '2026-11-20',
  startTime: '09:30 AM',
  endTime: '08:30 PM',
  eventLocation: 'Banjara Hills, Hyderabad',
  selectedEvents: ['Wedding', 'Vratham', 'Corporate Events'],
  selectedPackages: [
    { id: 'pkg-1', name: 'Traditional Photography', category: 'Photography', duration: 'Full Day', price: 8000 }
  ],
  album: { needAlbum: false, sheets: 0, price: 0 },
  deliverables: ['Cloud delivery'],
  addOns: [],
  servicesSubtotal: 8000,
  albumSubtotal: 0,
  addOnsSubtotal: 0,
  grandTotal: 8000
};

const pdfDoc7 = generateEstimatePdf(estimateData7, false);
const pdfText7 = extractPdfText(pdfDoc7);

assert(pdfText7.includes('2026-11-20'), 'PDF must include date 1');
assert(pdfText7.includes('2026-11-21'), 'PDF must include date 2');
assert(pdfText7.includes('2026-11-22'), 'PDF must include date 3');
assert(pdfText7.includes('09:30 AM'), 'PDF must include starting time 09:30 AM');
assert(pdfText7.includes('08:30 PM'), 'PDF must include ending time 08:30 PM');
assert(pdfText7.includes('Area: Banjara Hills, Hyderabad'), 'PDF must include Area label and value');
assert(!pdfText7.includes('Event Location:'), 'PDF must NOT include old "Event Location:" label');
console.log('✓ Test 7 Passed: Multiple event dates, start/end time, and Area label rendered in PDF\n');

// ── TEST 8: Step 2 Categories and Step 3 Package Filtering ──
console.log('--- TEST 8: Step 2 Categories and Step 3 Sangeeth Exclusion ---');
import('../src/utils/catalogService.js').then(({ EVENT_CATEGORIES, getApplicableCatalogPackages }) => {
  const weddingCat = EVENT_CATEGORIES.find(c => c.group.includes('Wedding'));
  assert(weddingCat, 'Wedding category must exist');
  assert(weddingCat.items.includes('Vratham'), 'Wedding must include Vratham');
  assert(weddingCat.items.includes('Pre-Wedding (Song Shoot)'), 'Wedding must include Pre-Wedding (Song Shoot)');
  assert(!weddingCat.items.includes('Pre-Wedding'), 'Old Pre-Wedding should be replaced by Pre-Wedding (Song Shoot)');

  const bdayCat = EVENT_CATEGORIES.find(c => c.group.includes('Birthday'));
  assert(bdayCat, 'Birthday category must exist');
  assert.deepStrictEqual(bdayCat.items, ['Birthday', 'Pre-Birthday', 'Kids Birthday'], 'Birthday must ONLY have Birthday, Pre-Birthday, Kids Birthday');

  const commCat = EVENT_CATEGORIES.find(c => c.group.includes('Commercial'));
  assert(commCat, 'Commercial Events category must exist');
  assert.deepStrictEqual(commCat.items, ['Corporate Events', 'Shopping Mall Opening', 'Hospital Events'], 'Commercial Events items must match');

  const step3Packages = getApplicableCatalogPackages(['Wedding', 'Sangeeth', 'Corporate Events']);
  const hasSangeeth = step3Packages.some(p => p.id === 'pkg-sangeeth-1' || p.name.toLowerCase().includes('sangeeth'));
  assert(!hasSangeeth, 'Sangeeth package must NEVER be present in Step 3 package options');

  console.log('✓ Test 8 Passed: Step 2 categories and Step 3 Sangeeth exclusion fully verified!\n');
  console.log('🎉 ALL 8 TEST CASES PASSED SUCCESSFULLY!');
});
