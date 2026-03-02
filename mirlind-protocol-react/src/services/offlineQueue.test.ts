import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enqueueOfflineRequest, getOfflineQueueSize, replayOfflineQueue } from './offlineQueue';

describe('offline queue', () => {
  beforeEach(() => {
    localStorage.removeItem('mirlind-offline-queue-v1');
  });

  it('enqueues and replays requests', async () => {
    enqueueOfflineRequest({
      endpoint: '/protocol',
      method: 'POST',
      body: '{"date":"2026-02-22"}',
      timestamp: Date.now(),
    });

    expect(getOfflineQueueSize()).toBe(1);

    const executor = vi.fn().mockResolvedValue(true);
    await replayOfflineQueue(executor);

    expect(executor).toHaveBeenCalledTimes(1);
    expect(getOfflineQueueSize()).toBe(0);
  });
});
