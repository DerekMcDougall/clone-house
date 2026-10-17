// A symbol shown in the top right corner of a guest card.
export interface GuestIcon {
  symbol: string;
  label: string;
}

// Shared icons. This module imports nothing, so guest type definitions can use these
// constants at load time without running into module cycles.
export const INVITE_ICON: GuestIcon = { symbol: '👤', label: 'Invites a guest on entrance' };
export const PEACE_ICON: GuestIcon = { symbol: '☮️', label: 'Peace' };
export const TROUBLE_ICON: GuestIcon = { symbol: '❌', label: 'Trouble' };
export const STAR_ICON: GuestIcon = { symbol: '⭐', label: 'Star' };
