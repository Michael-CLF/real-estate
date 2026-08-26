export type EducationAudience =
  | 'buyer'
  | 'seller'
  | 'professional'
  | 'all';

export interface EducationCategory {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly audience: EducationAudience;
  readonly displayOrder: number;
}