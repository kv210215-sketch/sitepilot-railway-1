/**
 * Deep-freeze plain objects/arrays for replay-safe immutable snapshots.
 * Prevents accidental runtime mutation during offline replay.
 */

function isFreezable(value: unknown): value is Record<string, unknown> | unknown[] {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const tag = Object.prototype.toString.call(value);
  return tag === '[object Object]' || tag === '[object Array]';
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (!isFreezable(value)) {
    return value as Readonly<T>;
  }
  if (Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item);
    }
    return Object.freeze(value) as Readonly<T>;
  }
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return Object.freeze(value) as Readonly<T>;
}

/** Throws when a frozen snapshot graph was mutated (Node marks frozen objects). */
export function assertDeepFrozen(value: unknown, label = 'snapshot'): void {
  if (!isFreezable(value)) {
    return;
  }
  if (!Object.isFrozen(value)) {
    throw new Error(`${label} is not frozen — replay immutability violated`);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      assertDeepFrozen(item, label);
    }
    return;
  }
  for (const key of Object.keys(value)) {
    assertDeepFrozen(value[key], label);
  }
}
