// A symbol shown in the top right corner of a guest card.
export interface GuestIcon {
  symbol: string;
  label: string;
}

// Icons for points of peace, trouble and star. Effect icons come from action kinds (see
// action-kinds.ts). This module imports nothing, so it's safe to use from any model module.
export const PEACE_ICON: GuestIcon = { symbol: '☮️', label: 'Peace' };
export const TROUBLE_ICON: GuestIcon = { symbol: '❌', label: 'Trouble' };
export const STAR_ICON: GuestIcon = { symbol: '⭐', label: 'Star' };
