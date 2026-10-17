import { Component, Input } from '@angular/core';
import { Guest, GUEST_TYPE_LABELS } from '../models/guest.model';
import { GuestDetailsComponent } from './guest-details.component';

@Component({
  selector: 'app-guest-card',
  imports: [GuestDetailsComponent],
  templateUrl: './guest-card.component.html',
  styleUrl: './guest-card.component.scss'
})
export class GuestCardComponent {
  @Input({ required: true }) guest!: Guest;

  protected readonly GUEST_TYPE_LABELS = GUEST_TYPE_LABELS;
}
