import fs from 'fs';
import path from 'path';

const categoryMappings = [
  { category: '21', folder: './photos/21', targetDir: './public/images/21', prefix: 'photo_21' },
  { category: 'Birthday', folder: './photos/Birthday', targetDir: './public/images/birthday', prefix: 'photo_bday' },
  { category: 'Engagement', folder: './photos/eng', targetDir: './public/images/engagement', prefix: 'photo_eng' },
  { category: 'Haldi', folder: './photos/Haldi', targetDir: './public/images/haldi', prefix: 'photo_haldi' },
  { category: 'Modeling', folder: './Madaling', targetDir: './public/images/modeling', prefix: 'photo_model' },
  { category: 'Maternity', folder: './photos/Metarniti', targetDir: './public/images/maternity', prefix: 'photo_mat' },
  { category: 'Nature', folder: './photos/Natur', targetDir: './public/images/nature', prefix: 'photo_nature' },
  { category: 'Panchalu', folder: './photos/Panchalu', targetDir: './public/images/panchalu', prefix: 'photo_panch' },
  { category: 'Pre Wedding', folder: './photos/Pre', targetDir: './public/images/pre_wedding', prefix: 'photo_pre' },
  { category: 'Reception', folder: './photos/Rece', targetDir: './public/images/reception', prefix: 'photo_rece' },
  { category: 'Saree Function', folder: './photos/Saree', targetDir: './public/images/saree_function', prefix: 'photo_saree' },
  { category: 'Wedding', folder: './photos/Wedding', targetDir: './public/images/wedding', prefix: 'photo_wed' }
];

const categoriesList = categoryMappings.map(m => m.category);

const allGalleryItems = [];

categoryMappings.forEach(mapping => {
  const { category, folder, targetDir, prefix } = mapping;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(folder)) {
    const files = fs.readdirSync(folder).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
    });

    console.log(`Processing ${category}: ${files.length} images found in ${folder}`);

    files.forEach((file, index) => {
      const ext = path.extname(file).toLowerCase();
      const newFilename = `${prefix}_${index + 1}${ext}`;
      const srcPath = path.join(folder, file);
      const destPath = path.join(targetDir, newFilename);

      fs.copyFileSync(srcPath, destPath);

      const publicUrl = `/images/${path.basename(targetDir)}/${newFilename}`;

      allGalleryItems.push({
        id: `${prefix}-${index + 1}`,
        title: `${category} Celebration ${String(index + 1).padStart(2, '0')}`,
        category: category,
        image: publicUrl,
        rawImage: publicUrl,
        location: 'KPR Photography Studio',
        story: `Authentic ${category} photography by KPR Production.`,
        camera: 'Professional Hasselblad & Sony Optics',
        exif: '1/250s • f/1.8 • ISO 100'
      });
    });
  } else {
    console.log(`Folder not found: ${folder} for category ${category}`);
  }
});

const galleryDataContent = `export const CATEGORIES = ${JSON.stringify(categoriesList, null, 2)};

export const GALLERY_ITEMS = ${JSON.stringify(allGalleryItems, null, 2)};
`;

fs.writeFileSync('./src/data/galleryData.js', galleryDataContent);
console.log(`Synced ${allGalleryItems.length} total photos into galleryData.js successfully!`);
