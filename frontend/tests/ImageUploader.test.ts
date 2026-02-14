import { readFileSync } from 'fs';
import { resolve } from 'path';

test('ImageUploader component exists and contains file input', () => {
  const filePath = resolve(__dirname, '../src/lib/components/ImageUploader.svelte');
  const content = readFileSync(filePath, 'utf8');
  expect(content).toMatch(/<input[^>]*type="file"/);
});