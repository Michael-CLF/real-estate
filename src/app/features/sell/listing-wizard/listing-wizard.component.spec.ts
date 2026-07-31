import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListingWizardComponent } from './listing-wizard.component';

describe('ListingWizardComponent', () => {
  let component: ListingWizardComponent;
  let fixture: ComponentFixture<ListingWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingWizardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListingWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
