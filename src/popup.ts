/// <reference types="chrome" />
import { StorageData } from './types';
import {
  DEFAULT_BLOCKED_SITES,
  TEMP_WHITELIST_KEY,
  BLOCKED_SITES_KEY,
} from './constants';
import {
  getFromChromeStorage,
  getMultipleFromChromeStorage,
  setInChromeStorage,
} from './chrome';
import './styles/main.css';

const TIME = {
  MINUTE_MS: 60 * 1000,
  COUNTDOWN_UPDATE_INTERVAL: 1000,
} as const;

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

// Helper: Pluralize words
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + 's');
}

// Helper: Update rules and reload lists
async function updateBlockingRules(): Promise<void> {
  chrome.runtime.sendMessage({ action: 'updateRules' });
  await Promise.all([loadWebsites(), loadWhitelistedSites()]);
}

// Helper: Update status text based on enabled state
function updateStatusText(isEnabled: boolean): void {
  statusText.textContent = isEnabled
    ? 'Extension Enabled'
    : 'Extension Disabled';
}

// Helper: Delete site from temp whitelist
async function deleteFromTempWhitelist(site: string): Promise<void> {
  const tempWhitelist = await _getTempList();
  if (tempWhitelist[site]) {
    delete tempWhitelist[site];
    await setInChromeStorage(TEMP_WHITELIST_KEY, tempWhitelist, 'local');
  }
}

// Helper: Create list item element
function createListItem(
  baseClass: string,
  contentHtml: string,
  buttonText: string,
  buttonClass: string,
  site: string
): HTMLLIElement {
  const li = document.createElement('li');
  li.className = baseClass;
  li.innerHTML = `
    ${contentHtml}
    <button class="${buttonClass}" data-site="${site}">${buttonText}</button>
  `;
  return li;
}

// Format time remaining (in minutes)
function formatTimeRemaining(expirationTime: number): string {
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

// Load and display whitelisted sites
async function loadWhitelistedSites(): Promise<void> {
  const tempWhitelist = await _getTempList();

  const now = Date.now();
  const activeWhitelist = Object.entries(tempWhitelist).filter(
    ([_, expiration]) => expiration > now
  );

  whitelistList.innerHTML = '';

  if (activeWhitelist.length === 0) {
    whitelistSection.classList.add('hidden');
    whitelistCountSpan.textContent = '0';
    return;
  }

  whitelistSection.classList.remove('hidden');
  whitelistCountSpan.textContent = activeWhitelist.length.toString();

  activeWhitelist.forEach(([site, expiration]) => {
    const contentHtml = `
      <div class="flex-1">
        <div class="text-sm text-gray-200 font-medium">${site}</div>
        <div class="text-xs text-green-400 mt-1 countdown-timer" data-expiration="${expiration}">
          Will be blocked again in ${formatTimeRemaining(expiration)}
        </div>
      </div>
    `;
    const li = createListItem(
      'flex items-center justify-between p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700',
      contentHtml,
      'Block Now',
      'px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors block-now-btn shadow-sm',
      site
    );
    whitelistList.appendChild(li);
  });

  document.querySelectorAll('.block-now-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLButtonElement).dataset.site;
      if (site) removeFromWhitelist(site);
    });
  });
}

// Update countdown timers
function updateCountdowns(): void {
  document.querySelectorAll('.countdown-timer').forEach(timer => {
    const expiration = parseInt(
      (timer as HTMLElement).dataset.expiration || '0'
    );
    const timeText = formatTimeRemaining(expiration);
    timer.textContent = `Will be blocked again in ${timeText}`;

    if (expiration <= Date.now()) {
      loadWebsites();
      loadWhitelistedSites();
    }
  });
}

// Remove site from whitelist (block it again immediately)
async function removeFromWhitelist(site: string): Promise<void> {
  const tempWhitelist = await _getTempList();
  delete tempWhitelist[site];
  await setInChromeStorage(TEMP_WHITELIST_KEY, tempWhitelist, 'local');

  await updateBlockingRules();
}

async function loadWebsites(): Promise<void> {
  const data = await getMultipleFromChromeStorage<
    StorageData & { isEnabled?: boolean }
  >(['blockedSites', 'isEnabled'], 'sync');
  const { blockedSites = [], isEnabled = true } = data;

  enableToggle.checked = isEnabled;
  updateStatusText(isEnabled);

  const tempWhitelist = await _getTempList();
  const now = Date.now();

  const activelyBlockedSites = blockedSites.filter(site => {
    const expiration = tempWhitelist[site];
    return !expiration || expiration <= now;
  });

  websiteList.innerHTML = '';
  countSpan.textContent = activelyBlockedSites.length.toString();
  _createBlockedListUI(activelyBlockedSites);
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLButtonElement).dataset.site;
      if (site) removeSite(site);
    });
  });
}

function _createBlockedListUI(sites: string[]) {
  sites.forEach(site => {
    const contentHtml = `<span class="text-sm text-gray-200 font-medium">${site}</span>`;
    const li = createListItem(
      'flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700',
      contentHtml,
      'Remove',
      'px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors remove-btn shadow-sm',
      site
    );
    websiteList.appendChild(li);
  });
}

// Get current tab URL
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

      const blockedSites = await _getBlockedSites();
      _changeAddCurrentDisplay(blockedSites.includes(currentSiteUrl));
    } else {
      currentSiteDiv.textContent = 'No site available';
      addCurrentBtn.disabled = true;
    }
  } catch (error) {
    currentSiteDiv.textContent = 'Unable to detect site';
    addCurrentBtn.disabled = true;
  }
}

function _changeAddCurrentDisplay(alreadyBlocked: boolean): void {
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

async function _getBlockedSites() {
  return (
    (await getFromChromeStorage<string[]>(BLOCKED_SITES_KEY, 'sync')) || []
  );
}

async function _getTempList() {
  return (
    (await getFromChromeStorage<{ [site: string]: number }>(
      TEMP_WHITELIST_KEY,
      'local'
    )) || {}
  );
}

async function addCurrentWebsite(): Promise<void> {
  if (!currentSiteUrl) {
    alert('No site to add');
    return;
  }

  const blockedSites = await _getBlockedSites();
  if (blockedSites.includes(currentSiteUrl)) {
    alert('This website is already blocked');
    return;
  }

  blockedSites.push(currentSiteUrl);
  await setInChromeStorage(BLOCKED_SITES_KEY, blockedSites, 'sync');

  await deleteFromTempWhitelist(currentSiteUrl);

  _changeAddCurrentDisplay(true);
  await updateBlockingRules();
}

// Remove a website
async function removeSite(site: string): Promise<void> {
  const blockedSites = await _getBlockedSites();
  const updatedSites = blockedSites.filter(s => s !== site);

  await setInChromeStorage(BLOCKED_SITES_KEY, updatedSites, 'sync');
  await deleteFromTempWhitelist(site);
  await updateBlockingRules();
}

async function resetToDefault(): Promise<void> {
  if (confirm('Reset to default blocked websites?')) {
    await setInChromeStorage(BLOCKED_SITES_KEY, DEFAULT_BLOCKED_SITES, 'sync');
    await setInChromeStorage('isEnabled', true, 'sync');
    await setInChromeStorage(TEMP_WHITELIST_KEY, {}, 'local');
    await updateBlockingRules();
  }
}

// Toggle extension on/off
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
loadWhitelistedSites();

// Start countdown timer updates (every second)
countdownInterval = window.setInterval(updateCountdowns, 1000);

// Clean up interval when popup closes
window.addEventListener('unload', () => {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
  }
});
