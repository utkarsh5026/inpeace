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

/**
 * Manages an interactive "shame button" challenge on blocked pages.
 *
 * Creates a progressively difficult interaction where users must click a button
 * multiple times to proceed. The button moves randomly, uses a flashlight effect
 * to obscure visibility, and employs a countdown timer that resets progress.
 *
 * Flow:
 * 1. User clicks the shame button
 * 2. Button moves to a random position with flashlight effect
 * 3. Timer counts down - if it expires, click count decreases
 * 4. After MAX_CLICKS successful clicks, the stage is complete
 */
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

  /**
   * Handles click events on the shame button.
   *
   * Prevents clicking if:
   * - The button is disabled (canClick = false)
   * - Maximum clicks have been reached
   *
   * On valid click:
   * 1. Clears the active timer
   * 2. Increments click count
   * 3. Updates UI displays
   * 4. Either completes the stage or moves the button to continue
   *
   * @private
   */
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

  /**
   * Restarts the shame challenge after a brief delay.
   *
   * Re-enables clicking, moves the button to a new random position,
   * and starts a new countdown timer. The delay creates a brief pause
   * after each click for visual feedback.
   *
   * @param buttonMoving - The moving button element to re-enable
   * @private
   */
  private restartShaming(buttonMoving: HTMLButtonElement): void {
    setTimeout(() => {
      this.moveButtonRandomly();
      this.canClick = true;
      if (buttonMoving) buttonMoving.disabled = false;

      this.timer.start(this.handleTimerExpiry.bind(this));
    }, 300);
  }

  /**
   * Handles the completion of the shame button challenge.
   *
   * Called when the user reaches MAX_CLICKS. Deactivates the flashlight,
   * clears the timer, disables the button, and invokes the stage completion callback.
   *
   * @param activeButton - The currently active button element to disable
   * @private
   */
  private userIsShameless(activeButton: HTMLButtonElement | null): void {
    if (this.flashLight.active) this.flashLight.deactivate();
    this.timer.clear();

    if (activeButton) activeButton.disabled = true;
    this.onStageComplete();
    return;
  }

  /**
   * Updates the visual state of the clicked button.
   *
   * Changes the button text to the shame message and disables it temporarily
   * to provide visual feedback and prevent rapid clicking.
   *
   * @param activeButton - The button element that was just clicked
   * @private
   */
  private updateActiveButtonDisplay(activeButton: HTMLButtonElement) {
    if (activeButton) {
      activeButton.textContent = SHAME_MESSAGE;
    }

    if (activeButton) {
      activeButton.disabled = true;
    }
  }

  /**
   * Handles timer expiration events.
   *
   * When the countdown timer reaches zero:
   * - If click count is 0, restarts the timer (initial state)
   * - If click count > 0, decrements it (penalizes slow clicking)
   * - Updates displays, changes button message, and moves button to new position
   * - Restarts the timer for the next cycle
   *
   * @private
   */
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

  /**
   * Updates the DOM element displaying the current click count.
   * Expects an element with ID 'clickCount' to exist in the DOM.
   * @private
   */
  private updateClickCountDisplay(): void {
    const clickCountDisplay = document.getElementById('clickCount');
    if (clickCountDisplay) {
      clickCountDisplay.textContent = this.clickCount.toString();
    }
  }

  /**
   * Updates the moving button's text based on current click count.
   *
   * Shows "SHAME" when the count is positive (user has made progress).
   * Shows "I Have No Self-Control" when count reaches zero (reset to initial state).
   *
   * @private
   */
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

  /**
   * Moves the shame button to a random position on the screen.
   *
   * Transitions from the initial static view to flashlight mode, calculates
   * a random position that keeps the button within viewport bounds and
   * below the flashlight message, then positions the button accordingly.
   * Resets the button discovery state and activates the flashlight effect.
   *
   * @private
   */
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

  /**
   * Calculates the bottom position of the flashlight message element.
   *
   * Used to ensure the button doesn't overlap with the instruction message
   * at the top of the screen. Includes a 20px buffer below the message.
   *
   * @returns The Y coordinate (in pixels) below which the button can be positioned
   * @private
   */
  private getFlashLightMessageBottom(): number {
    const flashlightMessage = document.getElementById('flashlightMessage');
    let messageBottom = 0;
    if (flashlightMessage) {
      const messageRect = flashlightMessage.getBoundingClientRect();
      messageBottom = messageRect.bottom + 20; // Add 20px buffer below message
    }

    return messageBottom;
  }

  /**
   * Resets the button's inline styles to prepare for repositioning.
   *
   * Removes any transitions, transforms, and positioning from previous states
   * to ensure clean repositioning. Makes the button visible and displayed.
   *
   * @param button - The button element to reset
   * @private
   */
  private resetButtonStyle(button: HTMLButtonElement): void {
    button.style.transition = 'none';
    button.style.transform = 'none';
    button.style.left = '0px';
    button.style.top = '0px';
    button.style.visibility = 'visible';
    button.style.display = 'block';
  }

  /**
   * Calculates the safe positioning boundaries for the button.
   *
   * Determines the minimum and maximum X/Y coordinates where the button
   * can be positioned while staying:
   * - Within viewport bounds
   * - With proper margins from edges
   * - Below the flashlight instruction message
   *
   * @param buttonWidth - Width of the button in pixels
   * @param buttonHeight - Height of the button in pixels
   * @param messageBottom - Y coordinate below which button can be placed
   * @returns Object containing min/max X and Y boundaries
   * @private
   */
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

  /**
   * Calculates a random position for the button within the given constraints.
   *
   * If there isn't enough space within constraints (e.g., button is larger than
   * available space), centers the button in that dimension instead.
   *
   * @param buttonWidth - Width of the button in pixels
   * @param buttonHeight - Height of the button in pixels
   * @param constraints - The boundaries within which to position the button
   * @returns Tuple of [x, y] coordinates for the button's top-left corner
   * @private
   */
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

  /**
   * Registers event listeners for both static and moving shame buttons.
   *
   * Sets up:
   * - Click handlers for both button variants
   * - Mouse enter handler for the moving button to detect when user's cursor
   *   finds it in flashlight mode (provides visual feedback)
   *
   * Should be called once during initialization to set up all interactive behavior.
   */
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
