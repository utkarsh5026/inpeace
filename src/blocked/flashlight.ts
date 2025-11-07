export class FlashLight {
  private isActive = false;

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

  get active(): boolean {
    return this.isActive;
  }
}
