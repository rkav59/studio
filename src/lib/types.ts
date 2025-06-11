
export interface Incident {
  id: string;
  type: 'Incident' | 'Near Miss' | 'Hazard';
  description: string;
  location: string;
  timestamp: string; // Using string for easier form handling, can be Date object
  region: string;
}

export interface InspectionChecklistItem {
  id:string;
  text: string;
  completed: boolean;
}

export interface Inspection {
  id: string;
  name: string;
  scheduledDate: string; // Using string for easier form handling
  status: 'Pending' | 'In Progress' | 'Completed';
  checklist: InspectionChecklistItem[];
  findings?: string;
  location: string; // Added location for consistency
}

// Risk Assessment Types
export interface RiskControlItem {
  id?: string;
  value?: string;
}

export interface RiskEntry {
  id?: string;
  risk: RiskControlItem;
  existingControls: RiskControlItem[];
  proposedControls: RiskControlItem[];
}

export interface HazardEntry {
  id?: string;
  hazard: RiskControlItem;
  assessedRisks: RiskEntry[];
  residualRiskLevel?: 'Low' | 'Medium' | 'High';
}

export type RiskAssessmentMethod =
  | "Job Safety Analysis (JSA)"
  | "Hazard Identification (HAZID)"
  | "Hazard and Operability Study (HAZOP)"
  | "Failure Mode and Effects Analysis (FMEA)"
  | "Fault Tree Analysis (FTA)"
  | "Bowtie Analysis"
  | "What-If Analysis"
  | "Preliminary Hazard Analysis (PHA)";

export interface RiskAssessment {
  id: string;
  activity: string;
  hazardEntries: HazardEntry[];
  methodUsed?: RiskAssessmentMethod;
  assessmentDate: string;
  assessor: string;
}

export interface RiskAssessmentSuggestionOutput {
  potentialRisks: string;
  recommendedControls: {
    elimination?: string[];
    substitution?: string[];
    engineering?: string[];
    administrative?: string[];
    ppe?: string[];
  };
  suggestedMethod: string;
}

// SHEQ Audit Types
export interface AuditObservationEntry {
  id: string;
  text: string;
}

export interface AuditChecklistItem {
  id: string; // Unique ID for the instance of this item in an audit
  text: string;
  status: 'Compliant' | 'Non-Compliant' | 'Not Applicable' | 'Pending';
  evidenceOrRemarks?: string;
  responsiblePerson?: string;
  observations: AuditObservationEntry[];
  comments?: string;
}

export interface NonConformance {
  id: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Critical';
  relatedChecklistItemId?: string; // Optional link to a checklist item
  relatedIncidentId?: string; // Optional link to an incident
  correctiveActionsProposed?: string;
  preventiveActionsProposed?: string;
  actionAssignedTo?: string;
  actionDueDate?: string; // ISO Date string
  actionStatus?: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  actionCompletionDate?: string; // ISO Date string
  actionVerificationNotes?: string;
}

export interface ChecklistItemTemplate {
  id: string; // Unique ID for the template item
  text: string;
  observationPrompt?: string;
  defaultResponsiblePerson?: string;
  defaultComments?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  items: ChecklistItemTemplate[];
  isSystemDefault?: boolean; // To distinguish from user-created templates
}


export interface SheqAudit {
  id: string;
  auditName: string;
  auditType: 'Safety' | 'Health' | 'Environment' | 'Quality' | 'Integrated';
  scope: string;
  auditDate: string; // Scheduled/Actual date of audit - ISO string
  auditor: string;
  status: 'Planned' | 'In Progress' | 'Awaiting Review' | 'Completed' | 'Closed';
  checklist: AuditChecklistItem[];
  nonConformances: NonConformance[];
  overallFindings?: string;
  recommendations?: string;
  templateIdUsed?: string; // Optional: to know which template was the origin
}


// Training & Competence Types
export interface TrainingCourse {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export type TrainingRecordStatus = 'Planned' | 'Completed' | 'Requires Renewal' | 'Expired';

export interface TrainingRecord {
  id: string;
  employeeName: string;
  courseId: string; // Links to TrainingCourse.id
  trainingDate: string; // ISO date string
  expiryDate?: string | null; // ISO date string, optional
  trainer?: string;
  status: TrainingRecordStatus; // User sets 'Planned' or 'Completed'; 'Expired'/'Requires Renewal' derived
  certificateUrl?: string; // Optional link to a certificate
  notes?: string;
}


export interface EmergencyPlan {
  id: string;
  planName: string;
  planType: 'Evacuation' | 'Fire Response' | 'Medical Emergency' | 'Spill Response' | 'Other';
  scope: string;
  description?: string;
  keyPersonnelAndRoles?: string;
  emergencyProcedures?: string;
  evacuationRoutesDescription?: string;
  emergencyContacts?: string;
  equipmentNeeded?: string;
  lastReviewedDate?: string; // ISO Date string
  nextReviewDate?: string; // ISO Date string
}

// Incident Investigation Types
export type InvestigationTechnique = 'FiveWhys' | 'FishboneIshikawa' | 'SCAT' | 'GenericRCA';

export const investigationTechniques: { name: InvestigationTechnique; label: string }[] = [
  { name: 'FiveWhys', label: '5 Whys' },
  { name: 'FishboneIshikawa', label: 'Fishbone (Ishikawa) Diagram' },
  { name: 'SCAT', label: 'Systematic Cause Analysis Technique (SCAT)' },
  { name: 'GenericRCA', label: 'Generic Root Cause Analysis' },
];

export interface FiveWhyDetail {
  id: string;
  why: string;
  because: string;
}

export interface FishboneCause {
  id: string;
  causeText: string;
}
export interface FishboneCategory {
  id: string;
  categoryName: string; // e.g., People, Process, Equipment, Environment, Management, Materials
  causes: FishboneCause[];
}

export interface ScatDetails {
  summaryOfEvents?: string;
  immediateCauses?: string; // What directly caused the incident
  underlyingFactors?: string; // Conditions that allowed immediate causes to exist
  systemDeficiencies?: string; // Failures in management systems, procedures, training
}

export interface GenericRcaDetails {
  problemStatement?: string;
  contributingFactors?: string; // Multi-line
  rootCauseSummary?: string; // The fundamental reason(s)
}

export interface CorrectiveAction {
  id: string;
  description: string;
  responsiblePerson: string;
  dueDate: string; // ISO string
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  completionDate?: string; // ISO string
  verificationNotes?: string;
}

export interface IncidentInvestigation {
  id: string;
  incidentId: string; // Link to an Incident (for now, manually entered ID)
  investigationTitle: string; // User-defined title for the investigation
  investigationDate: string; // ISO string
  investigators: string; // Comma-separated list of names or a team name
  techniqueUsed?: InvestigationTechnique;

  // Technique-specific details
  fiveWhysDetails?: FiveWhyDetail[];
  fishboneCategories?: FishboneCategory[];
  scatDetails?: ScatDetails;
  genericRcaDetails?: GenericRcaDetails;

  summaryOfFindings: string; // Overall summary regardless of technique
  evidenceSummary?: string; // New field for textual summary of evidence
  witnessStatementsSummary?: string; // New field for textual summary of witness statements

  correctiveActions: CorrectiveAction[];
  status: 'Open' | 'In Progress' | 'Review' | 'Closed';
}

// Input/Output for AI Root Cause Suggestion Flow
export interface SuggestRootCauseInput {
  incidentDescription: string; // Or perhaps investigation title if description is not directly available
  summaryOfFindings: string;
}

export interface SuggestRootCauseOutput {
  suggestedRootCauses: string; // A string, potentially multi-line, of suggested root causes
}


// Contractor Safety Types
export type ContractorVettingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Requires Review';
export type PtwStatus = 'Requested' | 'Approved' | 'Active' | 'Closed' | 'Cancelled' | 'Expired';

export interface ContractorDocument {
  id: string;
  name: string; // e.g., "Public Liability Insurance", "Safety Certification XYZ"
  documentType: 'Insurance' | 'Certification' | 'Method Statement' | 'Risk Assessment' | 'Other';
  fileUrlPlaceholder?: string; // Placeholder for file name or mock URL
  expiryDate?: string; // ISO Date string
  uploadedDate: string; // ISO Date string
}

export interface Contractor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  tradeOrService: string;
  vettingStatus: ContractorVettingStatus;
  vettingNotes?: string;
  inductionCompleted: boolean;
  inductionDate?: string; // ISO Date string
  documents: ContractorDocument[];
  performanceNotes?: string;
}

export interface PermitToWork {
  id: string;
  ptwNumber: string; // Auto-generated or manually entered
  contractorId: string; // Links to Contractor.id
  workDescription: string;
  location: string;
  startDate: string; // ISO DateTime string
  endDate: string; // ISO DateTime string
  status: PtwStatus;
  scopeOfWork: string;
  precautions: string; // Precautions to be taken
  authorizedBy?: string;
  authorizationDate?: string; // ISO DateTime string
  closedBy?: string;
  closureDate?: string; // ISO DateTime string
  supervisorOnSite?: string;
}


// PPE Management Types
export interface PpeItem {
  id: string;
  name: string; // e.g., "Safety Helmet Class A"
  type: string; // e.g., "Hard Hat", "Safety Glasses", "Respirator"
  category: string; // e.g., "Head Protection", "Eye Protection", "Respiratory Protection"
  specifications?: string; // e.g., "EN397, ANSI Z89.1 Type I Class E", "Size L"
  currentStock: number;
  reorderLevel: number;
  supplier?: string;
  lastStocktakeDate?: string; // ISO string
}

export interface PpeIssuanceRecord {
  id: string;
  ppeItemId: string; // Links to PpeItem.id
  employeeName: string;
  jobRole?: string;
  issuedDate: string; // ISO string
  quantityIssued: number;
  expectedReturnDate?: string; // ISO string
  actualReturnDate?: string; // ISO string
  conditionOnReturn?: 'Good' | 'Damaged' | 'Lost';
  notes?: string;
}

export interface PpeInspectionChecklistItem {
  id: string;
  text: string;
  status: 'Pass' | 'Fail' | 'N/A';
  remarks?: string;
}

export interface PpeInspectionRecord {
  id: string;
  ppeItemId: string; // Can link to a specific item from inventory or be a general type
  uniquePpeIdentifier?: string; // Optional: for tracking individual serialized PPE
  inspectionDate: string; // ISO string
  inspectorName: string;
  checklist: PpeInspectionChecklistItem[];
  overallStatus: 'Good' | 'Requires Repair' | 'To be Replaced';
  nextInspectionDate?: string; // ISO string
  notes?: string;
}

export interface PpeComplianceAuditChecklistItem {
  id: string;
  question: string; // e.g., "Is appropriate PPE being worn for the task?"
  isCompliant: boolean;
  observations?: string;
}

export interface PpeComplianceAudit {
  id: string;
  auditDate: string; // ISO string
  areaAudited: string;
  auditorName: string;
  checklist: PpeComplianceAuditChecklistItem[];
  overallComplianceScore?: number; // Optional, e.g., percentage
  findingsSummary?: string;
  recommendations?: string;
}

export interface PpeJobRoleMatrixEntry {
  id: string;
  jobRole: string;
  requiredPpeItemIds: string[]; // Array of PpeItem.id
  riskAssessmentReference?: string; // Optional reference to a RA
}

// Medical Screening & Health Monitoring
export interface MedicalScreeningRecord {
  id: string;
  employeeId: string;
  screeningDate: string;
  screeningType: string;
  resultsSummary: string;
  fitToWork: boolean;
}

export interface HealthMonitoringRecord {
  id: string;
  employeeId: string;
  monitoringDate: string;
  parameter: string;
  value: string;
  notes?: string;
}


// AI Insights for Audit Data
export interface AnalyzeAuditDataInput {
  totalAudits: number;
  completedAuditsCount: number;
  nonConformanceDescriptions: string[];
  failedChecklistItemsText: string[];
  capaStatusSummary: {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  overallFindingsSummary?: string[];
  overallRecommendationsSummary?: string[];
}

export interface AnalyzeAuditDataOutput {
  identifiedThemes: string; // Multi-line
  capaEffectivenessObservations: string;
  suggestedFocusAreas: string; // Multi-line
  positiveObservations?: string;
}
