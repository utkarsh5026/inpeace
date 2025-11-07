export interface DailySiteVisits {
  [site: string]: {
    count: number;
    date: string;
  };
}

export class SiteVistior {
  private todayVisitCount: number = 0;
  constructor(private site: string) {}

  async updateSiteVisits() {
    if (!this.site) return;

    const today = new Date().toISOString().split('T')[0]; // Format: "2025-11-06"
    const result = await chrome.storage.local.get('dailySiteVisits');
    let dailyVisits: DailySiteVisits = result.dailySiteVisits || {};

    if (!dailyVisits[this.site] || dailyVisits[this.site].date !== today) {
      dailyVisits[this.site] = {
        count: 1,
        date: today,
      };
      this.todayVisitCount = 1;
    } else {
      dailyVisits[this.site].count++;
      this.todayVisitCount = dailyVisits[this.site].count;
    }

    await chrome.storage.local.set({ dailySiteVisits: dailyVisits });
    this.updateVisitCountDisplay();
  }

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

  get todayCount() {
    return this.todayVisitCount;
  }
}
