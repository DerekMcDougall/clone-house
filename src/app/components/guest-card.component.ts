import { Component, Input } from '@angular/core';
import { Guest, GUEST_TYPE_LABELS } from '../models/guest.model';

@Component({
  selector: 'app-guest-card',
  imports: [],
  template: `
<div class="guest-card">
  <div class="card-header">{{ GUEST_TYPE_LABELS[guest.type] ?? guest.type }}</div>
  <div class="card-image">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  </div>
  <div class="card-caption">{{ guest.name }}</div>
</div>
  `,
  styles: [`
.guest-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  max-width: 200px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.guest-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.guest-card:focus-within {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.card-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.card-image {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  color: #999;
}

.card-image svg {
  width: 50px;
  height: 50px;
}

.card-caption {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  text-align: center;
}
  `]
})
export class GuestCardComponent {
  @Input({ required: true }) guest!: Guest;

  protected readonly GUEST_TYPE_LABELS = GUEST_TYPE_LABELS;
}
