import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SiteVistior, DailySiteVisits } from '../../src/blocked/visit';
import { chromeMocks } from '../setup';

describe('blocked/visit.ts - SiteVisitor Class', () => {
  let mockVisitCount: HTMLElement;
  let mockVisitPlural: HTMLElement;
  let mockVisitMessage: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    chromeMocks.storage.local._reset();

    // Create mock DOM elements
    mockVisitCount = document.createElement('span');
    mockVisitCount.id = 'visitCount';

    mockVisitPlural = document.createElement('span');
    mockVisitPlural.id = 'visitPlural';

    mockVisitMessage = document.createElement('div');
    mockVisitMessage.id = 'visitMessage';
    mockVisitMessage.classList.add('hidden');

    document.body.appendChild(mockVisitCount);
    document.body.appendChild(mockVisitPlural);
    document.body.appendChild(mockVisitMessage);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should create instance with site name', () => {
      const visitor = new SiteVistior('reddit.com');

      expect(visitor).toBeInstanceOf(SiteVistior);
    });

    it('should accept different site names', () => {
      const visitor1 = new SiteVistior('reddit.com');
      const visitor2 = new SiteVistior('twitter.com');

      expect(visitor1).toBeInstanceOf(SiteVistior);
      expect(visitor2).toBeInstanceOf(SiteVistior);
    });
  });

  describe('updateSiteVisits', () => {
    it('should initialize visit count to 1 for first visit', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      const visits: DailySiteVisits = stored.dailySiteVisits;

      expect(visits['reddit.com']).toEqual({
        count: 1,
        date: today,
      });
    });

    it('should increment visit count for same day visits', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');

      await visitor.updateSiteVisits();
      await visitor.updateSiteVisits();
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      const visits: DailySiteVisits = stored.dailySiteVisits;

      expect(visits['reddit.com'].count).toBe(3);
      expect(visits['reddit.com'].date).toBe(today);
    });

    it('should reset count for new day', async () => {
      const day1 = '2025-11-15';
      const day2 = '2025-11-16';

      // Visit on day 1
      vi.setSystemTime(new Date(day1));
      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();
      await visitor.updateSiteVisits();

      let stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(2);

      // Visit on day 2
      vi.setSystemTime(new Date(day2));
      await visitor.updateSiteVisits();

      stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(1);
      expect(stored.dailySiteVisits['reddit.com'].date).toBe(day2);
    });

    it('should track multiple sites independently', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const redditVisitor = new SiteVistior('reddit.com');
      const twitterVisitor = new SiteVistior('twitter.com');

      await redditVisitor.updateSiteVisits();
      await redditVisitor.updateSiteVisits();

      await twitterVisitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      const visits: DailySiteVisits = stored.dailySiteVisits;

      expect(visits['reddit.com'].count).toBe(2);
      expect(visits['twitter.com'].count).toBe(1);
    });

    it('should update visit count display element', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      expect(mockVisitCount.textContent).toBe('1');
    });

    it('should show visit message after update', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      expect(mockVisitMessage.classList.contains('hidden')).toBe(false);
    });

    it('should handle singular grammar for 1 visit', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      expect(mockVisitPlural.textContent).toBe('');
    });

    it('should handle plural grammar for multiple visits', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();
      await visitor.updateSiteVisits();

      expect(mockVisitPlural.textContent).toBe('s');
      expect(mockVisitCount.textContent).toBe('2');
    });

    it('should do nothing when site is empty', async () => {
      const visitor = new SiteVistior('');
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');

      expect(stored.dailySiteVisits).toBeUndefined();
    });

    it('should handle missing DOM elements gracefully', async () => {
      document.body.innerHTML = '';

      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');

      await expect(visitor.updateSiteVisits()).resolves.not.toThrow();
    });

    it('should preserve other sites data when updating', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      // Pre-populate with existing data
      await chrome.storage.local.set({
        dailySiteVisits: {
          'existing.com': {
            count: 5,
            date: today,
          },
        },
      });

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      const visits: DailySiteVisits = stored.dailySiteVisits;

      expect(visits['existing.com']).toEqual({
        count: 5,
        date: today,
      });
      expect(visits['reddit.com']).toEqual({
        count: 1,
        date: today,
      });
    });

    it('should handle dates correctly across midnight', async () => {
      // Last minute of day 1
      const day1End = new Date('2025-11-15T23:59:59');
      vi.setSystemTime(day1End);

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      let stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-11-15');

      // First minute of day 2
      const day2Start = new Date('2025-11-16T00:00:01');
      vi.setSystemTime(day2Start);

      await visitor.updateSiteVisits();

      stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-11-16');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(1);
    });

    it('should handle large visit counts', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('reddit.com');

      // Simulate 100 visits
      for (let i = 0; i < 100; i++) {
        await visitor.updateSiteVisits();
      }

      const stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(100);
      expect(mockVisitCount.textContent).toBe('100');
    });

    it('should format date as YYYY-MM-DD', async () => {
      const testDate = new Date('2025-03-05T12:00:00');
      vi.setSystemTime(testDate);

      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-03-05');
    });
  });

  describe('edge cases', () => {
    it('should handle site names with special characters', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor = new SiteVistior('my-site.co.uk');
      await visitor.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['my-site.co.uk']).toBeDefined();
    });

    it('should handle concurrent updates to different sites', async () => {
      const today = '2025-11-15';
      vi.setSystemTime(new Date(today));

      const visitor1 = new SiteVistior('reddit.com');
      const visitor2 = new SiteVistior('twitter.com');

      // Update sequentially to avoid race conditions in test
      await visitor1.updateSiteVisits();
      await visitor2.updateSiteVisits();

      const stored = await chrome.storage.local.get('dailySiteVisits');
      const visits: DailySiteVisits = stored.dailySiteVisits;

      // Both should be tracked
      expect(visits['reddit.com']).toBeDefined();
      expect(visits['twitter.com']).toBeDefined();
    });

    it('should handle month transitions correctly', async () => {
      // Last day of month
      vi.setSystemTime(new Date('2025-01-31T23:59:59'));
      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      let stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-01-31');

      // First day of next month
      vi.setSystemTime(new Date('2025-02-01T00:00:01'));
      await visitor.updateSiteVisits();

      stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-02-01');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(1);
    });

    it('should handle year transitions correctly', async () => {
      // Last day of year
      vi.setSystemTime(new Date('2025-12-31T23:59:59'));
      const visitor = new SiteVistior('reddit.com');
      await visitor.updateSiteVisits();

      let stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2025-12-31');

      // First day of next year
      vi.setSystemTime(new Date('2026-01-01T00:00:01'));
      await visitor.updateSiteVisits();

      stored = await chrome.storage.local.get('dailySiteVisits');
      expect(stored.dailySiteVisits['reddit.com'].date).toBe('2026-01-01');
      expect(stored.dailySiteVisits['reddit.com'].count).toBe(1);
    });
  });
});
