import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHostedDemoRateLimiter,
  hostedDemoModeEnabled,
  identifyHostedDemoClient,
  resolveSecServerCredential,
} from '../src/lib/hostedDemo';

test('hosted demo mode is opt-in and selects only the dedicated credential', () => {
  assert.equal(hostedDemoModeEnabled({}), false);
  assert.equal(hostedDemoModeEnabled({ GRIZZLY_BULLS_SEC_DEMO_ENABLED: 'true' }), true);

  assert.deepEqual(
    resolveSecServerCredential({ GRIZZLY_BULLS_API_KEY: 'developer-key' }),
    { mode: 'developer', key: 'developer-key' },
  );
  assert.deepEqual(
    resolveSecServerCredential({
      GRIZZLY_BULLS_SEC_DEMO_ENABLED: 'true',
      GRIZZLY_BULLS_SEC_DEMO_API_KEY: 'demo-key',
      GRIZZLY_BULLS_API_KEY: 'must-not-be-used',
    }),
    { mode: 'hosted-demo', key: 'demo-key' },
  );
  assert.deepEqual(
    resolveSecServerCredential({
      GRIZZLY_BULLS_SEC_DEMO_ENABLED: 'true',
      GRIZZLY_BULLS_API_KEY: 'must-not-be-used',
    }),
    { mode: 'hosted-demo', key: null },
  );
});

test('client identity prefers proxy-normalized headers and has a fail-closed fallback bucket', () => {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.10',
    'x-real-ip': '198.51.100.5',
    'x-forwarded-for': '192.0.2.2, 192.0.2.3',
  });
  assert.equal(identifyHostedDemoClient(headers), '203.0.113.10');

  const forwardedOnly = new Headers({
    'x-forwarded-for': '192.0.2.2, 192.0.2.3',
  });
  assert.equal(identifyHostedDemoClient(forwardedOnly), '192.0.2.2');
  assert.equal(identifyHostedDemoClient(new Headers()), 'unidentified-client');
});

test('hosted demo limiter allows at most 30 requests in any rolling 60-second window', () => {
  const limiter = createHostedDemoRateLimiter();
  const start = 1_000_000;

  for (let index = 0; index < 30; index += 1) {
    assert.equal(limiter.consume('client-a', start + index), true);
  }
  assert.equal(limiter.consume('client-a', start + 59_999), false);
  assert.equal(limiter.consume('client-b', start + 59_999), true);
  assert.equal(limiter.consume('client-a', start + 60_001), true);
});

test('hosted demo limiter bounds tracked client cardinality and fails closed for new identities', () => {
  const limiter = createHostedDemoRateLimiter({
    maxRequests: 1,
    windowMs: 60_000,
    maxTrackedClients: 2,
  });

  assert.equal(limiter.consume('client-a', 10_000), true);
  assert.equal(limiter.consume('client-b', 10_000), true);
  assert.equal(limiter.consume('client-c', 10_001), false);
  assert.equal(limiter.consume('client-c', 70_001), true);
});
