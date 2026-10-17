# Implementation Plan: Display Guest Details

## Overview

Add a pure `getGuestDetails()` function and an entrance icon map to the guest model. Add a `GuestDetailsComponent` overlay that draws the details, and include it on guest cards and shop cards.

## Tasks

- [x] 1. Guest model
  - [x] 1.1 Add `GuestIcon`, `GuestDetails`, `GUEST_TYPE_ENTRANCE_ICONS`, `getGuestDetails()` and `formatMoney()` to `guest.model.ts`
    - Put `GUEST_TYPE_ENTRANCE_ICONS` next to `GUEST_TYPE_ENTRANCE_EFFECTS`
    - `models/index.ts` re-exports only selected names, and nothing outside the model needs the new names through it, so it is unchanged
    - _Requirements: 1.3, 2.1–2.3, 3.1–3.3, 4.1–4.4, 5.1–5.6_
  - [x] 1.2 Add unit tests for `getGuestDetails()` and `formatMoney()` to `guest.model.spec.ts`, including the check that every entrance effect has an icon
  - [x] 1.3 Add property tests for Correctness Properties 1–4 to `guest.model.property.spec.ts`

- [x] 2. `GuestDetailsComponent`
  - [x] 2.1 Create `components/guest-details.component.ts`, with an inline template and styles like the other components
    - Absolutely positioned overlay with `pointer-events: none`
    - Icons in the top right, popularity on the right edge centered vertically, money in the bottom right
    - Accessible names and `title` tooltips on icons; accessible names on values
    - _Requirements: 1.4, 2.1, 3.1, 4.1, 4.2, 5.1, 6.2, 6.3, 6.5, 6.6_
  - [x] 2.2 Add component tests in `guest-details.component.spec.ts`

- [x] 3. Use the overlay on cards
  - [x] 3.1 Include it in `GuestCardComponent` with the guest's `type` and `properties`. Make the card `position: relative` and adjust the padding so nothing overlaps.
    - _Requirements: 1.1, 1.5, 6.1_
  - [x] 3.2 Include it in the Shop_Card in `PhaseContentComponent` with `GUEST_TYPE_DEFAULTS[item.type]`. Make the card `position: relative` and keep the money clear of the price and stock lines.
    - _Requirements: 1.2, 6.1, 6.4_
  - [x] 3.3 Add guest card and phase content tests: Climber at 3 popularity, the Climber and Celebrity shop cards, and buying still works. Fix any existing tests broken by the new elements.

- [x] 4. Check the layout in the running app
  - Look at party, ban selection and shop cards with the most crowded details (Celebrity, Rock Star, Unicorn, Ticket Taker), at desktop and phone widths

- [x] 5. Final checkpoint - Ensure all tests pass

## Notes

- `guest-card.component.html` and `guest-card.component.scss` are not used: the component has an inline template and styles. Edit the inline versions. Deleting the unused files is out of scope.
- The ban selection reuses `GuestCardComponent`, so it gets the details with no extra work and shows each guest's state at the bust.
- At phone width, party cards were already clipped under the status pane before this feature, so the popularity on their right edge can be hidden there. Fixing the gameplay layout at narrow widths is a separate change.
