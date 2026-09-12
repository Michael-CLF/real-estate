import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  forwardRef,
  inject
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';


const CURRENCY_FORMATTER =
  new Intl.NumberFormat(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );


@Directive({
  selector: 'input[appCurrencyInput]',
  standalone: true,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => CurrencyInputDirective
      ),
      multi: true
    }
  ]
})
export class CurrencyInputDirective
implements ControlValueAccessor {

  private readonly element =
    inject<ElementRef<HTMLInputElement>>(
      ElementRef
    );

  private readonly renderer =
    inject(Renderer2);

  private currentValue:
    number | null = null;

  private onChange:
    (value: number | null) => void =
      () => undefined;

  private onTouched:
    () => void =
      () => undefined;


  writeValue(
    value: number | string | null
  ): void {
    this.currentValue =
      parseCurrency(value);

    this.writeFormattedValue();
  }


  registerOnChange(
    onChange: (value: number | null) => void
  ): void {
    this.onChange = onChange;
  }


  registerOnTouched(
    onTouched: () => void
  ): void {
    this.onTouched = onTouched;
  }


  setDisabledState(
    disabled: boolean
  ): void {
    this.renderer.setProperty(
      this.element.nativeElement,
      'disabled',
      disabled
    );
  }


  @HostListener(
    'focus'
  )
  handleFocus(): void {
    this.renderer.setProperty(
      this.element.nativeElement,
      'value',
      this.currentValue === null
        ? ''
        : this.currentValue.toFixed(2)
    );

    this.element.nativeElement.select();
  }


  @HostListener(
    'input',
    ['$event']
  )
  handleInput(
    event: Event
  ): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.currentValue =
      parseCurrency(target.value);

    this.onChange(
      this.currentValue
    );
  }


  @HostListener(
    'blur'
  )
  handleBlur(): void {
    this.writeFormattedValue();
    this.onTouched();
  }


  private writeFormattedValue(): void {
    this.renderer.setProperty(
      this.element.nativeElement,
      'value',
      this.currentValue === null
        ? ''
        : CURRENCY_FORMATTER.format(
          this.currentValue
        )
    );
  }
}


function parseCurrency(
  value: number | string | null
): number | null {
  if (
    value === null ||
    value === ''
  ) {
    return null;
  }

  const normalized =
    typeof value === 'number'
      ? value
      : Number(
        value.replace(
          /[$,\s]/g,
          ''
        )
      );

  return Number.isFinite(normalized)
    ? Math.round(
      normalized * 100
    ) / 100
    : null;
}
