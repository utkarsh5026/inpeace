export class Timer {
  private timerInterval: number | null = null;
  private timeRemaining: number;
  private duration: number;

  constructor(
    timerDuration: number,
    private updateInterval: number
  ) {
    this.duration = timerDuration;
    this.timeRemaining = timerDuration;
  }

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

  start(onExpire: () => void): void {
    this.clear();

    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) {
      timerContainer.classList.remove('hidden');
    }

    this.timeRemaining = this.duration;
    this.updateTimerDisplay();

    this.timerInterval = window.setInterval(() => {
      this.timeRemaining -= this.updateInterval;
      if (this.timeRemaining <= 0) onExpire();
      else this.updateTimerDisplay();
    }, this.updateInterval);
  }

  private updateTimerDisplay(): void {
    const timerBar = document.getElementById('timerBar');
    const timerSeconds = document.getElementById('timerSeconds');

    if (!timerBar || !timerSeconds) return;

    const percentageRemaining = (this.timeRemaining / this.duration) * 100;
    const secondsRemaining = (this.timeRemaining / 1000).toFixed(1);
    timerSeconds.textContent = secondsRemaining;

    this.updateTimerBarDisplay(timerBar, percentageRemaining);
  }

  private updateTimerBarDisplay(
    timerBar: HTMLElement,
    percentageRemaining: number
  ) {
    timerBar.style.width = `${percentageRemaining}%`;
    timerBar.classList.remove('warning', 'danger');
    if (this.timeRemaining <= 1000) {
      timerBar.classList.add('danger');
    } else if (this.timeRemaining <= 1500) {
      timerBar.classList.add('warning');
    }
    // else - default green color
  }
}
