export type RAGStatus = 'Green' | 'Amber' | 'Red';

export type ReportStatus = 'In progress' | 'Report Delivered' | 'Overdue' | 'Data Submitted';

export type MembershipLevel =
  | 'Business Certification'
  | 'Advanced'
  | 'Net Zero Committed'
  | 'Multiple Tiers';

export type MeetingType =
  | 'Check-in'
  | 'Renewal'
  | 'Strategy'
  | 'Data Review'
  | 'Internal'
  | 'Ad hoc';

export type ActionStatus = 'Open' | 'Done' | 'Blocked';

export interface Account {
  id: string;
  company_name: string;
  membership_level: MembershipLevel | null;
  add_ons: string[];
  report_status: ReportStatus | null;
  main_poc: string | null;
  recurring_meetings: boolean;
  reporting_period: string | null;
  renewal_month: string | null;
  rag_status: RAGStatus | null;
  reporting_deadline: string | null;
  relevant_info: string | null;
  open_opportunity: string | null;
  opportunity_value: number | null;
  current_arr: number | null;
  turnover: string | null;
  industry: string | null;
  crm_id: string | null;
  created_at: string;
  updated_at: string;
  last_meeting_date?: string | null;
  open_actions_count?: number;
  overdue_actions_count?: number;
}

export interface Meeting {
  id: string;
  account_id: string | null;
  meeting_date: string;
  meeting_type: MeetingType;
  attendees: string | null;
  notes: string | null;
  is_internal: boolean;
  created_at: string;
  actions?: Action[];
  account?: Pick<Account, 'id' | 'company_name'> | null;
}

export interface Action {
  id: string;
  meeting_id: string | null;
  account_id: string | null;
  description: string;
  owner: string;
  due_date: string | null;
  status: ActionStatus;
  completed_at: string | null;
  created_at: string;
  account?: Pick<Account, 'id' | 'company_name'> | null;
}
