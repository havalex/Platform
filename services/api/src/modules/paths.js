import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const FORGE_DATA_DIR = process.env.FORGE_DATA_DIR
  || path.join(__dirname, '..', '..', '..', '..', 'data');

export const MODULES_DIR = path.join(FORGE_DATA_DIR, 'modules');

export function moduleDir(id, version) {
  return path.join(MODULES_DIR, id, version);
}

export function bundlePath(id, version) {
  return path.join(moduleDir(id, version), 'dist', 'index.js');
}

export function ensureModulesDir() {
  fs.mkdirSync(MODULES_DIR, { recursive: true });
}

/** Seed built-in modules from monorepo `platform/modules/` */
export function builtinModulesSourceRoot() {
  return path.join(__dirname, '..', '..', '..', '..', 'modules');
}
