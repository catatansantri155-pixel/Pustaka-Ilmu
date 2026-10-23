export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  mfa_enabled?: boolean;
}

export interface LoginResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
  mfa_required?: boolean;
  mfa_token?: string;
}

export interface MfaVerifyResponse {
  access_token: string;
  token_type?: string;
  user: User;
}

export interface MfaEnrollResponse {
  secret: string;
  otpauth_uri: string;
}

export interface MeResponse extends User {
  mfa_enabled?: boolean;
}

export interface Scholar {
  id: string;
  name_id?: string | null;
  name?: string | null;
  name_ar?: string | null;
  death_year_hijri?: string | number | null;
  death_year?: string | number | null;
  died?: string | null;
  bio_id?: string | null;
  bio?: string | null;
  description?: string | null;
  monogram_ar?: string | null;
}

export interface Topic {
  id: string;
  code?: string | null;
  name_id?: string | null;
  name_ar?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  parent_id?: string | null;
  material_count?: number | null;
}

export interface Issue {
  id: string;
  code?: string | null;
  title_id?: string | null;
  title?: string | null;
  question?: string | null;
  description?: string | null;
  topic_id?: string | null;
  topic?: Topic | null;
  topics?: Topic[];
}

export interface TextSegment {
  id: string;
  order_index: number;
  text_ar: string;
}

export interface TranslationSegment {
  id?: string;
  text_segment_id: string;
  text_id: string;
  version?: number;
}

export interface SegmentUpdateResponse {
  id: string;
  text_segment_id: string;
  text_id: string;
  version: number;
  material_version?: number | string | null;
}

export interface QualityFinding {
  id: string;
  material_id?: string | null;
  severity: string;
  category?: string | null;
  type?: string | null;
  code?: string | null;
  message?: string | null;
  detail?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export interface MaterialSummary {
  id: string;
  title_id?: string | null;
  title_ar?: string | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  scholar_id?: string | null;
  scholar?: Scholar | null;
  scholar_name?: string | null;
  content_type?: string | null;
  type?: string | null;
  status?: string | null;
  pipeline_status?: string | null;
  is_demo?: boolean;
  ai_label?: string | null;
  quality_status?: string | null;
  source_url?: string | null;
  source_id?: string | null;
  topics?: Topic[];
  topic?: Topic | null;
  created_at?: string | null;
  updated_at?: string | null;
  ai_run?: AiRun | null;
  last_ai_run?: AiRun | null;
  blockers?: string[];
}

export interface AiRun {
  id?: string;
  material_id?: string | null;
  status?: string | null;
  model?: string | null;
  error?: string | null;
  message?: string | null;
  detail?: string | null;
  cost_estimate?: number | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
  created_at?: string | null;
}

export interface AiRunTotals {
  runs: number;
  cost_estimate: number;
  tokens_input: number;
  tokens_output: number;
  by_status: Record<string, number>;
}

export interface AiRunsResponse {
  runs: AiRun[];
  totals: AiRunTotals;
}

export interface AcquisitionJob {
  id: string;
  url?: string | null;
  status?: string | null;
  error?: string | null;
  material_id?: string | null;
  created_at?: string | null;
}

export interface ProcessingJob {
  id: string;
  material_id?: string | null;
  job_type?: string | null;
  status?: string | null;
  error?: string | null;
  detail?: string | null;
  created_at?: string | null;
}

export interface ProcessingResponse {
  acquisition_jobs: AcquisitionJob[];
  processing_jobs: ProcessingJob[];
}

export interface PublicationApproval {
  id: string;
  decision?: string | null;
  admin_id?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface PublicationItem {
  material_id: string;
  title_id?: string | null;
  status?: string | null;
  rights_status?: string | null;
  is_demo?: boolean;
  published?: boolean;
  blockers: string[];
  approvals: PublicationApproval[];
}

export interface PublicationResponse {
  items: PublicationItem[];
}

export interface ReportsSummary {
  materials_by_status: Record<string, number>;
  materials_by_scholar: Record<string, number>;
  materials_by_topic: Record<string, number>;
  findings_by_severity: Record<string, number>;
  ai: {
    runs: number;
    cost_estimate: number;
    tokens_input: number;
    tokens_output: number;
  };
  jobs: {
    acquisition_by_status: Record<string, number>;
    processing_by_status: Record<string, number>;
  };
}

export interface AiSettings {
  ai_api_base_configured: boolean;
  ai_api_key_configured: boolean;
  ai_model: string;
  ai_cost_limit: number;
  celery_eager: boolean;
  redis_configured: boolean;
}

export interface GlossaryItem {
  id: string;
  term_ar: string;
  term_id: string;
  context?: string | null;
}

export interface BackupItem {
  name: string;
  size_bytes: number;
  created_at?: string | null;
}

export interface SystemInfo {
  app_version?: string | null;
  database: { dialect?: string | null; ok: boolean };
  worker_mode?: string | null;
  backups: BackupItem[];
}

export interface BackupCreateResponse {
  file: string;
  size_bytes: number;
}

export interface MaterialDetail extends MaterialSummary {
  arabic?: {
    full_text?: string | null;
    segments?: TextSegment[];
  } | null;
  arabic_text?: string | null;
  translation?: {
    id?: string | null;
    status?: string | null;
    segments?: TranslationSegment[];
  } | null;
  findings?: QualityFinding[];
  glossary?: Array<{ term: string; definition: string }> | Record<string, string> | null;
  references?: Array<Record<string, unknown>> | null;
  approval?: Record<string, unknown> | null;
  approved_by?: string | null;
  approved_at?: string | null;
}

export type SearchResult = MaterialSummary;

export interface Bookmark {
  id: string;
  material_id: string;
  material?: MaterialSummary | null;
  created_at?: string | null;
}

export interface SourceRegistryItem {
  id: string;
  name: string;
  domain?: string | null;
  base_url?: string | null;
  url?: string | null;
  scholar_id?: string | null;
  scholar?: Scholar | string | null;
  scholar_name?: string | null;
  permission_status?: string | null;
  redistribution_policy?: string | null;
  created_at?: string | null;
}

export interface AuditActivity {
  id?: string;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  actor?: string | null;
  created_at?: string | null;
  detail?: string | null;
}

export interface DashboardStats {
  total_materials?: number;
  materials_total?: number;
  total?: number;
  by_status?: Record<string, number>;
  status_counts?: Record<string, number>;
  pending_review?: number;
  awaiting_review?: number;
  published?: number;
  published_count?: number;
  critical_findings?: number;
  critical_findings_count?: number;
  total_sources?: number;
  sources_total?: number;
  sources?: number;
  recent_activity?: AuditActivity[];
  audit_logs?: AuditActivity[];
  activity?: AuditActivity[];
  [key: string]: unknown;
}

export interface ReferenceItem {
  id: string;
  reference?: string | null;
  text_ar?: string | null;
  text_id?: string | null;
  source?: string | null;
  [key: string]: unknown;
}
