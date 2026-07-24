import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import {
  ActivatedRoute
} from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  toSignal
} from '@angular/core/rxjs-interop';
import {
  map
} from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule
  ],
  selector: 'app-contact',
  standalone: true,
  styleUrl: './contact.component.scss',
  templateUrl: './contact.component.html'
})
export class ContactComponent {

  private readonly route = inject(ActivatedRoute);

  private readonly formBuilder = inject(FormBuilder);

  readonly selectedState = toSignal(
    this.route.queryParamMap.pipe(
      map(parameters => parameters.get('state') ?? '')
    ),
    {
      initialValue: ''
    }
  );

  readonly interest = toSignal(
    this.route.queryParamMap.pipe(
      map(parameters => parameters.get('interest') ?? '')
    ),
    {
      initialValue: ''
    }
  );

  readonly pageTitle = computed(() =>
    this.selectedState()
      ? `Contact Us About ${this.selectedState()}`
      : 'Contact Us'
  );

  readonly contactForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    interest: [this.interest()],
    lastName: ['', Validators.required],
    message: [''],
    phone: [''],
    state: [this.selectedState()]
  });

  submit(): void {
    console.log(this.contactForm.getRawValue());

    // Firebase integration later.
  }

}