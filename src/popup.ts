/// <reference types="chrome" />
import { DEFAULT_BLOCKED_SITES, StorageData } from './types';
import './styles/main.css';

// DOM elements
const currentSiteDiv = document.getElementById('currentSite') as HTMLDivElement;
const addCurrentBtn = document.getElementById(
  'addCurrentBtn'
) as HTMLButtonElement;
const websiteList = document.getElementById('websiteList') as HTMLUListElement;
const whitelistList = document.getElementById('whitelistList') as HTMLUListElement;
const whitelistSection = document.getElementById('whitelistSection') as HTMLDivElement;
const whitelistCountSpan = document.getElementById('whitelistCount') as HTMLSpanElement;
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

// Format time remaining (in minutes)
function formatTimeRemaining(expirationTime: number): string {
  const now = Date.now();
  const remaining = expirationTime - now;

  if (remaining <= 0) {
    return 'Expiring soon...';
  }

  const minutes = Math.ceil(remaining / (60 * 1000));

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${mins}m`;
}

// Load and display whitelisted sites
async function loadWhitelistedSites(): Promise<void> {
  const result = await chrome.storage.local.get('tempWhitelist');
  const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};

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
    const li = document.createElement('li');
    li.className =
      'flex items-center justify-between p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700';
    li.innerHTML = `
      <div class="flex-1">
        <div class="text-sm text-gray-200 font-medium">${site}</div>
        <div class="text-xs text-green-400 mt-1 countdown-timer" data-expiration="${expiration}">
          Will be blocked again in ${formatTimeRemaining(expiration)}
        </div>
      </div>
      <button class="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors block-now-btn shadow-sm" data-site="${site}">Block Now</button>
    `;
    whitelistList.appendChild(li);
  });

  // Add event listeners for "Block Now" buttons
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
    const expiration = parseInt((timer as HTMLElement).dataset.expiration || '0');
    const timeText = formatTimeRemaining(expiration);
    timer.textContent = `Will be blocked again in ${timeText}`;

    // If expired, reload the lists
    if (expiration <= Date.now()) {
      loadWebsites();
      loadWhitelistedSites();
    }
  });
}

// Remove site from whitelist (block it again immediately)
async function removeFromWhitelist(site: string): Promise<void> {
  const result = await chrome.storage.local.get('tempWhitelist');
  const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};

  delete tempWhitelist[site];
  await chrome.storage.local.set({ tempWhitelist });

  // Notify background script to update rules
  chrome.runtime.sendMessage({ action: 'updateRules' });

  // Reload both lists
  loadWebsites();
  loadWhitelistedSites();
}

async function loadWebsites(): Promise<void> {
  const data = (await chrome.storage.sync.get([
    'blockedSites',
    'isEnabled',
  ])) as StorageData & { isEnabled?: boolean };
  const { blockedSites = [], isEnabled = true } = data;

  enableToggle.checked = isEnabled;
  statusText.textContent = isEnabled
    ? 'Extension Enabled'
    : 'Extension Disabled';

  // Get whitelisted sites to filter them out
  const result = await chrome.storage.local.get('tempWhitelist');
  const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};
  const now = Date.now();

  // Filter out sites that are currently whitelisted
  const activelyBlockedSites = blockedSites.filter(site => {
    const expiration = tempWhitelist[site];
    return !expiration || expiration <= now;
  });

  websiteList.innerHTML = '';
  countSpan.textContent = activelyBlockedSites.length.toString();

  activelyBlockedSites.forEach(site => {
    const li = document.createElement('li');
    li.className =
      'flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700';
    li.innerHTML = `
      <span class="text-sm text-gray-200 font-medium">${site}</span>
      <button class="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors remove-btn shadow-sm" data-site="${site}">Remove</button>
    `;
    websiteList.appendChild(li);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLButtonElement).dataset.site;
      if (site) removeSite(site);
    });
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

      // Check if already blocked
      const data = (await chrome.storage.sync.get(
        'blockedSites'
      )) as StorageData;
      const blockedSites = data.blockedSites || [];

      if (blockedSites.includes(currentSiteUrl)) {
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
    } else {
      currentSiteDiv.textContent = 'No site available';
      addCurrentBtn.disabled = true;
    }
  } catch (error) {
    currentSiteDiv.textContent = 'Unable to detect site';
    addCurrentBtn.disabled = true;
  }
}

// Add current website
async function addCurrentWebsite(): Promise<void> {
  if (!currentSiteUrl) {
    alert('No site to add');
    return;
  }

  const data = (await chrome.storage.sync.get('blockedSites')) as StorageData;
  const blockedSites = data.blockedSites || [];

  if (blockedSites.includes(currentSiteUrl)) {
    alert('This website is already blocked');
    return;
  }

  blockedSites.push(currentSiteUrl);
  await chrome.storage.sync.set({ blockedSites });

  // Remove from whitelist if it's there
  const result = await chrome.storage.local.get('tempWhitelist');
  const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};
  if (tempWhitelist[currentSiteUrl]) {
    delete tempWhitelist[currentSiteUrl];
    await chrome.storage.local.set({ tempWhitelist });
  }

  chrome.runtime.sendMessage({ action: 'updateRules' });

  // Update button state
  addCurrentBtn.textContent = 'Already Blocked';
  addCurrentBtn.disabled = true;
  addCurrentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
  addCurrentBtn.classList.add('bg-gray-600');

  loadWebsites();
  loadWhitelistedSites();
}

// Remove a website
async function removeSite(site: string): Promise<void> {
  const data = (await chrome.storage.sync.get('blockedSites')) as StorageData;
  const blockedSites = data.blockedSites || [];
  const updatedSites = blockedSites.filter(s => s !== site);

  await chrome.storage.sync.set({ blockedSites: updatedSites });

  // Also remove from whitelist if it's there
  const result = await chrome.storage.local.get('tempWhitelist');
  const tempWhitelist: { [site: string]: number } = result.tempWhitelist || {};
  if (tempWhitelist[site]) {
    delete tempWhitelist[site];
    await chrome.storage.local.set({ tempWhitelist });
  }

  // Notify background script
  chrome.runtime.sendMessage({ action: 'updateRules' });

  loadWebsites();
  loadWhitelistedSites();
}

// Reset to default list
async function resetToDefault(): Promise<void> {
  if (confirm('Reset to default blocked websites?')) {
    await chrome.storage.sync.set({
      blockedSites: DEFAULT_BLOCKED_SITES,
      isEnabled: true,
    });

    // Clear whitelist
    await chrome.storage.local.set({ tempWhitelist: {} });

    chrome.runtime.sendMessage({ action: 'updateRules' });

    loadWebsites();
    loadWhitelistedSites();
  }
}

// Toggle extension on/off
async function toggleExtension(): Promise<void> {
  const isEnabled = enableToggle.checked;
  await chrome.storage.sync.set({ isEnabled });

  statusText.textContent = isEnabled
    ? 'Extension Enabled'
    : 'Extension Disabled';

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
