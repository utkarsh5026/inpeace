/**
 * Retrieves a single value from Chrome storage.
 *
 * @template T - The expected type of the stored value
 * @param {string} key - The storage key to retrieve
 * @param {'sync' | 'local'} [namespace='sync'] - The storage namespace (sync or local)
 * @returns {Promise<T | undefined>} The stored value, or undefined if not found
 */
export async function getFromChromeStorage<T>(
  key: string,
  namespace: 'sync' | 'local' = 'sync'
): Promise<T | undefined> {
  const storageArea =
    namespace === 'sync' ? chrome.storage.sync : chrome.storage.local;
  const result = await storageArea.get(key);
  return result[key] as T | undefined;
}

/**
 * Retrieves multiple values from Chrome storage as an object.
 *
 * @template T - The expected type of the returned object (must extend Record<string, any>)
 * @param {string[]} keys - Array of storage keys to retrieve
 * @param {'sync' | 'local'} [namespace='sync'] - The storage namespace (sync or local)
 * @returns {Promise<T>} Object containing all requested key-value pairs
 */
export async function getMultipleFromChromeStorage<
  T extends Record<string, any>,
>(keys: string[], namespace: 'sync' | 'local' = 'sync'): Promise<T> {
  const storageArea =
    namespace === 'sync' ? chrome.storage.sync : chrome.storage.local;
  return (await storageArea.get(keys)) as T;
}

/**
 * Stores a value in Chrome storage.
 *
 * @template T - The type of the value to store
 * @param {string} key - The storage key
 * @param {T} value - The value to store
 * @param {'sync' | 'local'} [namespace='sync'] - The storage namespace (sync or local)
 * @returns {Promise<void>}
 */
export async function setInChromeStorage<T>(
  key: string,
  value: T,
  namespace: 'sync' | 'local' = 'sync'
): Promise<void> {
  const storageArea =
    namespace === 'sync' ? chrome.storage.sync : chrome.storage.local;
  await storageArea.set({ [key]: value });
}
