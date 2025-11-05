/// <reference types="chrome" />
import { DEFAULT_BLOCKED_SITES, StorageData } from './types';
import './styles/main.css';

// DOM elements
const websiteInput = document.getElementById(
  'websiteInput'
) as HTMLInputElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const websiteList = document.getElementById('websiteList') as HTMLUListElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const enableToggle = document.getElementById(
  'enableToggle'
) as HTMLInputElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const countSpan = document.getElementById('count') as HTMLSpanElement;

// Load and display blocked websites
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

  websiteList.innerHTML = '';
  countSpan.textContent = blockedSites.length.toString();

  blockedSites.forEach(site => {
    const li = document.createElement('li');
    li.className =
      'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
    li.innerHTML = `
      <span class="text-sm text-gray-800">${site}</span>
      <button class="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors remove-btn" data-site="${site}">Remove</button>
    `;
    websiteList.appendChild(li);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLButtonElement).dataset.site;
      if (site) removeSite(site);
    });
  });
}

// Add a new website
async function addWebsite(): Promise<void> {
  const site = websiteInput.value.trim().toLowerCase();

  if (!site) {
    alert('Please enter a website');
    return;
  }

  const cleanSite = site
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

  const data = (await chrome.storage.sync.get('blockedSites')) as StorageData;
  const blockedSites = data.blockedSites || [];

  if (blockedSites.includes(cleanSite)) {
    alert('This website is already blocked');
    return;
  }

  blockedSites.push(cleanSite);
  await chrome.storage.sync.set({ blockedSites });

  chrome.runtime.sendMessage({ action: 'updateRules' });
  websiteInput.value = '';
  loadWebsites();
}

// Remove a website
async function removeSite(site: string): Promise<void> {
  const data = (await chrome.storage.sync.get('blockedSites')) as StorageData;
  const blockedSites = data.blockedSites || [];
  const updatedSites = blockedSites.filter(s => s !== site);

  await chrome.storage.sync.set({ blockedSites: updatedSites });

  // Notify background script
  chrome.runtime.sendMessage({ action: 'updateRules' });

  loadWebsites();
}

// Reset to default list
async function resetToDefault(): Promise<void> {
  if (confirm('Reset to default blocked websites?')) {
    await chrome.storage.sync.set({
      blockedSites: DEFAULT_BLOCKED_SITES,
      isEnabled: true,
    });

    chrome.runtime.sendMessage({ action: 'updateRules' });

    loadWebsites();
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
addBtn.addEventListener('click', addWebsite);
websiteInput.addEventListener('keypress', (e: KeyboardEvent) => {
  if (e.key === 'Enter') addWebsite();
});
resetBtn.addEventListener('click', resetToDefault);
enableToggle.addEventListener('change', toggleExtension);

// Initialize
loadWebsites();
