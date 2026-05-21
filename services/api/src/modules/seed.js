import fs from 'node:fs';
import path from 'node:path';
import { installModulePackage } from './install.js';
import { builtinModulesSourceRoot } from './paths.js';

/** Copy built-in modules from monorepo into platform_modules on startup */
export async function seedBuiltinModules() {
  const root = builtinModulesSourceRoot();
  if (!fs.existsSync(root)) return;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const modRoot = path.join(root, entry.name);
    const manifestPath = path.join(modRoot, 'module.json');
    const bundlePath = path.join(modRoot, 'dist', 'index.js');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(bundlePath)) continue;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const bundle = fs.readFileSync(bundlePath, 'utf-8');
    try {
      await installModulePackage({ manifest, bundle });
      console.log(`  📦 Module seeded: ${manifest.id}@${manifest.version}`);
    } catch (e) {
      console.warn(`  ⚠️  Seed ${entry.name}:`, e.message);
    }
  }
}
