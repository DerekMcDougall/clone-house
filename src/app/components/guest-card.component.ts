import { Component, Input } from '@angular/core';
import { Guest } from '../models/guest.model';
import { guestTypeLabel } from '../models/guest-type-registry';
import { GuestDetailsComponent } from './guest-details.component';

@Component({
  selector: 'app-guest-card',
  imports: [GuestDetailsComponent],
  templateUrl: './guest-card.component.html',
  styleUrl: './guest-card.component.scss'
})
export class GuestCardComponent {
  @Input({ required: true }) guest!: Guest;

  protected readonly guestTypeLabel = guestTypeLabel;
}
