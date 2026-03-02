import { logger } from './logger';

type Validator<T> = (value: unknown) => value is T;

export function loadJson<T>(
  key: string,
  fallback: T,
  validate?: Validator<T>
): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      logger.warn(`Invalid localStorage shape for key: ${key}`);
      return fallback;
    }
    return parsed as T;
  } catch (error) {
    logger.error(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error(`Failed to save localStorage key "${key}":`, error);
  }
}

export function getDatedKey(baseKey: string, date: string): string {
  return `${baseKey}-${date}`;
}
