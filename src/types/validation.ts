export type ComplianceStatus =
  | "Lulus Verifikasi"
  | "Catatan Procurement"
  | "Perlu Perbaikan"
  | "Sedang Dianalisis"
  | "Gagal Analisis";
export type ChecklistItemStatus = "Memenuhi" | "Tidak Memenuhi" | "Perlu Perhatian";
export type SeverityLevel = "SUCCESS" | "WARNING" | "ERROR";
export type CriterionSource = "template" | "custom";
export type AiTier =
  | "cekatan"
  | "cermat"
  | "cerdas"
  | "custom"
  | `custom:${string}`;
export type AiTierUsed = AiTier | "gemma" | "external" | "mcp_takeover";
export type ProcessingStatus = "processing" | "completed" | "failed";

export interface ChecklistRuleItem {
  category: string;
  item: string;
  guidance?: string | null;
  is_mandatory: boolean;
  weight: number;
  severity_on_failure?: SeverityLevel;
  source?: CriterionSource;
}

export interface ExtractedCriteriaResponse {
  suggested_name: string;
  suggested_document_kind: string;
  suggested_system_prompt?: string | null;
  checklist_rules: ChecklistRuleItem[];
  ai_tier_requested?: AiTier | string | null;
  ai_tier_used?: AiTierUsed | string | null;
  ai_model_used?: string | null;
  ai_fallback_notice?: string | null;
}

export interface ValidationProfile {
  id: string;
  name: string;
  code?: string;
  document_kind: string;
  description?: string;
  scope: string;
  department_id?: string;
  department_name?: string;
  passing_score_threshold: number;
  warning_score_threshold: number;
  strict_mandatory_enforcement: boolean;
  target_stage_to_clear?: string;
  custom_system_prompt?: string;
  prompt_template?: string;
  checklist_rules: ChecklistRuleItem[];
  is_default: boolean;
  is_active: boolean;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItemResult {
  item: string;
  status: ChecklistItemStatus;
  evidence_quote?: string | null;
  explanation?: string | null;
  comparison_detail?: string | null;
  severity: SeverityLevel;
  is_mandatory: boolean;
  weight?: number;
  normalized_weight?: number;
  fulfillment_ratio?: number;
  earned_score?: number;
  source?: CriterionSource | null;
}

export interface ExtractedStage {
  step: string;
  status: "Done" | "In Progress" | "Pending";
  auto_cleared: boolean;
  notes?: string | null;
}

export interface ExtractedProject {
  title: string;
  estimated_amount: number;
  suggested_method: string;
  department_name: string;
  department?: string;
  vendor_name?: string;
  stages: ExtractedStage[];
}

export interface DocumentValidationResponse {
  id: string;
  document_name: string;
  document_file_url?: string | null;
  file_url_signed?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  profile_id?: string | null;
  profile_name?: string | null;
  overall_score: number;
  passing_score_threshold: number;
  compliance_status: ComplianceStatus;
  summary: string;
  user_prompt?: string | null;
  checklist_rules?: ChecklistRuleItem[];
  checklist_evaluations: ChecklistItemResult[];
  recommendations: string[];
  extracted_project: ExtractedProject;
  created_at: string;
  request_id?: string | null;
  document_id?: string | null;
  processing_status?: ProcessingStatus;
  ai_tier_requested?: AiTier | string | null;
  ai_tier_used?: AiTierUsed | string | null;
  ai_model_used?: string | null;
  ai_fallback_notice?: string | null;
  error_message?: string | null;
}

export interface ReevaluateValidationPayload {
  checklist_rules?: ChecklistRuleItem[];
  passing_score_threshold?: number;
  custom_prompt?: string;
  ai_tier?: AiTier;
  async_mode?: boolean;
}

export interface ActiveValidationJob {
  id: string;
  document_name: string;
  profile_name?: string | null;
  processing_status: ProcessingStatus;
  ai_tier_requested?: AiTier | string | null;
  ai_tier_used?: AiTierUsed | string | null;
  ai_model_used?: string | null;
  ai_fallback_notice?: string | null;
  created_at?: string | null;
}

export interface PublishValidationToTrackerPayload {
  validation_log_id: string;
  target_request_id?: string;
  title?: string;
  amount?: number;
  procurement_method?: string;
  vendor_name?: string;
  department_id?: string;
  department_name?: string;
  fpp_id?: string;
  fpp_name?: string;
  pic_id?: string;
  pic_name?: string;
  stages?: ExtractedStage[];
  notes?: string;
}

export interface CreateValidationProfilePayload {
  name: string;
  code?: string;
  document_kind: string;
  description?: string;
  scope?: string;
  department_id?: string;
  department_name?: string;
  passing_score_threshold: number;
  warning_score_threshold?: number;
  strict_mandatory_enforcement: boolean;
  target_stage_to_clear?: string;
  custom_system_prompt?: string;
  checklist_rules: ChecklistRuleItem[];
  is_default?: boolean;
}

export type UpdateValidationProfilePayload = Partial<CreateValidationProfilePayload> & {
  is_active?: boolean;
};

export interface UpdateValidationDecisionPayload {
  compliance_status: string;
  overall_score?: number;
  reviewer_notes?: string;
  next_action?: string;
}

export interface ValidationLogListItem {
  id: string;
  request_id?: string | null;
  document_id?: string | null;
  profile_id?: string | null;
  profile_name?: string | null;
  document_name: string;
  document_file_url?: string | null;
  overall_score: number;
  passing_score_threshold?: number;
  compliance_status: ComplianceStatus;
  checklist_count: number;
  passed_count: number;
  validated_by_name?: string | null;
  created_at: string;
  processing_status?: ProcessingStatus;
  ai_tier_requested?: AiTier | string | null;
  ai_tier_used?: AiTierUsed | string | null;
  ai_model_used?: string | null;
  ai_fallback_notice?: string | null;
  error_message?: string | null;
}

export type StageGroup = "Persiapan" | "Sourcing" | "Evaluasi" | "Contracting" | "Selesai";

export interface WorkflowStage {
  id: string;
  procurement_method: string;
  step_name: string;
  stage_group: StageGroup | string;
  order_index: number;
  default_sla_days?: number | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowStagePayload {
  procurement_method: string;
  step_name: string;
  stage_group: string;
  order_index?: number;
  default_sla_days?: number;
  description?: string;
}

export type UpdateWorkflowStagePayload = Partial<CreateWorkflowStagePayload> & {
  is_active?: boolean;
};

export interface ReorderWorkflowStagesPayload {
  procurement_method: string;
  ordered_stage_ids: string[];
}
