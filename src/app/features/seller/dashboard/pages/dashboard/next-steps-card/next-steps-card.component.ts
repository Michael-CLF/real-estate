import { Component, Input } from '@angular/core';

export interface NextStep {
  title: string;
  description: string;
  action: string;
  required: boolean;
}

@Component({
  selector: 'app-next-steps-card',
  standalone: true,
  imports: [],
  templateUrl: './next-steps-card.component.html',
  styleUrl: './next-steps-card.component.scss'
})
export class NextStepsCardComponent {
  @Input() steps: NextStep[] = [];

  get requiredSteps(): NextStep[] {
    return this.steps.filter(step => step.required);
  }

  get recommendedSteps(): NextStep[] {
    return this.steps.filter(step => !step.required);
  }
}