# Design Document: Display Guest Details

## Overview

A pure function in the guest model, `getGuestDetails(type, properties)`, works out what a card shows: the popularity, the money and the icons. A new presentational component, `GuestDetailsComponent` (`app-guest-details`), draws those details on top of a card. Both card kinds use it:

- `GuestCardComponent` passes the guest instance's `type` and `properties`. This covers the party, the ban selection, and any future deck or discard view (Requirement 1.1, 1.5).
- The Shop_Card in `PhaseContentComponent` passes `item.type` and `GUEST_TYPE_DEFAULTS[item.type]` (Requirement 1.2).

The store does not change.

### Key Design Decisions

1. **Logic in a pure function, drawing in a component**: All the rules (hide zeros, icon order, how many person icons) live in `getGuestDetails()`, so they can be unit and property tested without the DOM. The component only positions what it is given.

2. **One overlay component instead of merging the two cards**: The Shop_Card is a `<button>` with its own price, stock and "Added!" markup, and is not a `GuestCardComponent`. Merging them is a larger refactor than this feature needs. An overlay that both cards include keeps the two in sync with one copy of the layout.

3. **Entrance effect icons are declared next to the effects**: A new `GUEST_TYPE_ENTRANCE_ICONS` map in `guest.model.ts` sits beside `GUEST_TYPE_ENTRANCE_EFFECTS`, so whoever adds an entrance effect sees where its icon goes. The icons cannot be derived from the handler functions, because handlers are opaque. Icons depend only on the type (Requirement 1.3).

4. **Shop cards use defaults, not the stocked instances**: Shop stock is built from `GUEST_TYPE_DEFAULTS` today, so the two match. Reading the defaults directly states the requirement ("as first added to the deck") and stays right if stocked instances ever differ.

5. **One icon per point**: Star, trouble and peace show as many icons as their value (Requirement 4.4), so a guest with 2 trouble shows ❌❌. No current guest has a value above 1 for these, so today's cards look the same either way. The card padding must still leave room for a few extra icons.

## Architecture

```
PhaseContentComponent
├── Shop_Card <button>  ──► <app-guest-details [type]="item.type" [properties]="defaults[item.type]">
└── GuestCardComponent  ──► <app-guest-details [type]="guest.type" [properties]="guest.properties">
                                   │
                                   └── getGuestDetails(type, properties)  (guest.model.ts)
```

## Components and Interfaces

### Guest model (`guest.model.ts`)

```ts
export interface GuestIcon {
  symbol: string;   // emoji
  label: string;    // accessible name, also used as a tooltip
}

export interface GuestDetails {
  popularity: number | null;  // null when zero
  money: number | null;       // null when zero
  icons: GuestIcon[];         // left to right
}

const INVITE_ICON: GuestIcon = { symbol: '👤', label: 'Invites a guest on entrance' };

// Icons for each type's entrance effect, left to right.
export const GUEST_TYPE_ENTRANCE_ICONS: Partial<Record<GuestType, readonly GuestIcon[]>> = {
  CLIMBER:    [{ symbol: '➕', label: 'Gains 1 popularity on entrance' }],
  MR_POPULAR: [INVITE_ICON],
  CELEBRITY:  [INVITE_ICON, INVITE_ICON],
  MERMAID:    [INVITE_ICON]
};

export function getGuestDetails(type: GuestType, properties: GuestProperties): GuestDetails;
export function formatMoney(value: number): string;
```

`getGuestDetails` builds `icons` in this order (Requirement 5.5):

1. `GUEST_TYPE_ENTRANCE_ICONS[type] ?? []`
2. ☮️ "Peace", repeated `peaceValue` times
3. ❌ "Trouble", repeated `troubleValue` times
4. ⭐ "Star", repeated `starValue` times

A value of zero or less adds no icons.

Emoji code points: ⭐ U+2B50, ❌ U+274C, ☮️ U+262E U+FE0F, ➕ U+2795, 👤 U+1F464.

`formatMoney` returns `$3` for 3 and `-$3` for -3 (Requirement 3.2).

### `GuestDetailsComponent` (`components/guest-details.component.ts`)

- Selector `app-guest-details`. Required inputs: `type: GuestType` and `properties: GuestProperties`.
- Uses `@Input` decorators like the other components, and computes the details with `getGuestDetails` in getters, so they update when the inputs change (Requirement 1.4). Signal inputs (`input.required()`) don't work in this project's Vitest setup, which compiles components just in time (JIT), so they fail with NG0950.
- Template (each part rendered only when there is something to show):
  - `.guest-icons` in the top right: one `<span role="img" [attr.aria-label]="icon.label" [title]="icon.label">` per icon. The row spans the card's width and wraps, right-aligned (Requirement 6.5). A second row would overlap the header, but no current guest has more than 2 icons.
  - `.guest-popularity` on the right edge, centered vertically
  - `.guest-money` in the bottom right, showing `formatMoney(money)`
  - Each value is a `.guest-value` span after a visually hidden "Popularity " or "Money " prefix, so screen readers announce "Popularity 2" (Requirement 6.3). `aria-label` is not used here, because ARIA prohibits it on a `<div>` with no role.
  - Negative values get a `.negative` class and show in red. Positive money shows in green (Requirement 6.6).
- Styles: `:host { position: absolute; inset: 0; pointer-events: none; }`. Children are absolutely positioned within the host. `pointer-events: none` keeps the overlay from blocking clicks on Shop_Card and ban selection buttons. The icon spans set `pointer-events: auto` again, because the property is inherited and their `title` tooltips would otherwise never show (Requirement 6.2). A click on an icon still reaches the card, because the span is inside it.

### `GuestCardComponent`

- Add `position: relative` to `.guest-card`, and include `<app-guest-details [type]="guest.type" [properties]="guest.properties" />` inside it.
- Raise the top and bottom padding to `1.75rem`, so the icons sit above the header and the money sits below the caption (Requirement 6.1). The side padding stays at `1rem`: there is already room for the popularity beside the image, and wider padding made the shop card text wrap at phone width.

### Shop_Card (`PhaseContentComponent`)

- Add `position: relative` to `.shop-card`, and include `<app-guest-details [type]="item.type" [properties]="GUEST_TYPE_DEFAULTS[item.type]" />`.
- Use the same `1.75rem 1rem` padding as the guest card, which keeps the money clear of the "Price" and "Available" lines (Requirement 6.1).
- The Expand House card does not get details.
- The button's `aria-label` ("Buy <type>") is kept, and `aria-describedby` points at the overlay (`id="shop-details-<TYPE>"`). Screen readers then announce, for example, "Buy Dragon", then "Star Money -$3" (Requirement 6.4).
- The Expand House price uses `formatMoney` too, so all money on the page has one format.

## Correctness Properties

1. **Zero hiding**: For any type and properties, `popularity` is `null` exactly when `popularityValue === 0`, and otherwise equals it. The same holds for `money` and `moneyValue`. _(Requirements 2.1, 2.3, 3.1, 3.3)_
2. **Icon order**: For any type and properties, `icons` equals the type's entrance icons, then `max(0, peaceValue)` peace icons, `max(0, troubleValue)` trouble icons and `max(0, starValue)` star icons, in that order. So the star icons are always last, and the trouble icons come directly before them. _(Requirements 4.1, 4.2, 4.4, 5.1, 5.2, 5.5)_
3. **Type-only entrance icons**: For any type and any two property sets, the entrance icons are the same. _(Requirement 1.3)_
4. **Money format**: For any non-zero integer n, `formatMoney(n)` is `'$' + n` when n > 0 and `'-$' + |n|` when n < 0. _(Requirements 3.1, 3.2)_

## Error Handling

- Guest types with no entry in `GUEST_TYPE_ENTRANCE_ICONS` get no entrance icons.
- Negative star, trouble or peace values (none exist today) show no icon.

## Testing Strategy

- **Model unit tests** (`guest.model.spec.ts`): `getGuestDetails` for representative types:
  - Old Friend: popularity only
  - Ticket Taker: negative popularity, and money
  - Dragon: negative money and a star
  - Unicorn: peace and a star
  - Dinosaur: trouble and a star
  - Climber: defaults (no popularity, ➕), and again with popularity 3
  - Mr. Popular, Mermaid (👤 and a star) and Celebrity (👤👤)
  - Made-up properties with 2 peace, 2 trouble and 3 stars: ☮️☮️❌❌⭐⭐⭐

  Also check that every type in `GUEST_TYPE_ENTRANCE_EFFECTS` has an entry in `GUEST_TYPE_ENTRANCE_ICONS`, so nobody can add an effect without an icon.
- **Model property tests** (`guest.model.property.spec.ts`, fast-check): Properties 1–4 over arbitrary guest types and integer property values.
- **Component tests** (`guest-details.component.spec.ts`): elements appear or are hidden according to the details, with the right text, accessible names and icon DOM order.
- **Guest card tests**: a Climber whose popularity was raised to 3 shows `3`, and the card updates when its `guest` input changes.
- **Phase content tests**: the Climber Shop_Card shows ➕ and no popularity. The Celebrity Shop_Card shows `2`, `$3` and two 👤 icons. Clicking a Shop_Card still buys the guest.
- Update any existing tests that compare a card's full `textContent` and now fail because of the new elements.
