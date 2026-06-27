import { NextResponse } from 'next/server';

/**
 * Liveness probe for Railway — intentionally backend-independent.
 *
 * The homepage ("/") is force-dynamic and calls notFound() (HTTP 404) when the
 * public API is unreachable or no homepage is published, which would fail a
 * health check on "/". This route only proves the Next.js server itself is up,
 * so deploy/restart decisions never depend on the backend being ready.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'marketing-web' });
}
