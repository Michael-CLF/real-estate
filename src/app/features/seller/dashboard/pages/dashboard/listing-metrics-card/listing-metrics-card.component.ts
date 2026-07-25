import { Component, Input } from '@angular/core';

export interface ListingMetric {
  label: string;
  value: string | number;
  helperText?: string;
}

@Component({
  selector: 'app-listing-metrics-card',
  standalone: true,
  imports: [],
  templateUrl: './listing-metrics-card.component.html',
  styleUrl: './listing-metrics-card.component.scss'
})
export class ListingMetricsCardComponent {
  @Input() metrics: ListingMetric[] = [];
}