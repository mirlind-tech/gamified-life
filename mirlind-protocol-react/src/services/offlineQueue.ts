import { loadJson, saveJson } from '../utils/storage';

const OFFLINE_QUEUE_KEY = 'mirlind-offline-queue-v1';

export interface QueuedRequest {
  endpoint: string;
  method: string;
  body?: string;
  timestamp: number;
}

function loadQueue(): QueuedRequest[] {
  return loadJson<QueuedRequest[]>(OFFLINE_QUEUE_KEY, []);
}

function saveQueue(queue: QueuedRequest[]): void {
  saveJson(OFFLINE_QUEUE_KEY, queue);
}

export function enqueueOfflineRequest(request: QueuedRequest): void {
  const queue = loadQueue();
  queue.push(request);
  saveQueue(queue);
}

export function getOfflineQueueSize(): number {
  return loadQueue().length;
}

export async function replayOfflineQueue(
  executor: (request: QueuedRequest) => Promise<boolean>
): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const remaining: QueuedRequest[] = [];

  for (const request of queue) {
    try {
      const ok = await executor(request);
      if (!ok) remaining.push(request);
    } catch {
      remaining.push(request);
    }
  }

  saveQueue(remaining);
}
