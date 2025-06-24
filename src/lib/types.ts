

export interface Incident {
  id: string;
  userId?: string; // Added for data ownership
  type: 'Incident' | 'Near Miss' | 'Hazard';
  description: string;
  location: string;
  timestamp: string; // Using string for easier form handling, can be Date object
  region: string;

  // New fields for KPIs
  isRecordable?: boolean;         // For TRIR
  lostWorkDays?: number;          // For Severity Rate & Man Hours Lost (Injury)
  classification?: 'First Aid' | 'Recordable' | 'Lost Time' | 'Fatality MVA' | 'Non-Fatality MVA' | 'Property Damage MVA' | 'Environmental' | 'Security' | 'Other'; // Added more classifications
  isFatality?: boolean;           // For Man Hours Lost (Fatality) - can be derived from classification or explicit
  reportedBy?: string; // Added field
  severityLevel?: Severity; // Added for qualitative severity, if needed alongside lostWorkDays
  rootCauseAnalyzed?: boolean; // Added
  status?: 'Open' | 'Under Investigation' | 'Actions Pending' | 'Closed'; // Added status
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

// --- Risk Management Module Types ---

export type Likelihood = 'Very Unlikely' | 'Unlikely' | 'Possible' | 'Likely' | 'Very Likely';
export type Severity = 'Insignificant' | 'Minor' | 'Moderate' | 'Serious' | 'Catastrophic';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Extreme';
export type RiskRegisterStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Closed' | 'Accepted';

export interface ManualHazard {
  id: string;
  userId?: string;
  activityDescription: string;
  hazardDescription: string;
  dateIdentified: string; // ISO Date string
  identifiedBy: string;
  location?: string;
  potentialConsequences?: string;
}

export interface RiskAssessmentControl {
  id: string; // Unique ID for the control instance
  description: string;
  responsiblePerson?: string;
  dueDate?: string; // ISO Date string
  status?: 'Open' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
}

export interface ManualRiskAssessment {
  id: string;
  userId?: string;
  activityOrProcess: string;
  assessmentDate: string; // ISO Date string
  assessedBy: string;
  teamMembers?: string; // Comma-separated or array
  scope: string;
  linkedHazardIds?: string[]; // Optional: Array of ManualHazard IDs
  potentialHazardsIdentified: string; // Text area for listing hazards if not linking
  
  existingControls: string; // Text area for listing existing controls

  initialLikelihood: Likelihood;
  initialSeverity: Severity;
  initialRiskLevel: RiskLevel;

  additionalControls: RiskAssessmentControl[];
  
  residualLikelihood: Likelihood;
  residualSeverity: Severity;
  residualRiskLevel: RiskLevel;
  
  reviewDate?: string; // ISO Date string
  status: 'Open' | 'Under Review' | 'Closed' | 'Superseded';
  overallComments?: string;
}

export interface RiskRegisterEntry {
  id: string;
  userId?: string;
  riskTitle: string;
  riskDescription: string;
  dateIdentified: string; // ISO
  identifiedBy: string;
  category?: string; // e.g., Operational, Financial, Safety, Environmental, Reputation
  source?: string; // e.g., Audit, Inspection, Hazard Report, Assessment-[ID], Management Review
  
  initialLikelihood: Likelihood;
  initialSeverity: Severity;
  initialRiskLevel: RiskLevel;
  
  treatmentPlan: string; // Description of actions to mitigate the risk
  riskOwner: string; // Person or department responsible for managing the risk
  treatmentDueDate?: string; // ISO
  status: RiskRegisterStatus;
  
  residualLikelihood?: Likelihood;
  residualSeverity?: Severity;
  residualRiskLevel?: RiskLevel;
  
  lastReviewedDate?: string; // ISO
  nextReviewDate?: string; // ISO
  linkedSheqAuditId?: string; // ID of the linked SHEQ Audit
  linkedSheqAuditName?: string; // Descriptive name of the linked SHEQ Audit
  notes?: string;
}


// Old Risk Assessment Types - Retained as they are not explicitly marked for removal yet
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
// End Old Risk Assessment Types

export type RiskAssessmentMethod =
  | "Job Safety Analysis (JSA)"
  | "Hazard Identification (HAZID)"
  | "Hazard and Operability Study (HAZOP)"
  | "Failure Mode and Effects Analysis (FMEA)"
  | "Fault Tree Analysis (FTA)"
  | "Bowtie Analysis"
  | "What-If Analysis"
  | "Preliminary Hazard Analysis (PHA)";

// This RiskAssessment type seems to be for a more structured, older system.
// The new ManualRiskAssessment is for user-driven manual entries.
// Kept for now if it's used elsewhere or if the AI suggestion tool is based on it.
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
// --- End Risk Management Module Types ---


// SHEQ Audit Types
export interface AuditObservationEntry {
  id: string;
  text: string;
}

export interface AuditChecklistItem {
  id: string; // Unique ID for the instance of this item in an audit
  templateItemId?: string; // ID of the original template item
  text: string;
  status: 'Compliant' | 'Non-Compliant' | 'Not Applicable' | 'Pending';
  auditCriteriaReference?: string;
  evidenceGatheringPrompt?: string;
  evidenceNotes?: string;
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
  auditCriteriaReference?: string;
  evidenceGatheringPrompt?: string;
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
  userId?: string; // Ensure userId is part of the type
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
  isArchived?: boolean;
}


// Training & Competence Types
export interface TrainingCourse {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  category?: string;
}

export type TrainingRecordStatus = 'Planned' | 'Completed' | 'Requires Renewal' | 'Expired';

export interface TrainingRecord {
  id: string;
  userId?: string;
  employeeName: string;
  courseId: string; // Links to TrainingCourse.id
  trainingDate: string; // ISO date string
  expiryDate?: string | null; // ISO date string, optional
  trainer?: string;
  status: TrainingRecordStatus; // User sets 'Planned' | 'Completed'; 'Expired'/'Requires Renewal' derived
  certificateUrl?: string; // Optional link to a certificate
  notes?: string;
}


// --- Emergency Preparedness Module Types ---
export interface EmergencyPlan {
  id: string;
  userId?: string;
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

export type EmergencyResourceType = 'First Aid Kit' | 'Fire Extinguisher' | 'Spill Kit' | 'AED' | 'Evacuation Chair' | 'Emergency Lighting' | 'Alarm System' | 'Communication Device' | 'Other';
export type EmergencyResourceStatus = 'Operational' | 'Requires Maintenance' | 'Requires Refill' | 'Out of Service' | 'Expired';

export interface EmergencyResource {
  id: string;
  userId?: string;
  name: string;
  type: EmergencyResourceType;
  location: string;
  quantity: number;
  status: EmergencyResourceStatus;
  lastCheckedDate?: string; // ISO Date string
  nextCheckDate?: string; // ISO Date string
  notes?: string;
}

export type DrillActionStatus = 'Open' | 'In Progress' | 'Completed' | 'Deferred';
export interface DrillActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate?: string; // ISO Date string
  status: DrillActionStatus;
}

export interface MockDrill {
  id: string;
  userId?: string;
  drillName: string;
  drillType: 'Evacuation' | 'Fire' | 'Medical' | 'Spill' | 'Security' | 'Tabletop' | 'Other';
  linkedPlanId?: string; // ID of an EmergencyPlan
  scheduledDate: string; // ISO Date string
  actualDate?: string; // ISO Date string
  scenario: string;
  participants?: string; // e.g., "All staff, Warehouse B", "ERT Members"
  observations?: string;
  lessonsLearned?: string;
  actionItems: DrillActionItem[];
  status: 'Planned' | 'Completed' | 'Cancelled';
}
// --- End Emergency Preparedness Module Types ---


// Incident Investigation Types (Retained as not explicitly marked for removal)
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
  fiveWhysDetails?: FiveWhyDetail[];
  fishboneCategories?: FishboneCategory[];
  scatDetails?: ScatDetails;
  genericRcaDetails?: GenericRcaDetails;
  correctiveActions: CorrectiveAction[];
  status: 'Open' | 'In Progress' | 'Review' | 'Closed';
  summaryOfFindings: string; // Added from user content
  evidenceSummary?: string; // Added from user content
  witnessStatementsSummary?: string; // Added from user content
}

export interface SuggestRootCauseInput {
  incidentDescription: string;
  summaryOfFindings: string;
}

export interface SuggestRootCauseOutput {
  suggestedRootCauses: string;
}


// --- Contractor Safety & Job Card Types ---
export type ContractorVettingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Requires Review';
export type PtwStatus = 'Requested' | 'Approved' | 'Active' | 'Closed' | 'Cancelled' | 'Expired';
export type JobCardStatus = 'Draft' | 'Issued' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ContractorDocument {
  id: string; // UUID for the document entry
  name: string; // User-defined name for the document
  documentType: 'Insurance' | 'Certification' | 'Method Statement' | 'Risk Assessment' | 'Other';
  fileUrl?: string;      // Actual download URL from Firebase Storage
  filePath?: string;     // Path in Firebase Storage (e.g., contractor_documents/userId/contractorId/docId/fileName.pdf)
  fileName?: string;     // Original name of the uploaded file
  fileType?: string;     // MIME type of the file
  fileSize?: number;     // Size in bytes
  expiryDate?: string;   // ISO date string
  uploadedDate: string; // ISO date string (represents when the record was created or file (re-)uploaded)
}


export interface Contractor {
  id: string;
  userId?: string;
  companyName: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  tradeOrService: string;
  vettingStatus: ContractorVettingStatus;
  vettingNotes?: string;
  inductionCompleted: boolean;
  inductionDate?: string;
  documents: ContractorDocument[];
  performanceNotes?: string;
}

export interface PermitToWork {
  id: string;
  userId?: string;
  ptwNumber: string;
  contractorId: string;
  workDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  status: PtwStatus;
  scopeOfWork: string;
  precautions: string;
  authorizedBy?: string;
  authorizationDate?: string;
  closedBy?: string;
  closureDate?: string;
  supervisorOnSite?: string;
}

export interface JobCardCheck {
  id: string;
  text: string;
  isChecked: boolean;
}

export interface JobCard {
  id: string;
  userId?: string;
  jobCardNumber: string;
  contractorId: string;
  workDate: string; // ISO
  jobDescription: string;
  location: string;
  status: JobCardStatus;
  safetyChecks: JobCardCheck[];
  requiredPpe: string; 
  supervisorSignOffName?: string;
  clientSignOffName?: string;
  notes?: string;
}

// --- PTW Supervision Types ---
export type SupervisionChecklistItemResult = 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory' | 'N/A';

export interface SupervisionChecklistItemInstance {
  id: string;
  questionText: string;
  result: SupervisionChecklistItemResult;
  observations?: string;
}

export type PtwPerformanceRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface PtwSupervisionRecord {
  id: string;
  userId?: string;
  ptwId: string; // Link to the PermitToWork
  ptwNumber: string; // For display convenience
  supervisionDate: string; // ISO Date string
  supervisorName: string;
  checklistItems: SupervisionChecklistItemInstance[];
  overallPerformanceRating: PtwPerformanceRating;
  summaryNotes?: string;
  actionItemsRequired?: string; // Textual description of follow-up actions
}
// --- End PTW Supervision Types ---


// PPE Management Types
export type PpeItemStatus = 'Available' | 'Under Inspection' | 'Awaiting Repair' | 'Awaiting Replacement' | 'Discarded';

export interface PpeItem {
  id: string;
  userId?: string;
  name: string;
  type: string;
  category: string;
  specifications?: string;
  currentStock: number;
  reorderLevel: number;
  supplier?: string;
  lastStocktakeDate?: string; // ISO date string
  status?: PpeItemStatus;
  inspectionIntervalDays?: number; // e.g., 30, 90, 180
}

export interface PpeIssuanceRecord {
  id: string;
  userId?: string;
  ppeItemId: string;
  employeeName: string;
  jobRole?: string;
  issuedDate: string; // ISO string
  quantityIssued: number;
  notes?: string;
  expectedReturnDate?: string | null; // ISO string
  actualReturnDate?: string | null; // ISO string
  returnNotes?: string;
}

// --- PPE Inspection Specific Types ---
export type PpeInspectionOverallStatus = 'Pass' | 'Requires Repair' | 'To be Replaced' | 'Action Pending';

export type PpeInspectionChecklistItemResult = 'Pass' | 'Fail' | 'N/A' | 'Pending';
export interface PpeInspectionChecklistItemInstance {
  id: string; // Unique ID for this instance of the check item in this specific inspection
  templateItemId?: string; // Optional: ID of the original template item, for traceability
  text: string; // Text of the check item (could be from a template or custom)
  result: PpeInspectionChecklistItemResult;
  remarks?: string;
}

export interface PpeInspectionRecord {
  id: string;
  userId?: string;
  ppeItemId: string; // ID of the PpeItem being inspected
  uniquePpeIdentifier?: string; // Optional: For serialized/uniquely tracked PPE items
  inspectionDate: string; // ISO Date string
  inspectorName: string;
  overallStatus: PpeInspectionOverallStatus;
  checklistItems: PpeInspectionChecklistItemInstance[];
  notes?: string;
  followUpAction?: string;
  nextInspectionDate?: string; // ISO Date string (optional)
}

// --- End PPE Inspection Specific Types ---

// --- PPE Job Role Matrix Specific Types ---
export interface PpeJobRoleMatrixEntry {
  id: string;
  userId?: string;
  jobRole: string;
  requiredPpeItemIds: string[]; // Array of PpeItem IDs
  linkedRiskAssessmentId?: string;
  linkedRiskAssessmentName?: string;
}
// --- End PPE Job Role Matrix Specific Types ---


export interface PpeComplianceAuditChecklistItem {
  id: string;
  question: string;
  isCompliant: boolean;
  observations?: string;
}

export interface PpeComplianceAudit {
  id: string;
  auditDate: string;
  areaAudited: string;
  auditorName: string;
  checklist: PpeComplianceAuditChecklistItem[];
  overallComplianceScore?: number;
  findingsSummary?: string;
  recommendations?: string;
}


// --- Health Monitoring Module Types ---
export interface SimilarExposureGroup {
  id: string;
  userId?: string;
  name: string; // e.g., "Welders - Workshop A", "Office Admin Staff - Building C"
  description?: string; // Brief description of the group
  riskProfileNotes?: string; // Notes on typical exposures or health risks
}

export type IndustrialHygieneSampleAgent = 'Noise' | 'Dust (Respirable)' | 'Dust (Inhalable)' | 'Silica' | 'Asbestos' | 'VOCs' | 'Lead' | 'Welding Fumes' | 'Specific Chemical' | 'Ergonomic Strain' | 'Other';

export interface IndustrialHygieneSample {
  id: string;
  userId?: string;
  segId?: string; // Optional link to SimilarExposureGroup
  employeeName?: string; // If personal sample not linked to SEG
  sampleDate: string; // ISO Date string
  agent: IndustrialHygieneSampleAgent;
  specificAgentName?: string; // If agent is 'Specific Chemical' or 'Other'
  exposureLevel: number;
  units: string; // e.g., "dBA", "mg/m³", "ppm", "fibers/cc"
  oel?: number; // Occupational Exposure Limit
  oelUnits?: string; // Units for the OEL, should match 'units' if possible
  sampleType: 'Personal' | 'Area' | 'Source';
  durationHours?: number;
  twa?: number; // Time-Weighted Average (if applicable)
  stel?: number; // Short-Term Exposure Limit (if applicable)
  location: string;
  notes?: string;
}

export type MedicalTestRecordType = 'Audiometry' | 'Spirometry (Lung Function)' | 'Vision Test' | 'Blood Test' | 'Urine Test' | 'Biological Monitoring' | 'X-Ray' | 'Musculoskeletal Assessment' | 'Fitness to Work Assessment' | 'Other';
export type MedicalScreeningPurpose = 'Pre-employment' | 'Periodic' | 'Exit' | 'Post-Incident' | 'Exposure-Specific' | 'Return-to-Work' | 'Other';


export interface MedicalTestRecord {
  id: string;
  userId?: string;
  employeeName: string;
  employeeId?: string; // Optional employee ID
  testType: MedicalTestRecordType;
  specificTestName?: string; // If testType is 'Other' or more detail needed
  testDate: string; // ISO Date string
  screeningPurpose?: MedicalScreeningPurpose;
  linkedExposure?: string; // e.g. "Noise exposure in Workshop A"
  resultSummary: string;
  referenceRange?: string; // E.g., "0.5 - 2.0 mg/L", "Negative"
  isFitForWork?: boolean;
  certificateExpiryDate?: string | null; // ISO Date string, allow null for "no expiry"
  followUpRequired?: boolean;
  notes?: string;
  segId?: string; // Optional link to SEG for group analysis
}

export type WellnessProgramStatus = 'Planned' | 'Active' | 'Completed' | 'On Hold';

export interface WellnessProgram {
  id: string;
  userId?: string;
  programName: string;
  description?: string;
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string, optional
  status: WellnessProgramStatus;
  targetAudience?: string; // e.g., "All Employees", "Specific SEG", "Department X"
  targetParticipants?: number;
  actualParticipants?: number;
  participationNotes?: string; // General notes on participation, or could be separate records
}
// --- End Health Monitoring Module Types ---


// Old MedicalScreeningRecord type - now superseded by enhanced MedicalTestRecord
// export interface MedicalScreeningRecord {
//   id: string;
//   employeeId: string;
//   screeningDate: string;
//   screeningType: string;
//   resultsSummary: string;
//   fitToWork: boolean;
// }

export interface HealthMonitoringRecord {
  id: string;
  employeeId: string; // This should be employeeName to match MedicalTestRecord
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
  identifiedThemes: string;
  capaEffectivenessObservations: string;
  suggestedFocusAreas: string;
  positiveObservations?: string;
}

// Derived status type for medical test records with certificate expiry
export type MedicalTestWithCertStatus = MedicalTestRecord & {
  certificateStatus?: 'Valid' | 'Expiring Soon' | 'Expired' | 'N/A';
};
// Helper type for pre-filling MedicalTestForm
export type MedicalTestPrefillData = Partial<Pick<MedicalTestRecord, 'employeeName' | 'segId' | 'linkedExposure' | 'testType'>>;


// --- SHE Meetings & Programs Module Types ---
export type MeetingActionItemStatus = 'Open' | 'In Progress' | 'Completed' | 'Deferred';

export interface MeetingActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate?: string; // ISO Date string
  status: MeetingActionItemStatus;
}

export type SheMeetingType = 'Safety Committee' | 'Management Review' | 'Toolbox Talk' | 'Program Kick-off' | 'Program Review' | 'Other';

export interface SheMeeting {
  id: string;
  userId?: string;
  title: string;
  meetingDate: string; // ISO Date string
  meetingType: SheMeetingType;
  locationOrPlatform: string;
  attendees: string; // Text area for names/groups
  agenda?: string; // Text area
  minutes?: string; // Text area
  actionItems: MeetingActionItem[];
  linkedProgramId?: string; // Optional link to a SheProgram
  linkedProgramName?: string; // For display
}

export type SheProgramType = 'Safety Campaign' | 'Health Initiative' | 'Environmental Drive' | 'Training Program' | 'Awareness Program' | 'Other';
export type SheProgramStatus = 'Planned' | 'Ongoing' | 'Completed' | 'On Hold' | 'Cancelled';

export interface SheProgram {
  id: string;
  userId?: string;
  programName: string;
  objective: string;
  programType: SheProgramType;
  targetAudience?: string;
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string, optional
  status: SheProgramStatus;
  keyActivities?: string; // Text area
  kpis?: string; // Key Performance Indicators, text area
  budget?: string; // Optional
  leadPerson?: string;
}
// --- End SHE Meetings & Programs Module Types ---

// --- KPI Suggestion Type ---
export interface KpiSuggestion {
  id: string;
  userId: string;
  suggestionText: string;
  timestamp: any; // Firestore Timestamp
  status: 'New' | 'Reviewed' | 'Implemented' | 'Rejected';
}
// --- End KPI Suggestion Type ---

// --- KPI Threshold Type ---
export interface KpiThreshold {
  id: string; // Composite key: `${userId}_${kpiKey}`
  userId: string;
  kpiKey: string; // e.g., "TRIR", "NMFR"
  value: number;
  targetDirection: 'above' | 'below'; // 'above' means higher is better, 'below' means lower is better
  lastUpdated: string; // ISO string for timestamp
}
// --- End KPI Threshold Type ---

// --- KPI Visibility Settings Type ---
export interface KpiVisibilitySettings {
  id: string; // Document ID will be userId
  userId: string;
  visibility: Record<string, boolean>; // e.g., { "TRIR": true, "NMFR": false }
  lastUpdated: string; // ISO string for timestamp
}
// --- End KPI Visibility Settings Type ---


// --- KPI AI Recommendation Types ---
export interface KpiRecommendationInput {
  kpiKey: string;
  kpiTitle: string;
  currentValue: number | string;
  thresholdValue: number;
  targetDirection: 'above' | 'below';
  kpiDefinition: string;
  kpiRelevance: string;
}

export interface KpiRecommendationOutput {
  suggestedActions: string[]; // Array of actionable recommendations
  reasoning: string; // Overall reasoning for the suggestions
  // Example of more structured output if needed later:
  // recommendations: Array<{ action: string; rationale: string; category?: string; difficulty?: 'Low' | 'Medium' | 'High' }>;
}
// --- End KPI AI Recommendation Types ---


// --- User Profile Type ---
export interface UserProfile {
    id: string; // Firebase User UID
    email: string;
    displayName?: string;
    country: string;
    createdAt: string; // ISO string
    planId: 'free' | 'trial' | 'pro' | 'premium';
    trialStartDate?: string; // ISO string
    trialEndDate?: string; // ISO string

    // Stripe fields
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: string; // ISO string
}
// --- End User Profile Type ---

// --- Legal Register Types ---
export interface LegalRegisterItem {
    title: string;
    type: 'Act' | 'Regulation' | 'Policy' | 'Framework' | 'Guideline' | 'Code of Practice' | 'Other';
    summary: string;
    relevanceToSheq: string;
    issuingBody?: string;
    jurisdiction?: string; // e.g., National, State/Provincial, Local
    keywords?: string[];
}

export interface GenerateLegalRegisterInput {
    country: string;
    industry?: string; // Optional for more specific results
}

export interface GenerateLegalRegisterOutput {
    legalItems: LegalRegisterItem[];
    disclaimer: string;
}
// --- End Legal Register Types ---

// --- Billing & Payments Types ---
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
}

export interface PaymentHistory {
    id: string;
    date: string; // ISO string
    amount: number;
    status: 'Paid' | 'Failed' | 'Pending';
    invoiceUrl?: string;
}
// --- End Billing & Payments Types ---



// --- Global App Types (Can be used across modules) ---
// (Consider moving types here if they are shared by more than 2-3 modules)
// e.g., export type ActionItemStatus = 'Open' | 'In Progress' | 'Completed' | 'Deferred';
// export interface UserProfile { ... }

// --- End Global App Types ---
