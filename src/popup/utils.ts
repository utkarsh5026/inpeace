// Time and formatting utilities for popup

export const TIME = {
  MINUTE_MS: 60 * 1000,
  COUNTDOWN_UPDATE_INTERVAL: 1000,
} as const;

/**
 * Pluralize words based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + 's');
}

/**
 * Format time remaining in a human-readable format
 * @param expirationTime - Timestamp in milliseconds
 * @returns Formatted string like "5 minutes" or "2h 30m"
 */
export function formatTimeRemaining(expirationTime: number): string {
  const now = Date.now();
  const remaining = expirationTime - now;

  if (remaining <= 0) {
    return 'Expiring soon...';
  }

  const minutes = Math.ceil(remaining / TIME.MINUTE_MS);

  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, 'minute')}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ${pluralize(hours, 'hour')}`;
  }

  return `${hours}h ${mins}m`;
}
