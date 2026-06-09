import { createServer } from 'node:http';

type HealthState = {
  startedAt: string;
  lastEventAt: string | null;
  eventsProcessed: number;
  lastError: string | null;
};

const state: HealthState = {
  startedAt: new Date().toISOString(),
  lastEventAt: null,
  eventsProcessed: 0,
  lastError: null,
};

export function recordPublisherEvent(): void {
  state.lastEventAt = new Date().toISOString();
  state.eventsProcessed += 1;
}

export function recordPublisherError(message: string): void {
  state.lastError = message;
}

export function startHealthServer(port = Number(process.env.SDS_HEALTH_PORT ?? 9090)): void {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'oracle-arena-sds-publisher', ...state }));
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Health port ${port} in use — continuing without health endpoint`);
      return;
    }
    console.error('Health server error:', err);
  });

  server.listen(port, () => {
    console.log(`Health endpoint listening on http://127.0.0.1:${port}/`);
  });
}
