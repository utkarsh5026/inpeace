import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  cleanupExpiredWhitelist,
  filterActiveSites,
  getUniqueSites,
} from '../../src/services/whitelist';
import type { TempWhitelist } from '../../src/types';

describe('services/whitelist.ts', () => {
  describe('cleanupExpiredWhitelist', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should remove expired entries from whitelist', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'reddit.com': now - 1000, // Expired
        'twitter.com': now + 1000, // Not expired
        'facebook.com': now - 5000, // Expired
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual({
        'twitter.com': now + 1000,
      });
      expect(Object.keys(cleaned)).toHaveLength(1);
    });

    it('should keep all entries when none are expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'reddit.com': now + 1000,
        'twitter.com': now + 2000,
        'facebook.com': now + 3000,
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual(whitelist);
      expect(Object.keys(cleaned)).toHaveLength(3);
    });

    it('should return empty object when all entries are expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'reddit.com': now - 1000,
        'twitter.com': now - 2000,
        'facebook.com': now - 3000,
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual({});
      expect(Object.keys(cleaned)).toHaveLength(0);
    });

    it('should handle empty whitelist', () => {
      const cleaned = cleanupExpiredWhitelist({});

      expect(cleaned).toEqual({});
    });

    it('should handle entries expiring exactly at current time', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'exact.com': now, // Exact match - should be expired
        'future.com': now + 1, // 1ms in future - should not be expired
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual({
        'future.com': now + 1,
      });
    });

    it('should preserve timestamp values in cleaned whitelist', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const futureTime = now + 10000;
      const whitelist: TempWhitelist = {
        'site.com': futureTime,
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned['site.com']).toBe(futureTime);
    });

    it('should handle large time differences', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'very-old.com': now - 1000000000, // Very old
        'very-future.com': now + 1000000000, // Far future
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual({
        'very-future.com': now + 1000000000,
      });
    });

    it('should handle mixed expired and valid entries', () => {
      const now = 1700000000000;
      vi.setSystemTime(now);

      const whitelist: TempWhitelist = {
        'expired1.com': now - 5000,
        'valid1.com': now + 1000,
        'expired2.com': now - 10000,
        'valid2.com': now + 2000,
        'expired3.com': now - 1,
      };

      const cleaned = cleanupExpiredWhitelist(whitelist);

      expect(cleaned).toEqual({
        'valid1.com': now + 1000,
        'valid2.com': now + 2000,
      });
      expect(Object.keys(cleaned)).toHaveLength(2);
    });
  });

  describe('filterActiveSites', () => {
    it('should remove whitelisted sites from blocked sites', () => {
      const blockedSites = ['reddit.com', 'twitter.com', 'facebook.com'];
      const whitelist: TempWhitelist = {
        'twitter.com': Date.now() + 1000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(['reddit.com', 'facebook.com']);
      expect(active).toHaveLength(2);
    });

    it('should return all sites when whitelist is empty', () => {
      const blockedSites = ['reddit.com', 'twitter.com'];
      const whitelist: TempWhitelist = {};

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(blockedSites);
    });

    it('should return empty array when all sites are whitelisted', () => {
      const blockedSites = ['reddit.com', 'twitter.com'];
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000,
        'twitter.com': Date.now() + 2000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual([]);
      expect(active).toHaveLength(0);
    });

    it('should handle empty blocked sites array', () => {
      const blockedSites: string[] = [];
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual([]);
    });

    it('should not modify sites not in whitelist', () => {
      const blockedSites = ['site1.com', 'site2.com', 'site3.com'];
      const whitelist: TempWhitelist = {
        'different.com': Date.now() + 1000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(blockedSites);
    });

    it('should preserve order of non-whitelisted sites', () => {
      const blockedSites = ['a.com', 'b.com', 'c.com', 'd.com'];
      const whitelist: TempWhitelist = {
        'b.com': Date.now() + 1000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(['a.com', 'c.com', 'd.com']);
    });

    it('should handle multiple whitelisted sites', () => {
      const blockedSites = ['a.com', 'b.com', 'c.com', 'd.com', 'e.com'];
      const whitelist: TempWhitelist = {
        'a.com': Date.now() + 1000,
        'c.com': Date.now() + 2000,
        'e.com': Date.now() + 3000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(['b.com', 'd.com']);
    });

    it('should filter based on truthy timestamp values', () => {
      const blockedSites = ['reddit.com', 'twitter.com', 'facebook.com'];
      const whitelist: TempWhitelist = {
        'reddit.com': 0, // 0 is falsy, won't filter
        'twitter.com': Date.now() + 1000, // Truthy, will filter
      };

      const active = filterActiveSites(blockedSites, whitelist);

      // Only twitter.com should be filtered (has truthy timestamp)
      // reddit.com not filtered (0 is falsy)
      // facebook.com not in whitelist
      expect(active).toEqual(['reddit.com', 'facebook.com']);
    });

    it('should be case-sensitive for site names', () => {
      const blockedSites = ['Reddit.com', 'reddit.com'];
      const whitelist: TempWhitelist = {
        'reddit.com': Date.now() + 1000,
      };

      const active = filterActiveSites(blockedSites, whitelist);

      expect(active).toEqual(['Reddit.com']);
    });
  });

  describe('getUniqueSites', () => {
    it('should remove duplicate sites', () => {
      const sites = ['reddit.com', 'twitter.com', 'reddit.com', 'facebook.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toHaveLength(3);
      expect(unique).toContain('reddit.com');
      expect(unique).toContain('twitter.com');
      expect(unique).toContain('facebook.com');
    });

    it('should return same array when no duplicates exist', () => {
      const sites = ['reddit.com', 'twitter.com', 'facebook.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toHaveLength(3);
      expect(unique).toEqual(expect.arrayContaining(sites));
    });

    it('should handle empty array', () => {
      const unique = getUniqueSites([]);

      expect(unique).toEqual([]);
    });

    it('should handle single site', () => {
      const unique = getUniqueSites(['reddit.com']);

      expect(unique).toEqual(['reddit.com']);
    });

    it('should handle all duplicate sites', () => {
      const sites = ['reddit.com', 'reddit.com', 'reddit.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toEqual(['reddit.com']);
      expect(unique).toHaveLength(1);
    });

    it('should preserve one instance of each duplicate', () => {
      const sites = ['a.com', 'b.com', 'a.com', 'c.com', 'b.com', 'a.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toHaveLength(3);
      expect(unique).toContain('a.com');
      expect(unique).toContain('b.com');
      expect(unique).toContain('c.com');
    });

    it('should be case-sensitive', () => {
      const sites = ['Reddit.com', 'reddit.com', 'REDDIT.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toHaveLength(3);
      expect(unique).toContain('Reddit.com');
      expect(unique).toContain('reddit.com');
      expect(unique).toContain('REDDIT.com');
    });

    it('should handle sites with special characters', () => {
      const sites = ['my-site.com', 'my-site.com', 'my_site.com'];

      const unique = getUniqueSites(sites);

      expect(unique).toHaveLength(2);
      expect(unique).toContain('my-site.com');
      expect(unique).toContain('my_site.com');
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should cleanup and filter in typical workflow', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const blockedSites = ['reddit.com', 'twitter.com', 'facebook.com'];
      const whitelist: TempWhitelist = {
        'reddit.com': now + 1000, // Valid
        'twitter.com': now - 1000, // Expired
      };

      // First cleanup expired entries
      const cleanedWhitelist = cleanupExpiredWhitelist(whitelist);

      // Then filter active sites
      const activeSites = filterActiveSites(blockedSites, cleanedWhitelist);

      expect(activeSites).toEqual(['twitter.com', 'facebook.com']);
    });

    it('should handle cleanup, dedupe, and filter workflow', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const blockedSites = [
        'reddit.com',
        'twitter.com',
        'reddit.com',
        'facebook.com',
      ];
      const whitelist: TempWhitelist = {
        'twitter.com': now + 1000,
        'expired.com': now - 1000,
      };

      // Remove duplicates
      const uniqueSites = getUniqueSites(blockedSites);

      // Cleanup whitelist
      const cleanedWhitelist = cleanupExpiredWhitelist(whitelist);

      // Filter active sites
      const activeSites = filterActiveSites(uniqueSites, cleanedWhitelist);

      expect(activeSites).toEqual(['reddit.com', 'facebook.com']);
    });

    it('should handle all operations on empty inputs', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const blockedSites: string[] = [];
      const whitelist: TempWhitelist = {};

      const unique = getUniqueSites(blockedSites);
      const cleaned = cleanupExpiredWhitelist(whitelist);
      const active = filterActiveSites(unique, cleaned);

      expect(unique).toEqual([]);
      expect(cleaned).toEqual({});
      expect(active).toEqual([]);
    });
  });
});
