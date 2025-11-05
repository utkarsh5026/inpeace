// Get the blocked site from URL
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');
if (site) {
  const blockedSiteElement = document.getElementById('blockedSite');
  if (blockedSiteElement) {
    blockedSiteElement.textContent = site;
  }
}

interface BlockStats {
  total: number;
  lastDate: string;
  todayCount: number;
}

// Update block statistics
async function updateStats(): Promise<void> {
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get('blockStats');
  let blockStats: BlockStats = result.blockStats || {
    total: 0,
    lastDate: today,
    todayCount: 0,
  };

  // Reset today count if it's a new day
  if (blockStats.lastDate !== today) {
    blockStats.todayCount = 0;
    blockStats.lastDate = today;
  }

  // Increment counts
  blockStats.total++;
  blockStats.todayCount++;

  // Save updated stats
  await chrome.storage.local.set({ blockStats });

  // Display stats
  const blocksTodayElement = document.getElementById('blocksToday');
  const totalBlocksElement = document.getElementById('totalBlocks');

  if (blocksTodayElement) {
    blocksTodayElement.textContent = blockStats.todayCount.toString();
  }
  if (totalBlocksElement) {
    totalBlocksElement.textContent = blockStats.total.toString();
  }
}

updateStats();

// Shame Ritual Logic
let clickCount = 0;
let currentStage = 0;

// Start at stage 1 immediately when page loads
function initShameRitual(): void {
  showStage(1);
}

function startShameRitual(): void {
  // Move to stage 2 (click challenge)
  showStage(2);
}

function showStage(stageNumber: number): void {
  currentStage = stageNumber;

  // Hide all stages
  for (let i = 1; i <= 4; i++) {
    const stageElement = document.getElementById(`stage${i}`);
    if (stageElement) {
      stageElement.classList.add('hidden');
    }
  }

  // Show current stage
  const currentStageElement = document.getElementById(`stage${stageNumber}`);
  if (currentStageElement) {
    currentStageElement.classList.remove('hidden');
  }

  // Auto-progress from stage 3 to stage 4
  if (stageNumber === 3) {
    setTimeout(() => showStage(4), 2500);
  }
}

function handleShameClick(): void {
  clickCount++;
  const shameMeterFill = document.getElementById('shameMeterFill');
  const clickCountDisplay = document.getElementById('clickCount');
  const shameButton = document.getElementById('shameButton');

  // Update click count
  if (clickCountDisplay) {
    clickCountDisplay.textContent = clickCount.toString();
  }

  // Update shame meter with animation
  if (shameMeterFill) {
    const percentage = (clickCount / 10) * 100;
    shameMeterFill.style.width = percentage + '%';
  }

  // Add shake animation to button
  if (shameButton) {
    shameButton.classList.add('shake-animation');
    setTimeout(() => {
      shameButton.classList.remove('shake-animation');
    }, 500);
  }

  // Add pulse to meter fill
  if (shameMeterFill) {
    shameMeterFill.classList.add('pulse-animation');
    setTimeout(() => {
      shameMeterFill.classList.remove('pulse-animation');
    }, 600);
  }

  // Progress to stage 3 after 10 clicks
  if (clickCount >= 10) {
    setTimeout(() => {
      showStage(3);
    }, 400);
  }
}

function handleFinalCheckbox(): void {
  const checkbox = document.getElementById('finalCheckbox') as HTMLInputElement;
  const proceedBtn = document.getElementById('proceedFinalBtn') as HTMLButtonElement;

  if (!checkbox || !proceedBtn) return;

  if (checkbox.checked) {
    proceedBtn.disabled = false;
    proceedBtn.classList.remove('bg-gray-600');
    proceedBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'cursor-pointer');
  } else {
    proceedBtn.disabled = true;
    proceedBtn.classList.add('bg-gray-600');
    proceedBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'cursor-pointer');
  }
}

function allowAccess(): void {
  // Here you would implement the logic to allow access to the site
  // For now, we'll redirect to the original site
  if (site) {
    window.location.href = 'https://' + site;
  }
}

// Set up event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize - show stage 1 immediately
  initShameRitual();

  // Close tab button
  const closeBtn = document.querySelector('[data-action="close"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => window.close());
  }

  // Proceed button
  const proceedBtn = document.getElementById('proceedBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', startShameRitual);
  }

  // Shame button
  const shameButton = document.getElementById('shameButton');
  if (shameButton) {
    shameButton.addEventListener('click', handleShameClick);
  }

  // Final checkbox
  const finalCheckbox = document.getElementById('finalCheckbox');
  if (finalCheckbox) {
    finalCheckbox.addEventListener('change', handleFinalCheckbox);
  }

  // Final proceed button
  const proceedFinalBtn = document.getElementById('proceedFinalBtn');
  if (proceedFinalBtn) {
    proceedFinalBtn.addEventListener('click', allowAccess);
  }
});
