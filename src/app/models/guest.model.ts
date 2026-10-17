import type { EffectContext, GameEffect } from './effect-context';
import { BUILT_IN_GUEST_TYPES } from './built-in-guest-types';
import { GuestIcon, PEACE_ICON, STAR_ICON, TROUBLE_ICON } from './guest-icons';
import type { EffectHandler } from './guest-type';
import { findGuestType, getGuestType } from './guest-type-registry';

export type { EffectContext, GameEffect, EffectHandler, GuestIcon };
export { admitGuest, autoInvite } from './guest-effects';

// A guest type's id. Any registered id is valid, including types registered at runtime;
// see guest-type-registry.ts. BuiltInGuestType lists the game's own types.
export type GuestType = string;

export interface GuestProperties {
  popularityValue: number;
  troubleValue: number;
  moneyValue: number;
  peaceValue: number;
  starValue: number;
}

export interface Guest {
  id: string;
  type: GuestType;
  name: string;
  properties: GuestProperties;
}

// Stars needed in a single party, at its normal end, to win the game.
export const WINNING_STAR_COUNT = 4;

// The tables below are views of BUILT_IN_GUEST_TYPES, kept so existing code and tests keep
// working. They don't include types registered at runtime.

/** @deprecated Use getGuestType(id).label or guestTypeLabel(id). */
export const GUEST_TYPE_LABELS: Record<GuestType, string> =
  Object.fromEntries(BUILT_IN_GUEST_TYPES.map(d => [d.id, d.label]));

/** @deprecated Use getGuestType(id).properties. */
export const GUEST_TYPE_DEFAULTS: Record<GuestType, GuestProperties> =
  Object.fromEntries(BUILT_IN_GUEST_TYPES.map(d => [d.id, { ...d.properties }]));

/** @deprecated Use getGuestType(id).cost. */
export const GUEST_TYPE_COSTS: Record<GuestType, number | null> =
  Object.fromEntries(BUILT_IN_GUEST_TYPES.map(d => [d.id, d.cost]));

/** @deprecated Use getGuestType(id).roster.shop. */
export const SHOP_GUESTS: readonly { type: GuestType; name: string }[] =
  BUILT_IN_GUEST_TYPES.flatMap(d => d.roster.shop.map(name => ({ type: d.id, name })));

/** @deprecated Use getGuestType(id).roster.starting. */
export const INITIAL_GUESTS: readonly { type: GuestType; name: string }[] =
  BUILT_IN_GUEST_TYPES.flatMap(d => d.roster.starting.map(name => ({ type: d.id, name })));

/** @deprecated Use getGuestType(id).entranceEffect. */
export const GUEST_TYPE_ENTRANCE_EFFECTS: Partial<Record<GuestType, EffectHandler>> =
  Object.fromEntries(BUILT_IN_GUEST_TYPES.flatMap(d => (d.entranceEffect ? [[d.id, d.entranceEffect]] : [])));

/** @deprecated Use getGuestType(id).entranceIcons. */
export const GUEST_TYPE_ENTRANCE_ICONS: Partial<Record<GuestType, readonly GuestIcon[]>> =
  Object.fromEntries(BUILT_IN_GUEST_TYPES.flatMap(d => (d.entranceIcons ? [[d.id, d.entranceIcons]] : [])));

export type GuestIdSource = () => string;

// Yields g1, g2, g3, ... A game uses one source so every guest's id is unique.
export function createGuestIdSource(): GuestIdSource {
  let next = 1;
  return () => `g${next++}`;
}

export function createGuest(type: GuestType, name: string, nextId: GuestIdSource): Guest {
  return { id: nextId(), type, name, properties: { ...getGuestType(type).properties } };
}

// What a guest card shows: popularity and money are null when zero, icons run left to right.
export interface GuestDetails {
  popularity: number | null;
  money: number | null;
  icons: GuestIcon[];
}

// Works out what a card shows for a guest of the given type with the given properties.
// Icons: entrance effects, then one per point of peace, trouble and star, in that order.
export function getGuestDetails(type: GuestType, properties: GuestProperties): GuestDetails {
  const repeat = (icon: GuestIcon, count: number): GuestIcon[] =>
    Array.from({ length: Math.max(0, count) }, () => icon);

  return {
    popularity: properties.popularityValue === 0 ? null : properties.popularityValue,
    money: properties.moneyValue === 0 ? null : properties.moneyValue,
    icons: [
      ...(findGuestType(type)?.entranceIcons ?? []),
      ...repeat(PEACE_ICON, properties.peaceValue),
      ...repeat(TROUBLE_ICON, properties.troubleValue),
      ...repeat(STAR_ICON, properties.starValue)
    ]
  };
}

// Formats money with a dollar sign, putting any minus sign first: 3 -> "$3", -3 -> "-$3".
export function formatMoney(value: number): string {
  return value < 0 ? `-$${-value}` : `$${value}`;
}
