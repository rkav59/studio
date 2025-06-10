
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

// New Types for additional modules

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
  identifiedHazards: string; // Changed from string[] for simpler text area input
  assessedRisks: string;     // Changed from string[]
  controlMeasures: string;   // Changed from string[]
  residualRiskLevel: 'Low' | 'Medium' | 'High';
  methodUsed?: RiskAssessmentMethod;
  assessmentDate: string;
  assessor: string;
}

export interface SheqAudit {
  id: string;
  auditType: 'Safety' | 'Health' | 'Environment' | 'Quality' | 'Integrated';
  scope: string;
  auditDate: string;
  auditor: string;
  findings: string; // Changed from string[] for simpler text area input
  recommendations: string; // Changed from string[]
  status: 'Planned' | 'In Progress' | 'Completed' | 'Closed';
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
  incidentId: string; // Link to original incident
  investigationDate: string;
  investigators: string[];
  rootCauses: string; // Changed from string[]
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
  complianceRate: number; // Percentage
  nonCompliances: string; // Changed from string[]
}

export interface Contractor {
  id: string;
  companyName: string;
  contactPerson: string;
  vettingStatus: 'Pending' | 'Approved' | 'Rejected';
  inductionCompleted: boolean;
  activePermits: string[]; // List of permit IDs
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
  screeningType: string; // e.g., "Annual Checkup", "Pre-employment"
  resultsSummary: string;
  fitToWork: boolean;
}

export interface HealthMonitoringRecord {
  id: string;
  employeeId: string;
  monitoringDate: string;
  parameter: string; // e.g., "Noise Exposure", "Dust Levels"
  value: string;
  notes?: string;
}
