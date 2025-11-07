/**
 * A visual countdown timer that displays progress in the UI.
 * Manages timer state, updates the display at regular intervals, and triggers callbacks on expiration.
 */
export class Timer {
  private timerInterval: number | null = null;
  private timeRemaining: number;
  private duration: number;

  /**
   * Creates a new Timer instance.
   * @param timerDuration - The total duration of the timer in milliseconds
   * @param updateInterval - How often to update the timer display in milliseconds
   */
  constructor(
    timerDuration: number,
    private updateInterval: number
  ) {
    this.duration = timerDuration;
    this.timeRemaining = timerDuration;
  }

  /**
   * Clears the active timer interval and hides the timer UI.
   * Safe to call multiple times - will only clear if a timer is running.
   */
  clear(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) {
      timerContainer.classList.add('hidden');
    }
  }

  /**
   * Starts the countdown timer, showing the UI and calling the callback when time expires.
   * Automatically clears any existing timer before starting.
   * @param onExpire - Callback function to execute when the timer reaches zero
   */
  start(onExpire: () => void): void {
    this.clear();

    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) {
      timerContainer.classList.remove('hidden');
    }

    this.timeRemaining = this.duration;
    this.updateTimerDisplay();
    this.setInterval(onExpire);
  }

  /**
   * Sets up a recurring interval that decrements the remaining time and updates the display.
   * @param onExpire - Callback function to be invoked when the timer reaches zero
   * @private
   */
  private setInterval(onExpire: () => void): void {
    this.timerInterval = window.setInterval(() => {
      this.timeRemaining -= this.updateInterval;

      if (this.timeRemaining <= 0) onExpire();
      else this.updateTimerDisplay();
    }, this.updateInterval);
  }

  /**
   * Updates the timer bar width and remaining seconds text in the DOM.
   * Calculates percentage remaining and formats seconds with one decimal place.
   * @private
   */
  private updateTimerDisplay(): void {
    const timerBar = document.getElementById('timerBar');
    const timerSeconds = document.getElementById('timerSeconds');

    if (!timerBar || !timerSeconds) return;

    const percentageRemaining = (this.timeRemaining / this.duration) * 100;
    const secondsRemaining = (this.timeRemaining / 1000).toFixed(1);
    timerSeconds.textContent = secondsRemaining;

    this.updateTimerBarDisplay(timerBar, percentageRemaining);
  }

  /**
   * Updates the visual styling of the timer bar based on remaining time.
   * Applies color classes: default (green) -> 'warning' (≤1.5s) -> 'danger' (≤1s)
   * @param timerBar - The DOM element representing the timer progress bar
   * @param percentageRemaining - The percentage of time remaining (0-100)
   * @private
   */
  private updateTimerBarDisplay(
    timerBar: HTMLElement,
    percentageRemaining: number
  ) {
    timerBar.style.width = `${percentageRemaining}%`;
    timerBar.classList.remove('warning', 'danger');
    if (this.timeRemaining <= this.duration / 2) {
      timerBar.classList.add('danger');
    } else if (this.timeRemaining <= this.duration * (3 / 4)) {
      timerBar.classList.add('warning');
    }
  }
}
