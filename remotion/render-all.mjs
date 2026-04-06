import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

mkdirSync('out', { recursive: true });

const slides = [
  { id: 'Slide01', name: 'splash' },
  { id: 'Slide02', name: 'pin' },
  { id: 'Slide03', name: 'home' },
  { id: 'Slide04', name: 'diario' },
  { id: 'Slide05', name: 'checkin' },
  { id: 'Slide06', name: 'percorso' },
  { id: 'Slide07', name: 'impostazioni' },
  { id: 'Slide08', name: 'motivazioni' },
];

for (const slide of slides) {
  const output = `out/${slide.id}-${slide.name}.png`;
  const cmd = `npx remotion still src/index.ts ${slide.id} ${output}`;
  console.log(`\nRendering ${slide.id} → ${output}`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('\n✓ Tutti e 8 gli screenshot renderizzati in out/');
