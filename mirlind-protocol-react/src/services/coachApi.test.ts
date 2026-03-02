import { describe, expect, it, vi } from 'vitest';

const apiRequestMock = vi.fn();

vi.mock('./authApi', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe('coachApi', () => {
  it('sends message and history to coach chat endpoint', async () => {
    apiRequestMock.mockResolvedValueOnce({ reply: 'Do task now.' });

    const { sendCoachMessage } = await import('./coachApi');
    const response = await sendCoachMessage('Help me focus', [
      { role: 'user', content: 'I keep delaying work.' },
      { role: 'assistant', content: 'Start with 20 minutes now.' },
    ]);

    expect(apiRequestMock).toHaveBeenCalledWith('/coach/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Help me focus',
        history: [
          { role: 'user', content: 'I keep delaying work.' },
          { role: 'assistant', content: 'Start with 20 minutes now.' },
        ],
      }),
    });
    expect(response).toEqual({ reply: 'Do task now.' });
  });

  it('generates AI actions', async () => {
    apiRequestMock.mockResolvedValueOnce({
      runId: 11,
      actions: [{ actionType: 'outcome_action', domain: 'career', objectiveTitle: 'Ship', title: 'Code', minutes: 45, targetCount: 5 }],
    });

    const { generateCoachActions } = await import('./coachApi');
    const response = await generateCoachActions('help me plan', 'career');

    expect(apiRequestMock).toHaveBeenCalledWith('/coach/actions/generate', {
      method: 'POST',
      body: JSON.stringify({ intent: 'help me plan', domain: 'career' }),
    });
    expect(response.runId).toBe(11);
  });

  it('applies AI actions', async () => {
    apiRequestMock.mockResolvedValueOnce({
      runId: 11,
      weekStart: '2026-02-16',
      applied: { objectives: [], actions: [], financeCaps: [] },
    });

    const { applyCoachActions } = await import('./coachApi');
    await applyCoachActions({ runId: 11 });

    expect(apiRequestMock).toHaveBeenCalledWith('/coach/actions/apply', {
      method: 'POST',
      body: JSON.stringify({ runId: 11 }),
    });
  });
});
