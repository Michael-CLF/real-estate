import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  AuthService,
} from '../../../../core/authentication/services/auth.service';

import {
  ListingSchool,
  ListingSchools,
  SchoolType,
} from '../../../../core/domains/listings/models/listing.model';

import {
  ListingService,
} from '../../../../core/domains/listings/services/listing.service';

@Component({
  selector: 'app-schools-enhancement',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './schools-enhancement.component.html',
  styleUrl: './schools-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolsEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly formBuilder = inject(FormBuilder);

  readonly schoolTypes: readonly {
    value: SchoolType;
    label: string;
  }[] = [
    {
      value: 'public',
      label: 'Public',
    },
    {
      value: 'charter',
      label: 'Charter',
    },
    {
      value: 'magnet',
      label: 'Magnet',
    },
    {
      value: 'private',
      label: 'Private',
    },
  ];

  readonly schoolsForm =
    this.formBuilder.nonNullable.group({
      districtName: [''],

      assignedSchoolsVerified: [false],

      elementarySchool:
        this.createSchoolForm(),

      middleSchool:
        this.createSchoolForm(),

      highSchool:
        this.createSchoolForm(),
    });

  readonly hasChanges = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  readonly saveError =
    signal<string | null>(null);

  readonly lastSavedAt =
    signal<Date | null>(null);

  constructor() {
    this.schoolsForm.valueChanges.subscribe(
      () => {
        if (
          !this.isLoading() &&
          !this.isSaving()
        ) {
          this.hasChanges.set(true);
          this.saveError.set(null);
        }
      },
    );
  }

  async ngOnInit(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid',
      );

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService
          .getPublishedListing(
            listingUid,
          );

      if (!listing) {
        this.saveError.set(
          'The selected listing could not be found.',
        );

        return;
      }

      if (listing.schools) {
        this.loadSchools(
          listing.schools,
        );
      }
    } catch (error: unknown) {
      console.error(
        'Unable to load school information:',
        error,
      );

      this.saveError.set(
        'We could not load the saved school information.',
      );
    } finally {
      this.hasChanges.set(false);
      this.isLoading.set(false);
    }
  }

  async saveSection(): Promise<void> {
    if (
      this.isSaving() ||
      this.isLoading()
    ) {
      return;
    }

    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid',
      );

    const sellerUid =
      this.authService.currentUserUid;

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      return;
    }

    if (!sellerUid) {
      this.saveError.set(
        'You must be signed in to update this listing.',
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.listingService
        .updatePublishedListing(
          listingUid,
          sellerUid,
          {
            schools:
              this.createSchools(),
          },
        );

      this.hasChanges.set(false);
      this.lastSavedAt.set(
        new Date(),
      );
    } catch (error: unknown) {
      console.error(
        'Unable to save school information:',
        error,
      );

      this.saveError.set(
        'We could not save this school information. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async returnToEnhancements(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid',
      );

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listingUid,
      'enhancements',
    ]);
  }

  async viewListing(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid',
      );

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      return;
    }

    await this.router.navigate([
      '/listings',
      listingUid,
    ]);
  }

  private createSchoolForm() {
    return this.formBuilder
      .nonNullable
      .group({
        name: [''],
        district: [''],

        schoolType: [
          'public' as SchoolType,
        ],

        grades: [''],
        distanceMiles: [''],
      });
  }

  private loadSchools(
    schools: ListingSchools,
  ): void {
    this.schoolsForm.patchValue(
      {
        districtName:
          schools.districtName ?? '',

        assignedSchoolsVerified:
          schools.assignedSchoolsVerified,

        elementarySchool:
          this.createSchoolFormValue(
            schools.elementarySchool,
          ),

        middleSchool:
          this.createSchoolFormValue(
            schools.middleSchool,
          ),

        highSchool:
          this.createSchoolFormValue(
            schools.highSchool,
          ),
      },
      {
        emitEvent: false,
      },
    );
  }

  private createSchoolFormValue(
    school?: ListingSchool,
  ) {
    return {
      name:
        school?.name ?? '',

      district:
        school?.district ?? '',

      schoolType:
        school?.schoolType ??
        'public',

      grades:
        school?.grades ?? '',

      distanceMiles:
        school?.distanceMiles
          ?.toString() ?? '',
    };
  }

  private createSchools():
    ListingSchools {
    const formValue =
      this.schoolsForm
        .getRawValue();

    const districtName =
      formValue.districtName.trim();

    const elementarySchool =
      this.createSchool(
        formValue.elementarySchool,
      );

    const middleSchool =
      this.createSchool(
        formValue.middleSchool,
      );

    const highSchool =
      this.createSchool(
        formValue.highSchool,
      );

    return {
      ...(districtName
        ? {
            districtName,
          }
        : {}),

      ...(elementarySchool
        ? {
            elementarySchool,
          }
        : {}),

      ...(middleSchool
        ? {
            middleSchool,
          }
        : {}),

      ...(highSchool
        ? {
            highSchool,
          }
        : {}),

      assignedSchoolsVerified:
        formValue
          .assignedSchoolsVerified,
    };
  }

  private createSchool(
    value: {
      name: string;
      district: string;
      schoolType: SchoolType;
      grades: string;
      distanceMiles: string;
    },
  ): ListingSchool | undefined {
    const name =
      value.name.trim();

    if (!name) {
      return undefined;
    }

    const district =
      value.district.trim();

    const grades =
      value.grades.trim();

    const distanceMiles =
      this.parseDistance(
        value.distanceMiles,
      );

    return {
      name,
      schoolType:
        value.schoolType,

      ...(district
        ? {
            district,
          }
        : {}),

      ...(grades
        ? {
            grades,
          }
        : {}),

      ...(distanceMiles !== undefined
        ? {
            distanceMiles,
          }
        : {}),
    };
  }

  private parseDistance(
    value: string,
  ): number | undefined {
    const trimmedValue =
      value.trim();

    if (!trimmedValue) {
      return undefined;
    }

    const distance =
      Number(trimmedValue);

    return (
      Number.isFinite(distance) &&
      distance >= 0
    )
      ? distance
      : undefined;
  }
}