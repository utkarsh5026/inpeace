/// <reference types="chrome" />

/**
 * Creates a redirect URL for blocked sites
 */
function createBlockedRedirectUrl(domain: string): string {
  return (
    chrome.runtime.getURL('blocked.html') +
    '?site=' +
    encodeURIComponent(domain)
  );
}

/**
 * Creates a single blocking rule for a domain pattern
 */
function createBlockingRule(
  id: number,
  urlPattern: string,
  domain: string
): chrome.declarativeNetRequest.Rule {
  return {
    id,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: createBlockedRedirectUrl(domain),
      },
    },
    condition: {
      urlFilter: urlPattern,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}

/**
 * Creates blocking rules for a list of domains
 * Each domain gets two rules: one for the bare domain and one for subdomains
 */
export function createBlockingRules(
  domains: string[]
): chrome.declarativeNetRequest.Rule[] {
  const rules: chrome.declarativeNetRequest.Rule[] = [];

  domains.forEach((domain, index) => {
    rules.push(createBlockingRule(index * 2 + 1, `*://${domain}/*`, domain));

    // Rule for subdomains (e.g., www.example.com)
    rules.push(createBlockingRule(index * 2 + 2, `*://*.${domain}/*`, domain));
  });

  return rules;
}

/**
 * Retrieves all existing dynamic rules
 */
export async function getExistingRules(): Promise<
  chrome.declarativeNetRequest.Rule[]
> {
  return chrome.declarativeNetRequest.getDynamicRules();
}

/**
 * Removes all existing dynamic rules
 */
export async function removeAllRules(ruleIds: number[]): Promise<void> {
  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    });
  }
}

/**
 * Adds new dynamic rules
 */
export async function addRules(
  rules: chrome.declarativeNetRequest.Rule[]
): Promise<void> {
  if (rules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  }
}
