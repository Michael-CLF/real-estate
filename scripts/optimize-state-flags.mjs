import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const sourceDirectory = path.resolve('public/assets/images/state-flags');
const outputDirectory = path.resolve('public/assets/images/state-flags-webp');

import { readdir } from 'node:fs/promises';

const flags = (await readdir(sourceDirectory))
  .filter(file => file.endsWith('.svg'))
  .map(file => path.basename(file, '.svg'));

await mkdir(outputDirectory, { recursive: true });

for (const flag of flags) {
  const input = path.join(sourceDirectory, `${flag}.svg`);
  const output = path.join(outputDirectory, `${flag}.webp`);

  await sharp(input, { density: 192 })
    .resize(112, 72, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 85, effort: 6 })
    .toFile(output);

  const original = await stat(input);
  const optimized = await stat(output);

  const savings = (1 - optimized.size / original.size) * 100;

  console.log(`${flag.toUpperCase()} flag`);
  console.log(`Original: ${(original.size / 1024).toFixed(1)} KB`);
  console.log(`WebP: ${(optimized.size / 1024).toFixed(1)} KB`);
  console.log(`Reduction: ${savings.toFixed(1)}%`);
  console.log(`Saved to: ${output}`);
}
