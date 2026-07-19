import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StateExplorerComponent } from '../home/state-explorer/state-explorer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [StateExplorerComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
