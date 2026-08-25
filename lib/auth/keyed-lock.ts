const chains = new Map<string, Promise<unknown>>();

/**
 * Serialize async work per key in this process.
 * Double-submit on the same instance cannot issue two live OTPs.
 */
export async function withKeyedLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  let result!: T;
  const current = previous.catch(() => undefined).then(async () => {
    result = await work();
  });
  chains.set(key, current);
  try {
    await current;
    return result;
  } finally {
    if (chains.get(key) === current) {
      chains.delete(key);
    }
  }
}
