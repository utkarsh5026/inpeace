export function handleFinalCheckbox(): void {
  const checkbox = document.getElementById('finalCheckbox') as HTMLInputElement;
  const proceedBtn = document.getElementById(
    'proceedFinalBtn'
  ) as HTMLButtonElement;

  if (!checkbox || !proceedBtn) return;

  if (checkbox.checked) {
    proceedBtn.disabled = false;
    proceedBtn.classList.remove('bg-gray-600');
    proceedBtn.classList.add(
      'bg-red-600',
      'hover:bg-red-700',
      'cursor-pointer'
    );
  } else {
    proceedBtn.disabled = true;
    proceedBtn.classList.add('bg-gray-600');
    proceedBtn.classList.remove(
      'bg-red-600',
      'hover:bg-red-700',
      'cursor-pointer'
    );
  }
}

export async function allowAccess(site: string | null): Promise<void> {
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  const proceedFinalBtn = document.getElementById(
    'proceedFinalBtn'
  ) as HTMLButtonElement;

  if (!countdownOverlay || !countdownNumber) return;

  // Disable button
  if (proceedFinalBtn) {
    proceedFinalBtn.disabled = true;
  }

  // Add site to temporary whitelist (30 minutes = 1800000ms)
  if (site) {
    const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    const result = await chrome.storage.local.get('tempWhitelist');
    const tempWhitelist: { [site: string]: number } =
      result.tempWhitelist || {};
    tempWhitelist[site] = expirationTime;
    await chrome.storage.local.set({ tempWhitelist });
  }

  countdownOverlay.classList.remove('hidden');

  let count = 3;
  const showCount = () => {
    if (count > 0) {
      countdownNumber.textContent = count.toString();
      countdownNumber.classList.remove('countdown-number');
      countdownNumber.offsetWidth;
      countdownNumber.classList.add('countdown-number');
      count--;
      setTimeout(showCount, 1000);
    } else {
      if (site) {
        window.location.href = 'https://' + site;
      }
    }
  };

  showCount();
}
