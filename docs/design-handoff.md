# Design handoff

[Figma project](https://www.figma.com/design/kC2SHjbPtuxS5TfhbiuP8h?node-id=3-936)

## File organization

| Page | Contents |
| --- | --- |
| 00 · Foundations & handoff | Product entry, semantic colour tokens, typography, role visibility and implementation notes |
| 01 · Annotated wireframes | 14 populated staff wireframes with phase and requirement references |
| 02 · Staff desktop | 14 populated teacher, pastoral, administration and leadership screens |
| 03 · Parent & student mobile | 15 screens including guardian settings and populated forms |
| 04 · States & access | 11 sign-in, verification, success, error, stale-data and access states |

All examples use fictional school and learner identities. No DevX logo artwork has been recreated; the design uses editable product text.

## Foundations

Headings: Manrope Bold. Body and controls: Inter. Desktop reference width: 1440 px, sidebar: 232 px. Mobile reference width: 390 px. Related content uses auto-layout. Colours are semantic variables aliased to primitives. Button and input instances reuse the Simple Design System library.

| Token | Value |
| --- | --- |
| color/ink | #173332 |
| color/muted | #536866 |
| color/brand | #067A69 |
| color/soft | #E8F5EE |
| color/canvas | #F4F7F5 |
| color/surface | #FFFFFF |
| color/warning | #FFF1D8 |
| color/danger | #B53737 |
| color/border | #D7E3DC |
| color/nav | #123D36 |

## Workflow coverage

Teacher day → report drafts → draft review. Staff navigation links lead to corresponding portal screens. Parent daily view → school concierge → early collection request → receipt. Student learning day → assignment → server acceptance receipt. Confidential help → concern form → safe acknowledgement. Supporting states document missing evidence, restricted access, empty queues, upload interruption, notification failure and waiting lists.

These are design prototypes, not functioning data integrations. Prototype navigation does not execute approvals, uploads, notifications or access checks.

## PRD traceability

| Problem | Design coverage |
| --- | --- |
| P01 | Teacher Copilot, draft review and missing-evidence state |
| P02 | Family daily view and child switcher |
| P03 | Homework workload planner and editable duration chart |
| P04 | Student-support queue and case detail |
| P05 | Behaviour context and pattern review |
| P06 | Confidential student reporting and safeguarding workspace |
| P07 | Approved-information concierge and request escalation |
| P08 | Teacher-approved learning passport |
| P09 | Revision resources, submissions and acceptance receipts |
| P10 | Attendance reconciliation and pending-register handling |
| P11 | Activity booking, capacity and waiting lists |
| P12 | Assigned-route status, stale telemetry and leadership measures |

## Implementation requirements

Enforce permissions on the server. Keep grades and attendance authoritative in their source systems. Exclude restricted case details from general retrieval and notification previews. Use explicit server receipts for uploads. Show freshness and missing-data states. Implement Arabic RTL and accessibility testing before release; the current designs primarily demonstrate English layouts.

## Remaining engineering design

Finalize vendor contracts, responsive breakpoints, component state variants, backend schemas, notification SLAs, safeguarding policy and school-specific Arabic content. Do not treat static Figma screens as evidence of validated production behaviour.
