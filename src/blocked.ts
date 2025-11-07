import { ShameButton } from './blocked/button-clicker';
import { allowAccess, handleFinalCheckbox } from './blocked/final-stage';
import { StageManager } from './blocked/stage';
import { SiteVistior } from './blocked/visit';

const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');

const stageManager = new StageManager();

const updateSiteUI = (): void => {
  if (site) {
    const blockedSiteElement = document.getElementById('blockedSite');
    if (blockedSiteElement) {
      blockedSiteElement.textContent = site;
    }
    new SiteVistior(site).updateSiteVisits();
  }
};

const initShameRitual = (): void => stageManager.showStage(1);
const startShameRitual = (): void => stageManager.showStage(2);
const showShameLessStage = (): void => stageManager.showStage(3);

const onDOMLoad = (): void => {
  initShameRitual();

  const closeBtn = document.querySelector('[data-action="close"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => window.close());
  }

  const proceedBtn = document.getElementById('proceedBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', startShameRitual);
  }

  const shameButton = new ShameButton(() => {
    setTimeout(showShameLessStage, 1000);
  });

  shameButton.registerListeners();

  const finalCheckbox = document.getElementById('finalCheckbox');
  if (finalCheckbox) {
    finalCheckbox.addEventListener('change', handleFinalCheckbox);
  }

  const proceedFinalBtn = document.getElementById('proceedFinalBtn');
  if (proceedFinalBtn) {
    proceedFinalBtn.addEventListener('click', () => allowAccess(site));
  }
};

updateSiteUI();
document.addEventListener('DOMContentLoaded', onDOMLoad);
