/// <reference types="chrome" />
import { StorageData, TempWhitelist } from '../types';
import {
  BLOCKED_SITES_KEY,
  TEMP_WHITELIST_KEY,
  IS_ENABLED_KEY,
} from '../constants';

/**
 * Retrieves blocked sites and enabled status from sync storage
 */
export async function getBlockedSitesData(): Promise<{
  blockedSites: string[];
  isEnabled: boolean;
}> {
  const data = (await chrome.storage.sync.get([
    BLOCKED_SITES_KEY,
    IS_ENABLED_KEY,
  ])) as StorageData & { isEnabled?: boolean };

  return {
    blockedSites: data.blockedSites || [],
    isEnabled: data.isEnabled ?? true,
  };
}

/**
 * Retrieves temporary whitelist from local storage
 */
export async function getTempWhitelist(): Promise<TempWhitelist> {
  const data = await chrome.storage.local.get(TEMP_WHITELIST_KEY);
  return data.tempWhitelist || {};
}

/**
 * Saves temporary whitelist to local storage
 */
export async function saveTempWhitelist(
  whitelist: TempWhitelist
): Promise<void> {
  await chrome.storage.local.set({ [TEMP_WHITELIST_KEY]: whitelist });
}

/**
 * Initializes storage with default values on first install
 */
export async function initializeStorage(defaultSites: string[]): Promise<void> {
  const { blockedSites } = (await chrome.storage.sync.get(
    BLOCKED_SITES_KEY
  )) as StorageData;

  if (!blockedSites) {
    await chrome.storage.sync.set({
      [BLOCKED_SITES_KEY]: defaultSites,
      [IS_ENABLED_KEY]: true,
    });
  }
}
