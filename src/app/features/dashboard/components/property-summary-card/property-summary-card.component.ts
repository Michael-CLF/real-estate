import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PropertySummary {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  listPrice: number;
  status: string;
  daysOnMarket: number;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-property-summary-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './property-summary-card.component.html',
  styleUrl: './property-summary-card.component.scss'
})
export class PropertySummaryCardComponent {
  @Input({ required: true })
  property!: PropertySummary;
}