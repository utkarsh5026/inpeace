import { Timer } from './timer';
import { FlashLight } from './flashlight';

const MAX_CLICKS = 10;
const TIMER_DURATION = 2000; // 2 seconds
const TIMER_UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation
const SHAME_BUTTON_MOVING = 'shameButtonMoving';
const SHAME_BUTTON_STATIC = 'shameButton';
const SHAME_MESSAGE = 'SHAME';

type ButtonConstraints = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

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
    this.timer.clear();
    this.canClick = false;
    this.clickCount++;

    const button = document.getElementById(
      SHAME_BUTTON_STATIC
    ) as HTMLButtonElement;
    const buttonMoving = document.getElementById(
      SHAME_BUTTON_MOVING
    ) as HTMLButtonElement;
    const activeButton = this.flashLight.active ? buttonMoving : button;

    this.updateClickCountDisplay();
    this.updateActiveButtonDisplay(activeButton);

    if (this.clickCount >= MAX_CLICKS) this.userIsShameless(activeButton);
    else this.restartShaming(buttonMoving);
  }

  private restartShaming(buttonMoving: HTMLButtonElement): void {
    setTimeout(() => {
      this.moveButtonRandomly();
      this.canClick = true;
      if (buttonMoving) buttonMoving.disabled = false;

      this.timer.start(this.handleTimerExpiry.bind(this));
    }, 300);
  }

  private userIsShameless(activeButton: HTMLButtonElement | null): void {
    if (this.flashLight.active) this.flashLight.deactivate();
    this.timer.clear();

    if (activeButton) activeButton.disabled = true;
    this.onStageComplete();
    return;
  }

  private updateActiveButtonDisplay(activeButton: HTMLButtonElement) {
    if (activeButton) {
      activeButton.textContent = SHAME_MESSAGE;
    }

    if (activeButton) {
      activeButton.disabled = true;
    }
  }

  private handleTimerExpiry(): void {
    if (this.clickCount == 0) {
      this.timer.start(this.handleTimerExpiry.bind(this));
      return;
    }

    this.clickCount--;
    this.updateClickCountDisplay();

    this.addMessageToButton();
    this.moveButtonRandomly();
    this.timer.start(this.handleTimerExpiry.bind(this));
  }

  private updateClickCountDisplay(): void {
    const clickCountDisplay = document.getElementById('clickCount');
    if (clickCountDisplay) {
      clickCountDisplay.textContent = this.clickCount.toString();
    }
  }

  private addMessageToButton(): void {
    const shameButtonMoving = document.getElementById(
      SHAME_BUTTON_MOVING
    ) as HTMLButtonElement;

    if (shameButtonMoving && this.clickCount > 0) {
      shameButtonMoving.textContent = SHAME_MESSAGE;
      return;
    }

    if (shameButtonMoving && this.clickCount === 0) {
      shameButtonMoving.textContent = 'I Have No Self-Control';
    }
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
    this.resetButtonStyle(shameButtonMoving);

    // Force a reflow to ensure the button is rendered
    void shameButtonMoving.offsetHeight;

    // Now get the actual button dimensions
    const buttonRect = shameButtonMoving.getBoundingClientRect();
    const buttonWidth = buttonRect.width;
    const buttonHeight = buttonRect.height;
    const messageBottom = this.getFlashLightMessageBottom();

    const constraints = this.determineButtonConstraints(
      buttonWidth,
      buttonHeight,
      messageBottom
    );

    const [randomX, randomY] = this.determineButtonPosition(
      buttonWidth,
      buttonHeight,
      constraints
    );

    shameButtonMoving.style.left = `${randomX}px`;
    shameButtonMoving.style.top = `${randomY}px`;
    shameButtonMoving.style.transform = 'none';

    this.buttonFound = false;
    this.flashLight.activate(() => {
      this.buttonFound = false;
    });
  }

  private getFlashLightMessageBottom(): number {
    const flashlightMessage = document.getElementById('flashlightMessage');
    let messageBottom = 0;
    if (flashlightMessage) {
      const messageRect = flashlightMessage.getBoundingClientRect();
      messageBottom = messageRect.bottom + 20; // Add 20px buffer below message
    }

    return messageBottom;
  }

  private resetButtonStyle(button: HTMLButtonElement): void {
    button.style.transition = 'none';
    button.style.transform = 'none';
    button.style.left = '0px';
    button.style.top = '0px';
    button.style.visibility = 'visible';
    button.style.display = 'block';
  }

  private determineButtonConstraints(
    buttonWidth: number,
    buttonHeight: number,
    messageBottom: number
  ): ButtonConstraints {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 16;

    // Calculate safe bounds for positioning
    // The button will be positioned absolutely from its top-left corner
    const minX = margin;
    const maxX = viewportWidth - buttonWidth - margin;
    const minY = Math.max(margin, messageBottom); // Don't place button above the message
    const maxY = viewportHeight - buttonHeight - margin;

    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  private determineButtonPosition(
    buttonWidth: number,
    buttonHeight: number,
    constraints: ButtonConstraints
  ): [number, number] {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { minX, maxX, minY, maxY } = constraints;

    const determinePos = (
      min: number,
      max: number,
      size: number,
      viewportSize: number
    ): number => {
      if (max <= min) {
        // Not enough space, center it
        return (viewportSize - size) / 2;
      }
      return min + Math.random() * (max - min);
    };

    let randomX: number;
    let randomY: number;

    randomX = determinePos(minX, maxX, buttonWidth, viewportWidth);
    randomY = determinePos(minY, maxY, buttonHeight, viewportHeight);

    return [randomX, randomY];
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
