# School Intel

DevX School Intelligence: a connected school operations and student-support platform for Dubai private schools.

## Project status

One web app for a school. The start page asks whether you are a **student, parent or teacher** (and remembers the answer), then you sign in with a login ID and passcode. After that you land in the right workspace:

- **Family workspace** (`apps/family-pwa`): students and parents. Installable, works on a phone and has a side rail on desktop.
- **Staff workspace** (`apps/staff-web`): teachers, pastoral and safeguarding staff, the school office, IT and leadership.
- **Start page and sign-in** (`apps/web`): role choice, login, and loading the right workspace.

The data comes from a SQLite file, [`apps/public/data/school.db`](apps/public/data/school.db), which is read in the browser when the app starts (sql.js). Nothing needs to run on the server: any host that can serve static files works. Changes people make (marks, registers, requests) are saved in that browser until a backend is added. A new release of `school.db` replaces them.

`services/api` enforces the PRD's permission rules and workflow states, and writes an audit log. It is **not** a production backend: there are no SIS/LMS connectors, no real AI provider and no server-side authentication.

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

The built-in AI (`services/api/src/ai.ts`) is a deterministic, rules-based stand-in for the school's approved model: keyword-grounded hints, rubric keyword matching with evidence sentences, template question generation and blueprint paper building. It never calls the network. The guardrails are the product rules: no generative study tools below Year 7, hints rather than answers, teacher confirmation before any mark is released, and every AI draft labelled and reviewed.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # permission rules, learning rules, login, and a check that school.db matches the seed
npm run build      # typecheck + static build in dist/
npm run preview    # serve the build at http://localhost:4173
npm run db:build   # rebuild apps/public/data/school.db from the seed data
```

## Accounts and the database

`school.db` holds:

| Table or view | What it is |
| --- | --- |
| `school_document` | The whole school (people, classes, subjects, materials, records) as one JSON document. This is what the app loads. |
| `accounts` | Logins: `login_id`, `role` (student, parent, teacher, admin), the person they belong to, and a scrypt `password_hash`. 231 logins. |
| `courses` | The syllabus catalogue: 142 CBSE, ICSE/ISC and Cambridge courses with topics and source links. |
| `meta` | Schema and data versions. |
| `students`, `staff`, `guardians`, `classes`, `subjects`, `topics`, `materials`, `questions` | Read-only views over the document for browsing with any SQLite tool. |

Sign in with a login ID from [docs/accounts.md](docs/accounts.md). The **initial passcode for every seeded login is `Horizon-2026`**. These are sample accounts: set `SCHOOL_INITIAL_PASSCODE` when running `npm run db:build` to use another one, and give people their own passcodes before using real records. First-time parents can also use the invitation code `482106` (Fatima Ahmed, parent of Sara and Adam).

Edit the seed in `services/api/src` and run `npm run db:build`; a test fails if the committed file is out of date. The build is deterministic, so the file only changes when the data does.

Because the database file is served to the browser, **anyone who can open the site can download it**. Passcodes are hashed, but a copy can be attacked offline, so this setup is for sample data and pilots only. Moving to real records needs a server-side API, a database, proper authentication and backups.

Sample logins to try:

| Role | Login ID | Try |
| --- | --- | --- |
| Student | `stu.sara` | Year 7A: the open quizzes, the timed science test, a past paper, the study helper and the written task |
| Student | `stu.cbse9.01` | Class 9 CBSE: the real Class 9 subjects and chapters |
| Parent | `par.fatima` | Children Sara (7A) and Adam (4B) |
| Teacher | `tch.nadia` | Maths teacher and Year 7 tutor: registers, question bank, quizzes, gradebook, merits |
| Teacher | `tch.priya` | Science: confirm AI-suggested marks for today's test, then release results |
| Teacher | `tch.james` | English: marking queue for three persuasive paragraphs |
| Staff | `staff.aisha` | Pastoral lead and safeguarding lead: support case SC-1042, restricted concern SG-026 |
| Staff | `staff.layla` | Office and attendance: family requests, absence explanations |
| Staff | `staff.karim` | School IT: connector health, mapping exceptions, failure simulation |
| Staff | `staff.samira` | Principal: aggregate measures and the audit log |

Each role only sees the areas and records it is authorised for. Visiting a restricted area shows the "This record is restricted" state and is recorded in the audit log. "Reload school data" in either workspace discards changes saved in the browser.

### Grades 9 to 13: real syllabus data

Besides the Year 7A scenario, the school has classes for CBSE (Class 9-12), ICSE (9-10), ISC (11-12), Cambridge IGCSE and O Level (Year 10-11) and AS and A Level (Year 12-13). Subjects, chapters and topics are the published syllabus titles; the students, parents and teachers are invented. See [docs/curriculum-data.md](docs/curriculum-data.md) for sources, licences and gaps.

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
apps/index.html       The single page the web app is served from
apps/web/             Start page (role choice), sign-in, and loading of the right workspace
apps/family-pwa/      Student and parent workspace (Pebble kit; side rail on desktop)
apps/staff-web/       Teacher and staff workspace / school CRM (Ledger kit)
apps/public/          Static files: manifest, service worker, icons, data/school.db
scripts/build-db.ts   Builds school.db from the seed data
services/api/         Seed data, database loader, permission checks, workflows, audit; tests
packages/ui/          Design tokens and shared accessible components
packages/contracts/   Shared data contracts (PRD §16 record contract)
docs/                 Requirements, design handoff, delivery plan, curriculum data, accounts
```

Stack: React 19, TypeScript, Vite, React Router (hash routing so the build works on any static host), SQLite read in the browser with sql.js, scrypt passcode hashes, lucide icons, self-hosted Fraunces, Figtree, IBM Plex Sans/Mono and Nunito fonts.

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
