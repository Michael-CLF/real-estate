export type NavStreetFeatureStatus =
  | 'available'
  | 'coming-soon';

export interface AudiencePath {
  analyticsName: string;
  description: string;
  destination: string;
  icon: string;
  label: string;
}

export interface JourneyStep {
  description: string;
  icon: string;
  status: NavStreetFeatureStatus;
  title: string;
}

export interface Capability {
  description: string;
  icon: string;
  title: string;
}

export interface CapabilitySection {
  capabilities: readonly Capability[];
  description: string;
  eyebrow: string;
  id: string;
  title: string;
}

export interface ProductTourAction {
  analyticsName: string;
  destination: string;
  label: string;
  style:
    | 'primary'
    | 'secondary';
}