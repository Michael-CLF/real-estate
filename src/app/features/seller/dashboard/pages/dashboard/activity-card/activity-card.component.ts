import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

export interface ActivityItem {
  title: string;
  description: string;
  timestamp: Date;
}

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss'
})
export class ActivityCardComponent {
  @Input() activities: ActivityItem[] = [];
}