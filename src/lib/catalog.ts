import type { AppRule } from './logic';

export type CatalogApp = { id: string; name: string; scheme: string };

export const CATALOG: CatalogApp[] = [
  { id: 'instagram', name: 'Instagram', scheme: 'instagram://app' },
  { id: 'tiktok', name: 'TikTok', scheme: 'tiktok://' },
  { id: 'youtube', name: 'YouTube', scheme: 'youtube://' },
  { id: 'x', name: 'X (Twitter)', scheme: 'twitter://' },
  { id: 'reddit', name: 'Reddit', scheme: 'reddit://' },
  { id: 'snapchat', name: 'Snapchat', scheme: 'snapchat://' },
  { id: 'facebook', name: 'Facebook', scheme: 'fb://' },
  { id: 'whatsapp', name: 'WhatsApp', scheme: 'whatsapp://' },
  { id: 'netflix', name: 'Netflix', scheme: 'nflx://' },
  { id: 'pinterest', name: 'Pinterest', scheme: 'pinterest://' },
  { id: 'linkedin', name: 'LinkedIn', scheme: 'linkedin://' },
  { id: 'threads', name: 'Threads', scheme: 'barcelona://' },
  { id: 'discord', name: 'Discord', scheme: 'discord://' },
  { id: 'telegram', name: 'Telegram', scheme: 'tg://' },
];

export function newRule(app: CatalogApp): AppRule {
  return {
    id: app.id,
    name: app.name,
    scheme: app.scheme,
    baseDelay: 10,
    growBy: 5,
    dailyOpens: 0,
    strict: false,
    graceMin: 5,
    window: null,
  };
}
