
import { redirect } from 'next/navigation';

export default function IncidentRiskRedirectPage() {
  redirect('/risk-management-hub?tab=occurrences-risks'); // Redirect to the relevant tab in the new hub
  return null; 
}
