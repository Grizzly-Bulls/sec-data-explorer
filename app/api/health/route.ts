import {
  hostedDemoModeEnabled,
  resolveSecServerCredential,
} from '../../../src/lib/hostedDemo';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const credential = resolveSecServerCredential();
  const hostedDemo = hostedDemoModeEnabled();
  const ready = credential.key !== null;
  const revision = process.env.GRIZZLY_BULLS_SEC_DEMO_REVISION?.trim() || null;

  return Response.json(
    {
      status: ready ? 'ok' : 'not_ready',
      service: 'sec-data-explorer',
      mode: hostedDemo ? 'hosted-demo' : 'developer',
      revision,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
