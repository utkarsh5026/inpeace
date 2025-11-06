/// <reference types="chrome" />
import { StorageData } from './types';
import {
  DEFAULT_BLOCKED_SITES,
  BLOCKED_SITES_KEY,
  TEMP_WHITELIST_KEY,
} from './constants';

const runOnInstall = async () => {
  const { blockedSites } = (await chrome.storage.sync.get(
    BLOCKED_SITES_KEY
  )) as StorageData;

  if (!blockedSites) {
    await chrome.storage.sync.set({
      blockedSites: DEFAULT_BLOCKED_SITES,
      isEnabled: true,
    });
  }

  await updateBlockingRules();
};
chrome.runtime.onInstalled.addListener(runOnInstall);

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && (changes.blockedSites || changes.isEnabled)) {
    await updateBlockingRules();
  }
  if (namespace === 'local' && changes.tempWhitelist) {
    await updateBlockingRules();
  }
});

// Periodic cleanup of expired whitelist entries (every 5 minutes)
chrome.alarms.create('cleanupWhitelist', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'cleanupWhitelist') {
    updateBlockingRules(); // This will clean up expired entries
  }
});

let isUpdating = false;

// Update the declarative net request rules
async function updateBlockingRules(): Promise<void> {
  if (isUpdating) {
    console.log('Update already in progress, skipping...');
    return;
  }

  isUpdating = true;

  try {
    const data = (await chrome.storage.sync.get([
      BLOCKED_SITES_KEY,
      'isEnabled',
    ])) as StorageData & { isEnabled?: boolean };
    const { blockedSites = [], isEnabled = true } = data;

    const tempWhitelistData =
      await chrome.storage.local.get(TEMP_WHITELIST_KEY);
    const tempWhitelist: { [site: string]: number } =
      tempWhitelistData.tempWhitelist || {};
    const now = Date.now();

    const cleanedWhitelist: { [site: string]: number } = {};
    for (const [site, expiration] of Object.entries(tempWhitelist)) {
      if (expiration > now) {
        cleanedWhitelist[site] = expiration;
      }
    }

    if (
      Object.keys(cleanedWhitelist).length !== Object.keys(tempWhitelist).length
    ) {
      await chrome.storage.local.set({ tempWhitelist: cleanedWhitelist });
    }

    const activeSites = blockedSites.filter(site => !cleanedWhitelist[site]);
    const uniqueSites = [...new Set(activeSites)];

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
      });
    }

    if (!isEnabled || !uniqueSites || uniqueSites.length === 0) {
      return;
    }

    // Create new rules (two rules per domain: one for bare domain, one for subdomains)
    const rules: chrome.declarativeNetRequest.Rule[] = [];
    uniqueSites.forEach((domain, index) => {
      rules.push({
        id: index * 2 + 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url:
              chrome.runtime.getURL('blocked.html') +
              '?site=' +
              encodeURIComponent(domain),
          },
        },
        condition: {
          urlFilter: `*://${domain}/*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });

      rules.push({
        id: index * 2 + 2,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url:
              chrome.runtime.getURL('blocked.html') +
              '?site=' +
              encodeURIComponent(domain),
          },
        },
        condition: {
          urlFilter: `*://*.${domain}/*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });
    });

    if (rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
      });
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  } finally {
    isUpdating = false;
  }
}

chrome.runtime.onMessage.addListener(
  (request: { action: string }, sender, sendResponse) => {
    if (request.action === 'updateRules') {
      updateBlockingRules().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  }
);
