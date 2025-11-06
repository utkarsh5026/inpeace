/// <reference types="chrome" />
import {
  DEFAULT_BLOCKED_SITES,
  TEMP_WHITELIST_KEY,
  BLOCKED_SITES_KEY,
} from './constants';
import { setInChromeStorage } from './chrome';
import {
  loadWhitelistedSites,
  loadBlockedSites,
  updateCountdowns,
  removeFromWhitelist,
  addSiteToBlockList,
  removeSiteFromBlockList,
} from './popup/site-lists';
import { TIME } from './popup/utils';
import './styles/main.css';

// DOM elements
const currentSiteDiv = document.getElementById('currentSite') as HTMLDivElement;
const addCurrentBtn = document.getElementById(
  'addCurrentBtn'
) as HTMLButtonElement;
const websiteList = document.getElementById('websiteList') as HTMLUListElement;
const whitelistList = document.getElementById(
  'whitelistList'
) as HTMLUListElement;
const whitelistSection = document.getElementById(
  'whitelistSection'
) as HTMLDivElement;
const whitelistCountSpan = document.getElementById(
  'whitelistCount'
) as HTMLSpanElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const enableToggle = document.getElementById(
  'enableToggle'
) as HTMLInputElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const countSpan = document.getElementById('count') as HTMLSpanElement;

// Current site state
let currentSiteUrl = '';

// Interval for updating countdown timers
let countdownInterval: number | null = null;

/**
 * Update blocking rules and reload all lists
 */
async function updateBlockingRules(): Promise<void> {
  chrome.runtime.sendMessage({ action: 'updateRules' });
  await Promise.all([loadWebsites(), refreshWhitelistedSites()]);
}

/**
 * Update status text based on enabled state
 */
function updateStatusText(isEnabled: boolean): void {
  statusText.textContent = isEnabled
    ? 'Extension Enabled'
    : 'Extension Disabled';
}

/**
 * Load whitelisted sites wrapper
 */
async function refreshWhitelistedSites(): Promise<void> {
  await loadWhitelistedSites(
    whitelistList,
    whitelistSection,
    whitelistCountSpan,
    handleBlockNow
  );
}

/**
 * Handle "Block Now" button click
 */
async function handleBlockNow(site: string): Promise<void> {
  await removeFromWhitelist(site);
  await updateBlockingRules();
}

/**
 * Load blocked websites
 */
async function loadWebsites(): Promise<void> {
  const { isEnabled } = await loadBlockedSites(
    websiteList,
    countSpan,
    handleRemoveSite
  );

  enableToggle.checked = isEnabled;
  updateStatusText(isEnabled);
}

/**
 * Handle site removal
 */
async function handleRemoveSite(site: string): Promise<void> {
  await removeSiteFromBlockList(site);
  await updateBlockingRules();
}

/**
 * Update countdown timers wrapper
 */
function refreshCountdowns(): void {
  updateCountdowns(() => {
    loadWebsites();
    refreshWhitelistedSites();
  });
}

/**
 * Get current tab URL and display it
 */
async function getCurrentSite(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentSiteUrl = url.hostname.replace(/^www\./, '');
      currentSiteDiv.textContent = currentSiteUrl;

      const { blockedSites } = await loadBlockedSites(
        websiteList,
        countSpan,
        handleRemoveSite
      );
      updateAddButtonDisplay(blockedSites.includes(currentSiteUrl));
    } else {
      currentSiteDiv.textContent = 'No site available';
      addCurrentBtn.disabled = true;
    }
  } catch (error) {
    currentSiteDiv.textContent = 'Unable to detect site';
    addCurrentBtn.disabled = true;
  }
}

/**
 * Update the "Add Current Site" button display
 */
function updateAddButtonDisplay(alreadyBlocked: boolean): void {
  if (alreadyBlocked) {
    addCurrentBtn.textContent = 'Already Blocked';
    addCurrentBtn.disabled = true;
    addCurrentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    addCurrentBtn.classList.add('bg-gray-600');
  } else {
    addCurrentBtn.textContent = 'Add Current Site to Block List';
    addCurrentBtn.disabled = false;
    addCurrentBtn.classList.remove('bg-gray-600');
    addCurrentBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
  }
}

/**
 * Add current website to block list
 */
async function addCurrentWebsite(): Promise<void> {
  if (!currentSiteUrl) {
    alert('No site to add');
    return;
  }

  const added = await addSiteToBlockList(currentSiteUrl);

  if (!added) {
    alert('This website is already blocked');
    return;
  }

  updateAddButtonDisplay(true);
  await updateBlockingRules();
}

/**
 * Reset to default blocked websites
 */
async function resetToDefault(): Promise<void> {
  if (confirm('Reset to default blocked websites?')) {
    await setInChromeStorage(BLOCKED_SITES_KEY, DEFAULT_BLOCKED_SITES, 'sync');
    await setInChromeStorage('isEnabled', true, 'sync');
    await setInChromeStorage(TEMP_WHITELIST_KEY, {}, 'local');
    await updateBlockingRules();
  }
}

/**
 * Toggle extension on/off
 */
async function toggleExtension(): Promise<void> {
  const isEnabled = enableToggle.checked;
  await setInChromeStorage('isEnabled', isEnabled, 'sync');
  updateStatusText(isEnabled);
  chrome.runtime.sendMessage({ action: 'updateRules' });
}

// Event listeners
addCurrentBtn.addEventListener('click', addCurrentWebsite);
resetBtn.addEventListener('click', resetToDefault);
enableToggle.addEventListener('change', toggleExtension);

// Initialize
getCurrentSite();
loadWebsites();
refreshWhitelistedSites();

countdownInterval = window.setInterval(
  refreshCountdowns,
  TIME.COUNTDOWN_UPDATE_INTERVAL
);

// Clean up interval when popup closes
window.addEventListener('unload', () => {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
  }
});
