import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categories = [
  { name: '21st Birthday', file: 'birthday_21.svg' },
  { name: 'Birthday', file: 'birthday.svg' },
  { name: 'Engagement', file: 'engagement.svg' },
  { name: 'Haldi', file: 'haldi.svg' },
  { name: 'Modeling', file: 'modeling.svg' },
  { name: 'Maternity', file: 'maternity.svg' },
  { name: 'Nature', file: 'nature.svg' },
  { name: 'Panchalu', file: 'panchalu.svg' },
  { name: 'Pre Wedding', file: 'pre_wedding.svg' },
  { name: 'Reception', file: 'reception.svg' },
  { name: 'Saree Function', file: 'saree_function.svg' },
  { name: 'Wedding', file: 'wedding.svg' }
];

categories.forEach(c => {
  const svg = `<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="1000" fill="#1A1A1A"/>
  <rect x="25" y="25" width="750" height="950" stroke="#C5A880" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.5"/>
  <circle cx="400" cy="440" r="50" fill="#262626" stroke="#C5A880" stroke-width="2"/>
  <path d="M380 440 H420 M400 420 V460" stroke="#C5A880" stroke-width="3" stroke-linecap="round"/>
  <text x="400" y="540" text-anchor="middle" fill="#FFFFFF" font-family="serif" font-size="36" letter-spacing="4">${c.name.toUpperCase()}</text>
  <text x="400" y="580" text-anchor="middle" fill="#C5A880" font-family="sans-serif" font-size="14" letter-spacing="3">ADD YOUR PHOTO HERE</text>
  <text x="400" y="610" text-anchor="middle" fill="#888888" font-family="sans-serif" font-size="12">File path: public/images/${c.file}</text>
</svg>`;
  fs.writeFileSync(path.join(__dirname, 'public', 'images', c.file), svg);
});

console.log('All SVG placeholders created successfully!');
