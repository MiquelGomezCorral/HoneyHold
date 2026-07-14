// Stamps the version chosen by semantic-release into the single user-visible
// VERSION constant (shown in the "About HoneyHold" modal).
//
// Invoked by @semantic-release/exec during the `prepare` step:
//   node scripts/sync-version.mjs <version>
//
// The updated file is committed back by @semantic-release/git (see .releaserc.json).
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!version) {
  console.error('sync-version: missing <version> argument');
  process.exit(1);
}

const configPath = 'frontend/src/lib/config.ts';
const config = readFileSync(configPath, 'utf8');
const updated = config.replace(
  /export const VERSION = '[^']*';/,
  `export const VERSION = '${version}';`,
);
if (updated === config) {
  console.error(`sync-version: could not find the VERSION constant in ${configPath}`);
  process.exit(1);
}
writeFileSync(configPath, updated);
console.log(`sync-version: ${configPath} -> ${version}`);
