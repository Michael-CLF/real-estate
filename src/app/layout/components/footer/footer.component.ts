import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  styleUrl: './footer.component.scss',
  templateUrl: './footer.component.html'
})
export class FooterComponent {}