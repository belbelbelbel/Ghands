#!/usr/bin/env node
/**
 * Run from an Expo app root before `expo start` or before copying to a new repo.
 * Usage: node scripts/verify-expo-setup.mjs [projectRoot]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || process.cwd());

const required = [
  'package.json',
  'app.config.js',
  'app/_layout.tsx',
  'app/index.tsx',
  'metro.config.js',
  'babel.config.js',
  'global.css',
  'assets/images/icon.png',
];

const forbidden = ['App.tsx', 'App.jsx', 'App.js', 'app/provider/home.tsx'];

let failed = false;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}

console.log(`\nVerifying Expo project: ${root}\n`);

for (const rel of required) {
  if (fs.existsSync(path.join(root, rel))) ok(rel);
  else fail(`Missing: ${rel}`);
}

const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.main === 'expo-router/entry') ok('package.json main = expo-router/entry');
  else {
    fail(
      `package.json "main" must be "expo-router/entry" (found: ${JSON.stringify(pkg.main)}). ` +
        'Without it, Expo looks for App.tsx and you get "Unable to resolve ../../App".'
    );
  }
  const hasExpoRouter =
    pkg.dependencies?.['expo-router'] ||
    pkg.devDependencies?.['expo-router'] ||
    fs.existsSync(path.join(root, 'node_modules/expo-router'));
  if (!hasExpoRouter) {
    const parentPkg = path.join(root, '../../package.json');
    if (fs.existsSync(parentPkg)) {
      const parent = JSON.parse(fs.readFileSync(parentPkg, 'utf8'));
      if (parent.dependencies?.['expo-router']) ok('dependency expo-router (monorepo root)');
      else fail('Missing dependency: expo-router (add to package.json or run npm install)');
    } else fail('Missing dependency: expo-router');
  } else ok('dependency expo-router');
}

for (const rel of forbidden) {
  if (fs.existsSync(path.join(root, rel))) {
    fail(`Remove legacy file: ${rel} (provider routes belong in app/(tabs)/ only)`);
  }
}

if (fs.existsSync(path.join(root, 'app/provider'))) {
  fail('Delete folder app/provider/ — use app/(tabs)/ for provider tabs in a provider-only repo');
}

console.log('');
if (failed) {
  console.error('Fix the issues above before expo start or copying to a new repo.\n');
  process.exit(1);
}
console.log('Expo project structure looks good.\n');
