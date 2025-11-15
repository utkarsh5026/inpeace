import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer } from '../../src/blocked/timer';

describe('blocked/timer.ts - Timer Class', () => {
  let mockTimerContainer: HTMLElement;
  let mockTimerBar: HTMLElement;
  let mockTimerSeconds: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create mock DOM elements
    mockTimerContainer = document.createElement('div');
    mockTimerContainer.id = 'timerContainer';
    mockTimerContainer.classList.add('hidden');

    mockTimerBar = document.createElement('div');
    mockTimerBar.id = 'timerBar';

    mockTimerSeconds = document.createElement('span');
    mockTimerSeconds.id = 'timerSeconds';

    document.body.appendChild(mockTimerContainer);
    document.body.appendChild(mockTimerBar);
    document.body.appendChild(mockTimerSeconds);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with correct duration', () => {
      const timer = new Timer(5000, 100);

      expect(timer).toBeInstanceOf(Timer);
    });

    it('should accept different duration and interval values', () => {
      const timer1 = new Timer(1000, 50);
      const timer2 = new Timer(10000, 500);

      expect(timer1).toBeInstanceOf(Timer);
      expect(timer2).toBeInstanceOf(Timer);
    });
  });

  describe('start', () => {
    it('should show timer container when started', () => {
      const timer = new Timer(5000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerContainer.classList.contains('hidden')).toBe(false);
    });

    it('should update timer display on start', () => {
      const timer = new Timer(5000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerSeconds.textContent).toBe('5.0');
      expect(mockTimerBar.style.width).toBe('100%');
    });

    it('should call onExpire callback when timer completes', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      vi.advanceTimersByTime(1000);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should decrement time correctly with each interval', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      // After 100ms
      vi.advanceTimersByTime(100);
      expect(mockTimerSeconds.textContent).toBe('0.9');

      // After 200ms
      vi.advanceTimersByTime(100);
      expect(mockTimerSeconds.textContent).toBe('0.8');

      // After 500ms total
      vi.advanceTimersByTime(300);
      expect(mockTimerSeconds.textContent).toBe('0.5');
    });

    it('should update progress bar width as time decreases', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerBar.style.width).toBe('100%');

      vi.advanceTimersByTime(500);
      expect(mockTimerBar.style.width).toBe('50%');

      vi.advanceTimersByTime(200);
      expect(mockTimerBar.style.width).toBe('30%');
    });

    it('should clear previous timer when starting a new one', () => {
      const timer = new Timer(5000, 100);
      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      timer.start(mockCallback1);
      vi.advanceTimersByTime(500);

      timer.start(mockCallback2);
      vi.advanceTimersByTime(5000);

      // First callback should not be called
      expect(mockCallback1).not.toHaveBeenCalled();
      // Second callback should be called
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });

    it('should reset time to full duration when restarted', () => {
      const timer = new Timer(2000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);
      vi.advanceTimersByTime(1000);

      expect(mockTimerSeconds.textContent).toBe('1.0');

      timer.start(mockCallback);

      expect(mockTimerSeconds.textContent).toBe('2.0');
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = ''; // Remove all elements

      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      expect(() => timer.start(mockCallback)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should hide timer container when cleared', () => {
      const timer = new Timer(5000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);
      mockTimerContainer.classList.remove('hidden');

      timer.clear();

      expect(mockTimerContainer.classList.contains('hidden')).toBe(true);
    });

    it('should stop timer interval when cleared', () => {
      const timer = new Timer(5000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);
      timer.clear();

      vi.advanceTimersByTime(10000);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(() => {
        timer.clear();
        timer.clear();
        timer.clear();
      }).not.toThrow();
    });

    it('should be safe to call before starting timer', () => {
      const timer = new Timer(1000, 100);

      expect(() => timer.clear()).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);
      document.body.innerHTML = '';

      expect(() => timer.clear()).not.toThrow();
    });
  });

  describe('timer display styling', () => {
    it('should apply danger class when time is <= 50% remaining', () => {
      const timer = new Timer(2000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      // Initially no danger class
      expect(mockTimerBar.classList.contains('danger')).toBe(false);

      // Advance to 50% (1000ms)
      vi.advanceTimersByTime(1000);

      expect(mockTimerBar.classList.contains('danger')).toBe(true);
    });

    it('should apply warning class when time is <= 75% remaining', () => {
      const timer = new Timer(4000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      // Initially no warning
      expect(mockTimerBar.classList.contains('warning')).toBe(false);

      // Advance to 75% (1000ms elapsed, 3000ms remaining)
      vi.advanceTimersByTime(1000);

      expect(mockTimerBar.classList.contains('warning')).toBe(true);
      expect(mockTimerBar.classList.contains('danger')).toBe(false);
    });

    it('should remove warning when danger is applied', () => {
      const timer = new Timer(2000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      // Get to warning state (> 50%, <= 75%)
      vi.advanceTimersByTime(500);
      expect(mockTimerBar.classList.contains('warning')).toBe(true);

      // Get to danger state (<= 50%)
      vi.advanceTimersByTime(500);
      expect(mockTimerBar.classList.contains('danger')).toBe(true);
      expect(mockTimerBar.classList.contains('warning')).toBe(false);
    });

    it('should not have warning or danger class at start (100%)', () => {
      const timer = new Timer(4000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerBar.classList.contains('warning')).toBe(false);
      expect(mockTimerBar.classList.contains('danger')).toBe(false);
    });
  });

  describe('timer display updates', () => {
    it('should format seconds with one decimal place', () => {
      const timer = new Timer(3456, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerSeconds.textContent).toBe('3.5');

      vi.advanceTimersByTime(100);
      expect(mockTimerSeconds.textContent).toBe('3.4');
    });

    it('should calculate percentage remaining correctly', () => {
      const timer = new Timer(1000, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerBar.style.width).toBe('100%');

      vi.advanceTimersByTime(100);
      expect(mockTimerBar.style.width).toBe('90%');

      vi.advanceTimersByTime(400);
      expect(mockTimerBar.style.width).toBe('50%');
    });

    it('should not update display after timer expires', () => {
      const timer = new Timer(500, 100);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      vi.advanceTimersByTime(500);
      const finalText = mockTimerSeconds.textContent;

      vi.advanceTimersByTime(500);
      expect(mockTimerSeconds.textContent).toBe(finalText);
    });
  });

  describe('edge cases', () => {
    it('should handle very short durations', () => {
      const timer = new Timer(100, 50);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      vi.advanceTimersByTime(100);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle very long durations', () => {
      const timer = new Timer(60000, 1000);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      expect(mockTimerSeconds.textContent).toBe('60.0');

      vi.advanceTimersByTime(30000);
      expect(mockTimerSeconds.textContent).toBe('30.0');
    });

    it('should handle interval equal to duration', () => {
      const timer = new Timer(1000, 1000);
      const mockCallback = vi.fn();

      timer.start(mockCallback);

      vi.advanceTimersByTime(1000);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should call onExpire only once', () => {
      const timer = new Timer(500, 100);
      const mockCallback = vi.fn(() => {
        // Clear timer to stop further callbacks
        timer.clear();
      });

      timer.start(mockCallback);

      vi.advanceTimersByTime(1000);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});
