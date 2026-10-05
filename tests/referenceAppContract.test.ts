import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const client = readFileSync(new URL('../src/lib/secApi.ts', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> };

test('the machine API adapter is explicitly server-only', () => {
  assert.match(client, /import 'server-only'/);
  assert.match(client, /process\.env\.GRIZZLY_BULLS_API_KEY/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_/);
});

test('the reference app points at the versioned public SEC API rather than SEC.gov', () => {
  assert.match(client, /GRIZZLY_BULLS_SEC_API_BASE_URL/);
  assert.doesNotMatch(client, /sec\.gov/i);
  assert.match(envExample, /GRIZZLY_BULLS_API_KEY=your_key_here/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_/);
});

test('one check command covers lint, types, tests, and production build', () => {
  assert.match(packageJson.scripts.check, /pnpm lint/);
  assert.match(packageJson.scripts.check, /pnpm typecheck/);
  assert.match(packageJson.scripts.check, /pnpm test/);
  assert.match(packageJson.scripts.check, /pnpm build/);
});
