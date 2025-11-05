export interface StorageData {
  blockedSites?: string[];
  isEnabled?: boolean;
}

export interface BlockStats {
  total: number;
  lastDate: string;
  todayCount: number;
}

export interface Message {
  action: string;
}

export interface MessageResponse {
  success: boolean;
}

export const DEFAULT_BLOCKED_SITES: string[] = [
  'reddit.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'linkedin.com',
  'twitch.tv',
  'netflix.com',
  '9gag.com',
  'buzzfeed.com'
];
