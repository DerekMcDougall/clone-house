import { Component, Input } from '@angular/core';
import { formatMoney, getGuestDetails, GuestDetails, GuestProperties, GuestType } from '../models/guest.model';

// Overlays a guest's popularity, money and icons on a card. The card must be position: relative.
@Component({
  selector: 'app-guest-details',
  imports: [],
  template: `
@if (details.icons.length > 0) {
  <div class="guest-icons">
    @for (icon of details.icons; track $index) {
      <span role="img" [attr.aria-label]="icon.label" [title]="icon.label">{{ icon.symbol }}</span>
    }
  </div>
}
@if (details.popularity !== null) {
  <div class="guest-popularity" [attr.aria-label]="'Popularity ' + details.popularity">{{ details.popularity }}</div>
}
@if (money !== null) {
  <div class="guest-money" [attr.aria-label]="'Money ' + money">{{ money }}</div>
}
  `,
  styles: [`
:host {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.guest-icons {
  position: absolute;
  top: 0.3rem;
  right: 0.4rem;
  display: flex;
  gap: 0.1rem;
  font-size: 0.85rem;
  line-height: 1;
}

.guest-popularity {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.guest-money {
  position: absolute;
  bottom: 0.3rem;
  right: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #2e7d32;
}
  `]
})
export class GuestDetailsComponent {
  @Input({ required: true }) type!: GuestType;
  @Input({ required: true }) properties!: GuestProperties;

  protected get details(): GuestDetails {
    return getGuestDetails(this.type, this.properties);
  }

  protected get money(): string | null {
    const money = this.details.money;
    return money === null ? null : formatMoney(money);
  }
}
