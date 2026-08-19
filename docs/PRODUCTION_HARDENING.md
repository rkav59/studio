# SHEiQpro Production Hardening

This document tracks the transition from the current feature-rich application to a production-grade multi-tenant SaaS.

## P0 launch blockers

- [x] Create dedicated production-hardening branch.
- [x] Version-control Firestore security rules.
- [x] Version-control Storage security rules.
- [x] Wire Firebase rules into `firebase.json`.
- [x] Stop ignoring TypeScript and build-time lint failures.
- [x] Add CI typecheck/build gate.
- [x] Stop granting new accounts the Premium plan automatically; use a time-limited trial.
- [ ] Migrate every business record to mandatory `organizationId` + `createdBy`/`userId` tenancy metadata.
- [ ] Replace client-only role checks with server-enforced RBAC for every sensitive operation.
- [ ] Complete Firestore rules for every collection, including approval and administrative actions.
- [ ] Replace user-scoped Storage paths with organization-scoped paths and enforce authorization.
- [ ] Implement invitation records with signed/hashed tokens, role, organization, expiry and acceptance state.
- [ ] Implement user suspension/deactivation through privileged server-side code.
- [ ] Implement immutable audit logging for security and compliance events.
- [ ] Implement Stripe Checkout/customer portal/webhooks and server-side entitlement enforcement.
- [ ] Add automated tests for tenant isolation and authorization.
- [ ] Add production error monitoring and alerting.
- [ ] Establish backup/restore and data-export procedures.

## P1 hardening

- [ ] MFA / stronger authentication controls.
- [ ] Site and department hierarchy.
- [ ] Approval workflows for risks, incidents, audits and permits.
- [ ] Immutable/versioned compliance records.
- [ ] Customer data export and account deletion workflows.
- [ ] AI quotas, rate limits and cost accounting.
- [ ] Sensitive health-data access model and retention controls.
- [ ] Malware/content validation for uploaded files.
- [ ] Security headers and production CSP review.
- [ ] Dependency and secret scanning in CI.

## Tenancy target

Every organization-owned business record should contain at minimum:

```text
organizationId
userId / createdBy
createdAt
updatedAt
```

Where operationally relevant, records should also reference:

```text
siteId
departmentId
```

Client-side visibility is never considered authorization. All access to organization data must be enforced by Firebase Security Rules or privileged server-side code.

## Launch gate

SHEiQpro must not be promoted to a commercial production environment until P0 items are complete and automated tests demonstrate that users from Organization A cannot read, modify, delete or enumerate Organization B's data.
