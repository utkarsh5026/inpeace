import { afterEach, vi } from 'vitest';

/**
 * Mock Chrome API for testing
 */
const createStorageMock = () => {
  const storage = new Map<string, any>();

  return {
    get: vi.fn((keys: string[] | string, callback?: (items: any) => void) => {
      const result: any = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];

      keyArray.forEach(key => {
        if (storage.has(key)) {
          result[key] = storage.get(key);
        }
      });

      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: vi.fn((items: any, callback?: () => void) => {
      Object.entries(items).forEach(([key, value]) => {
        storage.set(key, value);
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string[] | string, callback?: () => void) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => storage.delete(key));
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: vi.fn((callback?: () => void) => {
      storage.clear();
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    // Helper for tests
    _reset: () => storage.clear(),
    _getStorage: () => storage,
  };
};

const storageSyncMock = createStorageMock();
const storageLocalMock = createStorageMock();

global.chrome = {
  storage: {
    sync: storageSyncMock as any,
    local: storageLocalMock as any,
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn().mockResolvedValue(undefined),
    getDynamicRules: vi.fn().mockResolvedValue([]),
    getSessionRules: vi.fn().mockResolvedValue([]),
    updateSessionRules: vi.fn().mockResolvedValue(undefined),
    MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 5000,
    RuleActionType: {
      BLOCK: 'block',
      REDIRECT: 'redirect',
      ALLOW: 'allow',
      UPGRADE_SCHEME: 'upgradeScheme',
      MODIFY_HEADERS: 'modifyHeaders',
    },
    ResourceType: {
      MAIN_FRAME: 'main_frame',
      SUB_FRAME: 'sub_frame',
      STYLESHEET: 'stylesheet',
      SCRIPT: 'script',
      IMAGE: 'image',
      FONT: 'font',
      OBJECT: 'object',
      XMLHTTPREQUEST: 'xmlhttprequest',
      PING: 'ping',
      CSP_REPORT: 'csp_report',
      MEDIA: 'media',
      WEBSOCKET: 'websocket',
      OTHER: 'other',
    },
  } as any,
  runtime: {
    id: 'test-extension-id',
    getURL: vi.fn(
      (path: string) => `chrome-extension://test-extension-id/${path}`
    ),
    lastError: undefined,
  } as any,
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
  } as any,
} as any;

// Export mocks for use in tests
export const chromeMocks = {
  storage: {
    sync: storageSyncMock,
    local: storageLocalMock,
  },
  declarativeNetRequest: global.chrome.declarativeNetRequest,
  runtime: global.chrome.runtime,
  tabs: global.chrome.tabs,
};

// Reset function to clear all mocks between tests
export const resetChromeMocks = () => {
  storageSyncMock._reset();
  storageLocalMock._reset();
  vi.clearAllMocks();
};

// Auto-reset after each test
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    resetChromeMocks();
  });
}
