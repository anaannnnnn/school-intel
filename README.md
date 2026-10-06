# School Intel

DevX School Intelligence: a connected school operations and student-support platform for Dubai private schools.

## Project status

Product specification and Figma design handoff are available. Application implementation has not started. This repository does not yet contain a runnable app or production integrations.

## Product and design

- [Product requirements document](docs/prd.md): text extracted from the 22-page PRD, v1.0, 6 October 2026.
- [Figma design project](https://www.figma.com/design/kC2SHjbPtuxS5TfhbiuP8h?node-id=3-936): editable wireframes, staff desktop screens, parent/student mobile screens, and workflow states.
- [Design handoff](docs/design-handoff.md)
- [Implementation roadmap](docs/implementation-roadmap.md)

## MVP

1. School identity, verified guardian relationships and role-based access.
2. One SIS connector and one LMS connector with reconciliation and freshness indicators.
3. Teacher-reviewed feedback and report drafts.
4. Consolidated daily feed and approved school-information search.
5. Explainable student-support rules, assigned cases and follow-up tracking.
6. Audit logs and integration health monitoring.

Existing SIS/LMS records remain authoritative. AI-generated teacher content stays private until teacher approval. Student support signals suggest human review, not diagnoses or automatic sanctions.

## Later phases

Homework balancing, behaviour and confidential reporting, learning passports, exam resources and submissions, attendance follow-up, activities and transport.

## Planned implementation structure

```text
apps/staff-web/       Teacher and administrator portal
apps/family-pwa/      Parent and student progressive web app
services/api/         Domain services and integration workers
packages/ui/         Shared accessible interface components
packages/contracts/  Shared API schemas and data contracts
docs/                Requirements, design handoff and delivery plan
```

The application directories above are proposed, not implemented.

## Data and evidence

Design school identities and operational metrics are fictional examples. Historical research is dated; unresolved review claims are validation leads rather than verified findings. Do not commit student records, credentials or confidential school case material.
