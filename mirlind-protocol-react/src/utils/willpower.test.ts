import { describe, expect, it } from 'vitest';
import { getXPMultiplier, getWillpowerStatus } from './willpower';

describe('willpower utils', () => {
  it('returns expected status boundaries', () => {
    expect(getWillpowerStatus(0, 100)).toBe('exhausted');
    expect(getWillpowerStatus(25, 100)).toBe('low');
    expect(getWillpowerStatus(50, 100)).toBe('moderate');
    expect(getWillpowerStatus(75, 100)).toBe('high');
    expect(getWillpowerStatus(100, 100)).toBe('peak');
  });

  it('applies the intended XP multipliers', () => {
    expect(getXPMultiplier(0)).toBe(0.5);
    expect(getXPMultiplier(20)).toBe(0.75);
    expect(getXPMultiplier(40)).toBe(0.9);
    expect(getXPMultiplier(60)).toBe(1.0);
    expect(getXPMultiplier(90)).toBe(1.25);
  });
});
