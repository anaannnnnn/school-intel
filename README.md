# School Intel

DevX School Intelligence: a connected school operations and student-support platform for Dubai private schools.

## Project status

An interactive prototype of both surfaces is implemented and runs as static files:

- **Family app** (`apps/family-pwa`): an installable mobile web app (PWA) for parents and students.
- **Staff workspace** (`apps/staff-web`): the school CRM for teachers, pastoral and safeguarding staff, the school office, IT and leadership. It works on desktop, tablet and phone.

Both apps use `services/api`, an in-browser demo API with fictional seed data. It enforces the PRD's permission rules and workflow states and writes an audit log. It is **not** a production backend. There are no real SIS/LMS connectors, no AI provider and no authentication service.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (entry page → family app or staff workspace)
npm test           # PRD acceptance scenarios against the demo API
npm run build      # typecheck + static build in dist/
npm run preview    # serve the build at http://localhost:4173
```

Both apps are served from one origin, so they share the demo data store in your browser. Open the family app on a phone-sized window and the staff workspace in another tab. A request a guardian submits appears in the office queue, and an office decision appears in the family app.

### Demo sign-in

| Surface | How |
| --- | --- |
| Parent | "I'm a parent or guardian", invitation code `482106` (Fatima Ahmed, children Sara 7A and Adam 4B) |
| Student | "I'm a student" (Sara Ahmed, Year 7A) |
| Staff | Pick a staff member, then any six-digit MFA code |

| Staff member | Role | Try |
| --- | --- | --- |
| Nadia Farooq | Teacher, 7A | Teacher Copilot review → approve and publish; homework threshold override |
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

Homework balancing, behaviour and confidential reporting, learning passports, exam resources and submissions, attendance follow-up, activities and transport.

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

Stack: React 19, TypeScript, Vite, React Router (hash routing so the build works on any static host), lucide icons, self-hosted Inter and Manrope fonts.

## Design

The UI follows the Figma project's foundations: semantic colour tokens (`packages/ui/src/tokens.css`), Manrope headings with Inter body text, 8/16/24 spacing, 12 px cards, a 232 px deep-green staff sidebar and a 390 px mobile layout. On top of the static frames it adds:

- status chips, freshness and source indicators
- a bottom tab bar and child switcher for the mobile app
- sheets and dialogs that confirm irreversible steps
- empty, stale, restricted and error states
- subtle motion that respects `prefers-reduced-motion`
- logical CSS properties, so layouts are ready for Arabic right-to-left

The family app's language setting previews the right-to-left layout; Arabic content itself still needs school translations. "Show PRD references" in the staff account menu reveals the phase and requirement IDs from the designs.

## Data and evidence

Design school identities and operational metrics are fictional examples. Historical research is dated; unresolved review claims are validation leads rather than verified findings. Do not commit student records, credentials or confidential school case material.
