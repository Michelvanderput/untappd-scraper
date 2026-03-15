/**
 * Cryptographically secure, unbiased random for production use.
 * Avoids modulo bias and uses crypto.getRandomValues when available.
 */

const U32_MAX = 2 ** 32;

/**
 * Returns a random integer in [0, max) with no modulo bias.
 * Uses rejection sampling so each index has equal probability.
 */
export function secureRandomIndex(max: number): number {
  if (max <= 0 || !Number.isInteger(max)) return 0;
  if (max === 1) return 0;

  const buffer = new Uint32Array(1);
  const threshold = U32_MAX - (U32_MAX % max);

  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0];
    if (value < threshold) return value % max;
  }
}

/**
 * Pick one random item from an array. Returns undefined if array is empty.
 */
export function pickRandom<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[secureRandomIndex(array.length)];
}

/**
 * Fisher-Yates shuffle with cryptographically secure random.
 * Mutates the array in place and returns it.
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Return a new array that is a shuffled copy of the input.
 */
export function shuffled<T>(array: T[]): T[] {
  return shuffleArray([...array]);
}
