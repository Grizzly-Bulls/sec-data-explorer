export const HOSTED_DEMO_REQUESTS_PER_WINDOW = 30;
export const HOSTED_DEMO_WINDOW_MS = 60_000;
export const HOSTED_DEMO_MAX_TRACKED_CLIENTS = 2_048;

type Environment = Partial<Record<string, string | undefined>>;
type HeaderReader = Pick<Headers, 'get'>;

export type SecServerCredential = {
  mode: 'developer' | 'hosted-demo';
  key: string | null;
};

function trimmed(value: string | undefined): string | null {
  const candidate = value?.trim();
  return candidate ? candidate : null;
}

export function hostedDemoModeEnabled(env: Environment = process.env): boolean {
  return env.GRIZZLY_BULLS_SEC_DEMO_ENABLED?.trim().toLowerCase() === 'true';
}

export function resolveSecServerCredential(
  env: Environment = process.env,
): SecServerCredential {
  if (hostedDemoModeEnabled(env)) {
    return {
      mode: 'hosted-demo',
      key: trimmed(env.GRIZZLY_BULLS_SEC_DEMO_API_KEY),
    };
  }

  return {
    mode: 'developer',
    key: trimmed(env.GRIZZLY_BULLS_API_KEY),
  };
}

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(',', 1)[0]?.trim();
  if (!first) return null;
  return first.slice(0, 128);
}

export function identifyHostedDemoClient(headers: HeaderReader): string {
  return (
    firstForwardedValue(headers.get('cf-connecting-ip')) ??
    firstForwardedValue(headers.get('x-real-ip')) ??
    firstForwardedValue(headers.get('x-forwarded-for')) ??
    'unidentified-client'
  );
}

export type HostedDemoRateLimiter = {
  consume(clientId: string, now?: number): boolean;
};

type HostedDemoRateLimiterOptions = {
  maxRequests?: number;
  windowMs?: number;
  maxTrackedClients?: number;
};

export function createHostedDemoRateLimiter(
  options: HostedDemoRateLimiterOptions = {},
): HostedDemoRateLimiter {
  const maxRequests = options.maxRequests ?? HOSTED_DEMO_REQUESTS_PER_WINDOW;
  const windowMs = options.windowMs ?? HOSTED_DEMO_WINDOW_MS;
  const maxTrackedClients =
    options.maxTrackedClients ?? HOSTED_DEMO_MAX_TRACKED_CLIENTS;
  const observations = new Map<string, number[]>();

  function pruneExpiredClients(cutoff: number): void {
    for (const [clientId, timestamps] of observations) {
      const retained = timestamps.filter((timestamp) => timestamp > cutoff);
      if (retained.length === 0) {
        observations.delete(clientId);
      } else if (retained.length !== timestamps.length) {
        observations.set(clientId, retained);
      }
    }
  }

  return {
    consume(clientId: string, now = Date.now()): boolean {
      const cutoff = now - windowMs;
      let timestamps = observations.get(clientId) ?? [];
      timestamps = timestamps.filter((timestamp) => timestamp > cutoff);

      if (timestamps.length === 0 && !observations.has(clientId)) {
        if (observations.size >= maxTrackedClients) {
          pruneExpiredClients(cutoff);
        }
        if (observations.size >= maxTrackedClients) {
          return false;
        }
      }

      if (timestamps.length >= maxRequests) {
        observations.set(clientId, timestamps);
        return false;
      }

      timestamps.push(now);
      observations.set(clientId, timestamps);
      return true;
    },
  };
}
