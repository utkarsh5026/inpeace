// Site list rendering and management for popup UI

import { formatTimeRemaining } from './utils';
import { getFromChromeStorage, setInChromeStorage } from '../chrome';
import { TEMP_WHITELIST_KEY, BLOCKED_SITES_KEY } from '../constants';

/**
 * Create a list item element with consistent styling
 */
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

/**
 * Get temporary whitelist from storage
 */
async function getTempWhitelist(): Promise<{ [site: string]: number }> {
  return (
    (await getFromChromeStorage<{ [site: string]: number }>(
      TEMP_WHITELIST_KEY,
      'local'
    )) || {}
  );
}

/**
 * Delete site from temporary whitelist
 */
async function deleteFromTempWhitelist(site: string): Promise<void> {
  const tempWhitelist = await getTempWhitelist();
  if (tempWhitelist[site]) {
    delete tempWhitelist[site];
    await setInChromeStorage(TEMP_WHITELIST_KEY, tempWhitelist, 'local');
  }
}

/**
 * Load and display whitelisted sites
 */
export async function loadWhitelistedSites(
  whitelistList: HTMLUListElement,
  whitelistSection: HTMLDivElement,
  whitelistCountSpan: HTMLSpanElement,
  onBlockNow: (site: string) => void
): Promise<void> {
  const tempWhitelist = await getTempWhitelist();

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
      if (site) onBlockNow(site);
    });
  });
}

/**
 * Load and display blocked sites
 */
export async function loadBlockedSites(
  websiteList: HTMLUListElement,
  countSpan: HTMLSpanElement,
  onRemove: (site: string) => void
): Promise<{ blockedSites: string[]; isEnabled: boolean }> {
  const allBlockedSites =
    (await getFromChromeStorage<string[]>(BLOCKED_SITES_KEY, 'sync')) || [];
  const isEnabled =
    (await getFromChromeStorage<boolean>('isEnabled', 'sync')) ?? true;

  const tempWhitelist = await getTempWhitelist();
  const now = Date.now();

  const activelyBlockedSites = allBlockedSites.filter(site => {
    const expiration = tempWhitelist[site];
    return !expiration || expiration <= now;
  });

  renderBlockedSites(websiteList, countSpan, activelyBlockedSites);
  addRemoveSiteListener(onRemove);

  return { blockedSites: allBlockedSites, isEnabled };
}

function renderBlockedSites(
  websiteList: HTMLUListElement,
  countSpan: HTMLSpanElement,
  activelyBlockedSites: string[]
): void {
  websiteList.innerHTML = '';
  countSpan.textContent = activelyBlockedSites.length.toString();

  activelyBlockedSites.forEach(site => {
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

function addRemoveSiteListener(onRemove: (site: string) => void): void {
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLButtonElement).dataset.site;
      if (site) onRemove(site);
    });
  });
}

/**
 * Update countdown timers on the page
 */
export function updateCountdowns(onExpired: () => void): void {
  document.querySelectorAll('.countdown-timer').forEach(timer => {
    const expiration = parseInt(
      (timer as HTMLElement).dataset.expiration || '0'
    );
    const timeText = formatTimeRemaining(expiration);
    timer.textContent = `Will be blocked again in ${timeText}`;

    if (expiration <= Date.now()) {
      onExpired();
    }
  });
}

/**
 * Remove site from whitelist (block it again immediately)
 */
export async function removeFromWhitelist(site: string): Promise<void> {
  const tempWhitelist = await getTempWhitelist();
  delete tempWhitelist[site];
  await setInChromeStorage(TEMP_WHITELIST_KEY, tempWhitelist, 'local');
}

/**
 * Add site to blocked list
 */
export async function addSiteToBlockList(site: string): Promise<boolean> {
  const blockedSites =
    (await getFromChromeStorage<string[]>(BLOCKED_SITES_KEY, 'sync')) || [];

  if (blockedSites.includes(site)) {
    return false; // Already blocked
  }

  blockedSites.push(site);
  await setInChromeStorage(BLOCKED_SITES_KEY, blockedSites, 'sync');
  await deleteFromTempWhitelist(site);

  return true;
}

/**
 * Remove site from blocked list
 */
export async function removeSiteFromBlockList(site: string): Promise<void> {
  const blockedSites =
    (await getFromChromeStorage<string[]>(BLOCKED_SITES_KEY, 'sync')) || [];
  const updatedSites = blockedSites.filter(s => s !== site);

  await setInChromeStorage(BLOCKED_SITES_KEY, updatedSites, 'sync');
  await deleteFromTempWhitelist(site);
}
