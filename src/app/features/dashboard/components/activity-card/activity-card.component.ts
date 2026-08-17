import {
  Component,
  Input
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

export interface ActivityItem {
  activityUid: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  statusLabel?: string;
  route: string[];
}

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl:
    './activity-card.component.html',
  styleUrl:
    './activity-card.component.scss'
})
export class ActivityCardComponent {
  @Input()
  activities: ActivityItem[] = [];
}