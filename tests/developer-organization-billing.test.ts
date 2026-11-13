import assert from "node:assert/strict";
import test from "node:test";
import {
  DEVELOPER_ORGANIZATION_ID,
  isDeveloperOrganizationMember,
} from "../src/lib/billing/developer-organization";

test("active, verified members of the developer organisation are billing exempt", () => {
  assert.equal(
    isDeveloperOrganizationMember(
      { organization_id: DEVELOPER_ORGANIZATION_ID, active: true },
      true,
    ),
    true,
  );
});

test("developer organisation exemption applies to employees without admin role", () => {
  const employee = {
    organization_id: DEVELOPER_ORGANIZATION_ID,
    active: true,
  };
  assert.equal(isDeveloperOrganizationMember(employee, true), true);
});

test("a different organisation never inherits the developer exemption", () => {
  assert.equal(
    isDeveloperOrganizationMember(
      { organization_id: "f6b428d7-9a33-48be-a702-65b16d487bae", active: true },
      true,
    ),
    false,
  );
});

test("unverified or inactive memberships do not bypass billing", () => {
  assert.equal(
    isDeveloperOrganizationMember(
      { organization_id: DEVELOPER_ORGANIZATION_ID, active: true },
      false,
    ),
    false,
  );
  assert.equal(
    isDeveloperOrganizationMember(
      { organization_id: DEVELOPER_ORGANIZATION_ID, active: false },
      true,
    ),
    false,
  );
  assert.equal(isDeveloperOrganizationMember(null, true), false);
});
