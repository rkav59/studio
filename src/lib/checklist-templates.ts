
import type { ChecklistTemplate } from './types';

export const defaultChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'general-safety-v1',
    name: 'General Workplace Safety',
    items: [
      { id: 'gs-1', text: 'Are emergency exits clear, unobstructed, and clearly marked?' },
      { id: 'gs-2', text: 'Are fire extinguishers inspected, charged, and accessible?' },
      { id: 'gs-3', text: 'Is first aid equipment available, stocked, and accessible?' },
      { id: 'gs-4', text: 'Are walkways and work areas free from slip, trip, and fall hazards?' },
      { id: 'gs-5', text: 'Is adequate lighting provided in all work areas?' },
      { id: 'gs-6', text: 'Is relevant PPE available, in good condition, and used correctly?' },
      { id: 'gs-7', text: 'Are safety data sheets (SDS) available for hazardous substances?' },
      { id: 'gs-8', text: 'Are electrical cords and equipment in good condition and used safely?' },
      { id: 'gs-9', text: 'Is waste disposed of correctly and are bins regularly emptied?' },
      { id: 'gs-10', text: 'Are employees aware of emergency procedures and evacuation routes?' },
    ],
  },
  {
    id: 'office-safety-v1',
    name: 'Office Environment Safety',
    items: [
      { id: 'os-1', text: 'Are workstations ergonomically set up (chairs, desks, monitors)?' },
      { id: 'os-2', text: 'Are cables and cords managed to prevent trip hazards?' },
      { id: 'os-3', text: 'Is there adequate ventilation and comfortable temperature?' },
      { id: 'os-4', text: 'Are heavy items stored safely to prevent falling?' },
      { id: 'os-5', text: 'Are aisles and corridors clear of obstructions?' },
      { id: 'os-6', text: 'Is fire safety equipment (alarms, extinguishers) functional and tested?' },
      { id: 'os-7', text: 'Are emergency contact numbers clearly displayed?' },
    ],
  },
  {
    id: 'construction-site-v1',
    name: 'Construction Site Safety (Basic)',
    items: [
      { id: 'cs-1', text: 'Is the site secured and access controlled?' },
      { id: 'cs-2', text: 'Are risk assessments and method statements (RAMS) in place for high-risk activities?' },
      { id: 'cs-3', text: 'Is appropriate PPE being worn by all personnel on site?' },
      { id: 'cs-4', text: 'Are scaffolding and access equipment inspected and tagged?' },
      { id: 'cs-5', text: 'Are excavation areas properly shored and barricaded?' },
      { id: 'cs-6', text: 'Is there a system for managing hazardous materials on site?' },
      { id: 'cs-7', text: 'Are temporary electrical installations safe and inspected?' },
      { id: 'cs-8', text: 'Is plant and equipment maintained and operated by competent persons?' },
      { id: 'cs-9', text: 'Are welfare facilities (toilets, drinking water) adequate and clean?' },
      { id: 'cs-10', text: 'Are emergency procedures and first aid provision in place and known?' },
    ],
  },
   {
    id: 'blank-v1',
    name: 'Blank / Custom Checklist',
    items: [
        {id: 'blank-item-1', text: 'Custom Item 1 (Edit me)'}
    ],
  }
];
