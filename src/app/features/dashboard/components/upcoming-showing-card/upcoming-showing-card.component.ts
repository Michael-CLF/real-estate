import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

export interface UpcomingShowing {
  buyerName: string;
  date: Date;
  agentName: string;
}

@Component({
  selector: 'app-upcoming-showing-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './upcoming-showing-card.component.html',
  styleUrl: './upcoming-showing-card.component.scss'
})
export class UpcomingShowingCardComponent {
  @Input() showing: UpcomingShowing | null = null;
}