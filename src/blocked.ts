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

// Shame Ritual Logic
let clickCount = 0;
let currentStage = 0;
let canClick = true;
let clickCooldown = 800; // Start with 800ms cooldown
let isFlashlightActive = false;
let buttonFound = false;

// Timer Logic
let clickTimer: number | null = null;
let timerInterval: number | null = null;
let timeRemaining = 2000; // 2 seconds in milliseconds
const TIMER_DURATION = 2000; // 2 seconds
const TIMER_UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation

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
  {
    text: 'Congratulations. You Have Zero Self-Control.',
    emoji: '💔',
    scale: 2.0,
  },
];

// Timer Functions
function startClickTimer(): void {
  // Clear any existing timer
  clearClickTimer();

  // Show timer container
  const timerContainer = document.getElementById('timerContainer');
  if (timerContainer) {
    timerContainer.classList.remove('hidden');
  }

  // Reset time remaining
  timeRemaining = TIMER_DURATION;
  updateTimerDisplay();

  // Start the countdown interval
  timerInterval = window.setInterval(() => {
    timeRemaining -= TIMER_UPDATE_INTERVAL;

    if (timeRemaining <= 0) {
      handleTimerExpiry();
    } else {
      updateTimerDisplay();
    }
  }, TIMER_UPDATE_INTERVAL);
}

function clearClickTimer(): void {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Hide timer container
  const timerContainer = document.getElementById('timerContainer');
  if (timerContainer) {
    timerContainer.classList.add('hidden');
  }
}

function updateTimerDisplay(): void {
  const timerBar = document.getElementById('timerBar');
  const timerSeconds = document.getElementById('timerSeconds');

  if (!timerBar || !timerSeconds) return;

  // Calculate percentage remaining
  const percentageRemaining = (timeRemaining / TIMER_DURATION) * 100;
  timerBar.style.width = `${percentageRemaining}%`;

  // Update seconds display
  const secondsRemaining = (timeRemaining / 1000).toFixed(1);
  timerSeconds.textContent = secondsRemaining;

  // Update color based on time remaining
  timerBar.classList.remove('warning', 'danger');
  if (timeRemaining <= 1000) {
    // Less than 1 second - danger (red)
    timerBar.classList.add('danger');
  } else if (timeRemaining <= 1500) {
    // Less than 1.5 seconds - warning (yellow)
    timerBar.classList.add('warning');
  }
  // else - default green color
}

function handleTimerExpiry(): void {
  // Only go back if we have clicks to lose
  if (clickCount > 0) {
    // Go back one step
    clickCount--;

    const clickCountDisplay = document.getElementById('clickCount');
    if (clickCountDisplay) {
      clickCountDisplay.textContent = clickCount.toString();
    }

    // Update button text to previous message
    const shameButtonMoving = document.getElementById(
      'shameButtonMoving'
    ) as HTMLButtonElement;
    if (shameButtonMoving && clickCount > 0) {
      const previousMessage = shameMessages[clickCount - 1];
      shameButtonMoving.textContent = previousMessage.text;
    } else if (shameButtonMoving && clickCount === 0) {
      shameButtonMoving.textContent = 'I Have No Self-Control';
    }

    // Move button to new random position
    moveButtonRandomly();
  }

  // IMPORTANT: Restart the timer immediately - no breaks!
  // The timer keeps running until they reach 10 clicks
  startClickTimer();
}

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
  const shameButtonMoving = document.getElementById(
    'shameButtonMoving'
  ) as HTMLButtonElement;
  const buttonContainer = document.getElementById('buttonContainer');
  const initialView = document.getElementById('initialView');
  const flashlightMode = document.getElementById('flashlightMode');

  if (!shameButtonMoving || !buttonContainer || !initialView || !flashlightMode)
    return;

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

  // Get flashlight message dimensions to avoid overlap
  const flashlightMessage = document.getElementById('flashlightMessage');
  let messageBottom = 0;
  if (flashlightMessage) {
    const messageRect = flashlightMessage.getBoundingClientRect();
    messageBottom = messageRect.bottom + 20; // Add 20px buffer below message
    console.log('Flashlight message bottom:', messageBottom);
  }

  // Minimum margin from edges (16px as requested)
  const margin = 16;

  // Calculate safe bounds for positioning
  // The button will be positioned absolutely from its top-left corner
  const minX = margin;
  const maxX = viewportWidth - buttonWidth - margin;
  const minY = Math.max(margin, messageBottom); // Don't place button above the message
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

  if (
    willOverflowRight ||
    willOverflowBottom ||
    willOverflowLeft ||
    willOverflowTop
  ) {
    console.error('Button will overflow!', {
      right: willOverflowRight,
      bottom: willOverflowBottom,
      left: willOverflowLeft,
      top: willOverflowTop,
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

  // Clear any existing timer since they clicked in time
  clearClickTimer();

  canClick = false;
  clickCount++;

  const clickCountDisplay = document.getElementById('clickCount');
  const shameButton = document.getElementById(
    'shameButton'
  ) as HTMLButtonElement;
  const shameButtonMoving = document.getElementById(
    'shameButtonMoving'
  ) as HTMLButtonElement;

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

    // Clear timer on final click - they won!
    clearClickTimer();

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

      // Start the timer for the next click - pressure is on!
      startClickTimer();
    }, 300); // Brief delay before next round
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
    proceedFinalBtn.addEventListener('click', () => allowAccess(site));
  }
});
