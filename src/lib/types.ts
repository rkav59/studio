

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
  observations: AuditObservationEntry[]; // Changed from single observation to array
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


export interface TrainingRecord {
  id: string;
  employeeId: string;
  courseName: string;
  trainingDate: string;
  expiryDate?: string;
  trainer: string;
  competencyAchieved: boolean;
}

export interface EmergencyPlan {
  id: string;
  planType: 'Evacuation' | 'Fire Response' | 'Medical Emergency' | 'Spill Response';
  location: string;
  description: string;
  lastReviewedDate: string;
  nextReviewDate: string;
}

export interface MockDrill {
  id: string;
  emergencyPlanId: string;
  drillDate: string;
  scenario: string;
  participants: string[]; 
  observations: string;
  lessonsLearned: string;
}

export interface IncidentInvestigation {
  id: string;
  incidentId: string; 
  investigationDate: string;
  investigators: string[]; 
  rootCauses: string; 
  correctiveActions: CorrectiveAction[];
  status: 'Open' | 'Pending Review' | 'Closed';
}

export interface CorrectiveAction {
  id: string;
  description: string;
  responsiblePerson: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
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
    
