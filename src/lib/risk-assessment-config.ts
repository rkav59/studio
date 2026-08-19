import type { RiskAssessmentMethod, Likelihood, Severity, RiskLevel, RiskRegisterStatus, RiskAssessmentControl, ManualRiskAssessment } from "./types";

export interface DescriptiveRiskAssessmentMethod {
  name: RiskAssessmentMethod;
  description: string;
  useWhen: string;
}

export const riskAssessmentMethodsList: DescriptiveRiskAssessmentMethod[] = [
  {
    name: "Job Safety Analysis (JSA)",
    description: "Breaks down a job into specific steps, identifies hazards associated with each step, and recommends controls to mitigate those hazards.",
    useWhen: "Ideal for routine tasks, especially those with a history of incidents or high potential for harm. Good for task-specific training and developing safe work procedures."
  },
  {
    name: "Hazard Identification (HAZID)",
    description: "A systematic process to identify all potential hazards in a facility, process, or system, often conducted by a multidisciplinary team.",
    useWhen: "Early in project lifecycles, before detailed design, or for existing facilities to ensure all major hazards are known. Forms a basis for more detailed risk assessments."
  },
  {
    name: "Hazard and Operability Study (HAZOP)",
    description: "A structured and systematic examination of a planned or existing process or operation using guidewords (e.g., No, More, Less) applied to process parameters (e.g., Flow, Pressure) to identify deviations that could lead to risks.",
    useWhen: "Complex chemical processes, new designs, or significant modifications to existing plants. Requires detailed process information and a skilled team."
  },
  {
    name: "Failure Mode and Effects Analysis (FMEA)",
    description: "Identifies potential failure modes in a system, product, or process, and analyzes their potential effects. Often involves scoring for severity, occurrence, and detection (Risk Priority Number - RPN).",
    useWhen: "Product design, manufacturing processes, equipment reliability studies. Helps prioritize actions to mitigate high-risk failure modes."
  },
  {
    name: "Fault Tree Analysis (FTA)",
    description: "A top-down, deductive failure analysis where an undesired state of a system (top event) is analyzed using Boolean logic to combine a series of lower-level events that could cause it.",
    useWhen: "To understand the causes of a specific critical failure, especially in complex systems (aerospace, nuclear). Good for quantifying failure probabilities if data is available."
  },
  {
    name: "Bowtie Analysis",
    description: "Visually represents the pathways from threats (causes) to a top event (hazard), and from the top event to consequences. Shows preventative barriers on the left and mitigative/recovery barriers on the right.",
    useWhen: "For analyzing and communicating complex risk scenarios, especially high-consequence events. Helps visualize the role and effectiveness of safety barriers."
  },
  {
    name: "What-If Analysis",
    description: "A brainstorming technique where a team asks 'What if...?' questions to explore potential hazardous scenarios, their consequences, existing safeguards, and recommendations.",
    useWhen: "Simpler processes, modifications, or as a less formal alternative to HAZOP. Effective with experienced teams familiar with the process."
  },
  {
    name: "Preliminary Hazard Analysis (PHA)",
    description: "An early-stage analysis to identify major hazards, their causes, and potential consequences in a new system, product, or process, often based on conceptual information.",
    useWhen: "Early in the project lifecycle (concept or design phase) to identify critical safety issues and inform design decisions before significant resources are committed."
  }
];

export const methodSpecificGuidance: Partial<Record<RiskAssessmentMethod, {
  identifiedHazards?: string;
  assessedRisks?: string;
  controlMeasures?: string;
}>> = {
  "Job Safety Analysis (JSA)": {
    identifiedHazards: "For JSA: Break down the job into discrete steps. For each step, identify potential hazards (e.g., struck by, caught between, slip/trip, exposure).",
    assessedRisks: "For JSA: For each identified hazard within a job step, describe the potential negative outcomes or consequences if that hazard is realized.",
    controlMeasures: "For JSA: For each hazard, list specific actions, procedures, or PPE to eliminate or reduce the risk. Be precise for each step."
  },
  "Hazard Identification (HAZID)": {
    identifiedHazards: "For HAZID: Conduct a broad identification of hazards across the entire process, system, or area. Consider energy sources, hazardous materials, environmental conditions, and human factors.",
    assessedRisks: "For HAZID: Describe potential unwanted scenarios and their consequences that could result from the identified hazards. Think about worst-case possibilities.",
    controlMeasures: "For HAZID: List existing or proposed high-level controls. Detailed controls might be developed in a further assessment."
  },
  "Hazard and Operability Study (HAZOP)": {
    identifiedHazards: "For HAZOP: Systematically review process parameters (e.g., Flow, Temperature, Pressure) using guidewords (No, More, Less, As Well As, Part Of, Reverse, Other Than). Document deviations, causes, and consequences.",
    assessedRisks: "For HAZOP: Focus on how deviations from design intent could lead to undesirable outcomes, including safety, environmental, or operational impacts.",
    controlMeasures: "For HAZOP: Document existing safeguards for each deviation and make recommendations for new or improved safeguards where necessary."
  },
  "Failure Mode and Effects Analysis (FMEA)": {
    identifiedHazards: "For FMEA (as Failure Modes): Identify potential failure modes for each component, system, or process step. What could go wrong?",
    assessedRisks: "For FMEA (as Effects & Severity): Analyze the potential effects of each failure mode. Consider severity (S), likelihood of occurrence (O), and detectability (D) to calculate a Risk Priority Number (RPN = S x O x D).",
    controlMeasures: "For FMEA: Recommend actions to reduce high RPNs, typically by improving design, processes, or detection methods for critical failure modes."
  },
  "Fault Tree Analysis (FTA)": {
    identifiedHazards: "For FTA (as Top Event): Define a specific undesired top event (e.g., system explosion, major spill). This is the primary hazard you are analyzing.",
    assessedRisks: "For FTA: Deductively identify all sequences of lower-level equipment failures or human errors (basic events, intermediate events) that could lead to the top event. Construct a logical tree. Quantify probabilities if data is available.",
    controlMeasures: "For FTA: Identify critical paths and basic events in the fault tree where controls, redundancy, or changes can be implemented to reduce the probability of the top event occurring."
  },
  "Bowtie Analysis": {
    identifiedHazards: "For Bowtie (as the 'Knot'): Identify a specific critical event or hazard that you want to manage (this is the center of the bowtie).",
    assessedRisks: "For Bowtie: On the left side, list all credible threats that could lead to the hazard/knot. On the right side, list all potential consequences if the hazard/knot occurs and controls fail.",
    controlMeasures: "For Bowtie: On the left side, list preventive controls (barriers) for each threat. On the right side, list mitigative/recovery controls for each consequence."
  },
  "What-If Analysis": {
    identifiedHazards: "For What-If: Brainstorm a series of 'What if...?' questions related to potential equipment failures, human errors, procedural deviations, or external events.",
    assessedRisks: "For What-If: For each 'What if' question, determine the potential consequences and estimate the likelihood. Consider if existing safeguards are adequate.",
    controlMeasures: "For What-If: Document existing safeguards and, if consequences are significant and safeguards inadequate, recommend additional control measures."
  },
  "Preliminary Hazard Analysis (PHA)": {
    identifiedHazards: "For PHA: Conduct an early-stage identification of potential hazards in a new system, product, or process, often based on system design or conceptual information.",
    assessedRisks: "For PHA: Provide an initial, often qualitative, assessment of the severity and likelihood of the identified hazards to prioritize further analysis or design changes.",
    controlMeasures: "For PHA: Suggest broad control measures, design criteria, or operational considerations to mitigate the identified hazards. These are often high-level at this stage."
  }
};

export const likelihoodLevels: Record<Likelihood, number> = {
  "Very Unlikely": 1, "Unlikely": 2, "Possible": 3, "Likely": 4, "Very Likely": 5,
};
export const severityLevels: Record<Severity, number> = {
  "Insignificant": 1, "Minor": 2, "Moderate": 3, "Serious": 4, "Catastrophic": 5,
};
export const severityOptions: Array<{ value: Severity; label: Severity }> = (Object.keys(severityLevels) as Severity[]).map(s => ({ value: s, label: s }));
export const likelihoodOptions: Array<{ value: Likelihood; label: Likelihood }> = (Object.keys(likelihoodLevels) as Likelihood[]).map(l => ({ value: l, label: l }));
export const getRiskLevel = (likelihoodValue: number, severityValue: number): RiskLevel => {
  const riskScore = likelihoodValue * severityValue;
  if (riskScore <= 4) return 'Low';
  if (riskScore <= 9) return 'Medium';
  if (riskScore <= 15) return 'High';
  return 'Extreme';
};
export const riskMatrix: Record<RiskLevel, { color: string; description: string }> = {
  Low: { color: "bg-green-500 text-white", description: "Acceptable, manage with routine procedures." },
  Medium: { color: "bg-yellow-500 text-black", description: "Tolerable, implement controls to reduce risk where possible." },
  High: { color: "bg-orange-500 text-white", description: "Undesirable, implement significant controls to reduce risk. Activity may require specific authorization." },
  Extreme: { color: "bg-red-600 text-white", description: "Intolerable, activity should not proceed without substantial risk reduction. Immediate action required." },
};
export const controlActionStatuses: Array<Required<RiskAssessmentControl>['status']> = ['Open', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
export const riskAssessmentStatuses: Array<Required<ManualRiskAssessment>['status']> = ['Open', 'Under Review', 'Closed', 'Superseded'];
export const riskRegisterStatuses: RiskRegisterStatus[] = ['Open', 'In Progress', 'Mitigated', 'Closed', 'Accepted'];
export const riskCategories: string[] = ['Safety', 'Health', 'Environmental', 'Operational', 'Financial', 'Reputational', 'Legal/Compliance', 'Other'];
export const riskSources: string[] = ['Audit Finding', 'Inspection Finding', 'Hazard Report', 'Risk Assessment', 'Management Review', 'External Source', 'Other'];
