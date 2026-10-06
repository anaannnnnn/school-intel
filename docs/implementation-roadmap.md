# Implementation roadmap

## Stage 1 — Discovery and integration contract

Confirm pilot school, year groups, workflows and accountable owners. Agree SIS/LMS permissions, fields, schema mapping, rate limits, correction/deletion handling and expected freshness. Measure baseline teacher task time and routine enquiry volume.

## Stage 2 — Platform foundation

Implement tenant isolation, school SSO, staff MFA, verified guardians, enrolment relationships, audit events and least-privilege role checks. Build idempotent import jobs, quarantine queues, reconciliation and health monitoring.

## Stage 3 — MVP workflows

Implement a consolidated feed, teacher draft generation/review/publication, current approved-circular retrieval, explainable support rules and assigned case actions. Provide stale, insufficient-data and notification failure behaviour.

## Stage 4 — Pilot readiness

Verify cross-tenant and unlinked-child denial through UI and API. Reconcile records with authoritative sources. Evaluate AI with school-approved synthetic or de-identified cases. Test prompt injection, wrong-child mixing, unsupported claims, interrupted uploads, job failures and restored backups. Run accessibility and load checks.

## Stage 5 — Six-week pilot

Use the PRD's proposed measures: matched-task drafting time, routine enquiries, support review timeliness and adoption. Report sample sizes and limitations. School stakeholders decide go, revise or stop.

## Later releases

Phase 2: homework balancing, learning/exam tools, attendance follow-up, behaviour and school-approved confidential reporting. Phase 3: activities, transport and broader analytics.

## Definition of done for production work

- PRD acceptance scenarios verified with meaningful tests.
- Required school policies and workflow owners recorded.
- Data freshness and corrections are visible and traceable.
- AI drafting never bypasses approval.
- No unresolved critical student-data leakage or escalation defect.
- Provider/licensing, hosting and data-processing arrangements approved by the school.

## Estimates

The PRD suggests an indicative 14-week MVP build plus a six-week pilot, subject to connector discovery and timely school review. Re-estimate before committing delivery dates or prices.
