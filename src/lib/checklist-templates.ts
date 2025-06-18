
import type { ChecklistItemTemplate, ChecklistTemplate } from './types';

export const defaultChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'system-general-safety-iso45001-v1',
    name: 'OH&S Management System Audit (ISO 45001:2018 Based)',
    isSystemDefault: true,
    items: [
      // Clause 4: Context of the organization
      { 
        id: 'ohs-c4-q1', 
        text: 'Has the organization determined external and internal issues relevant to its purpose and that affect its ability to achieve the intended outcomes of its OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.1',
        evidenceGatheringPrompt: 'Review documentation (e.g., SWOT analysis, strategic plans, risk registers). Interview top management and relevant personnel regarding understanding of these issues.',
        observationPrompt: 'Assess the process for identifying and understanding organizational context and its impact on OH&S.'
      },
      { 
        id: 'ohs-c4-q2', 
        text: 'Have the needs and expectations of workers and other interested parties been determined and are relevant ones considered OH&S legal requirements and other requirements?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.2',
        evidenceGatheringPrompt: 'Review processes for identifying interested parties (e.g., workers, suppliers, contractors, regulatory bodies) and their OH&S related needs/expectations. Check records of communication or consultation.',
        observationPrompt: 'Evaluate the methods used to capture and address interested party requirements impacting OH&S.'
      },
      { 
        id: 'ohs-c4-q3', 
        text: 'Is the scope of the OH&S management system clearly defined and documented, considering organizational context, interested parties, and planned/performed work-related activities?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.3',
        evidenceGatheringPrompt: 'Review documented scope statement. Verify it aligns with the organization\'s activities, boundaries, and context.',
        observationPrompt: 'Confirm the documented scope accurately reflects the operational reality and intent of the OH&S system.'
      },
      { 
        id: 'ohs-c4-q4', 
        text: 'Has the organization established, implemented, maintained, and continually improved an OH&S management system, including the processes needed and their interactions?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.4',
        evidenceGatheringPrompt: 'Review overall system documentation (manuals, procedures). Observe processes in action. Interview personnel about their roles within the system.',
        observationPrompt: 'Assess the overall establishment and functioning of the OH&S management system.'
      },
      { 
        id: 'ohs-c4-q5',
        text: 'Are processes in place to identify and understand the organization\'s compliance obligations related to OH&S?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.3',
        evidenceGatheringPrompt: 'Review legal registers, communication with regulatory bodies, and processes for updating compliance information.',
        observationPrompt: 'Evaluate the effectiveness of the system for staying current with OH&S legal and other requirements.'
      },
      {
        id: 'ohs-c4-q6',
        text: 'How does the organization ensure that work-related activities performed by contractors are controlled in relation to OH&S risks?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.4.2',
        evidenceGatheringPrompt: 'Review contractor management procedures, pre-qualification records, site inductions, and monitoring of contractor activities.',
        observationPrompt: 'Assess the effectiveness of controls applied to contractor OH&S performance.'
      },

      // Clause 5: Leadership and worker participation
      { 
        id: 'ohs-c5-q1', 
        text: 'Does top management demonstrate leadership and commitment with respect to the OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.1',
        evidenceGatheringPrompt: 'Interview top management. Review OH&S policy, objectives, resource allocation, and management review minutes. Observe leadership involvement in OH&S activities.',
        observationPrompt: 'Assess the visible commitment and active involvement of top management in promoting OH&S.'
      },
      { 
        id: 'ohs-c5-q2', 
        text: 'Is there a documented OH&S policy that is appropriate, communicated, understood, and available?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.2',
        evidenceGatheringPrompt: 'Review the OH&S policy document. Verify communication methods (e.g., notice boards, intranet, training). Interview workers to check understanding.',
        observationPrompt: 'Evaluate the suitability and effectiveness of the OH&S policy communication and understanding.'
      },
      { 
        id: 'ohs-c5-q3', 
        text: 'Are organizational roles, responsibilities, and authorities for OH&S defined, documented, and communicated?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.3',
        evidenceGatheringPrompt: 'Review organization charts, job descriptions, and relevant procedures. Interview personnel about their OH&S responsibilities.',
        observationPrompt: 'Confirm clarity and understanding of OH&S roles and responsibilities across the organization.'
      },
      { 
        id: 'ohs-c5-q4', 
        text: 'Are there established processes for consultation and participation of workers (and their representatives, where they exist) in the OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.4',
        evidenceGatheringPrompt: 'Review procedures for consultation (e.g., safety committee meetings, suggestion schemes). Check minutes of meetings. Interview workers about their involvement.',
        observationPrompt: 'Assess the effectiveness of mechanisms for worker consultation and participation on OH&S matters.'
      },
      {
        id: 'ohs-c5-q5',
        text: 'Does top management ensure the integration of OH&S management system requirements into the organization’s business processes?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.1.c',
        evidenceGatheringPrompt: 'Review business process documentation, strategic plans, and operational procedures to see how OH&S is incorporated. Interview managers.',
        observationPrompt: 'Evaluate how OH&S considerations are embedded within core business activities rather than treated as separate.'
      },
      {
        id: 'ohs-c5-q6',
        text: 'Does top management ensure that resources needed for the OH&S management system are available?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.1.e',
        evidenceGatheringPrompt: 'Review budgets, training plans, equipment procurement related to OH&S. Interview personnel about resource adequacy.',
        observationPrompt: 'Assess the provision of necessary resources (human, financial, technical) for effective OH&S management.'
      },

      // Clause 6: Planning
      { 
        id: 'ohs-c6-q1', 
        text: 'Has the organization established processes for hazard identification that are ongoing and proactive?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.2.1',
        evidenceGatheringPrompt: 'Review hazard identification procedures (e.g., risk assessments, inspections, incident investigations). Check records of identified hazards. Interview workers on hazard reporting.',
        observationPrompt: 'Evaluate the thoroughness and proactiveness of hazard identification processes.'
      },
      { 
        id: 'ohs-c6-q2', 
        text: 'Are OH&S risks and opportunities assessed, considering identified hazards, legal requirements, and other issues?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.2.2, 6.1.2.3',
        evidenceGatheringPrompt: 'Review risk assessment records. Verify methodology used. Check if opportunities for OH&S improvement are considered.',
        observationPrompt: 'Assess the suitability and completeness of the risk assessment process and the identification of opportunities.'
      },
      { 
        id: 'ohs-c6-q3', 
        text: 'Has the organization determined and has access to applicable OH&S legal requirements and other requirements?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.3',
        evidenceGatheringPrompt: 'Review legal register or system for tracking compliance obligations. Check how this information is updated and communicated.',
        observationPrompt: 'Evaluate the process for identifying and maintaining current knowledge of OH&S legal and other requirements.'
      },
      { 
        id: 'ohs-c6-q4', 
        text: 'Are there documented OH&S objectives at relevant functions and levels, consistent with the OH&S policy and considering risks/opportunities?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.2.1',
        evidenceGatheringPrompt: 'Review documented OH&S objectives. Check if they are measurable (if practicable) and aligned with policy. Interview personnel about objectives relevant to their area.',
        observationPrompt: 'Assess the appropriateness and communication of OH&S objectives.'
      },
      { 
        id: 'ohs-c6-q5', 
        text: 'Is there planning to achieve OH&S objectives, including actions, resources, responsibilities, timelines, and evaluation methods?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.2.2',
        evidenceGatheringPrompt: 'Review action plans for achieving OH&S objectives. Check for assigned responsibilities, resources, and due dates. Verify how progress is tracked.',
        observationPrompt: 'Evaluate the adequacy of planning for the achievement of OH&S objectives.'
      },
      {
        id: 'ohs-c6-q6',
        text: 'Are processes in place to eliminate hazards and reduce OH&S risks using the hierarchy of controls?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.2',
        evidenceGatheringPrompt: 'Review risk assessments and control measure documentation. Observe implemented controls. Interview personnel about the hierarchy of controls application.',
        observationPrompt: 'Assess the organization\'s approach to applying the hierarchy of controls (elimination, substitution, engineering, administrative, PPE).'
      },
      
      // Clause 7: Support
      {
        id: 'ohs-c7-q1',
        text: 'Does the organization determine and provide the necessary resources for the establishment, implementation, maintenance, and continual improvement of the OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.1',
        evidenceGatheringPrompt: 'Review resource allocation (budget, personnel, infrastructure). Interview management and workers about resource adequacy.',
        observationPrompt: 'Assess if sufficient and appropriate resources are provided for the OH&S system.'
      },
      {
        id: 'ohs-c7-q2',
        text: 'Are workers competent on the basis of appropriate education, training, or experience, and is competence maintained?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.2',
        evidenceGatheringPrompt: 'Review training records, competency matrices, job descriptions. Interview workers and supervisors. Observe tasks being performed.',
        observationPrompt: 'Evaluate the processes for ensuring and verifying worker competence for OH&S critical tasks.'
      },
      {
        id: 'ohs-c7-q3',
        text: 'Are workers aware of the OH&S policy, their contribution to OH&S effectiveness, implications of not conforming, incident information, hazards, and their right to remove themselves from imminent danger?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.3',
        evidenceGatheringPrompt: 'Interview workers. Review induction materials, toolbox talks, safety briefings content.',
        observationPrompt: 'Assess the level of OH&S awareness among workers regarding key aspects of the system.'
      },
      {
        id: 'ohs-c7-q4',
        text: 'Are processes for internal and external OH&S communication established, implemented, and maintained?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.4',
        evidenceGatheringPrompt: 'Review communication procedures, meeting minutes, notice boards, safety alerts. Interview personnel about communication channels.',
        observationPrompt: 'Evaluate the effectiveness and appropriateness of OH&S communication processes.'
      },
      {
        id: 'ohs-c7-q5',
        text: 'Is documented information required by the OH&S standard and necessary for system effectiveness appropriately created, updated, controlled, and maintained?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.5',
        evidenceGatheringPrompt: 'Review document control procedures. Sample key documents (policy, procedures, records) for control (e.g., revision, availability, legibility).',
        observationPrompt: 'Assess the adequacy of documented information management for the OH&S system.'
      },
      {
        id: 'ohs-c7-q6',
        text: 'Does the organization ensure that information relevant to the OH&S management system is communicated to contractors and other visitors to the workplace?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.4.1, 7.4.3',
        evidenceGatheringPrompt: 'Review contractor induction materials, visitor sign-in procedures, and site rules communication.',
        observationPrompt: 'Assess how OH&S information is conveyed to non-employees on site.'
      },

      // Clause 8: Operation
      {
        id: 'ohs-c8-q1',
        text: 'Has the organization planned, implemented, and controlled processes needed to meet OH&S requirements and implement actions from Clause 6 (Planning)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.1',
        evidenceGatheringPrompt: 'Review operational procedures, work instructions, risk control implementation records. Observe work activities.',
        observationPrompt: 'Assess the effectiveness of operational controls in managing OH&S risks.'
      },
      {
        id: 'ohs-c8-q2',
        text: 'Are processes for eliminating hazards and reducing OH&S risks (hierarchy of controls) implemented and effective?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.2',
        evidenceGatheringPrompt: 'Observe application of controls (e.g., machine guarding, ventilation, safe work procedures, PPE). Review risk assessments and control plans.',
        observationPrompt: 'Verify that the hierarchy of controls is being practically applied and controls are functional.'
      },
      {
        id: 'ohs-c8-q3',
        text: 'Are processes for managing change established and implemented to ensure new OH&S risks are addressed before changes are introduced?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.3',
        evidenceGatheringPrompt: 'Review management of change (MOC) procedures. Examine records of recent changes (e.g., new equipment, processes, materials) and associated risk assessments.',
        observationPrompt: 'Evaluate the effectiveness of the MOC process in identifying and mitigating OH&S risks from changes.'
      },
      {
        id: 'ohs-c8-q4',
        text: 'Are procurement processes, including for contractors and outsourced activities, established to ensure conformity with OH&S requirements?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.4',
        evidenceGatheringPrompt: 'Review procurement procedures, contractor selection criteria, and contracts for OH&S clauses. Assess monitoring of outsourced functions.',
        observationPrompt: 'Evaluate how OH&S is considered in procurement and management of external providers.'
      },
      {
        id: 'ohs-c8-q5',
        text: 'Has the organization established, implemented, and maintained processes for emergency preparedness and response?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.2',
        evidenceGatheringPrompt: 'Review emergency response plans, drill records, emergency equipment inspection logs. Interview emergency response team members and workers.',
        observationPrompt: 'Assess the adequacy and readiness of emergency preparedness and response arrangements.'
      },
      {
        id: 'ohs-c8-q6',
        text: 'Are permit-to-work systems effectively implemented for controlling high-risk activities?',
        auditCriteriaReference: 'Operational Control Procedures; Industry Best Practice',
        evidenceGatheringPrompt: 'Review permit-to-work procedures and completed permits for activities like hot work, confined space entry, electrical work. Observe PTW process if possible.',
        observationPrompt: 'Evaluate the compliance and effectiveness of the PTW system in managing high-risk tasks.'
      },
      
      // Clause 9: Performance evaluation
      {
        id: 'ohs-c9-q1',
        text: 'Are processes in place for monitoring, measurement, analysis, and performance evaluation of the OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review what is monitored (e.g., leading/lagging indicators, objectives), methods used, frequency, and records of results. Check calibration records for monitoring equipment.',
        observationPrompt: 'Assess the suitability and effectiveness of OH&S performance monitoring and measurement processes.'
      },
      {
        id: 'ohs-c9-q2',
        text: 'Is the organization evaluating compliance with legal and other requirements related to OH&S?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.2',
        evidenceGatheringPrompt: 'Review records of compliance evaluations (e.g., audits, inspections, self-assessments). Check how non-compliances are addressed.',
        observationPrompt: 'Evaluate the process for and outcomes of compliance evaluations.'
      },
      {
        id: 'ohs-c9-q3',
        text: 'Are internal audits of the OH&S management system conducted at planned intervals?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.2',
        evidenceGatheringPrompt: 'Review internal audit program/schedule, audit reports, auditor competence records, and records of corrective actions from audits.',
        observationPrompt: 'Assess the effectiveness of the internal audit program in verifying OH&S system conformity and effectiveness.'
      },
      {
        id: 'ohs-c9-q4',
        text: 'Does top management review the OH&S management system at planned intervals to ensure its continuing suitability, adequacy, and effectiveness?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.3',
        evidenceGatheringPrompt: 'Review management review meeting minutes, agendas, attendees, and records of decisions and actions.',
        observationPrompt: 'Evaluate the thoroughness and effectiveness of management reviews in driving OH&S improvement.'
      },
      {
        id: 'ohs-c9-q5',
        text: 'Are results of monitoring and measurement analyzed to identify trends and areas for improvement in OH&S performance?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review performance reports, trend analyses, and management review inputs related to OH&S data.',
        observationPrompt: 'Assess how performance data is used to inform decision-making and identify improvement opportunities.'
      },
      {
        id: 'ohs-c9-q6',
        text: 'Is information from worker consultation and participation fed into the performance evaluation processes, including management review?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.4, 9.3',
        evidenceGatheringPrompt: 'Review safety committee minutes, worker feedback records, and check if these are inputs to management reviews or other performance evaluations.',
        observationPrompt: 'Verify that worker feedback on OH&S matters is considered in performance reviews.'
      },

      // Clause 10: Improvement
      {
        id: 'ohs-c10-q1',
        text: 'Has the organization established processes for reporting, investigating, and taking action to address incidents and nonconformities?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2',
        evidenceGatheringPrompt: 'Review incident/nonconformity reporting and investigation procedures. Examine records of incidents, investigations, and corrective actions.',
        observationPrompt: 'Assess the effectiveness of processes for managing incidents and nonconformities, including root cause analysis and corrective actions.'
      },
      {
        id: 'ohs-c10-q2',
        text: 'Are corrective actions appropriate to the effects or potential effects of the incidents or nonconformities encountered?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2',
        evidenceGatheringPrompt: 'Review a sample of corrective actions. Verify that root causes were identified and actions address these causes to prevent recurrence.',
        observationPrompt: 'Evaluate the suitability and effectiveness of implemented corrective actions.'
      },
      {
        id: 'ohs-c10-q3',
        text: 'Does the organization continually improve the suitability, adequacy, and effectiveness of the OH&S management system?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.3',
        evidenceGatheringPrompt: 'Review evidence of improvements (e.g., updated procedures, new controls, reduced incident rates, achievement of objectives). Check management review outputs for improvement actions.',
        observationPrompt: 'Assess the overall commitment and process for continual improvement of the OH&S system.'
      },
      {
        id: 'ohs-c10-q4',
        text: 'Are opportunities for continual improvement identified and acted upon?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.3, 6.1.2.3',
        evidenceGatheringPrompt: 'Review records of improvement suggestions, risk assessments for opportunities, management review outputs. Check how these are prioritized and implemented.',
        observationPrompt: 'Evaluate the process for identifying and realizing opportunities to enhance OH&S performance.'
      },
      {
        id: 'ohs-c10-q5',
        text: 'Are the results of incident investigations and corrective actions communicated to relevant workers and interested parties?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2, 7.4',
        evidenceGatheringPrompt: 'Review communication records (e.g., safety alerts, meeting minutes) regarding incident outcomes and lessons learned.',
        observationPrompt: 'Assess the effectiveness of sharing lessons learned from incidents and corrective actions.'
      },
      {
        id: 'ohs-c10-q6',
        text: 'Are changes to the OH&S management system, resulting from corrective actions or continual improvement initiatives, effectively implemented and documented?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2, 10.3, 7.5',
        evidenceGatheringPrompt: 'Review updated documents, training records related to changes, and verify implementation of new or modified processes/controls.',
        observationPrompt: 'Confirm that improvements lead to tangible changes in the OH&S management system and practices.'
      }
    ],
  },
  {
    id: 'system-environmental-safety-iso14001-v1',
    name: 'Environmental Management System Audit (ISO 14001:2015 Based)',
    isSystemDefault: true,
    items: [
      // Clause 4: Context of the Organization
      {
        id: 'env-c4-q1',
        text: 'Has the organization determined external and internal issues relevant to its purpose and that affect its ability to achieve the intended outcomes of its EMS?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 4.1',
        evidenceGatheringPrompt: 'Review strategic documents, risk assessments, stakeholder analyses. Interview top management.',
        observationPrompt: 'Assess understanding of how internal/external issues impact environmental performance.'
      },
      {
        id: 'env-c4-q2',
        text: 'Have the needs and expectations of interested parties relevant to the EMS been determined?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 4.2',
        evidenceGatheringPrompt: 'Review stakeholder identification, communication records, legal and other requirements register.',
        observationPrompt: 'Evaluate the process for identifying and understanding interested party requirements.'
      },
      {
        id: 'env-c4-q3',
        text: 'Is the scope of the EMS defined, documented, and available?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 4.3',
        evidenceGatheringPrompt: 'Review documented scope statement. Verify alignment with organizational activities and boundaries.',
        observationPrompt: 'Confirm the scope accurately reflects the environmental management activities.'
      },
      {
        id: 'env-c4-q4',
        text: 'Has the organization established, implemented, maintained, and continually improved an EMS?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 4.4',
        evidenceGatheringPrompt: 'Review EMS manual, procedures, and observe processes. Interview personnel.',
        observationPrompt: 'Assess overall EMS establishment and operational effectiveness.'
      },
      {
        id: 'env-c4-q5',
        text: 'Does the organization systematically identify environmental aspects of its activities, products and services that it can control and influence, and their associated environmental impacts, considering a life cycle perspective?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.1.2',
        evidenceGatheringPrompt: 'Review procedures for identifying environmental aspects and impacts. Examine aspect registers. Verify if a life cycle perspective is considered.',
        observationPrompt: 'Evaluate the thoroughness of the aspect identification process.'
      },

      // Clause 5: Leadership
      {
        id: 'env-c5-q1',
        text: 'Does top management demonstrate leadership and commitment with respect to the EMS?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 5.1',
        evidenceGatheringPrompt: 'Interview top management. Review policy, objectives, resource allocation, management review minutes.',
        observationPrompt: 'Assess visible leadership support for environmental management.'
      },
      {
        id: 'env-c5-q2',
        text: 'Is there an established, implemented, and maintained environmental policy appropriate to the organization?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 5.2',
        evidenceGatheringPrompt: 'Review environmental policy. Verify communication and understanding among employees.',
        observationPrompt: 'Evaluate the suitability and communication of the environmental policy.'
      },
      {
        id: 'env-c5-q3',
        text: 'Are organizational roles, responsibilities, and authorities for the EMS assigned, communicated, and understood?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 5.3',
        evidenceGatheringPrompt: 'Review organization charts, job descriptions. Interview personnel about their EMS roles.',
        observationPrompt: 'Confirm clarity of EMS roles and responsibilities.'
      },
      {
        id: 'env-c5-q4',
        text: 'Does top management ensure that the environmental policy and objectives are compatible with the strategic direction of the organization?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 5.1.b',
        evidenceGatheringPrompt: 'Review strategic plans and compare with environmental policy and objectives.',
        observationPrompt: 'Assess alignment between environmental commitments and overall business strategy.'
      },
      {
        id: 'env-c5-q5',
        text: 'Does top management promote continual improvement of the EMS?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 5.1.j',
        evidenceGatheringPrompt: 'Review management review outputs, improvement project records, and communication related to environmental improvements.',
        observationPrompt: 'Evaluate the leadership\'s role in driving environmental improvement.'
      },

      // Clause 6: Planning
      {
        id: 'env-c6-q1',
        text: 'Has the organization planned actions to address its significant environmental aspects, compliance obligations, and risks and opportunities?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.1.1, 6.1.4',
        evidenceGatheringPrompt: 'Review risk/opportunity register, action plans related to significant aspects and compliance.',
        observationPrompt: 'Assess the planning process for managing key environmental issues.'
      },
      {
        id: 'env-c6-q2',
        text: 'Are significant environmental aspects determined, considering criteria established by the organization?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.1.2',
        evidenceGatheringPrompt: 'Review procedure for determining significance of aspects. Check the list of significant aspects.',
        observationPrompt: 'Evaluate the methodology and outcome of significance determination.'
      },
      {
        id: 'env-c6-q3',
        text: 'Has the organization determined its compliance obligations related to its environmental aspects?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.1.3',
        evidenceGatheringPrompt: 'Review legal register, permits, licenses. Check how updates are managed.',
        observationPrompt: 'Assess the system for identifying and managing environmental compliance obligations.'
      },
      {
        id: 'env-c6-q4',
        text: 'Are environmental objectives established at relevant functions and levels, consistent with the environmental policy?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.2.1',
        evidenceGatheringPrompt: 'Review documented environmental objectives. Verify they are measurable and aligned with policy.',
        observationPrompt: 'Evaluate the appropriateness and communication of environmental objectives.'
      },
      {
        id: 'env-c6-q5',
        text: 'Is there planning to achieve environmental objectives, including actions, resources, responsibilities, and timelines?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 6.2.2',
        evidenceGatheringPrompt: 'Review action plans for objectives. Check resource allocation and progress tracking.',
        observationPrompt: 'Assess the adequacy of planning for achieving environmental objectives.'
      },

      // Clause 7: Support
      {
        id: 'env-c7-q1',
        text: 'Are necessary resources for the EMS determined and provided?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 7.1',
        evidenceGatheringPrompt: 'Review budgets, staffing, infrastructure related to EMS. Interview relevant personnel.',
        observationPrompt: 'Assess resource adequacy for effective EMS implementation.'
      },
      {
        id: 'env-c7-q2',
        text: 'Is personnel performing work affecting environmental performance competent on the basis of education, training, or experience?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 7.2',
        evidenceGatheringPrompt: 'Review training records, competency assessments. Observe tasks with environmental significance.',
        observationPrompt: 'Evaluate processes for ensuring environmental competence.'
      },
      {
        id: 'env-c7-q3',
        text: 'Are persons doing work under the organization\'s control aware of the environmental policy, significant aspects, their contribution to EMS effectiveness, and implications of nonconformance?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 7.3',
        evidenceGatheringPrompt: 'Interview employees and contractors. Review induction materials and awareness training.',
        observationPrompt: 'Assess environmental awareness levels across relevant personnel.'
      },
      {
        id: 'env-c7-q4',
        text: 'Are processes for internal and external communication relevant to the EMS established and implemented?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 7.4',
        evidenceGatheringPrompt: 'Review communication procedures, records of communication with stakeholders.',
        observationPrompt: 'Evaluate effectiveness of environmental communication channels.'
      },
      {
        id: 'env-c7-q5',
        text: 'Is EMS documented information created, updated, controlled, and maintained as required by the standard and for system effectiveness?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 7.5',
        evidenceGatheringPrompt: 'Review document control procedures. Sample key EMS documents and records for control.',
        observationPrompt: 'Assess adequacy of EMS documentation and its control.'
      },

      // Clause 8: Operation
      {
        id: 'env-c8-q1',
        text: 'Are operational controls established and implemented for processes associated with significant environmental aspects?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 8.1',
        evidenceGatheringPrompt: 'Review operational procedures (e.g., waste management, spill control, emissions control). Observe activities.',
        observationPrompt: 'Evaluate the implementation and effectiveness of operational controls for significant aspects.'
      },
      {
        id: 'env-c8-q2',
        text: 'Are criteria for the processes maintained and are processes carried out in accordance with these criteria?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 8.1',
        evidenceGatheringPrompt: 'Verify documented operating criteria. Observe processes to confirm adherence.',
        observationPrompt: 'Assess consistency between documented procedures and actual practice.'
      },
      {
        id: 'env-c8-q3',
        text: 'Are controls related to outsourced processes that affect environmental performance established and maintained?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 8.1',
        evidenceGatheringPrompt: 'Review contractor agreements, supplier evaluation processes for environmental aspects.',
        observationPrompt: 'Evaluate how environmental controls are applied to outsourced activities.'
      },
      {
        id: 'env-c8-q4',
        text: 'Are processes for emergency preparedness and response established, implemented, and tested?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 8.2',
        evidenceGatheringPrompt: 'Review emergency plans (e.g., spill response, fire). Check drill records, emergency equipment inspections.',
        observationPrompt: 'Assess readiness to respond to environmental emergencies.'
      },
      {
        id: 'env-c8-q5',
        text: 'Does the organization control planned changes and review the consequences of unintended changes, taking action to mitigate adverse effects?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 8.1',
        evidenceGatheringPrompt: 'Review management of change procedures. Examine recent changes and their environmental impact assessment.',
        observationPrompt: 'Evaluate the process for managing environmental aspects of changes.'
      },

      // Clause 9: Performance Evaluation
      {
        id: 'env-c9-q1',
        text: 'Are processes for monitoring, measurement, analysis, and evaluation of environmental performance established?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review what is monitored (e.g., emissions, waste, resource use), methods, frequency, records. Check equipment calibration.',
        observationPrompt: 'Assess suitability and effectiveness of environmental performance monitoring.'
      },
      {
        id: 'env-c9-q2',
        text: 'Is compliance with environmental legal and other requirements evaluated periodically?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 9.1.2',
        evidenceGatheringPrompt: 'Review records of compliance evaluations (e.g., audits, inspections). Check follow-up actions.',
        observationPrompt: 'Evaluate the process for assessing environmental compliance.'
      },
      {
        id: 'env-c9-q3',
        text: 'Are internal audits of the EMS conducted at planned intervals?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 9.2',
        evidenceGatheringPrompt: 'Review internal audit program, reports, auditor competence, corrective actions.',
        observationPrompt: 'Assess effectiveness of the internal EMS audit program.'
      },
      {
        id: 'env-c9-q4',
        text: 'Does top management review the EMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 9.3',
        evidenceGatheringPrompt: 'Review management review minutes, agenda, inputs, and outputs (decisions, actions).',
        observationPrompt: 'Evaluate thoroughness and effectiveness of EMS management reviews.'
      },
      {
        id: 'env-c9-q5',
        text: 'Are the results of monitoring and measurement used to identify trends in environmental performance and opportunities for improvement?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review performance reports, data analysis, and how this information is used in planning or reviews.',
        observationPrompt: 'Assess how environmental data drives decision-making and improvement.'
      },

      // Clause 10: Improvement
      {
        id: 'env-c10-q1',
        text: 'Are nonconformities, including those from incidents, identified and corrected, and are actions taken to control and correct them and deal with consequences?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 10.2',
        evidenceGatheringPrompt: 'Review nonconformity and corrective action procedures. Examine records of nonconformities, root cause analysis, and corrective actions.',
        observationPrompt: 'Assess the process for managing environmental nonconformities.'
      },
      {
        id: 'env-c10-q2',
        text: 'Are actions taken to eliminate the causes of nonconformities to prevent recurrence (corrective actions)?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 10.2',
        evidenceGatheringPrompt: 'Verify root cause analysis for significant nonconformities. Check effectiveness of implemented corrective actions.',
        observationPrompt: 'Evaluate the thoroughness of corrective actions in addressing root causes.'
      },
      {
        id: 'env-c10-q3',
        text: 'Does the organization continually improve the suitability, adequacy, and effectiveness of the EMS to enhance environmental performance?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 10.3',
        evidenceGatheringPrompt: 'Review evidence of improvements (e.g., reduced emissions, better resource efficiency, achievement of objectives). Check management review outputs.',
        observationPrompt: 'Assess overall commitment and process for continual environmental improvement.'
      },
      {
        id: 'env-c10-q4',
        text: 'Are the results of analysis and evaluation, and outputs from management review, used to determine if there are needs or opportunities that shall be addressed as part of continual improvement?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 10.1, 10.3',
        evidenceGatheringPrompt: 'Trace how data from performance evaluation and management reviews leads to improvement initiatives.',
        observationPrompt: 'Evaluate how the EMS drives proactive improvement rather than just reactive corrections.'
      },
      {
        id: 'env-c10-q5',
        text: 'Are changes to the EMS implemented in a planned manner when improvements are made?',
        auditCriteriaReference: 'ISO 14001:2015 Clause 10.1, 8.1',
        evidenceGatheringPrompt: 'Review how changes resulting from improvements (e.g., new procedures, technologies) are managed and documented.',
        observationPrompt: 'Assess the control of changes arising from continual improvement activities.'
      }
    ],
  },
  {
    id: 'system-construction-safety-iso45001-v1',
    name: 'Construction Site OH&S Audit (ISO 45001:2018 Based)',
    isSystemDefault: true,
    items: [
      // Clause 4: Context specific to construction
      { 
        id: 'con-c4-q1', 
        text: 'Are specific site conditions, project phases, and interfaces with other parties (public, other contractors) considered in understanding the context for OH&S management on this site?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.1',
        evidenceGatheringPrompt: 'Review site-specific risk assessments, project plans, coordination meeting minutes. Interview site management.',
        observationPrompt: 'Assess if the unique context of the construction site is adequately understood for OH&S planning.'
      },
      {
        id: 'con-c4-q2',
        text: 'Are the OH&S needs and expectations of clients, designers, principal contractors, subcontractors, and regulatory bodies specific to this construction project identified and addressed?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.2',
        evidenceGatheringPrompt: 'Review project communication plans, contractual OH&S requirements, stakeholder engagement records.',
        observationPrompt: 'Evaluate how specific construction project stakeholder requirements are managed.'
      },
      {
        id: 'con-c4-q3',
        text: 'Is the scope of the OH&S management system for this construction project clearly defined, considering all activities, workers (including temporary), and site boundaries?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.3',
        evidenceGatheringPrompt: 'Review site management plan, scope of works documents for the OH&S system application.',
        observationPrompt: 'Confirm clarity of OH&S system scope for the specific construction project.'
      },
      {
        id: 'con-c4-q4',
        text: 'Are processes in place to ensure the construction site OH&S system interfaces effectively with the organization\'s overall OH&S MS and any client/principal contractor systems?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 4.4',
        evidenceGatheringPrompt: 'Review interface documents, coordination procedures. Interview site and project management.',
        observationPrompt: 'Assess the integration and alignment of site-specific OH&S processes with broader systems.'
      },
      {
        id: 'con-c4-q5',
        text: 'Are specific legal and other requirements applicable to the construction activities (e.g., CDM regulations, specific work permits) identified and managed?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.3',
        evidenceGatheringPrompt: 'Review site-specific legal register, permits obtained (e.g., for road closures, hot work).',
        observationPrompt: 'Verify identification and management of construction-specific compliance obligations.'
      },

      // Clause 5: Leadership and worker participation specific to construction
      { 
        id: 'con-c5-q1', 
        text: 'Does site management demonstrate visible leadership and commitment to OH&S on the construction site (e.g., site inspections, safety talks)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.1',
        evidenceGatheringPrompt: 'Observe site management presence and actions. Review records of safety tours, toolbox talks led by management.',
        observationPrompt: 'Assess the on-site leadership engagement in OH&S.'
      },
      {
        id: 'con-c5-q2',
        text: 'Is the organization\'s OH&S policy effectively communicated and applied to all personnel on the construction site, including subcontractors?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.2',
        evidenceGatheringPrompt: 'Check site induction records, notice boards. Interview site workers (own and subcontractor).',
        observationPrompt: 'Verify awareness and application of the OH&S policy at site level.'
      },
      {
        id: 'con-c5-q3',
        text: 'Are OH&S roles, responsibilities, and authorities clearly defined and communicated for all personnel involved in the construction project (e.g., site manager, supervisors, crane operator)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.3',
        evidenceGatheringPrompt: 'Review site organization chart, RAMS, induction materials. Interview personnel.',
        observationPrompt: 'Confirm clarity of OH&S responsibilities specific to construction roles.'
      },
      {
        id: 'con-c5-q4',
        text: 'Are there effective mechanisms for consultation and participation of construction workers (including subcontractor personnel) on site-specific OH&S matters?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.4',
        evidenceGatheringPrompt: 'Review site safety meeting minutes, records of toolbox talks, worker feedback mechanisms specific to the site.',
        observationPrompt: 'Assess how construction workers contribute to and are consulted on site safety.'
      },
      {
        id: 'con-c5-q5',
        text: 'Does site management actively promote a culture that encourages workers to report hazards, incidents, and OH&S concerns without fear of reprisal?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.1, 5.4',
        evidenceGatheringPrompt: 'Interview workers and supervisors. Review incident reporting trends and close-out rates. Observe management response to reported issues.',
        observationPrompt: 'Evaluate the openness of the reporting culture on site.'
      },

      // Clause 6: Planning specific to construction
      {
        id: 'con-c6-q1',
        text: 'Are specific construction hazards (e.g., work at height, excavations, lifting operations, temporary works, moving plant) systematically identified and assessed for this project?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.2.1, 6.1.2.2',
        evidenceGatheringPrompt: 'Review site-specific risk assessments, method statements (RAMS), Job Safety Analyses (JSAs) for construction tasks.',
        observationPrompt: 'Evaluate the thoroughness of hazard identification and risk assessment for key construction activities.'
      },
      {
        id: 'con-c6-q2',
        text: 'Are controls for significant construction OH&S risks planned and documented, following the hierarchy of controls (e.g., edge protection before fall arrest systems)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.1.4, 8.1.2',
        evidenceGatheringPrompt: 'Review RAMS, temporary works designs, safe systems of work. Verify selection of controls.',
        observationPrompt: 'Assess the appropriateness and planned application of the hierarchy of controls for construction risks.'
      },
      {
        id: 'con-c6-q3',
        text: 'Are OH&S objectives specific to the construction project established (e.g., relating to incident rates, training completion, inspection findings closure)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.2.1',
        evidenceGatheringPrompt: 'Review project OH&S plan and objectives. Check if they are communicated to the site team.',
        observationPrompt: 'Assess the relevance and measurability of project-specific OH&S objectives.'
      },
      {
        id: 'con-c6-q4',
        text: 'Is there adequate planning for achieving project OH&S objectives, including defined responsibilities, resources, and timelines for construction phases?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 6.2.2',
        evidenceGatheringPrompt: 'Review project OH&S plans, resource allocation for safety measures (e.g., safety personnel, equipment).',
        observationPrompt: 'Evaluate the planning for achieving OH&S objectives throughout the project lifecycle.'
      },
      {
        id: 'con-c6-q5',
        text: 'Has planning considered OH&S implications of design changes, material substitutions, or changes in construction methods during the project?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.3 (Management of Change)',
        evidenceGatheringPrompt: 'Review MOC procedures applied to the project. Check records of design reviews or change requests for OH&S input.',
        observationPrompt: 'Assess how OH&S is considered when project changes occur.'
      },

      // Clause 7: Support specific to construction
      {
        id: 'con-c7-q1',
        text: 'Are sufficient and competent resources (e.g., site safety advisors, first aiders, trained operatives) provided for the construction site?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.1, 7.2',
        evidenceGatheringPrompt: 'Review site staffing levels for safety roles, training records for site personnel (e.g., CSCS cards, specific plant operator licenses).',
        observationPrompt: 'Assess the adequacy and competence of resources for managing site OH&S.'
      },
      {
        id: 'con-c7-q2',
        text: 'Are all workers, including temporary and subcontractor staff, provided with appropriate site-specific OH&S induction and ongoing awareness training (e.g., toolbox talks)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.2, 7.3',
        evidenceGatheringPrompt: 'Review induction records, toolbox talk topics and attendance. Interview workers.',
        observationPrompt: 'Evaluate the effectiveness of site-specific OH&S training and awareness programs.'
      },
      {
        id: 'con-c7-q3',
        text: 'Are there effective communication channels for OH&S information on site (e.g., safety notice boards, daily briefings, reporting lines)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.4',
        evidenceGatheringPrompt: 'Observe communication methods. Review minutes of site meetings. Interview workers about how they receive OH&S information.',
        observationPrompt: 'Assess clarity and reach of OH&S communication on the construction site.'
      },
      {
        id: 'con-c7-q4',
        text: 'Is relevant OH&S documented information (e.g., RAMS, permits, inspection records, emergency plan) readily available and controlled at the point of use on site?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 7.5',
        evidenceGatheringPrompt: 'Request to see specific documents at work locations. Check for version control and legibility.',
        observationPrompt: 'Verify accessibility and control of critical OH&S documents on site.'
      },
      {
        id: 'con-c7-q5',
        text: 'Are welfare facilities (toilets, washing facilities, rest areas, drinking water) provided, adequate for the number of personnel, and maintained in a clean and hygienic condition?',
        auditCriteriaReference: 'Local regulations (e.g., CDM); ISO 45001:2018 Clause 7.1',
        evidenceGatheringPrompt: 'Inspect welfare facilities. Observe cleanliness and availability of supplies.',
        observationPrompt: 'Assess the adequacy and maintenance of site welfare facilities.'
      },

      // Clause 8: Operation specific to construction
      {
        id: 'con-c8-q1',
        text: 'Are safe systems of work (SSOW), as defined in RAMS, being implemented and followed for construction activities?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.1',
        evidenceGatheringPrompt: 'Observe work activities. Compare observed practices with documented RAMS. Interview operatives and supervisors.',
        observationPrompt: 'Verify practical implementation and adherence to planned safe work methods.'
      },
      {
        id: 'con-c8-q2',
        text: 'Is appropriate and maintained PPE being used correctly for specific tasks as required by risk assessments and site rules?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.2 (Hierarchy of Controls - PPE)',
        evidenceGatheringPrompt: 'Observe PPE usage. Inspect condition of PPE. Check PPE issue and inspection records.',
        observationPrompt: 'Assess compliance with PPE requirements and suitability/condition of PPE provided.'
      },
      {
        id: 'con-c8-q3',
        text: 'Are controls for high-risk construction activities (e.g., lifting, confined space entry, hot work, work near live services) robustly implemented, including permit-to-work systems where required?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.1; Specific regulations',
        evidenceGatheringPrompt: 'Review permits for high-risk tasks. Observe ongoing high-risk activities. Interview personnel involved.',
        observationPrompt: 'Evaluate the effectiveness of controls for managing high-risk construction work.'
      },
      {
        id: 'con-c8-q4',
        text: 'Is there effective management and coordination of subcontractors on site to ensure their OH&S performance meets project requirements?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.1.4.2',
        evidenceGatheringPrompt: 'Review subcontractor RAMS approval process, site monitoring records for subcontractors, coordination meeting minutes.',
        observationPrompt: 'Assess the system for managing subcontractor OH&S on site.'
      },
      {
        id: 'con-c8-q5',
        text: 'Are arrangements for site traffic management, pedestrian segregation, and control of moving plant effective in preventing collisions and injuries?',
        auditCriteriaReference: 'Site Traffic Management Plan; ISO 45001:2018 Clause 8.1.1',
        evidenceGatheringPrompt: 'Observe site traffic and pedestrian movements. Review traffic management plan. Check signage and barriers.',
        observationPrompt: 'Evaluate the effectiveness of site traffic and plant movement controls.'
      },
      {
        id: 'con-c8-q6',
        text: 'Is the site emergency plan specific to construction site hazards (e.g., structural collapse, fire on temporary structures, medical emergencies in remote areas) established and are personnel aware of it?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 8.2',
        evidenceGatheringPrompt: 'Review site-specific emergency plan. Check drill records for construction scenarios. Interview site personnel.',
        observationPrompt: 'Assess the adequacy of emergency preparedness for construction-specific emergencies.'
      },

      // Clause 9: Performance Evaluation specific to construction
      {
        id: 'con-c9-q1',
        text: 'Is OH&S performance on the construction site monitored and measured (e.g., site inspections, incident statistics, training compliance, near-miss reporting)?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review site inspection reports, incident logs, training matrices, safety meeting minutes.',
        observationPrompt: 'Assess the system for monitoring and measuring site-specific OH&S performance.'
      },
      {
        id: 'con-c9-q2',
        text: 'Are site-specific OH&S legal and other requirements periodically evaluated for compliance?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.2',
        evidenceGatheringPrompt: 'Review records of site compliance checks against specific construction regulations or permit conditions.',
        observationPrompt: 'Evaluate how compliance with construction-specific obligations is verified.'
      },
      {
        id: 'con-c9-q3',
        text: 'Are regular site-specific OH&S audits or inspections conducted, and are findings effectively addressed?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.2',
        evidenceGatheringPrompt: 'Review site audit/inspection schedule and reports. Track closure of actions arising.',
        observationPrompt: 'Assess the effectiveness of the site audit/inspection process.'
      },
      {
        id: 'con-c9-q4',
        text: 'Is site OH&S performance, including incident trends and audit findings, reviewed by project/site management and fed into overall management reviews?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.3',
        evidenceGatheringPrompt: 'Review site management meeting minutes where OH&S is discussed. Check inputs to higher-level management reviews.',
        observationPrompt: 'Evaluate how site OH&S performance is reviewed and escalated if necessary.'
      },
      {
        id: 'con-c9-q5',
        text: 'Are leading indicators (e.g., hazard reporting, safety observations, training completion) as well as lagging indicators (e.g., LTI, incident rates) tracked and analyzed for the construction project?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 9.1.1',
        evidenceGatheringPrompt: 'Review project OH&S performance reports for a mix of leading and lagging indicators. Check for trend analysis.',
        observationPrompt: 'Assess the balance and utility of performance indicators used for the project.'
      },

      // Clause 10: Improvement specific to construction
      {
        id: 'con-c10-q1',
        text: 'Are construction site incidents (including near misses and property damage) reported, investigated, and are effective corrective actions taken to prevent recurrence?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2',
        evidenceGatheringPrompt: 'Review site incident reports, investigation records, and corrective action tracking for construction-related events.',
        observationPrompt: 'Assess the incident management process specifically for the construction site.'
      },
      {
        id: 'con-c10-q2',
        text: 'Are lessons learned from site incidents and nonconformities shared with relevant site personnel (including subcontractors) and used to improve site practices?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.2, 7.4',
        evidenceGatheringPrompt: 'Review safety alerts, updates to RAMS based on incidents, toolbox talks discussing lessons learned.',
        observationPrompt: 'Evaluate how lessons learned are disseminated and utilized on site.'
      },
      {
        id: 'con-c10-q3',
        text: 'Is there evidence of continual improvement in OH&S performance and management practices on the construction site throughout the project lifecycle?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.3',
        evidenceGatheringPrompt: 'Look for changes in procedures, improved risk controls, positive trends in performance indicators over project phases.',
        observationPrompt: 'Assess the commitment to and evidence of ongoing OH&S improvement on the project.'
      },
      {
        id: 'con-c10-q4',
        text: 'Are suggestions for OH&S improvements from site personnel (including subcontractors) actively encouraged, considered, and implemented where appropriate?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 5.4, 10.3',
        evidenceGatheringPrompt: 'Review suggestion schemes, records of worker feedback on safety. Check if feasible suggestions are actioned.',
        observationPrompt: 'Evaluate the process for capturing and acting on worker-driven improvement ideas.'
      },
      {
        id: 'con-c10-q5',
        text: 'Are post-project OH&S reviews conducted (where applicable) to capture lessons learned for future construction projects?',
        auditCriteriaReference: 'ISO 45001:2018 Clause 10.3; Organizational Learning Processes',
        evidenceGatheringPrompt: 'Review project close-out reports or lessons learned documentation for OH&S aspects.',
        observationPrompt: 'Assess if there is a systematic approach to learning from completed construction projects to benefit future ones.'
      }
    ],
  },
  {
    id: 'system-mining-safety-ims-v1',
    name: 'Integrated Management System Audit (Mining - ISO 9001, 14001, 45001 Based)',
    isSystemDefault: true,
    items: [
      // IMS Clause 4: Context, Scope & Interested Parties (QEH&S)
      {
        id: 'ims-mine-c4-q1',
        text: 'Has the organization determined external/internal issues relevant to its purpose in mining operations and affecting its ability to achieve IMS (Quality, Environment, OH&S) outcomes?',
        auditCriteriaReference: 'ISO 9001:4.1, ISO 14001:4.1, ISO 45001:4.1',
        evidenceGatheringPrompt: 'Review strategic analyses, risk registers (QEH&S), stakeholder maps specific to mining. Interview management.',
        observationPrompt: 'Assess integrated understanding of context for QEH&S in mining.'
      },
      {
        id: 'ims-mine-c4-q2',
        text: 'Are the needs and expectations of interested parties (e.g., community, regulators, employees, customers) for QEH&S in mining operations identified and addressed, including relevant legal obligations?',
        auditCriteriaReference: 'ISO 9001:4.2, ISO 14001:4.2, ISO 45001:4.2, 6.1.3',
        evidenceGatheringPrompt: 'Review stakeholder communication, community agreements, environmental permits, safety regulations, quality specs.',
        observationPrompt: 'Evaluate process for managing integrated stakeholder requirements for mining.'
      },
      {
        id: 'ims-mine-c4-q3',
        text: 'Is the scope of the IMS for mining operations clearly defined, documented, and does it cover all relevant QEH&S aspects from exploration to closure/rehabilitation?',
        auditCriteriaReference: 'ISO 9001:4.3, ISO 14001:4.3, ISO 45001:4.3',
        evidenceGatheringPrompt: 'Review documented IMS scope. Verify its application across mining lifecycle stages.',
        observationPrompt: 'Confirm comprehensive and accurate IMS scope for mining activities.'
      },
      {
        id: 'ims-mine-c4-q4',
        text: 'Are the processes needed for the IMS and their interactions (addressing QEH&S) established, implemented, maintained, and continually improved for mining operations?',
        auditCriteriaReference: 'ISO 9001:4.4, ISO 14001:4.4, ISO 45001:4.4',
        evidenceGatheringPrompt: 'Review integrated process maps, procedures. Observe interconnectedness of QEH&S processes in mining tasks.',
        observationPrompt: 'Assess the integration and effectiveness of IMS processes in the mining context.'
      },
      {
        id: 'ims-mine-c4-q5',
        text: 'How does the organization consider QEH&S risks and opportunities associated with its mining activities, products (e.g., minerals), and services throughout their life cycle?',
        auditCriteriaReference: 'ISO 9001:6.1, ISO 14001:6.1.1, 6.1.2, ISO 45001:6.1.1, 6.1.2.3',
        evidenceGatheringPrompt: 'Review integrated risk assessments covering quality (product specs, customer satisfaction), environmental (impacts of extraction, waste, water), and OH&S (worker safety, community health). Check if life cycle (exploration, operation, closure) is considered.',
        observationPrompt: 'Evaluate the comprehensiveness of the integrated risk and opportunity assessment process for mining.'
      },
      {
        id: 'ims-mine-c4-q6',
        text: 'Is there a process for identifying and managing legal and other requirements for Quality, Environmental, and OH&S aspects relevant to mining operations?',
        auditCriteriaReference: 'ISO 9001:8.2.2, ISO 14001:6.1.3, ISO 45001:6.1.3',
        evidenceGatheringPrompt: 'Review integrated legal register (mining leases, environmental permits, safety acts, quality standards). Check update mechanisms.',
        observationPrompt: 'Assess the system for maintaining compliance with all relevant QEH&S legal frameworks in mining.'
      },

      // IMS Clause 5: Leadership, Commitment & Worker/Stakeholder Engagement (QEH&S)
      {
        id: 'ims-mine-c5-q1',
        text: 'Does top management demonstrate integrated leadership and commitment for QEH&S in mining operations (e.g., promoting a unified QEH&S culture)?',
        auditCriteriaReference: 'ISO 9001:5.1, ISO 14001:5.1, ISO 45001:5.1',
        evidenceGatheringPrompt: 'Interview top management. Review integrated QEH&S policy, objectives, resource allocation. Observe leadership visibility in QEH&S initiatives.',
        observationPrompt: 'Assess top management\'s commitment to an integrated QEH&S approach.'
      },
      {
        id: 'ims-mine-c5-q2',
        text: 'Is there an integrated QEH&S policy suitable for mining operations, communicated, understood, and available to relevant parties?',
        auditCriteriaReference: 'ISO 9001:5.2, ISO 14001:5.2, ISO 45001:5.2',
        evidenceGatheringPrompt: 'Review integrated policy. Verify its communication (e.g., inductions, site postings) and worker understanding.',
        observationPrompt: 'Evaluate the effectiveness and integration of the QEH&S policy.'
      },
      {
        id: 'ims-mine-c5-q3',
        text: 'Are organizational roles, responsibilities, and authorities for the integrated QEH&S system in mining clearly defined, documented, and communicated?',
        auditCriteriaReference: 'ISO 9001:5.3, ISO 14001:5.3, ISO 45001:5.3',
        evidenceGatheringPrompt: 'Review IMS organizational structure, job descriptions. Interview personnel regarding their QEH&S roles.',
        observationPrompt: 'Confirm clarity of integrated QEH&S responsibilities.'
      },
      {
        id: 'ims-mine-c5-q4',
        text: 'Are there effective mechanisms for consultation and participation of workers (and their representatives) in the QEH&S aspects of mining operations?',
        auditCriteriaReference: 'ISO 45001:5.4 (OH&S focus, can extend principle)',
        evidenceGatheringPrompt: 'Review QEH&S committee minutes, worker feedback systems, participation in risk assessments or procedure development.',
        observationPrompt: 'Assess worker engagement in QEH&S matters specific to mining.'
      },
      {
        id: 'ims-mine-c5-q5',
        text: 'Does top management ensure customer focus by meeting customer and applicable QEH&S statutory/regulatory requirements related to mining products/services?',
        auditCriteriaReference: 'ISO 9001:5.1.2',
        evidenceGatheringPrompt: 'Review customer specifications, complaints, feedback mechanisms. Verify processes for ensuring product/service conformity while meeting EH&S obligations.',
        observationPrompt: 'Evaluate how customer requirements are met alongside EH&S compliance.'
      },
      {
        id: 'ims-mine-c5-q6',
        text: 'How does leadership ensure that QEH&S responsibilities are assigned and understood for emergency situations specific to mining (e.g., rock falls, gas outbursts, tailings dam issues)?',
        auditCriteriaReference: 'ISO 14001:8.2, ISO 45001:8.2, (Leadership aspects from Clause 5)',
        evidenceGatheringPrompt: 'Review emergency response plans for mining-specific scenarios, check assigned roles for emergencies. Interview emergency coordinators.',
        observationPrompt: 'Assess clarity of roles and leadership during simulated or actual mining emergencies.'
      },

      // IMS Clause 6: Planning - Risks, Opportunities, Objectives & Legal Compliance (QEH&S)
      {
        id: 'ims-mine-c6-q1',
        text: 'Are QEH&S risks and opportunities associated with mining operations (e.g., ground stability, water management, dust control, product quality, community impact) identified, assessed, and planned for?',
        auditCriteriaReference: 'ISO 9001:6.1, ISO 14001:6.1, ISO 45001:6.1',
        evidenceGatheringPrompt: 'Review integrated risk assessments. Check plans to address significant QEH&S risks/opportunities in mining.',
        observationPrompt: 'Evaluate the comprehensiveness of integrated QEH&S risk management.'
      },
      {
        id: 'ims-mine-c6-q2',
        text: 'Are integrated QEH&S objectives established for mining operations, consistent with the QEH&S policy and considering significant risks/aspects/impacts?',
        auditCriteriaReference: 'ISO 9001:6.2, ISO 14001:6.2, ISO 45001:6.2',
        evidenceGatheringPrompt: 'Review documented QEH&S objectives (e.g., safety targets, emission limits, product conformity rates). Verify measurability.',
        observationPrompt: 'Assess the alignment and integration of QEH&S objectives.'
      },
      {
        id: 'ims-mine-c6-q3',
        text: 'Is there planning to achieve integrated QEH&S objectives, including actions, resources, responsibilities, timelines, and evaluation methods specific to mining contexts?',
        auditCriteriaReference: 'ISO 9001:6.2, ISO 14001:6.2.2, ISO 45001:6.2.2',
        evidenceGatheringPrompt: 'Review action plans for QEH&S objectives. Check resource allocation (e.g., for pollution control, safety equipment, quality checks).',
        observationPrompt: 'Evaluate planning for achieving integrated QEH&S objectives.'
      },
      {
        id: 'ims-mine-c6-q4',
        text: 'Are processes for managing changes to mining operations, QEH&S system, or compliance obligations established to ensure unintended QEH&S consequences are addressed?',
        auditCriteriaReference: 'ISO 9001:6.3, 8.5.6, ISO 14001:8.1, ISO 45001:8.1.3',
        evidenceGatheringPrompt: 'Review Management of Change (MOC) procedures. Examine records of recent changes (e.g., new mining methods, equipment, regulations).',
        observationPrompt: 'Assess the effectiveness of the MOC process from an integrated QEH&S perspective.'
      },
      {
        id: 'ims-mine-c6-q5',
        text: 'How does the organization plan for controlling environmental aspects such as waste rock and tailings management, water discharge, and land rehabilitation in its mining activities?',
        auditCriteriaReference: 'ISO 14001:6.1.2, 8.1',
        evidenceGatheringPrompt: 'Review waste management plans, water treatment procedures, rehabilitation plans. Inspect relevant operational areas.',
        observationPrompt: 'Evaluate planning and controls for key environmental aspects in mining.'
      },
      {
        id: 'ims-mine-c6-q6',
        text: 'Are plans in place to ensure the quality of extracted minerals meets customer or processing requirements, considering variability in ore bodies?',
        auditCriteriaReference: 'ISO 9001:6.1, 8.1, 8.2.3',
        evidenceGatheringPrompt: 'Review quality control plans, geological survey data integration, sampling procedures, and process control for mineral processing.',
        observationPrompt: 'Assess planning for product quality assurance in mining and processing.'
      },

      // IMS Clause 7: Support - Resources, Competence, Awareness & Communication (QEH&S)
      {
        id: 'ims-mine-c7-q1',
        text: 'Are necessary resources (human, financial, technological, infrastructure like ventilation, water treatment, labs) for the IMS in mining determined and provided?',
        auditCriteriaReference: 'ISO 9001:7.1, ISO 14001:7.1, ISO 45001:7.1',
        evidenceGatheringPrompt: 'Review budgets, staffing for QEH&S roles, maintenance records for critical equipment. Interview personnel.',
        observationPrompt: 'Assess adequacy of integrated resources for QEH&S in mining.'
      },
      {
        id: 'ims-mine-c7-q2',
        text: 'Is personnel performing work affecting QEH&S in mining competent (education, training, experience), including specialized mining skills and QEH&S knowledge?',
        auditCriteriaReference: 'ISO 9001:7.2, ISO 14001:7.2, ISO 45001:7.2',
        evidenceGatheringPrompt: 'Review training records (e.g., mine safety training, environmental awareness, quality control procedures), competency assessments.',
        observationPrompt: 'Evaluate processes for ensuring QEH&S competence in the mining workforce.'
      },
      {
        id: 'ims-mine-c7-q3',
        text: 'Are persons working under the organization’s control in mining operations aware of the QEH&S policy, their contribution to IMS effectiveness, significant QEH&S aspects/risks, and implications of nonconformities?',
        auditCriteriaReference: 'ISO 9001:7.3, ISO 14001:7.3, ISO 45001:7.3',
        evidenceGatheringPrompt: 'Interview workers. Review induction materials, QEH&S briefings.',
        observationPrompt: 'Assess integrated QEH&S awareness levels.'
      },
      {
        id: 'ims-mine-c7-q4',
        text: 'Are effective internal/external communication processes for QEH&S matters in mining established (e.g., reporting safety hazards, environmental incidents, quality issues, community liaison)?',
        auditCriteriaReference: 'ISO 9001:7.4, ISO 14001:7.4, ISO 45001:7.4',
        evidenceGatheringPrompt: 'Review communication procedures, meeting minutes, reporting systems, community engagement records.',
        observationPrompt: 'Evaluate effectiveness of integrated QEH&S communication.'
      },
      {
        id: 'ims-mine-c7-q5',
        text: 'Is documented information required for the IMS in mining (e.g., mine plans, environmental monitoring records, safety procedures, quality specifications) created, updated, and controlled?',
        auditCriteriaReference: 'ISO 9001:7.5, ISO 14001:7.5, ISO 45001:7.5',
        evidenceGatheringPrompt: 'Review document control. Sample key QEH&S documents and records for control.',
        observationPrompt: 'Assess adequacy of IMS documented information management for mining.'
      },
      {
        id: 'ims-mine-c7-q6',
        text: 'Is there a system for ensuring the availability and suitability of monitoring and measuring resources required for verifying product/service conformity and ensuring valid EH&S results (e.g., calibrated lab equipment, survey tools)?',
        auditCriteriaReference: 'ISO 9001:7.1.5',
        evidenceGatheringPrompt: 'Review calibration records for assay labs, environmental monitoring equipment, surveying instruments. Check maintenance records.',
        observationPrompt: 'Assess the control and reliability of QEH&S monitoring and measuring equipment.'
      },

      // IMS Clause 8: Operational Planning & Control (Mining Specific - QEH&S)
      {
        id: 'ims-mine-c8-q1',
        text: 'Are operational controls implemented for mining processes (exploration, drilling, blasting, excavation, material handling, processing, waste disposal) to manage QEH&S risks and meet requirements?',
        auditCriteriaReference: 'ISO 9001:8.1, 8.5, ISO 14001:8.1, ISO 45001:8.1',
        evidenceGatheringPrompt: 'Review operational procedures for key mining activities. Observe work. Check compliance with QEH&S controls.',
        observationPrompt: 'Evaluate implementation and effectiveness of integrated QEH&S operational controls in mining.'
      },
      {
        id: 'ims-mine-c8-q2',
        text: 'Are processes for emergency preparedness and response specific to mining hazards (e.g., ground failure, inundation, fire, explosions, chemical spills, tailings dam failure) established, tested, and maintained?',
        auditCriteriaReference: 'ISO 14001:8.2, ISO 45001:8.2',
        evidenceGatheringPrompt: 'Review mine emergency response plans, drill records, emergency equipment status (e.g., refuge chambers, gas detectors).',
        observationPrompt: 'Assess readiness for mining-specific QEH&S emergencies.'
      },
      {
        id: 'ims-mine-c8-q3',
        text: 'Are controls for procurement of goods and services in mining (e.g., explosives, chemicals, contract drilling, maintenance services) ensuring QEH&S requirements are met?',
        auditCriteriaReference: 'ISO 9001:8.4, ISO 14001:8.1, ISO 45001:8.1.4',
        evidenceGatheringPrompt: 'Review procurement procedures, supplier/contractor QEH&S pre-qualification, contractual agreements, monitoring of contractor performance.',
        observationPrompt: 'Evaluate how QEH&S is managed in the mining supply chain.'
      },
      {
        id: 'ims-mine-c8-q4',
        text: 'For mineral processing, are controls in place to ensure product quality (e.g., grade, recovery, purity) while managing associated environmental (e.g., reagent use, tailings) and OH&S (e.g., chemical exposure, noise) aspects?',
        auditCriteriaReference: 'ISO 9001:8.5, ISO 14001:8.1, ISO 45001:8.1',
        evidenceGatheringPrompt: 'Review process control procedures, quality sampling/testing records, environmental monitoring data for processing plant, operator safety procedures.',
        observationPrompt: 'Assess integrated QEH&S management in mineral processing.'
      },
      {
        id: 'ims-mine-c8-q5',
        text: 'Are controls for identifying, storing, handling, and transporting hazardous materials used or generated in mining (e.g., explosives, fuels, reagents, concentrates) implemented effectively?',
        auditCriteriaReference: 'ISO 14001:8.1, ISO 45001:8.1',
        evidenceGatheringPrompt: 'Inspect chemical storage areas, review SDS availability, observe handling practices, check transport manifests and emergency spill response preparedness for hazardous materials.',
        observationPrompt: 'Evaluate the safe and environmentally sound management of hazardous materials in mining.'
      },
      {
        id: 'ims-mine-c8-q6',
        text: 'Are processes in place for the design and development of mine plans, infrastructure, or new processes, ensuring QEH&S requirements are considered at each stage?',
        auditCriteriaReference: 'ISO 9001:8.3 (Design & Development)',
        evidenceGatheringPrompt: 'Review design procedures, records of design reviews (including QEH&S input), validation of designs before implementation in mining projects.',
        observationPrompt: 'Assess how QEH&S is integrated into the design and development lifecycle for mining projects.'
      },

      // IMS Clause 9: Performance Evaluation - Monitoring, Audits & Management Review (QEH&S)
      {
        id: 'ims-mine-c9-q1',
        text: 'Are processes for monitoring, measurement, analysis, and evaluation of integrated QEH&S performance in mining established and effective?',
        auditCriteriaReference: 'ISO 9001:9.1, ISO 14001:9.1, ISO 45001:9.1',
        evidenceGatheringPrompt: 'Review QEH&S KPIs (e.g., safety stats, environmental compliance, product quality data), monitoring methods, data analysis, equipment calibration.',
        observationPrompt: 'Assess suitability and effectiveness of integrated QEH&S performance monitoring for mining.'
      },
      {
        id: 'ims-mine-c9-q2',
        text: 'Is compliance with QEH&S legal and other requirements relevant to mining operations periodically evaluated?',
        auditCriteriaReference: 'ISO 9001:9.1.2 (customer focus/statutory), ISO 14001:9.1.2, ISO 45001:9.1.2',
        evidenceGatheringPrompt: 'Review records of compliance audits/evaluations against mining regulations, environmental permits, quality standards.',
        observationPrompt: 'Evaluate the process for assessing integrated QEH&S compliance in mining.'
      },
      {
        id: 'ims-mine-c9-q3',
        text: 'Are internal audits of the IMS for mining operations conducted at planned intervals, covering QEH&S aspects effectively?',
        auditCriteriaReference: 'ISO 9001:9.2, ISO 14001:9.2, ISO 45001:9.2',
        evidenceGatheringPrompt: 'Review internal audit program, reports, auditor competence for QEH&S in mining, corrective actions.',
        observationPrompt: 'Assess effectiveness of the internal IMS audit program for mining.'
      },
      {
        id: 'ims-mine-c9-q4',
        text: 'Does top management review the IMS for mining operations at planned intervals to ensure its continuing QEH&S suitability, adequacy, and effectiveness?',
        auditCriteriaReference: 'ISO 9001:9.3, ISO 14001:9.3, ISO 45001:9.3',
        evidenceGatheringPrompt: 'Review management review minutes, agenda covering QEH&S performance in mining, inputs, and outputs.',
        observationPrompt: 'Evaluate thoroughness and effectiveness of integrated management reviews for mining.'
      },
      {
        id: 'ims-mine-c9-q5',
        text: 'Is customer satisfaction, including perception of product quality and responsible mining practices (EH&S), monitored and reviewed?',
        auditCriteriaReference: 'ISO 9001:9.1.2',
        evidenceGatheringPrompt: 'Review customer feedback, surveys, complaint records. Check if EH&S performance is part of customer communication or reporting.',
        observationPrompt: 'Assess how customer perception of overall QEH&S performance is gathered and analyzed.'
      },
      {
        id: 'ims-mine-c9-q6',
        text: 'Are results from QEH&S monitoring, audits, and reviews used to identify trends, weaknesses, and opportunities for improvement in mining operations?',
        auditCriteriaReference: 'ISO 9001:9.1.3, ISO 14001:9.1.1, ISO 45001:9.1.1',
        evidenceGatheringPrompt: 'Review trend analysis reports, performance dashboards, and how these feed into improvement planning.',
        observationPrompt: 'Evaluate the use of performance data for driving QEH&S improvements.'
      },

      // IMS Clause 10: Improvement - Nonconformities, Incidents & Continual Improvement (QEH&S)
      {
        id: 'ims-mine-c10-q1',
        text: 'Are QEH&S nonconformities (e.g., product defects, environmental spills, safety incidents) in mining operations identified, controlled, corrected, and are consequences dealt with?',
        auditCriteriaReference: 'ISO 9001:10.2, ISO 14001:10.2, ISO 45001:10.2',
        evidenceGatheringPrompt: 'Review procedures for nonconformity/incident management. Examine records of QEH&S nonconformities/incidents, investigations, corrective actions.',
        observationPrompt: 'Assess the integrated process for managing QEH&S nonconformities and incidents in mining.'
      },
      {
        id: 'ims-mine-c10-q2',
        text: 'Are actions taken to eliminate the causes of QEH&S nonconformities/incidents to prevent recurrence (corrective actions) in the mining context?',
        auditCriteriaReference: 'ISO 9001:10.2, ISO 14001:10.2, ISO 45001:10.2',
        evidenceGatheringPrompt: 'Verify root cause analysis for significant QEH&S issues. Check effectiveness of implemented corrective actions for mining-related problems.',
        observationPrompt: 'Evaluate the thoroughness of corrective actions in addressing root causes of QEH&S issues.'
      },
      {
        id: 'ims-mine-c10-q3',
        text: 'Does the organization continually improve the suitability, adequacy, and effectiveness of the IMS to enhance QEH&S performance in its mining operations?',
        auditCriteriaReference: 'ISO 9001:10.3, ISO 14001:10.3, ISO 45001:10.3',
        evidenceGatheringPrompt: 'Review evidence of QEH&S improvements (e.g., process optimization for quality/environment/safety, new technologies, reduced incidents/emissions/defects).',
        observationPrompt: 'Assess overall commitment and process for continual integrated QEH&S improvement in mining.'
      },
      {
        id: 'ims-mine-c10-q4',
        text: 'Are lessons learned from QEH&S incidents, nonconformities, and audits effectively communicated and used to drive improvements across mining operations?',
        auditCriteriaReference: 'ISO 9001:7.4, ISO 14001:7.4, ISO 45001:7.4, and respective 10.2 clauses',
        evidenceGatheringPrompt: 'Review safety alerts, quality bulletins, environmental advisories. Check how lessons are incorporated into training or procedures.',
        observationPrompt: 'Evaluate the organizational learning process from QEH&S events in mining.'
      },
      {
        id: 'ims-mine-c10-q5',
        text: 'Are proactive measures taken to improve QEH&S performance based on risk assessments, opportunities identified, and stakeholder feedback in the mining sector?',
        auditCriteriaReference: 'ISO 9001:6.1, 10.3, ISO 14001:6.1, 10.3, ISO 45001:6.1, 10.3',
        evidenceGatheringPrompt: 'Review improvement initiatives not stemming from nonconformities (e.g., new technology adoption for better safety or environmental performance, process changes for higher quality).',
        observationPrompt: 'Assess the organization\'s proactive approach to enhancing its integrated QEH&S performance in mining.'
      },
      {
        id: 'ims-mine-c10-q6',
        text: 'How are results of management reviews used to drive continual improvement of the IMS and its QEH&S outcomes in the context of mining?',
        auditCriteriaReference: 'ISO 9001:9.3.3, ISO 14001:9.3, ISO 45001:9.3',
        evidenceGatheringPrompt: 'Trace actions and decisions from management review minutes to implemented improvements or changes in objectives/plans for QEH&S.',
        observationPrompt: 'Verify that management review is an effective driver for continual QEH&S improvement.'
      }
    ],
  },
  {
    id: 'system-office-safety-v1', // Kept as is, since not part of the request to modify based on a specific ISO standard section per clause.
    name: 'Office Environment Safety',
    isSystemDefault: true,
    items: [
      { 
        id: 'os-1', 
        text: 'Are workstations ergonomically set up (chairs, desks, monitors)?', 
        auditCriteriaReference: 'Ergonomics Guideline ERG-001; DSE Regulations', 
        evidenceGatheringPrompt: 'Observe workstation setups. Interview users about comfort and adjustments. Review DSE assessment records.' 
      },
      { 
        id: 'os-2', 
        text: 'Are cables and cords managed to prevent trip hazards?',
        auditCriteriaReference: 'General Housekeeping Standards',
        evidenceGatheringPrompt: 'Visual inspection of walkways, under desks, and common areas for trailing cables.'
      },
      { 
        id: 'os-3', 
        text: 'Is there adequate ventilation and comfortable temperature?',
        auditCriteriaReference: 'Workplace (Health, Safety and Welfare) Regulations',
        evidenceGatheringPrompt: 'Assess air quality and temperature. Interview staff regarding comfort levels. Check HVAC maintenance records if available.'
      },
      { 
        id: 'os-4', 
        text: 'Are heavy items stored safely to prevent falling (e.g., on shelves, in cabinets)?',
        auditCriteriaReference: 'Manual Handling Operations Regulations; General storage safety',
        evidenceGatheringPrompt: 'Inspect storage areas, shelves, and cabinets for stability and load capacity. Check how heavy or bulky items are stored.'
      },
      { 
        id: 'os-5', 
        text: 'Are aisles, corridors, and emergency exit routes clear of obstructions?',
        auditCriteriaReference: 'Fire Safety Regulations; Workplace (Health, Safety and Welfare) Regulations',
        evidenceGatheringPrompt: 'Walk through all office areas, paying attention to pathways and exit routes for any blockages.'
      },
      { 
        id: 'os-6', 
        text: 'Is fire safety equipment (alarms, extinguishers, emergency lighting) functional, regularly inspected, and tested?', 
        auditCriteriaReference: 'Fire Safety Procedure FSP-001; Regulatory Reform (Fire Safety) Order', 
        evidenceGatheringPrompt: 'Check inspection tags on extinguishers. Review alarm test records and emergency lighting test logs.' 
      },
      { 
        id: 'os-7', 
        text: 'Are emergency contact numbers and procedures (e.g., for first aid, fire) clearly displayed and known by staff?',
        auditCriteriaReference: 'Emergency Procedures Document EMP-001',
        evidenceGatheringPrompt: 'Check notice boards for displayed information. Interview a sample of staff on their awareness of emergency contacts and basic procedures.'
      },
    ],
  },
  {
    id: 'system-blank-v1',
    name: 'Blank / Custom Checklist',
    isSystemDefault: true,
    items: [
        {
          id: 'blank-item-1', 
          text: 'Custom Item 1 (Edit me)',
          auditCriteriaReference: 'Specify criteria (e.g., standard, procedure, regulation)',
          evidenceGatheringPrompt: 'Describe what evidence to look for (e.g., records, observations, interviews)',
          observationPrompt: 'Guide for overall observation related to this item',
        }
    ],
  }
];
