/// <reference types="chrome" />
import { DEFAULT_BLOCKED_SITES } from './constants';
import { initializeStorage } from './services/storage';
import { updateBlockingRules } from './services/ruleManager';

/**
 * Initializes extension on installation
 */
async function handleInstall(): Promise<void> {
  await initializeStorage(DEFAULT_BLOCKED_SITES);
  await updateBlockingRules();
}

chrome.runtime.onInstalled.addListener(handleInstall);

/**
 * Handles storage changes and triggers rule updates when necessary
 */
async function handleStorageChange(
  changes: { [key: string]: chrome.storage.StorageChange },
  namespace: string
): Promise<void> {
  const shouldUpdate =
    (namespace === 'sync' && (changes.blockedSites || changes.isEnabled)) ||
    (namespace === 'local' && changes.tempWhitelist);

  if (shouldUpdate) {
    await updateBlockingRules();
  }
}

chrome.storage.onChanged.addListener(handleStorageChange);

/**
 * Sets up periodic cleanup of expired whitelist entries
 */
function setupPeriodicCleanup(): void {
  chrome.alarms.create('cleanupWhitelist', { periodInMinutes: 5 });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'cleanupWhitelist') {
      updateBlockingRules();
    }
  });
}

setupPeriodicCleanup();

/**
 * Handles messages from other parts of the extension
 */
function handleMessage(
  request: { action: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: { success: boolean }) => void
): boolean {
  if (request.action === 'updateRules') {
    updateBlockingRules().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
  return false;
}

chrome.runtime.onMessage.addListener(handleMessage);
