/// <reference types="chrome" />
import { DEFAULT_BLOCKED_SITES, StorageData } from './types';
import './styles/main.css';

// DOM elements
const currentSiteDiv = document.getElementById('currentSite') as HTMLDivElement;
const addCurrentBtn = document.getElementById('addCurrentBtn') as HTMLButtonElement;
const websiteList = document.getElementById('websiteList') as HTMLUListElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const enableToggle = document.getElementById(
  'enableToggle'
) as HTMLInputElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const countSpan = document.getElementById('count') as HTMLSpanElement;

// Current site state
let currentSiteUrl = '';

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
      'flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700';
    li.innerHTML = `
      <span class="text-sm text-gray-200 font-medium">${site}</span>
      <button class="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors remove-btn shadow-sm" data-site="${site}">Remove</button>
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

// Get current tab URL
async function getCurrentSite(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentSiteUrl = url.hostname.replace(/^www\./, '');
      currentSiteDiv.textContent = currentSiteUrl;

      // Check if already blocked
      const data = (await chrome.storage.sync.get('blockedSites')) as StorageData;
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

  chrome.runtime.sendMessage({ action: 'updateRules' });

  // Update button state
  addCurrentBtn.textContent = 'Already Blocked';
  addCurrentBtn.disabled = true;
  addCurrentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
  addCurrentBtn.classList.add('bg-gray-600');

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
addCurrentBtn.addEventListener('click', addCurrentWebsite);
resetBtn.addEventListener('click', resetToDefault);
enableToggle.addEventListener('change', toggleExtension);

// Initialize
getCurrentSite();
loadWebsites();
