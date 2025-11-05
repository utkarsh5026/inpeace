/// <reference types="chrome" />
import { DEFAULT_BLOCKED_SITES, StorageData } from "./types";

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  const { blockedSites } = (await chrome.storage.sync.get(
    "blockedSites"
  )) as StorageData;

  if (!blockedSites) {
    await chrome.storage.sync.set({
      blockedSites: DEFAULT_BLOCKED_SITES,
      isEnabled: true,
    });
  }

  await updateBlockingRules();
});

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "sync" && (changes.blockedSites || changes.isEnabled)) {
    await updateBlockingRules();
  }
});

// Update the declarative net request rules
async function updateBlockingRules(): Promise<void> {
  const data = (await chrome.storage.sync.get([
    "blockedSites",
    "isEnabled",
  ])) as StorageData & { isEnabled?: boolean };
  const { blockedSites = [], isEnabled = true } = data;

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
    });
  }

  // If disabled, don't add new rules
  if (!isEnabled || !blockedSites || blockedSites.length === 0) {
    return;
  }

  // Create new rules
  const rules: chrome.declarativeNetRequest.Rule[] = blockedSites.map(
    (domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          url:
            chrome.runtime.getURL("blocked.html") +
            "?site=" +
            encodeURIComponent(domain),
        },
      },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    })
  );

  // Add the new rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener(
  (request: { action: string }, sender, sendResponse) => {
    if (request.action === "updateRules") {
      updateBlockingRules().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  }
);
