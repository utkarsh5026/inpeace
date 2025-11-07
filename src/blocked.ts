import { ShameButton } from './blocked/button-clicker';
import { allowAccess, handleFinalCheckbox } from './blocked/final-stage';
import { SiteVistior } from './blocked/visit';

const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');

function updateSiteUI() {
  if (site) {
    const blockedSiteElement = document.getElementById('blockedSite');
    if (blockedSiteElement) {
      blockedSiteElement.textContent = site;
    }
    new SiteVistior(site).updateSiteVisits();
  }
}

updateSiteUI();

let currentStage = 0;

function initShameRitual(): void {
  showStage(1);
}

function startShameRitual(): void {
  showStage(2);
}

function showStage(stageNumber: number): void {
  const previousStage = currentStage;
  currentStage = stageNumber;

  // Fade out previous stage if it exists
  if (previousStage > 0) {
    const previousStageElement = document.getElementById(
      `stage${previousStage}`
    );
    if (
      previousStageElement &&
      !previousStageElement.classList.contains('hidden')
    ) {
      previousStageElement.classList.add('stage-fade-out');

      // After fade out completes, hide it and show next stage
      setTimeout(() => {
        previousStageElement.classList.add('hidden');
        previousStageElement.classList.remove('stage-fade-out');
        showNextStage(stageNumber);
      }, 500); // Match the fadeOut animation duration
    } else {
      showNextStage(stageNumber);
    }
  } else {
    showNextStage(stageNumber);
  }
}

function showNextStage(stageNumber: number): void {
  // Hide all stages first
  for (let i = 1; i <= 4; i++) {
    const stageElement = document.getElementById(`stage${i}`);
    if (stageElement && i !== stageNumber) {
      stageElement.classList.add('hidden');
      stageElement.classList.remove(
        'stage-fade-in',
        'stage-fade-out',
        'stage3-container'
      );
    }
  }

  // Show and fade in current stage
  const currentStageElement = document.getElementById(`stage${stageNumber}`);
  if (currentStageElement) {
    currentStageElement.classList.remove('hidden');

    // Special handling for stage 3 animation
    if (stageNumber === 3) {
      currentStageElement.classList.add('stage3-container');
    } else {
      currentStageElement.classList.add('stage-fade-in');
      // Remove fade-in class after animation completes
      setTimeout(() => {
        currentStageElement.classList.remove('stage-fade-in');
      }, 500);
    }
  }

  // Auto-progress from stage 3 to stage 4
  if (stageNumber === 3) {
    setTimeout(() => showStage(4), 4500); // 4s animation + 0.5s buffer
  }
}

function onDOMLoad(): void {
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
    setTimeout(() => {
      showStage(3);
    }, 1000);
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
}

document.addEventListener('DOMContentLoaded', onDOMLoad);
