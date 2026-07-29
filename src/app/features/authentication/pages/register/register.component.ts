import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private readonly formBuilder = inject(FormBuilder);

  loading = false;
  errorMessage = '';

 readonly registerForm = this.formBuilder.nonNullable.group({
  firstName: [
    '',
    [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[A-Za-z' -]+$/)
    ]
  ],
  lastName: [
    '',
    [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[A-Za-z]+$/)
    ]
  ],
  email: [
    '',
    [
      Validators.required,
      Validators.email
    ]
  ],
  phone: [
    '',
    [
      Validators.required,
      Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    ]
  ]
});

formatPhoneNumber(event: Event): void {
  const input = event.target as HTMLInputElement;

  const digits = input.value
    .replace(/\D/g, '')
    .slice(0, 10);

  let formattedValue = '';

  if (digits.length > 0) {
    formattedValue = `(${digits.slice(0, 3)}`;
  }

  if (digits.length >= 4) {
    formattedValue += `) ${digits.slice(3, 6)}`;
  }

  if (digits.length >= 7) {
    formattedValue += `-${digits.slice(6, 10)}`;
  }

  this.registerForm.controls.phone.setValue(
    formattedValue,
    { emitEvent: false }
  );
}

  async submit(): Promise<void> {
    if (this.registerForm.invalid || this.loading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const {
        firstName,
        lastName,
        email,
        phone
      } = this.registerForm.getRawValue();

      const pendingRegistration = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, '')
      };

      sessionStorage.setItem(
        'pendingSellerRegistration',
        JSON.stringify(pendingRegistration)
      );

      /*
       * The OTP request will be added after the OTP backend/service
       * method is created.
       */
    } catch (error) {
      console.error('Unable to begin seller registration:', error);

      this.errorMessage =
        'We could not begin registration. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}