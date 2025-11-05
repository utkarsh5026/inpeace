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
let canClick = true;
let clickCooldown = 800; // Start with 800ms cooldown

// Progressive messages for each click
const shameMessages = [
  { text: 'I Have No Self-Control', emoji: '😞', scale: 1.0 },
  { text: 'Really? You\'re Going Through With This?', emoji: '😟', scale: 1.1 },
  { text: 'Think About What You\'re Doing...', emoji: '😥', scale: 1.2 },
  { text: 'This Is Embarrassing', emoji: '😓', scale: 1.3 },
  { text: 'You Could Be Doing Literally Anything Else', emoji: '😢', scale: 1.4 },
  { text: 'Your Future Self Is Disappointed', emoji: '😭', scale: 1.5 },
  { text: 'Is This Really Worth It?', emoji: '🤦', scale: 1.6 },
  { text: 'You Have No Willpower', emoji: '😤', scale: 1.7 },
  { text: 'This Is Who You Are', emoji: '💔', scale: 1.8 },
  { text: 'One More Click... That\'s All It Takes', emoji: '😔', scale: 2.0 }
];

// Start at stage 1 immediately when page loads
function initShameRitual(): void {
  showStage(1);
}

function startShameRitual(): void {
  // Move to stage 2 (click challenge)
  showStage(2);
  clickCount = 0;
  canClick = true;
  clickCooldown = 800;
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
  if (!canClick || clickCount >= 10) return;

  canClick = false;
  clickCount++;

  const shameMeterFill = document.getElementById('shameMeterFill');
  const clickCountDisplay = document.getElementById('clickCount');
  const shameButton = document.getElementById('shameButton') as HTMLButtonElement;
  const stage2Container = document.getElementById('stage2');
  const shameEmoji = document.getElementById('shameEmoji');
  const shameTitle = document.getElementById('shameTitle');
  const shameSubtext = document.getElementById('shameSubtext');
  const cooldownBar = document.getElementById('cooldownBar');
  const body = document.body;

  // Update click count
  if (clickCountDisplay) {
    clickCountDisplay.textContent = clickCount.toString();
  }

  // Update shame meter with animation
  if (shameMeterFill) {
    const percentage = (clickCount / 10) * 100;
    shameMeterFill.style.width = percentage + '%';
  }

  // Update messages, emoji, and styling
  const currentMessage = shameMessages[clickCount - 1];
  if (shameButton && currentMessage) {
    shameButton.textContent = currentMessage.text;
    // Flash animation to draw attention to text change
    shameButton.classList.add('button-text-change');
    setTimeout(() => {
      shameButton.classList.remove('button-text-change');
    }, 600);
  }

  if (shameEmoji && currentMessage) {
    shameEmoji.textContent = currentMessage.emoji;
    shameEmoji.style.transform = `scale(${currentMessage.scale})`;
  }

  // Update title and subtext with increasing urgency
  if (shameTitle && clickCount > 3) {
    const intensity = Math.floor(clickCount / 3);
    if (intensity === 2) {
      shameTitle.textContent = 'Stop. Just Stop.';
    } else if (intensity >= 3) {
      shameTitle.textContent = 'You\'re Really Doing This?';
    }
  }

  if (shameSubtext) {
    if (clickCount === 5) {
      shameSubtext.textContent = 'Halfway there... halfway to regret.';
    } else if (clickCount === 8) {
      shameSubtext.textContent = 'Almost done throwing away your dignity.';
    } else if (clickCount === 9) {
      shameSubtext.textContent = 'One. More. Click.';
      shameSubtext.classList.add('text-red-400', 'font-bold');
    }
  }

  // Escalating screen shake
  if (stage2Container) {
    const shakeIntensity = Math.min(clickCount, 5);
    stage2Container.classList.add(`screen-shake-${shakeIntensity}`);
    setTimeout(() => {
      stage2Container.classList.remove(`screen-shake-${shakeIntensity}`);
    }, 500);
  }

  // Progressive background color change
  if (body) {
    const redIntensity = Math.floor((clickCount / 10) * 30);
    body.style.backgroundColor = `rgb(${17 + redIntensity}, ${24 - redIntensity}, ${39 - redIntensity})`;
  }

  // Add shake animation to button
  if (shameButton) {
    shameButton.classList.add('shake-animation');
    shameButton.disabled = true;
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

  // Show and animate cooldown bar
  if (cooldownBar) {
    cooldownBar.style.width = '100%';
    cooldownBar.style.transition = 'none';
    setTimeout(() => {
      cooldownBar.style.transition = `width ${clickCooldown}ms linear`;
      cooldownBar.style.width = '0%';
    }, 50);
  }

  // Increasing cooldown with each click (makes it more painful)
  setTimeout(() => {
    canClick = true;
    if (shameButton) {
      shameButton.disabled = false;
    }
  }, clickCooldown);

  // Increase cooldown for next click
  clickCooldown = Math.min(clickCooldown + 200, 2000);

  // Progress to stage 3 after 10 clicks
  if (clickCount >= 10) {
    setTimeout(() => {
      showStage(3);
      // Reset background
      if (body) {
        body.style.backgroundColor = '';
      }
    }, clickCooldown + 400);
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
