/// <reference types="chrome" />
import {
  getBlockedSitesData,
  getTempWhitelist,
  saveTempWhitelist,
} from './storage';
import {
  cleanupExpiredWhitelist,
  filterActiveSites,
  getUniqueSites,
} from './whitelist';
import {
  createBlockingRules,
  getExistingRules,
  removeAllRules,
  addRules,
} from './rules';

let isUpdating = false;

/**
 * Main function to update declarative net request blocking rules
 * Handles cleanup of expired whitelist entries and updates blocking rules
 */
export async function updateBlockingRules(): Promise<void> {
  if (isUpdating) {
    console.log('Update already in progress, skipping...');
    return;
  }

  isUpdating = true;

  try {
    const { blockedSites, isEnabled } = await getBlockedSitesData();
    const tempWhitelist = await getTempWhitelist();

    const cleanedWhitelist = cleanupExpiredWhitelist(tempWhitelist);

    if (
      Object.keys(cleanedWhitelist).length !== Object.keys(tempWhitelist).length
    ) {
      await saveTempWhitelist(cleanedWhitelist);
    }

    const activeSites = filterActiveSites(blockedSites, cleanedWhitelist);
    const uniqueSites = getUniqueSites(activeSites);

    const existingRules = await getExistingRules();
    const existingRuleIds = existingRules.map(rule => rule.id);
    await removeAllRules(existingRuleIds);

    if (isEnabled && uniqueSites.length > 0) {
      const rules = createBlockingRules(uniqueSites);
      await addRules(rules);
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  } finally {
    isUpdating = false;
  }
}
