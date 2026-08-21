import fs from 'fs';
import path from 'path';

const srcDir = './21';
const destDir = './public/images/21';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach((f, i) => {
  const destPath = path.join(destDir, `photo_${i + 1}.jpg`);
  fs.copyFileSync(path.join(srcDir, f), destPath);
  console.log(`Copied ${f} -> ${destPath}`);
});
