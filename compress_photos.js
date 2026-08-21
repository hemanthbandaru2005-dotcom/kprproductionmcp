import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const categoryDirs = [
  '21', 'birthday', 'engagement', 'haldi', 'modeling', 
  'maternity', 'nature', 'panchalu', 'pre_wedding', 
  'reception', 'saree_function', 'wedding', 'packages'
];

async function optimizeImages() {
  let totalSavedBytes = 0;
  let processedCount = 0;

  for (const cat of categoryDirs) {
    const dirPath = path.join('./public/images', cat);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
    });

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      // Only compress files larger than 400KB
      if (stats.size > 400000) {
        try {
          const inputBuffer = fs.readFileSync(filePath);
          const compressedBuffer = await sharp(inputBuffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

          const saved = stats.size - compressedBuffer.length;
          totalSavedBytes += saved;

          fs.writeFileSync(filePath, compressedBuffer);
          processedCount++;
          console.log(`Optimized ${cat}/${file}: ${(stats.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedBuffer.length / 1024).toFixed(0)}KB`);
        } catch (err) {
          console.error(`Error processing ${filePath}:`, err.message);
        }
      }
    }
  }

  console.log(`Optimization Complete! ${processedCount} images optimized. Total space saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
}

optimizeImages();
