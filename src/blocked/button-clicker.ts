import { shameMessages } from './messages';
import { Timer } from './timer';
import { FlashLight } from './flashlight';

const MAX_CLICKS = 10;
const TIMER_DURATION = 1500; // 2 seconds
const TIMER_UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation
const SHAME_BUTTON_MOVING = 'shameButtonMoving';
const SHAME_BUTTON_STATIC = 'shameButton';

export class ShameButton {
  private clickCount: number = 0;
  private canClick: boolean = true;
  private buttonFound = false;

  private timer: Timer;
  private flashLight: FlashLight;
  private onStageComplete: () => void;

  constructor(onStageComplete: () => void) {
    this.timer = new Timer(TIMER_DURATION, TIMER_UPDATE_INTERVAL);
    this.flashLight = new FlashLight();
    this.onStageComplete = onStageComplete;
  }

  private handleShameClick(): void {
    if (!this.canClick || this.clickCount >= MAX_CLICKS) return;
    console.log('clicking shame button');
    this.timer.clear();
    this.canClick = false;
    this.clickCount++;

    const clickCountDisplay = document.getElementById('clickCount');
    const button = document.getElementById(
      SHAME_BUTTON_STATIC
    ) as HTMLButtonElement;
    const buttonMoving = document.getElementById(
      SHAME_BUTTON_MOVING
    ) as HTMLButtonElement;

    if (clickCountDisplay) {
      clickCountDisplay.textContent = this.clickCount.toString();
    }

    const currMsg = shameMessages[this.clickCount - 1];
    const activeButton = this.flashLight.active ? buttonMoving : button;

    if (activeButton && currMsg) {
      activeButton.textContent = currMsg.text;
    }

    if (activeButton) {
      activeButton.disabled = true;
    }

    if (this.clickCount >= MAX_CLICKS) {
      if (this.flashLight.active) {
        this.flashLight.deactivate();
      }

      this.timer.clear();
      if (activeButton) activeButton.disabled = true;
      this.onStageComplete();
    } else {
      setTimeout(() => {
        this.moveButtonRandomly();
        this.canClick = true;
        if (buttonMoving) buttonMoving.disabled = false;

        this.timer.start(this.handleTimerExpiry.bind(this));
      }, 300); // Brief delay before next round
    }
  }

  private handleTimerExpiry(): void {
    if (this.clickCount == 0) {
      this.timer.start(this.handleTimerExpiry.bind(this));
      return;
    }

    this.clickCount--;
    const clickCountDisplay = document.getElementById('clickCount');
    if (clickCountDisplay) {
      clickCountDisplay.textContent = this.clickCount.toString();
    }

    const shameButtonMoving = document.getElementById(
      'shameButtonMoving'
    ) as HTMLButtonElement;
    if (shameButtonMoving && this.clickCount > 0) {
      const previousMessage = shameMessages[this.clickCount - 1];
      shameButtonMoving.textContent = previousMessage.text;
    } else if (shameButtonMoving && this.clickCount === 0) {
      shameButtonMoving.textContent = 'I Have No Self-Control';
    }

    this.moveButtonRandomly();
    this.timer.start(this.handleTimerExpiry.bind(this));
  }

  private moveButtonRandomly(): void {
    const shameButtonMoving = document.getElementById(
      'shameButtonMoving'
    ) as HTMLButtonElement;
    const buttonContainer = document.getElementById('buttonContainer');
    const initialView = document.getElementById('initialView');
    const flashlightMode = document.getElementById('flashlightMode');

    if (
      !shameButtonMoving ||
      !buttonContainer ||
      !initialView ||
      !flashlightMode
    )
      return;

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

    this.buttonFound = false;
    this.flashLight.activate(() => {
      this.buttonFound = false;
    });
  }

  registerListeners(): void {
    const shameButton = document.getElementById(SHAME_BUTTON_STATIC);
    if (shameButton) {
      shameButton.addEventListener('click', this.handleShameClick.bind(this));
    }

    const shameButtonMoving = document.getElementById(SHAME_BUTTON_MOVING);
    if (shameButtonMoving) {
      shameButtonMoving.addEventListener(
        'click',
        this.handleShameClick.bind(this)
      );

      shameButtonMoving.addEventListener('mouseenter', () => {
        if (this.flashLight.active && !this.buttonFound) {
          this.buttonFound = true;
          shameButtonMoving.style.filter = 'brightness(1.3)';
          setTimeout(() => {
            if (shameButtonMoving) {
              shameButtonMoving.style.filter = '';
            }
          }, 200);
        }
      });
    }
  }
}
