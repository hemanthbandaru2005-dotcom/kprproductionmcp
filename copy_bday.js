import fs from 'fs';
import path from 'path';

const srcDir = './Birthday';
const destDir = './public/images/birthday';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));

console.log(`Found ${files.length} birthday photos to process.`);

files.forEach((f, i) => {
  const destName = `bday_${i + 1}.jpg`;
  const destPath = path.join(destDir, destName);
  fs.copyFileSync(path.join(srcDir, f), destPath);
});

console.log(`Successfully copied ${files.length} Birthday photos into ${destDir}`);
