export type UserRole = "user" | "admin";
export type ProfileStatus = "active" | "suspended";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  grade: string | null;
  role: UserRole;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationAnswers {
  leadership_experience: string;
  motivation: string;
  officer_goals: string;
  ideas_for_year: string;
  execution_plan: string;
  skills: string;
}

export interface Application {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  answers: ApplicationAnswers;
  resume_url: string | null;
  admin_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  application_id: string;
  leadership: number;
  creativity: number;
  execution: number;
  commitment: number;
  total_score: number;
  notes: string | null;
  scored_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithProfile extends Application {
  profiles: Pick<Profile, "email" | "full_name" | "grade"> | null;
}

export interface ApplicationWithScore extends ApplicationWithProfile {
  scores: Score | null;
}

export interface ApplicationFormData extends ApplicationAnswers {}

export const EMPTY_APPLICATION: ApplicationFormData = {
  leadership_experience: "",
  motivation: "",
  officer_goals: "",
  ideas_for_year: "",
  execution_plan: "",
  skills: "",
};

export const GRADES = ["9", "10", "11", "12"] as const;

export interface AppSettings {
  id: number;
  applications_open: boolean;
  season_label: string;
  closed_message: string;
  updated_at: string;
  updated_by: string | null;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export interface Officer {
  id: string;
  name: string;
  title: string | null;
  image_path: string | null;
  display_order: number;
  created_at: string;
}

export type ReportCategory =
  | "general"
  | "incident"
  | "suggestion"
  | "feedback"
  | "other";

export interface Report {
  id: string;
  user_id: string;
  subject: string;
  category: ReportCategory;
  body: string;
  created_at: string;
}

export interface ReportWithProfile extends Report {
  profiles: Pick<Profile, "email" | "full_name"> | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubSocial {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  display_order: number;
  created_at: string;
}

export interface ClubInfo {
  id: number;
  description: string;
  updated_at: string;
}

export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "incident", label: "Incident" },
  { value: "suggestion", label: "Suggestion" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

export const SOCIAL_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Twitter",
  "Facebook",
  "LinkedIn",
  "YouTube",
  "Website",
  "Other",
] as const;
