#!/usr/bin/env node
/**
 * Wrapper around the Blender asset pipeline, so building 3-D models is
 * `npm run models:build` rather than a long command nobody remembers.
 *
 *   npm run models:build                 # build every model
 *   npm run models:build -- bar-magnet   # build one model
 *
 * Blender is located in this order:
 *   1. BLENDER_PATH environment variable
 *   2. the path recorded for this project (Windows)
 *   3. `blender` on PATH
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'build_models.py');

const CANDIDATES = [
  process.env.BLENDER_PATH,
  'X:\\TheBleanderrr\\blender.exe',
  '/Applications/Blender.app/Contents/MacOS/Blender',
  '/usr/bin/blender',
].filter(Boolean);

function findBlender() {
  for (const candidate of CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  // Fall back to PATH and let spawn report if it isn't there.
  return 'blender';
}

const blender = findBlender();
const extraArgs = process.argv.slice(2);

console.log(`Using Blender: ${blender}`);
console.log(`Script: ${script}`);

const args = ['--background', '--python', script];
if (extraArgs.length > 0) args.push('--', ...extraArgs);

const result = spawnSync(blender, args, { stdio: 'inherit' });

if (result.error) {
  console.error('\nCould not run Blender.');
  console.error('Set BLENDER_PATH to your Blender executable, for example:');
  console.error('  set BLENDER_PATH=X:\\TheBleanderrr\\blender.exe   (Windows)');
  console.error('  export BLENDER_PATH=/usr/bin/blender             (macOS/Linux)');
  process.exit(1);
}

process.exit(result.status ?? 0);
