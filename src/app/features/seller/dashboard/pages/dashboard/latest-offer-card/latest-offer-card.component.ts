import { Component, Input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

export interface LatestOffer {
  buyerName: string;
  amount: number;
  submittedDate: Date;
  financing: string;
  contingencies: number;
}

@Component({
  selector: 'app-latest-offer-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './latest-offer-card.component.html',
  styleUrl: './latest-offer-card.component.scss'
})
export class LatestOfferCardComponent {
  @Input() offer: LatestOffer | null = null;
}