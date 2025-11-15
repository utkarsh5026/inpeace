import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBlockedSitesData,
  getTempWhitelist,
  saveTempWhitelist,
  initializeStorage,
} from '../../src/services/storage';
import { chromeMocks } from '../setup';
import {
  BLOCKED_SITES_KEY,
  IS_ENABLED_KEY,
  TEMP_WHITELIST_KEY,
} from '../../src/constants';
import type { TempWhitelist } from '../../src/types';

describe('services/storage.ts', () => {
  beforeEach(() => {
    chromeMocks.storage.sync._reset();
    chromeMocks.storage.local._reset();
  });

  describe('getBlockedSitesData', () => {
    it('should return blocked sites and enabled status from sync storage', async () => {
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: ['reddit.com', 'twitter.com'],
        [IS_ENABLED_KEY]: true,
      });

      const result = await getBlockedSitesData();

      expect(result).toEqual({
        blockedSites: ['reddit.com', 'twitter.com'],
        isEnabled: true,
      });
    });

    it('should return empty array and true when no data exists', async () => {
      const result = await getBlockedSitesData();

      expect(result).toEqual({
        blockedSites: [],
        isEnabled: true,
      });
    });

    it('should handle isEnabled being false', async () => {
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: ['facebook.com'],
        [IS_ENABLED_KEY]: false,
      });

      const result = await getBlockedSitesData();

      expect(result).toEqual({
        blockedSites: ['facebook.com'],
        isEnabled: false,
      });
    });

    it('should default isEnabled to true when not set', async () => {
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: ['youtube.com'],
      });

      const result = await getBlockedSitesData();

      expect(result.isEnabled).toBe(true);
    });

    it('should handle empty blocked sites array', async () => {
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: [],
        [IS_ENABLED_KEY]: true,
      });

      const result = await getBlockedSitesData();

      expect(result.blockedSites).toEqual([]);
    });

    it('should handle multiple blocked sites', async () => {
      const sites = [
        'reddit.com',
        'twitter.com',
        'facebook.com',
        'instagram.com',
        'youtube.com',
      ];

      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: sites,
        [IS_ENABLED_KEY]: true,
      });

      const result = await getBlockedSitesData();

      expect(result.blockedSites).toEqual(sites);
      expect(result.blockedSites).toHaveLength(5);
    });
  });

  describe('getTempWhitelist', () => {
    it('should retrieve temporary whitelist from local storage', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000000,
        'twitter.com': Date.now() + 2000000,
      };

      await chrome.storage.local.set({
        [TEMP_WHITELIST_KEY]: whitelist,
      });

      const result = await getTempWhitelist();

      expect(result).toEqual(whitelist);
    });

    it('should return empty object when no whitelist exists', async () => {
      const result = await getTempWhitelist();

      expect(result).toEqual({});
    });

    it('should handle empty whitelist object', async () => {
      await chrome.storage.local.set({
        [TEMP_WHITELIST_KEY]: {},
      });

      const result = await getTempWhitelist();

      expect(result).toEqual({});
    });

    it('should handle whitelist with expired timestamps', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() - 1000, // Expired
        'twitter.com': Date.now() + 1000000, // Not expired
      };

      await chrome.storage.local.set({
        [TEMP_WHITELIST_KEY]: whitelist,
      });

      const result = await getTempWhitelist();

      expect(result).toEqual(whitelist);
    });

    it('should handle multiple sites in whitelist', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': 1234567890,
        'twitter.com': 1234567891,
        'facebook.com': 1234567892,
        'youtube.com': 1234567893,
      };

      await chrome.storage.local.set({
        [TEMP_WHITELIST_KEY]: whitelist,
      });

      const result = await getTempWhitelist();

      expect(Object.keys(result)).toHaveLength(4);
      expect(result).toEqual(whitelist);
    });
  });

  describe('saveTempWhitelist', () => {
    it('should save temporary whitelist to local storage', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000000,
      };

      await saveTempWhitelist(whitelist);

      const stored = await chrome.storage.local.get(TEMP_WHITELIST_KEY);
      expect(stored[TEMP_WHITELIST_KEY]).toEqual(whitelist);
    });

    it('should overwrite existing whitelist', async () => {
      const oldWhitelist: TempWhitelist = {
        'reddit.com': 123456,
      };

      const newWhitelist: TempWhitelist = {
        'twitter.com': 789012,
      };

      await chrome.storage.local.set({
        [TEMP_WHITELIST_KEY]: oldWhitelist,
      });

      await saveTempWhitelist(newWhitelist);

      const stored = await chrome.storage.local.get(TEMP_WHITELIST_KEY);
      expect(stored[TEMP_WHITELIST_KEY]).toEqual(newWhitelist);
      expect(stored[TEMP_WHITELIST_KEY]).not.toEqual(oldWhitelist);
    });

    it('should handle empty whitelist', async () => {
      await saveTempWhitelist({});

      const stored = await chrome.storage.local.get(TEMP_WHITELIST_KEY);
      expect(stored[TEMP_WHITELIST_KEY]).toEqual({});
    });

    it('should handle multiple sites', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': 1111111,
        'twitter.com': 2222222,
        'facebook.com': 3333333,
      };

      await saveTempWhitelist(whitelist);

      const stored = await chrome.storage.local.get(TEMP_WHITELIST_KEY);
      expect(stored[TEMP_WHITELIST_KEY]).toEqual(whitelist);
      expect(Object.keys(stored[TEMP_WHITELIST_KEY])).toHaveLength(3);
    });

    it('should persist values correctly', async () => {
      const timestamp = Date.now();
      const whitelist: TempWhitelist = {
        'reddit.com': timestamp,
      };

      await saveTempWhitelist(whitelist);

      const result = await getTempWhitelist();
      expect(result['reddit.com']).toBe(timestamp);
    });
  });

  describe('initializeStorage', () => {
    it('should initialize storage with default sites when no data exists', async () => {
      const defaultSites = ['reddit.com', 'twitter.com', 'facebook.com'];

      await initializeStorage(defaultSites);

      const stored = await chrome.storage.sync.get([
        BLOCKED_SITES_KEY,
        IS_ENABLED_KEY,
      ]);

      expect(stored[BLOCKED_SITES_KEY]).toEqual(defaultSites);
      expect(stored[IS_ENABLED_KEY]).toBe(true);
    });

    it('should not overwrite existing blocked sites', async () => {
      const existingSites = ['youtube.com', 'instagram.com'];
      const defaultSites = ['reddit.com', 'twitter.com'];

      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: existingSites,
      });

      await initializeStorage(defaultSites);

      const stored = await chrome.storage.sync.get(BLOCKED_SITES_KEY);
      expect(stored[BLOCKED_SITES_KEY]).toEqual(existingSites);
      expect(stored[BLOCKED_SITES_KEY]).not.toEqual(defaultSites);
    });

    it('should handle empty default sites array', async () => {
      await initializeStorage([]);

      const stored = await chrome.storage.sync.get([
        BLOCKED_SITES_KEY,
        IS_ENABLED_KEY,
      ]);

      expect(stored[BLOCKED_SITES_KEY]).toEqual([]);
      expect(stored[IS_ENABLED_KEY]).toBe(true);
    });

    it('should only initialize when blockedSites is undefined', async () => {
      // Set isEnabled but not blockedSites
      await chrome.storage.sync.set({
        [IS_ENABLED_KEY]: false,
      });

      const defaultSites = ['reddit.com'];
      await initializeStorage(defaultSites);

      const stored = await chrome.storage.sync.get([
        BLOCKED_SITES_KEY,
        IS_ENABLED_KEY,
      ]);

      expect(stored[BLOCKED_SITES_KEY]).toEqual(defaultSites);
      expect(stored[IS_ENABLED_KEY]).toBe(true); // Overwritten
    });

    it('should preserve existing isEnabled value when blockedSites exists', async () => {
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: ['existing.com'],
        [IS_ENABLED_KEY]: false,
      });

      await initializeStorage(['default.com']);

      const stored = await chrome.storage.sync.get([
        BLOCKED_SITES_KEY,
        IS_ENABLED_KEY,
      ]);

      expect(stored[BLOCKED_SITES_KEY]).toEqual(['existing.com']);
      expect(stored[IS_ENABLED_KEY]).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full initialization workflow', async () => {
      const defaultSites = ['reddit.com', 'twitter.com'];

      // Initialize storage
      await initializeStorage(defaultSites);

      // Retrieve data
      const data = await getBlockedSitesData();

      expect(data.blockedSites).toEqual(defaultSites);
      expect(data.isEnabled).toBe(true);
    });

    it('should handle whitelist save and retrieve workflow', async () => {
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000000,
        'twitter.com': Date.now() + 2000000,
      };

      await saveTempWhitelist(whitelist);
      const retrieved = await getTempWhitelist();

      expect(retrieved).toEqual(whitelist);
    });

    it('should maintain separation between sync and local storage', async () => {
      // Set blocked sites in sync storage
      await chrome.storage.sync.set({
        [BLOCKED_SITES_KEY]: ['reddit.com'],
      });

      // Set whitelist in local storage
      const whitelist: TempWhitelist = {
        'twitter.com': Date.now(),
      };
      await saveTempWhitelist(whitelist);

      // Both should be retrievable independently
      const blockedData = await getBlockedSitesData();
      const whitelistData = await getTempWhitelist();

      expect(blockedData.blockedSites).toEqual(['reddit.com']);
      expect(whitelistData).toEqual(whitelist);
    });
  });
});
