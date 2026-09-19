export interface StateMetrics {
  pending: number;
  inProcess: number;
  resolved: number;
  rejected: number;
  total: number;
}

export interface UserRoleMetrics {
  admin: number;
  baseSecurity: number;
  securityPersonnel: number;
  citizen: number;
  total: number;
}

export interface AverageTimesMetrics {
  attentionTimeSeconds: number;
  attentionTimeFormatted: string;
  resolutionTimeSeconds: number;
  resolutionTimeFormatted: string;
  totalTimeSeconds: number;
  totalTimeFormatted: string;
}

export interface TypeDistribution {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface RecentCommentary {
  id: string;
  commentary: string;
  score: number;
  userName: string;
  userImage?: string;
  date: string;
}

export interface DashboardOverview {
  states: StateMetrics;
  users: UserRoleMetrics;
  averageTimes: AverageTimesMetrics;
  typesDistribution: TypeDistribution[];
  monthlySeries: number[];
  recentCommentaries: RecentCommentary[];
  year: number;
  weeklyAlerts: number;
}
