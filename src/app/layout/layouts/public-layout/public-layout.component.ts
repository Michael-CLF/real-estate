import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import {
  FooterComponent
} from '../../components/footer/footer.component';

import {
  HeaderComponent
} from '../../components/header/header.component';

import {
  NavStreetAssistantComponent
} from '../../../shared/components/navstreet-assistant/navstreet-assistant.component';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  imports: [
    FooterComponent,
    HeaderComponent,
    NavStreetAssistantComponent,
    RouterOutlet
  ],
  selector:
    'app-public-layout',
  standalone:
    true,
  styleUrl:
    './public-layout.component.scss',
  templateUrl:
    './public-layout.component.html'
})
export class PublicLayoutComponent {}