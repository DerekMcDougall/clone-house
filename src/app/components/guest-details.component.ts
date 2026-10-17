import { Component, Input } from '@angular/core';
import { formatMoney, getGuestDetails, GuestDetails, GuestProperties, GuestType } from '../models/guest.model';

// Overlays a guest's popularity, money and icons on a card. The card must be position: relative.
@Component({
  selector: 'app-guest-details',
  imports: [],
  templateUrl: './guest-details.component.html',
  styleUrl: './guest-details.component.scss'
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
