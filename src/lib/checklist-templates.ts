
import type { ChecklistItemTemplate, ChecklistTemplate } from './types';

export const defaultChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'system-general-safety-v1',
    name: 'General Workplace Safety (ISO 19011 Aligned)',
    isSystemDefault: true,
    items: [
      { 
        id: 'gs-1-iso', 
        text: 'Verify emergency exits are maintained clear, unobstructed, and legibly marked.',
        auditCriteriaReference: 'Site Emergency Plan Sec 3.2; Local Fire Code Art. 5; OHSAS 18001/ISO 45001 Clause 8.2',
        evidenceGatheringPrompt: 'Visual inspection of all designated emergency exits. Check signage for legibility and correct placement. Review exit path inspection logs if available. Interview responsible person for exit maintenance.',
        observationPrompt: 'Assess overall accessibility, signage, and readiness of emergency exits. Note any obstructions or deficiencies observed.',
        defaultResponsiblePerson: 'Facilities Manager / Safety Officer',
      },
      { 
        id: 'gs-2-iso', 
        text: 'Confirm fire extinguishers are inspected, adequately charged, readily accessible, and appropriate for the hazards present.',
        auditCriteriaReference: 'Fire Safety Procedure FSP-001; NFPA 10; ISO 45001 Clause 8.2',
        evidenceGatheringPrompt: 'Check inspection tags for dates. Verify pressure gauge readings. Confirm accessibility and visibility. Cross-reference type with area hazards (SDS/Risk Assessment).',
        observationPrompt: 'Evaluate the overall fire extinguisher readiness program, including placement, condition, and staff awareness.',
      },
      { 
        id: 'gs-3-iso', 
        text: 'Assess availability, adequacy, and accessibility of first aid equipment.',
        auditCriteriaReference: 'First Aid Procedure FAP-003; Local First Aid Regulations',
        evidenceGatheringPrompt: 'Locate first aid stations/kits. Check contents against inventory list or regulatory requirements. Verify expiry dates of perishable items. Interview first aiders about accessibility.',
        observationPrompt: 'Note condition of kits, replenishment process, and visibility of first aid information.',
      },
      { 
        id: 'gs-4-iso', 
        text: 'Verify walkways, work areas, and storage areas are maintained free from slip, trip, and fall hazards.',
        auditCriteriaReference: 'Housekeeping Procedure HKP-002; General Duty of Care',
        evidenceGatheringPrompt: 'Conduct walk-through of representative areas. Look for spills, obstructions, poor cable management, uneven surfaces. Observe material storage practices.',
        observationPrompt: 'Document specific examples of good or poor housekeeping related to STF hazards. Evaluate effectiveness of controls.',
      },
      { 
        id: 'gs-5-iso', 
        text: 'Determine if adequate and appropriate lighting is provided in all work areas, including emergency lighting.',
        auditCriteriaReference: 'Lighting Standard LS-001; Illuminating Engineering Society (IES) recommendations',
        evidenceGatheringPrompt: 'Visual assessment during normal operations and simulated emergency (if safe). Review light level survey reports if available. Check emergency light test records.',
        observationPrompt: 'Assess suitability of lighting for tasks performed, noting any glare, shadows, or malfunctioning units.',
      },
      { 
        id: 'gs-6-iso', 
        text: 'Confirm relevant Personal Protective Equipment (PPE) is available, maintained in good condition, and used correctly by personnel as per documented requirements.',
        auditCriteriaReference: 'PPE Procedure PPE-004; Risk Assessments RA-005 to RA-010',
        evidenceGatheringPrompt: 'Observe PPE use in various work areas. Inspect condition of sampled PPE. Check PPE issue records and inspection logs. Interview employees on PPE training and suitability.',
        observationPrompt: 'Note compliance with PPE requirements, condition of PPE, and any observed misuse or lack of use.',
        defaultComments: 'Refer to specific PPE matrix for detailed requirements.'
      },
      { 
        id: 'gs-7-iso', 
        text: 'Verify Safety Data Sheets (SDS) for hazardous substances are readily accessible to employees and up-to-date.',
        auditCriteriaReference: 'Chemical Management Procedure CMP-007; GHS/HazCom Standard',
        evidenceGatheringPrompt: 'Request SDS for specific chemicals used. Check accessibility (e.g., binder, online portal). Verify revision dates on SDS. Interview employees on SDS location and understanding.',
        observationPrompt: 'Assess the effectiveness of the SDS management system.',
      },
      { 
        id: 'gs-8-iso', 
        text: 'Assess if electrical cords, equipment, and installations are maintained in good condition and used safely, including PAT records if applicable.',
        auditCriteriaReference: 'Electrical Safety Procedure ESP-005; Relevant electrical codes (e.g., NEC, BS7671)',
        evidenceGatheringPrompt: 'Visual inspection of representative electrical items for damage. Check for proper grounding, strain relief. Review Portable Appliance Testing (PAT) records. Observe usage practices.',
        observationPrompt: 'Note any damaged equipment, unsafe practices (e.g., daisy-chaining), or overdue inspections.',
        defaultResponsiblePerson: 'Maintenance Department / Electrical Supervisor',
      },
      { 
        id: 'gs-9-iso', 
        text: 'Verify that waste is segregated, stored, and disposed of in accordance with documented procedures and regulatory requirements.',
        auditCriteriaReference: 'Waste Management Procedure WMP-008; Environmental Permit EP-001',
        evidenceGatheringPrompt: 'Inspect waste storage areas. Check labeling of bins/containers. Review waste transfer notes or disposal records. Interview personnel responsible for waste handling.',
        observationPrompt: 'Assess compliance with waste segregation, storage conditions, and record-keeping for disposal.',
      },
      { 
        id: 'gs-10-iso', 
        text: 'Confirm employees are aware of emergency procedures, evacuation routes, and assembly points.',
        auditCriteriaReference: 'Emergency Response Plan ERP-001; Employee Training Records',
        evidenceGatheringPrompt: 'Interview a sample of employees. Review emergency drill records. Check for displayed emergency information. Observe an emergency drill if possible.',
        observationPrompt: 'Evaluate employee understanding of emergency actions and the effectiveness of communication and training.',
      },
    ],
  },
  {
    id: 'system-office-safety-v1',
    name: 'Office Environment Safety',
    isSystemDefault: true,
    items: [
      { id: 'os-1', text: 'Are workstations ergonomically set up (chairs, desks, monitors)?', auditCriteriaReference: 'Ergonomics Guideline ERG-001', evidenceGatheringPrompt: 'Observe workstation setups. Interview users about comfort and adjustments. Review DSE assessment records.' },
      { id: 'os-2', text: 'Are cables and cords managed to prevent trip hazards?' },
      { id: 'os-3', text: 'Is there adequate ventilation and comfortable temperature?' },
      { id: 'os-4', text: 'Are heavy items stored safely to prevent falling?' },
      { id: 'os-5', text: 'Are aisles and corridors clear of obstructions?' },
      { id: 'os-6', text: 'Is fire safety equipment (alarms, extinguishers) functional and tested?', auditCriteriaReference: 'Fire Safety Procedure FSP-001', evidenceGatheringPrompt: 'Check inspection tags. Review test records.' },
      { id: 'os-7', text: 'Are emergency contact numbers clearly displayed?' },
    ],
  },
  {
    id: 'system-construction-site-v1',
    name: 'Construction Site Safety (Basic)',
    isSystemDefault: true,
    items: [
      { id: 'cs-1', text: 'Is the site secured and access controlled?', auditCriteriaReference: 'Site Security Plan SSP-001', evidenceGatheringPrompt: 'Inspect site perimeter, access points, and signage. Review access logs.' },
      { id: 'cs-2', text: 'Are risk assessments and method statements (RAMS) in place for high-risk activities?', auditCriteriaReference: 'RAMS Procedure RAMS-001', evidenceGatheringPrompt: 'Review RAMS for selected high-risk tasks. Verify communication to relevant personnel.' },
      { id: 'cs-3', text: 'Is appropriate PPE being worn by all personnel on site?', auditCriteriaReference: 'Site PPE Matrix; RAMS', evidenceGatheringPrompt: 'Conduct site walk-through and observe PPE usage. Compare with requirements.' },
      { id: 'cs-4', text: 'Are scaffolding and access equipment inspected and tagged?', auditCriteriaReference: 'Scaffold Register; LOLER/PUWER Regs.', evidenceGatheringPrompt: 'Check scaffold tags. Review inspection records.' },
      { id: 'cs-5', text: 'Are excavation areas properly shored and barricaded?' },
      { id: 'cs-6', text: 'Is there a system for managing hazardous materials on site (storage, SDS, handling)?', auditCriteriaReference: 'COSHH Assessment; Chemical Register', evidenceGatheringPrompt: 'Inspect chemical storage areas. Verify SDS availability. Observe handling practices.' },
      { id: 'cs-7', text: 'Are temporary electrical installations safe and inspected?' },
      { id: 'cs-8', text: 'Is plant and equipment maintained and operated by competent persons?', evidenceGatheringPrompt: 'Review maintenance records and operator competency records.' },
      { id: 'cs-9', text: 'Are welfare facilities (toilets, drinking water) adequate and clean?' },
      { id: 'cs-10', text: 'Are emergency procedures and first aid provision in place and known?', auditCriteriaReference: 'Site Emergency Plan; First Aid Needs Assessment', evidenceGatheringPrompt: 'Locate first aid points. Interview site personnel on emergency actions.' },
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

    