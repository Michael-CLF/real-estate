export interface DashboardWorkspace {
  id: string;
  title: string;
  subtitle: string;
  type: WorkspaceType;
  progress: number;
  status: string;
  primaryAction: string;
}

export type WorkspaceType =
  | 'listing'
  | 'purchase'
  | 'business'
  | 'transaction';

export interface DashboardStat {
  label: string;
  value: number;
}

export interface DashboardNextStep {
  title: string;
  description: string;
  action: string;
  required: boolean;
}

export interface DashboardActivity {
  title: string;
  description: string;
  timestamp: Date;
}

