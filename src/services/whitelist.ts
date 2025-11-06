import { TempWhitelist } from '../types';

/**
 * Cleans up expired entries from the temporary whitelist
 */
export function cleanupExpiredWhitelist(
  whitelist: TempWhitelist
): TempWhitelist {
  const now = Date.now();
  const cleaned: TempWhitelist = {};

  for (const [site, expiration] of Object.entries(whitelist)) {
    if (expiration > now) {
      cleaned[site] = expiration;
    }
  }

  return cleaned;
}

/**
 * Filters blocked sites by removing whitelisted ones
 */
export function filterActiveSites(
  blockedSites: string[],
  whitelist: TempWhitelist
): string[] {
  return blockedSites.filter(site => !whitelist[site]);
}

/**
 * Removes duplicates from site list
 */
export function getUniqueSites(sites: string[]): string[] {
  return [...new Set(sites)];
}
