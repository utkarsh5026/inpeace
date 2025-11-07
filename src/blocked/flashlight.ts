/**
 * Creates a "flashlight" effect where the screen is darkened except for a circular area
 * that follows the user's mouse cursor, revealing content underneath.
 * Used to create an interactive challenge on blocked pages.
 */
export class FlashLight {
  private isActive = false;

  /**
   * Activates the flashlight effect, darkening the screen and enabling mouse tracking.
   * Shows an overlay with a circular spotlight that follows the mouse cursor.
   * Applies dark-mode styling to stage2 and triggers the provided callback.
   * @param onActive - Callback function executed when the flashlight is activated
   */
  activate(onActive: () => void): void {
    const flashlightOverlay = document.getElementById('flashlightOverlay');
    const stage2 = document.getElementById('stage2');

    if (!flashlightOverlay || !stage2) return;

    this.isActive = true;
    onActive();

    flashlightOverlay.classList.remove('hidden');
    stage2.classList.add('dark-mode');
    this.registerMouseListener(flashlightOverlay);
  }

  /**
   * Registers a mousemove event listener to track cursor position and update the flashlight.
   * Updates CSS custom properties (--mouse-x, --mouse-y) as percentages of viewport dimensions.
   * Stores the handler reference on the overlay element for later cleanup.
   * @param flashlightOverlay - The DOM element representing the flashlight overlay
   * @private
   */
  private registerMouseListener(flashlightOverlay: HTMLElement): void {
    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isActive) return;

      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      flashlightOverlay.style.setProperty('--mouse-x', `${x}%`);
      flashlightOverlay.style.setProperty('--mouse-y', `${y}%`);
    };

    document.addEventListener('mousemove', handleMouseMove);
    (flashlightOverlay as any).mouseMoveHandler = handleMouseMove;
  }

  /**
   * Deactivates the flashlight effect and cleans up event listeners.
   * Hides the overlay, removes dark-mode styling, and unregisters the mousemove handler.
   * Safe to call even if the flashlight is already inactive.
   */
  deactivate(): void {
    const flashlightOverlay = document.getElementById('flashlightOverlay');
    const stage2 = document.getElementById('stage2');

    if (!flashlightOverlay || !stage2) return;

    this.isActive = false;

    flashlightOverlay.classList.add('hidden');
    stage2.classList.remove('dark-mode');
    const handler = (flashlightOverlay as any).mouseMoveHandler;
    if (handler) {
      document.removeEventListener('mousemove', handler);
    }
  }

  /**
   * Gets the current activation state of the flashlight effect.
   * @returns True if the flashlight is currently active, false otherwise
   */
  get active(): boolean {
    return this.isActive;
  }
}
