import { OFFICIAL_PHOTOGRAPHY_PACKAGES } from './packagesService.js';

// ── STEP 2: Grouped Event Categories with multi-select (Exact 5 Categories) ──
export const EVENT_CATEGORIES = [
  {
    group: '💍 Wedding & Couple Events',
    items: [
      'Wedding',
      'Pre-Wedding',
      'Engagement',
      'Reception',
      'Haldi',
      'Mehendi',
      'Sangeeth',
      'Bridal Shower',
      'Groom Ceremony',
      'Wedding Anniversary',
      'Destination Wedding',
      'Couple Shoot',
      'Bridal Portraits',
      'Groom Portraits'
    ]
  },
  {
    group: '🎂 Birthdays & Milestones',
    items: [
      '1st Birthday',
      'Kids Birthday',
      'Adult Milestone Birthday',
      'Half Birthday'
    ]
  },
  {
    group: '👶 Baby & Family',
    items: [
      'Maternity',
      'Newborn / Baby Shoot',
      'Cradle Ceremony',
      'Annaprashana',
      'Dhothi / Saree Function',
      'Family Portraits'
    ]
  },
  {
    group: '🎓 Personal, Academic & Lifestyle',
    items: [
      'Graduation / Convocation',
      'Fashion / Model Shoot',
      'Individual Portrait',
      'Travel / Vacation Shoot',
      'Housewarming'
    ]
  },
  {
    group: '🎭 Culture & Celebrations',
    items: [
      'Festival Celebrations',
      'Religious / Spiritual Ceremonies',
      'Dance / Music Performances',
      'Sports & Fitness Events'
    ]
  }
];

/**
 * Catalog Generation Logic (Requirement 6):
 * Iterates through all selected events, identifies applicable catalog/package information,
 * includes it in the result, and prevents duplicate entries.
 */
export function getApplicableCatalogPackages(selectedEvents, allPackages = OFFICIAL_PHOTOGRAPHY_PACKAGES) {
  const events = Array.isArray(selectedEvents) && selectedEvents.length > 0 ? selectedEvents : ['Wedding'];
  const catalogMap = new Map();

  for (const eventName of events) {
    const evLower = eventName.toLowerCase();
    
    for (const pkg of allPackages) {
      // Exclude removed packages (Corporate, Mall, and Per-sheet item)
      if (pkg.id === 'pkg-corp-1' || pkg.id === 'pkg-mall-1' || pkg.id === 'pkg-12' || pkg.name === 'Each Album One Sheet') {
        continue;
      }

      // Check event applicability:
      // Standard packages (Traditional Photo, Candid, Traditional Video, Cinematic Video, Drone, Teaser, Live Link, LED, Editing)
      // apply to all photography/videography events.
      // Sangeeth package is specific to Sangeeth or wedding/reception/celebration events.
      let isApplicable = true;
      if (pkg.id === 'pkg-sangeeth-1' || pkg.name.toLowerCase().includes('sangeeth')) {
        const isWeddingOrSangeeth = /sangeeth|wedding|reception|mehendi|haldi|bridal|groom|couple/i.test(evLower);
        if (!isWeddingOrSangeeth && !events.some(e => /sangeeth|wedding/i.test(e))) {
          isApplicable = false;
        }
      }

      if (isApplicable) {
        if (!catalogMap.has(pkg.id)) {
          catalogMap.set(pkg.id, {
            ...pkg,
            applicableEvents: [eventName]
          });
        } else {
          const existing = catalogMap.get(pkg.id);
          if (!existing.applicableEvents.includes(eventName)) {
            existing.applicableEvents.push(eventName);
          }
        }
      }
    }
  }

  // Safety fallback: if no event-specific matches, supply standard active packages
  if (catalogMap.size === 0) {
    allPackages.forEach(pkg => {
      if (pkg.id !== 'pkg-corp-1' && pkg.id !== 'pkg-mall-1' && pkg.id !== 'pkg-12' && pkg.name !== 'Each Album One Sheet') {
        catalogMap.set(pkg.id, { ...pkg, applicableEvents: events });
      }
    });
  }

  return Array.from(catalogMap.values());
}
