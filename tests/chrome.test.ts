import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFromChromeStorage,
  getMultipleFromChromeStorage,
  setInChromeStorage,
} from '../src/chrome';
import { chromeMocks } from './setup';

describe('chrome.ts - Chrome Storage Wrappers', () => {
  beforeEach(() => {
    chromeMocks.storage.sync._reset();
    chromeMocks.storage.local._reset();
  });

  describe('getFromChromeStorage', () => {
    it('should retrieve a value from sync storage by default', async () => {
      await chromeMocks.storage.sync.set({ testKey: 'testValue' });

      const result = await getFromChromeStorage<string>('testKey');

      expect(result).toBe('testValue');
      expect(chromeMocks.storage.sync.get).toHaveBeenCalledWith('testKey');
    });

    it('should retrieve a value from local storage when specified', async () => {
      await chromeMocks.storage.local.set({ localKey: 'localValue' });

      const result = await getFromChromeStorage<string>('localKey', 'local');

      expect(result).toBe('localValue');
      expect(chromeMocks.storage.local.get).toHaveBeenCalledWith('localKey');
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await getFromChromeStorage<string>('nonExistent');

      expect(result).toBeUndefined();
    });

    it('should handle complex object types', async () => {
      const complexObject = {
        nested: { value: 123 },
        array: [1, 2, 3],
        boolean: true,
      };

      await chromeMocks.storage.sync.set({ complexKey: complexObject });

      const result =
        await getFromChromeStorage<typeof complexObject>('complexKey');

      expect(result).toEqual(complexObject);
    });

    it('should handle array types', async () => {
      const arrayValue = ['item1', 'item2', 'item3'];
      await chromeMocks.storage.sync.set({ arrayKey: arrayValue });

      const result = await getFromChromeStorage<string[]>('arrayKey');

      expect(result).toEqual(arrayValue);
    });
  });

  describe('getMultipleFromChromeStorage', () => {
    it('should retrieve multiple values from sync storage', async () => {
      await chromeMocks.storage.sync.set({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });

      const result = await getMultipleFromChromeStorage<{
        key1: string;
        key2: string;
        key3: string;
      }>(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    it('should retrieve multiple values from local storage when specified', async () => {
      await chromeMocks.storage.local.set({
        localKey1: 100,
        localKey2: 200,
      });

      const result = await getMultipleFromChromeStorage<{
        localKey1: number;
        localKey2: number;
      }>(['localKey1', 'localKey2'], 'local');

      expect(result).toEqual({
        localKey1: 100,
        localKey2: 200,
      });
    });

    it('should return empty object when no keys match', async () => {
      const result = await getMultipleFromChromeStorage<Record<string, any>>([
        'nonExistent1',
        'nonExistent2',
      ]);

      expect(result).toEqual({});
    });

    it('should handle partial matches', async () => {
      await chromeMocks.storage.sync.set({ existingKey: 'exists' });

      const result = await getMultipleFromChromeStorage<{
        existingKey?: string;
        missingKey?: string;
      }>(['existingKey', 'missingKey']);

      expect(result).toEqual({ existingKey: 'exists' });
      expect(result.missingKey).toBeUndefined();
    });

    it('should handle empty key array', async () => {
      const result = await getMultipleFromChromeStorage<Record<string, any>>(
        []
      );

      expect(result).toEqual({});
    });
  });

  describe('setInChromeStorage', () => {
    it('should store a value in sync storage by default', async () => {
      await setInChromeStorage('newKey', 'newValue');

      const result = await chromeMocks.storage.sync.get('newKey');
      expect(result.newKey).toBe('newValue');
      expect(chromeMocks.storage.sync.set).toHaveBeenCalledWith({
        newKey: 'newValue',
      });
    });

    it('should store a value in local storage when specified', async () => {
      await setInChromeStorage('localKey', 'localValue', 'local');

      const result = await chromeMocks.storage.local.get('localKey');
      expect(result.localKey).toBe('localValue');
      expect(chromeMocks.storage.local.set).toHaveBeenCalledWith({
        localKey: 'localValue',
      });
    });

    it('should overwrite existing values', async () => {
      await chromeMocks.storage.sync.set({ existingKey: 'oldValue' });

      await setInChromeStorage('existingKey', 'newValue');

      const result = await chromeMocks.storage.sync.get('existingKey');
      expect(result.existingKey).toBe('newValue');
    });

    it('should handle complex object types', async () => {
      const complexObject = {
        nested: { deep: { value: 'test' } },
        array: [{ id: 1 }, { id: 2 }],
      };

      await setInChromeStorage('complexKey', complexObject);

      const result = await chromeMocks.storage.sync.get('complexKey');
      expect(result.complexKey).toEqual(complexObject);
    });

    it('should handle boolean values', async () => {
      await setInChromeStorage('boolKey', true);

      const result = await chromeMocks.storage.sync.get('boolKey');
      expect(result.boolKey).toBe(true);
    });

    it('should handle number values', async () => {
      await setInChromeStorage('numberKey', 42);

      const result = await chromeMocks.storage.sync.get('numberKey');
      expect(result.numberKey).toBe(42);
    });

    it('should handle null values', async () => {
      await setInChromeStorage('nullKey', null);

      const result = await chromeMocks.storage.sync.get('nullKey');
      expect(result.nullKey).toBe(null);
    });

    it('should handle array values', async () => {
      const arrayValue = ['a', 'b', 'c'];
      await setInChromeStorage('arrayKey', arrayValue);

      const result = await chromeMocks.storage.sync.get('arrayKey');
      expect(result.arrayKey).toEqual(arrayValue);
    });
  });

  describe('integration scenarios', () => {
    it('should handle set and get workflow', async () => {
      await setInChromeStorage('testKey', 'testValue');
      const retrieved = await getFromChromeStorage<string>('testKey');

      expect(retrieved).toBe('testValue');
    });

    it('should maintain separate sync and local storage', async () => {
      await setInChromeStorage('sharedKey', 'syncValue', 'sync');
      await setInChromeStorage('sharedKey', 'localValue', 'local');

      const syncResult = await getFromChromeStorage<string>(
        'sharedKey',
        'sync'
      );
      const localResult = await getFromChromeStorage<string>(
        'sharedKey',
        'local'
      );

      expect(syncResult).toBe('syncValue');
      expect(localResult).toBe('localValue');
    });

    it('should handle multiple operations in sequence', async () => {
      await setInChromeStorage('key1', 'value1');
      await setInChromeStorage('key2', 'value2');
      await setInChromeStorage('key3', 'value3');

      const results = await getMultipleFromChromeStorage<{
        key1: string;
        key2: string;
        key3: string;
      }>(['key1', 'key2', 'key3']);

      expect(results).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });
  });
});
