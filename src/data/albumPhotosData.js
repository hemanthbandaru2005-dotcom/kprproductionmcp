/**
 * KPR PRODUCTIONS — INDIVIDUAL ALBUM PHOTO DATA (FULL BLEED PAGES)
 * 31 authentic Telugu Wedding & Event spreads split into perfectly matched Left & Right pages.
 * Total: 62 pages (31 matched 2-page spreads).
 */

export const FLEXY_ALBUM_PHOTOS = Array.from({ length: 62 }, (_, i) => ({
  id: i + 1,
  src: `/images/album/flexy/page_${String(i + 1).padStart(2, '0')}.jpg`
}));

export const FLEXY_PHOTO_URLS = FLEXY_ALBUM_PHOTOS.map(p => p.src);
