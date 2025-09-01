import fs from 'fs/promises';
import path from 'path';

export async function obterListaSwitches() {
  const filePath = path.resolve('./switches.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}