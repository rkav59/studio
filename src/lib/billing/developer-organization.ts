/**
 * The developer's own organisation is a permanent internal workspace.
 * This is an organisation-scoped billing exemption, not an authorisation bypass.
 * Supabase authentication, active membership, role permissions, and RLS still apply.
 */
export const DEVELOPER_ORGANIZATION_ID = "8c393d9b-dc40-4d29-ac89-125854d5e95f";

type Membership = {
  organization_id: string | null;
  active: boolean;
};

export function isDeveloperOrganizationMember(
  membership: Membership | null | undefined,
  emailVerified: boolean,
): boolean {
  return (
    emailVerified &&
    membership?.active === true &&
    membership.organization_id === DEVELOPER_ORGANIZATION_ID
  );
}
