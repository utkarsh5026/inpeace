/**
 * Represents the structure for tracking daily site visit counts.
 * Maps site URLs to their visit data including count and date.
 */
export interface DailySiteVisits {
  [site: string]: {
    /** The number of times the site has been visited today */
    count: number;
    /** ISO date string in format "YYYY-MM-DD" representing the visit date */
    date: string;
  };
}

/**
 * Tracks and displays the number of times a user has visited a specific site today.
 * Persists visit counts in Chrome's local storage and automatically resets daily.
 */
export class SiteVistior {
  private todayVisitCount: number = 0;

  /**
   * Creates a new SiteVisitor instance for tracking visits to a specific site.
   * @param site - The URL or identifier of the site to track visits for
   */
  constructor(private site: string) {}

  /**
   * Updates the visit count for the current site in storage and refreshes the UI.
   *
   * Automatically resets the count if this is the first visit of a new day.
   * Retrieves existing visit data from Chrome storage, increments the count,
   * and persists the updated data.
   * @async
   */
  async updateSiteVisits() {
    if (!this.site) return;

    const result = await chrome.storage.local.get('dailySiteVisits');
    let dailyVisits: DailySiteVisits = result.dailySiteVisits || {};

    this.updateTodayVisitCount(dailyVisits);
    await chrome.storage.local.set({ dailySiteVisits: dailyVisits });
    this.updateVisitCountDisplay();
  }

  /**
   * Updates the visit count for the current site for today's date.
   *
   * If no visits exist for today or the stored date doesn't match today's date,
   * initializes a new entry with count 1. Otherwise, increments the existing count.
   * Also updates the instance's `todayVisitCount` property with the current count.
   *
   * @param dailyVisits - The daily visits object containing visit counts per site
   * @private
   */
  private updateTodayVisitCount(dailyVisits: DailySiteVisits) {
    const today = new Date().toISOString().split('T')[0]; // Format: "2025-11-06"
    const siteVisits = dailyVisits[this.site];

    if (!siteVisits || siteVisits.date !== today) {
      dailyVisits[this.site] = {
        count: 1,
        date: today,
      };
      this.todayVisitCount = 1;
    } else {
      dailyVisits[this.site].count++;
      this.todayVisitCount = dailyVisits[this.site].count;
    }
  }

  /**
   * Updates the DOM elements to display the current visit count.
   * Shows/hides the visit message and handles singular/plural grammar.
   * Expects DOM elements with IDs: 'visitCount', 'visitPlural', and 'visitMessage'.
   * @private
   */
  private updateVisitCountDisplay(): void {
    const visitCountElement = document.getElementById('visitCount');
    const visitPluralElement = document.getElementById('visitPlural');

    if (visitCountElement && this.todayVisitCount > 0) {
      visitCountElement.textContent = this.todayVisitCount.toString();

      if (visitPluralElement) {
        visitPluralElement.textContent = this.todayVisitCount === 1 ? '' : 's';
      }

      const visitMessageElement = document.getElementById('visitMessage');
      if (visitMessageElement) {
        visitMessageElement.classList.remove('hidden');
      }
    }
  }
}
