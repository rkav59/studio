

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
  observationPrompt?: string; // Optional prompt for the initial observation
  defaultResponsiblePerson?: string; // Optional default responsible person
  defaultComments?: string; // Optional default comments
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
  correctiveActions: CorrectiveAction[];
  status: 'Open' | 'In Progress' | 'Review' | 'Closed';
}


export interface PpeLog {
  id: string;
  ppeType: string;
  employeeId: string; 
  issueDate: string;
  returnDate?: string;
  condition: string; 
}

export interface PpeAudit {
  id: string;
  area: string;
  auditDate: string;
  auditor: string;
  complianceRate: number; 
  nonCompliances: string; 
}

export interface Contractor {
  id: string;
  companyName: string;
  contactPerson: string;
  vettingStatus: 'Pending' | 'Approved' | 'Rejected';
  inductionCompleted: boolean;
  activePermits: string[]; 
}

export interface PermitToWork {
  id: string;
  contractorId: string;
  workDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'Requested' | 'Approved' | 'Active' | 'Closed' | 'Cancelled';
}

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
    
