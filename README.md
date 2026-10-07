# School Intel

DevX School Intelligence: a connected school operations and student-support platform for Dubai private schools.

## Project status

An interactive prototype of both surfaces is implemented and runs as static files:

- **Family app** (`apps/family-pwa`): an installable mobile web app (PWA) for parents and students.
- **Staff workspace** (`apps/staff-web`): the school CRM for teachers, pastoral and safeguarding staff, the school office, IT and leadership. It works on desktop, tablet and phone.

Both apps use `services/api`, an in-browser demo API with fictional seed data. It enforces the PRD's permission rules and workflow states and writes an audit log. It is **not** a production backend. There are no real SIS/LMS connectors, no AI provider and no authentication service.

### Learning, assessment and records

| Area | Students and parents (mobile app) | Staff (CRM) |
| --- | --- | --- |
| Study materials | Subjects, topics, notes, worksheets and video summaries; revision cards and a simpler reading level on request | Materials library and editor; AI drafts of revision cards and simplified versions, published only after review |
| AI study helper | Year 7 and above: step-by-step hints grounded in the class notes, with sources; one tap sends the conversation to the teacher | Student questions inbox, common themes per topic, teacher replies |
| Quizzes, tests, past papers | Instant feedback on quizzes; timed tests (the study helper pauses until submission); school-authored past papers as timed practice | Question bank with AI-drafted questions awaiting approval; paper builder from a topic blueprint; item analysis and topic insight |
| Marking | Formative "check my draft" feedback before submitting written work; marks only after release | Marking queue: AI suggests marks per rubric criterion with the quoted evidence and a confidence level; the teacher confirms or changes every mark, then releases |
| Exam preparation | Exam countdowns, readiness per topic, a study plan that puts the weakest topics first | Gradebook with topic mastery heatmap |
| Attendance | Lesson-by-lesson marks, term calendar, attendance rate | Lesson registers (present, late, absent, excused); families of absent students are notified on submit |
| Discipline | Merits and behaviour notes | Merits and demerits with family notification; class totals only, no individual rankings |

The demo AI (`services/api/src/ai.ts`) is a deterministic, rules-based stand-in for the school's approved model: keyword-grounded hints, rubric keyword matching with evidence sentences, template question generation and blueprint paper building. It never calls the network. The guardrails are the product rules: no generative study tools below Year 7, hints rather than answers, teacher confirmation before any mark is released, and every AI draft labelled and reviewed.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (entry page → family app or staff workspace)
npm test           # PRD acceptance scenarios and learning rules against the demo API
npm run build      # typecheck + static build in dist/
npm run preview    # serve the build at http://localhost:4173
```

Both apps are served from one origin, so they share the demo data store in your browser. Open the family app on a phone-sized window and the staff workspace in another tab. A request a guardian submits appears in the office queue, and an office decision appears in the family app.

### Demo sign-in

| Surface | How |
| --- | --- |
| Parent | "I'm a parent or guardian", invitation code `482106` (Fatima Ahmed, children Sara 7A and Adam 4B) |
| Student | "I'm a student" (Sara Ahmed, Year 7A): try the open quizzes, the timed science test, a past paper, the study helper and the written task |
| Staff | Pick a staff member, then any six-digit MFA code |

| Staff member | Role | Try |
| --- | --- | --- |
| Nadia Farooq | Maths teacher, 7A tutor | Lessons & registers; question bank (approve AI drafts); build a quiz; gradebook; award merits; Teacher Copilot |
| Priya Menon | Science teacher | Confirm AI-suggested marks for today's particles test, then release results; answer escalated student questions |
| James Carter | English teacher | Marking queue for three persuasive paragraphs (evidence highlighted per rubric criterion) |
| Huda Al Mansoori | Arabic teacher | Bilingual vocabulary materials and quiz |
| Aisha Rahman | Pastoral lead, safeguarding lead | Support case SC-1042; restricted concern SG-026 |
| Daniel Reed | PE teacher, pastoral | Assigned case SC-1043 |
| Layla Haddad | Office, attendance officer | Family requests inbox; absence explanations; guardian revocation |
| Karim Mansour | School IT | Connector health, mapping exceptions, failure simulation (LMS outage, stale bus, safeguarding delivery failure) |
| Samira Qureshi | Principal | Aggregate leadership measures and audit log |

Each role only sees the areas and records it is authorised for. Visiting a restricted area shows the "This record is restricted" state and is recorded in the audit log. "Reset demo data" in either app restores the 6 October 2026 scenario.

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

Homework balancing, behaviour and confidential reporting, learning passports, exam resources and submissions, attendance follow-up, activities and transport. The prototype now also covers study materials, the AI study helper, quizzes, tests and past papers, AI-assisted marking, lesson registers, the gradebook and merits (see the table above).

## Implementation structure

```text
apps/index.html       Product entry page
apps/family-pwa/      Parent and student mobile web app (PWA manifest + offline shell service worker in apps/public/family-pwa)
apps/staff-web/       Staff workspace / school CRM
services/api/         Demo API: seed data, permission checks, workflows, audit (browser storage); acceptance tests
packages/ui/          Design tokens and shared accessible components
packages/contracts/   Shared data contracts (PRD §16 record contract)
docs/                 Requirements, design handoff and delivery plan
```

Stack: React 19, TypeScript, Vite, React Router (hash routing so the build works on any static host), lucide icons, self-hosted IBM Plex Sans/Mono and Nunito fonts.

## Design

The two surfaces use kits from the [UI Kit Collection](https://www.figma.com/file/KGGDuwKLk60dTA9F0HQ9aB) Figma file:

- **Staff workspace: Ledger** (clinical calm). Teal `#0f7c7a` accent, IBM Plex Sans with Plex Mono for figures, a 268 px white sidebar with a pill search and mono section labels, Card/Stat with icon tiles and mini bars, underline tabs, list rows with 44 px icon tiles, 12 px cards. Tokens live at the top of `apps/staff-web/src/staff.css`.
- **Mobile app: Pebble** (soft and friendly). Lavender `#6d5df6` accent, Nunito, pill buttons, 28 px cards, an accent hero card, a pill segmented control and a bottom tab bar with a 56 × 32 pill indicator. Tokens live at the top of `apps/family-pwa/src/family.css`.

Both themes re-map the semantic tokens in `packages/ui/src/tokens.css`, so the shared components (`packages/ui`) adopt each kit. On top of the kits the apps add:

- status chips, freshness and source indicators
- a bottom tab bar and child switcher for the mobile app
- sheets and dialogs that confirm irreversible steps
- empty, stale, restricted and error states
- subtle motion that respects `prefers-reduced-motion`
- logical CSS properties, so layouts are ready for Arabic right-to-left

The family app's language setting previews the right-to-left layout; Arabic content itself still needs school translations. "Show PRD references" in the staff account menu reveals the phase and requirement IDs from the designs.

## Data and evidence

Design school identities and operational metrics are fictional examples. Historical research is dated; unresolved review claims are validation leads rather than verified findings. Do not commit student records, credentials or confidential school case material.
