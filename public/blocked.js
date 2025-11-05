// Get the blocked site from URL
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');
if (site) {
  document.getElementById('blockedSite').textContent = site;
}

// Update block statistics
async function updateStats() {
  const today = new Date().toDateString();
  let { blockStats = { total: 0, lastDate: today, todayCount: 0 } } =
    await chrome.storage.local.get('blockStats');

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
  document.getElementById('blocksToday').textContent = blockStats.todayCount;
  document.getElementById('totalBlocks').textContent = blockStats.total;
}

updateStats();

// Shame Ritual Logic
let clickCount = 0;
let currentStage = 0;

// Start at stage 1 immediately when page loads
function initShameRitual() {
  showStage(1);
}

function startShameRitual() {
  // Move to stage 2 (click challenge)
  showStage(2);
}

function showStage(stageNumber) {
  currentStage = stageNumber;

  // Hide all stages
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`stage${i}`).classList.add('hidden');
  }

  // Show current stage
  document.getElementById(`stage${stageNumber}`).classList.remove('hidden');

  // Auto-progress from stage 3 to stage 4
  if (stageNumber === 3) {
    setTimeout(() => showStage(4), 2500);
  }
}

function handleShameClick() {
  clickCount++;
  const shameMeterFill = document.getElementById('shameMeterFill');
  const clickCountDisplay = document.getElementById('clickCount');
  const shameButton = document.getElementById('shameButton');

  // Update click count
  clickCountDisplay.textContent = clickCount;

  // Update shame meter with animation
  const percentage = (clickCount / 10) * 100;
  shameMeterFill.style.width = percentage + '%';

  // Add shake animation to button
  shameButton.classList.add('shake-animation');
  setTimeout(() => {
    shameButton.classList.remove('shake-animation');
  }, 500);

  // Add pulse to meter fill
  shameMeterFill.classList.add('pulse-animation');
  setTimeout(() => {
    shameMeterFill.classList.remove('pulse-animation');
  }, 600);

  // Progress to stage 3 after 10 clicks
  if (clickCount >= 10) {
    setTimeout(() => {
      showStage(3);
    }, 400);
  }
}

function handleFinalCheckbox() {
  const checkbox = document.getElementById('finalCheckbox');
  const proceedBtn = document.getElementById('proceedFinalBtn');

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

function allowAccess() {
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
