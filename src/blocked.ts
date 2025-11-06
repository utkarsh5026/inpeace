// Get the blocked site from URL
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');

interface DailySiteVisits {
  [site: string]: {
    count: number;
    date: string;
  };
}

interface BlockStats {
  total: number;
  lastDate: string;
  todayCount: number;
}

let todayVisitCount = 0;

// Update per-site daily visit tracking
async function updateDailySiteVisits(): Promise<void> {
  if (!site) return;

  const today = new Date().toISOString().split('T')[0]; // Format: "2025-11-06"
  const result = await chrome.storage.local.get('dailySiteVisits');
  let dailySiteVisits: DailySiteVisits = result.dailySiteVisits || {};

  // Check if we have data for this site
  if (!dailySiteVisits[site] || dailySiteVisits[site].date !== today) {
    // New day or first visit - reset count
    dailySiteVisits[site] = {
      count: 1,
      date: today,
    };
    todayVisitCount = 1;
  } else {
    // Same day - increment count
    dailySiteVisits[site].count++;
    todayVisitCount = dailySiteVisits[site].count;
  }

  // Save updated stats
  await chrome.storage.local.set({ dailySiteVisits });

  // Update the display
  updateVisitCountDisplay();
}

// Update the visit count display
function updateVisitCountDisplay(): void {
  const visitCountElement = document.getElementById('visitCount');
  const visitPluralElement = document.getElementById('visitPlural');

  if (visitCountElement && todayVisitCount > 0) {
    visitCountElement.textContent = todayVisitCount.toString();

    // Update singular/plural form
    if (visitPluralElement) {
      visitPluralElement.textContent = todayVisitCount === 1 ? '' : 's';
    }

    // Show the visit message container
    const visitMessageElement = document.getElementById('visitMessage');
    if (visitMessageElement) {
      visitMessageElement.classList.remove('hidden');
    }
  }
}

// Update the blocked site display
if (site) {
  const blockedSiteElement = document.getElementById('blockedSite');
  if (blockedSiteElement) {
    blockedSiteElement.textContent = site;
  }
}

// Update block statistics (stored for potential future use)
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
}

// Initialize tracking
updateDailySiteVisits();
updateStats();

// Shame Ritual Logic
let clickCount = 0;
let currentStage = 0;
let canClick = true;
let clickCooldown = 800; // Start with 800ms cooldown
let isFlashlightActive = false;
let buttonFound = false;

// Progressive messages for each click
const shameMessages = [
  { text: 'I Have No Self-Control', emoji: '😞', scale: 1.0 },
  { text: "Really? You're Going Through With This?", emoji: '😟', scale: 1.1 },
  { text: "Think About What You're Doing...", emoji: '😥', scale: 1.2 },
  { text: 'This Is Embarrassing', emoji: '😓', scale: 1.3 },
  {
    text: 'You Could Be Doing Literally Anything Else',
    emoji: '😢',
    scale: 1.4,
  },
  { text: 'Your Future Self Is Disappointed', emoji: '😭', scale: 1.5 },
  { text: 'Is This Really Worth It?', emoji: '🤦', scale: 1.6 },
  { text: 'You Have No Willpower', emoji: '😤', scale: 1.7 },
  { text: "One More Click... That's All It Takes", emoji: '😔', scale: 1.8 },
  { text: 'Congratulations. You Have Zero Self-Control.', emoji: '💔', scale: 2.0 },
];

// Start at stage 1 immediately when page loads
function initShameRitual(): void {
  showStage(1);
}

function startShameRitual(): void {
  showStage(2);
  clickCount = 0;
  canClick = true;
  clickCooldown = 800;
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

function activateFlashlight(): void {
  const flashlightOverlay = document.getElementById('flashlightOverlay');
  const stage2 = document.getElementById('stage2');

  if (!flashlightOverlay || !stage2) return;

  isFlashlightActive = true;
  buttonFound = false;

  // Show flashlight overlay and dark mode
  flashlightOverlay.classList.remove('hidden');
  stage2.classList.add('dark-mode');

  // Track mouse movement for flashlight effect
  const handleMouseMove = (e: MouseEvent) => {
    if (!isFlashlightActive) return;

    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    flashlightOverlay.style.setProperty('--mouse-x', `${x}%`);
    flashlightOverlay.style.setProperty('--mouse-y', `${y}%`);
  };

  document.addEventListener('mousemove', handleMouseMove);

  // Store the handler so we can remove it later
  (flashlightOverlay as any).mouseMoveHandler = handleMouseMove;
}

function deactivateFlashlight(): void {
  const flashlightOverlay = document.getElementById('flashlightOverlay');
  const stage2 = document.getElementById('stage2');

  if (!flashlightOverlay || !stage2) return;

  isFlashlightActive = false;

  // Hide flashlight overlay
  flashlightOverlay.classList.add('hidden');
  stage2.classList.remove('dark-mode');

  // Remove mouse move listener
  const handler = (flashlightOverlay as any).mouseMoveHandler;
  if (handler) {
    document.removeEventListener('mousemove', handler);
  }
}

function moveButtonRandomly(): void {
  const shameButtonMoving = document.getElementById('shameButtonMoving') as HTMLButtonElement;
  const buttonContainer = document.getElementById('buttonContainer');
  const initialView = document.getElementById('initialView');
  const flashlightMode = document.getElementById('flashlightMode');

  if (!shameButtonMoving || !buttonContainer || !initialView || !flashlightMode) return;

  // First, show flashlight mode so the button becomes visible for measurement
  initialView.classList.add('hidden');
  flashlightMode.classList.remove('hidden');

  // Reset button styling for measurement
  shameButtonMoving.style.transition = 'none';
  shameButtonMoving.style.transform = 'none';
  shameButtonMoving.style.left = '0px';
  shameButtonMoving.style.top = '0px';
  shameButtonMoving.style.visibility = 'visible';
  shameButtonMoving.style.display = 'block';

  // Force a reflow to ensure the button is rendered
  void shameButtonMoving.offsetHeight;

  // Now get the actual button dimensions
  const buttonRect = shameButtonMoving.getBoundingClientRect();
  const buttonWidth = buttonRect.width;
  const buttonHeight = buttonRect.height;

  console.log('Button dimensions:', buttonWidth, 'x', buttonHeight);

  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  console.log('Viewport dimensions:', viewportWidth, 'x', viewportHeight);

  // Minimum margin from edges (16px as requested)
  const margin = 16;

  // Calculate safe bounds for positioning
  // The button will be positioned absolutely from its top-left corner
  const minX = margin;
  const maxX = viewportWidth - buttonWidth - margin;
  const minY = margin;
  const maxY = viewportHeight - buttonHeight - margin;

  console.log('Safe bounds - X:', minX, 'to', maxX, '| Y:', minY, 'to', maxY);

  // Generate random position within safe bounds
  let randomX: number;
  let randomY: number;

  if (maxX <= minX) {
    // Not enough horizontal space, center it
    randomX = (viewportWidth - buttonWidth) / 2;
    console.warn('Not enough horizontal space, centering button');
  } else {
    randomX = minX + Math.random() * (maxX - minX);
  }

  if (maxY <= minY) {
    // Not enough vertical space, center it
    randomY = (viewportHeight - buttonHeight) / 2;
    console.warn('Not enough vertical space, centering button');
  } else {
    randomY = minY + Math.random() * (maxY - minY);
  }

  console.log('Placing button at:', randomX, ',', randomY);

  // Verify the button will be within bounds
  const willOverflowRight = randomX + buttonWidth > viewportWidth - margin;
  const willOverflowBottom = randomY + buttonHeight > viewportHeight - margin;
  const willOverflowLeft = randomX < margin;
  const willOverflowTop = randomY < margin;

  if (willOverflowRight || willOverflowBottom || willOverflowLeft || willOverflowTop) {
    console.error('Button will overflow!', {
      right: willOverflowRight,
      bottom: willOverflowBottom,
      left: willOverflowLeft,
      top: willOverflowTop
    });
  }

  // Apply the final position instantly (no transition)
  shameButtonMoving.style.left = `${randomX}px`;
  shameButtonMoving.style.top = `${randomY}px`;
  shameButtonMoving.style.transform = 'none';

  // Reset button found state when moving
  buttonFound = false;

  // Activate flashlight effect
  activateFlashlight();
}

function handleShameClick(): void {
  if (!canClick || clickCount >= 10) return;

  canClick = false;
  clickCount++;

  const clickCountDisplay = document.getElementById('clickCount');
  const shameButton = document.getElementById('shameButton') as HTMLButtonElement;
  const shameButtonMoving = document.getElementById('shameButtonMoving') as HTMLButtonElement;

  // Update click count display
  if (clickCountDisplay) {
    clickCountDisplay.textContent = clickCount.toString();
  }

  // Update button text with messages
  const currentMessage = shameMessages[clickCount - 1];
  const activeButton = isFlashlightActive ? shameButtonMoving : shameButton;

  if (activeButton && currentMessage) {
    activeButton.textContent = currentMessage.text;
  }

  // Disable button temporarily
  if (activeButton) {
    activeButton.disabled = true;
  }

  // Progress to stage 3 after 10 clicks
  if (clickCount >= 10) {
    // Deactivate flashlight on final click
    if (isFlashlightActive) {
      deactivateFlashlight();
    }

    // Keep button disabled after 10th click
    if (activeButton) {
      activeButton.disabled = true;
    }
    setTimeout(() => {
      showStage(3);
    }, 1000);
  } else {
    // Move button to random position and keep searching
    setTimeout(() => {
      moveButtonRandomly();
      canClick = true;
      if (shameButtonMoving) {
        shameButtonMoving.disabled = false;
      }
    }, 300); // Brief delay before next round
  }
}

function handleFinalCheckbox(): void {
  const checkbox = document.getElementById('finalCheckbox') as HTMLInputElement;
  const proceedBtn = document.getElementById(
    'proceedFinalBtn'
  ) as HTMLButtonElement;

  if (!checkbox || !proceedBtn) return;

  if (checkbox.checked) {
    proceedBtn.disabled = false;
    proceedBtn.classList.remove('bg-gray-600');
    proceedBtn.classList.add(
      'bg-red-600',
      'hover:bg-red-700',
      'cursor-pointer'
    );
  } else {
    proceedBtn.disabled = true;
    proceedBtn.classList.add('bg-gray-600');
    proceedBtn.classList.remove(
      'bg-red-600',
      'hover:bg-red-700',
      'cursor-pointer'
    );
  }
}

async function allowAccess(): Promise<void> {
  // Show dramatic countdown before allowing access
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  const proceedFinalBtn = document.getElementById(
    'proceedFinalBtn'
  ) as HTMLButtonElement;

  if (!countdownOverlay || !countdownNumber) return;

  // Disable button
  if (proceedFinalBtn) {
    proceedFinalBtn.disabled = true;
  }

  // Add site to temporary whitelist (30 minutes = 1800000ms)
  if (site) {
    const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    const result = await chrome.storage.local.get('tempWhitelist');
    const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};
    tempWhitelist[site] = expirationTime;
    await chrome.storage.local.set({ tempWhitelist });
  }

  // Show overlay
  countdownOverlay.classList.remove('hidden');

  let count = 3;
  const showCount = () => {
    if (count > 0) {
      countdownNumber.textContent = count.toString();
      countdownNumber.classList.remove('countdown-number');
      // Force reflow to restart animation
      countdownNumber.offsetWidth;
      countdownNumber.classList.add('countdown-number');
      count--;
      setTimeout(showCount, 1000);
    } else {
      // Redirect to the site
      if (site) {
        window.location.href = 'https://' + site;
      }
    }
  };

  showCount();
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

  // Initial shame button (for first click)
  const shameButton = document.getElementById('shameButton');
  if (shameButton) {
    shameButton.addEventListener('click', handleShameClick);
  }

  // Moving shame button (for flashlight mode)
  const shameButtonMoving = document.getElementById('shameButtonMoving');
  if (shameButtonMoving) {
    shameButtonMoving.addEventListener('click', handleShameClick);

    // Add hover detection for flashlight mode
    shameButtonMoving.addEventListener('mouseenter', () => {
      if (isFlashlightActive && !buttonFound) {
        buttonFound = true;
        // Give visual feedback that button is found (temporarily brighten)
        shameButtonMoving.style.filter = 'brightness(1.3)';
        setTimeout(() => {
          if (shameButtonMoving) {
            shameButtonMoving.style.filter = '';
          }
        }, 200);
      }
    });
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
