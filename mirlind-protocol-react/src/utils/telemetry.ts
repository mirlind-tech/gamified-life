const TELEMETRY_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/telemetry`;
const TELEMETRY_ENABLED = import.meta.env.VITE_TELEMETRY_ENABLED !== 'false';

interface TelemetryEventPayload {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

interface TelemetryErrorPayload {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

async function postTelemetry(path: 'event' | 'error', body: TelemetryEventPayload | TelemetryErrorPayload): Promise<void> {
  if (!TELEMETRY_ENABLED) return;

  try {
    await fetch(`${TELEMETRY_API_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: 'include',
    });
  } catch {
    // Telemetry should never break UX.
  }
}

export async function trackEvent(name: string, properties?: Record<string, unknown>): Promise<void> {
  await postTelemetry('event', {
    name,
    properties,
    timestamp: new Date().toISOString(),
  });
}

export async function captureError(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  await postTelemetry('error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
