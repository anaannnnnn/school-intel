# DevX Dubai School Intelligence — PRD v1.0

Date: 6 October 2026.

This is a readable text extraction of the generated PDF. Page labels and tables retain their extracted formatting; the original PDF remains the layout reference.

<PARSED TEXT FOR PAGE: 1 / 22>

    DEVX | Dubai School Intelligence
    Product Requirements Document • Version 1.0 • 6 October 2026

    A connected school operations and student-support platform for Dubai private schools.


    What to build
    Build a responsive teacher and administration web portal, a parent/student progressive web app (PWA), and
    an integration backend. Start with teacher-approved drafting, one daily school view, and explainable
    student-support alerts. Retain the school’s existing student information system (SIS) and learning
    management system (LMS) as authoritative records.


    Decision this document enables
    Select a pilot school, agree on an integration contract, approve MVP scope, and estimate implementation
    using testable requirements. This is a proposed product specification; pilot schools have not yet validated the
    assumptions or committed to adoption.


    Evidence and limits
    The supplied research text is the discovery input. Its embedded citation tokens do not resolve to individual
    review URLs. Named-school complaints and alleged case studies therefore remain unverified leads and are
    not presented as findings about those schools. OECD and KHDA primary sources were checked separately.
    Historical findings are dated and should not be described as current prevalence.

    Technical features can improve visibility and coordination. They cannot by themselves resolve staffing
    shortages, bullying, poor pedagogy or student distress; assigned staff and school procedures remain
    essential.


    Document map
    1. Strategy and evidence • 2. Users and scope • 3–14. Twelve problem specifications • 15. Architecture • 16.
    Data and integrations • 17. Safety and AI • 18. Non-functional requirements • 19. Roadmap and pilot • 20.
    Acceptance and validation • 21. References and open decisions




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  1

<PARSED TEXT FOR PAGE: 2 / 22>

    1 | Strategy, evidence and outcomes

    Evidence register
      Evidence                     Interpretation and product relevance

      E1 — OECD, 2021              Dubai private-school teachers reported substantial stress and administrative
                                   pressure. This supports testing workload-reduction workflows. It does not
                                   prove AI savings or describe every school today.

      E2 — OECD, SSES              The Dubai chapter identifies relationships between social/emotional skills,
      2023 data                    attendance and wellbeing. These are associations, not a diagnostic model or
                                   evidence of causality.

      E3 — KHDA, 2022              Wellbeing Matters provides a monitoring and improvement framework. Product
                                   outputs can help schools document their own support workflows; this is not
                                   regulatory certification.

      E4 — Uploaded                Parent platform fragmentation, employee workload reviews, homework
      research                     consistency and transport/ECA claims are useful interview leads. Original
                                   review URLs and case-study records are missing.


    Product goals and proposed pilot targets
    • Reduce median weekly report-writing and routine communication time by 25% versus a measured baseline.

    • Reduce repetitive office enquiries by 20%, measured by category and excluding unresolved escalations.

    • Give every student-support alert an owner and a documented disposition; at least 90% reviewed within the
    school’s agreed working-day SLA.

    • Show reconciled academic and attendance records with visible freshness and source links.

    • Improve workflow completion without increasing teacher data-entry time.

    Targets are hypotheses, not promised outcomes. Measure a two-week baseline and compare like-for-like
    tasks during a six-week pilot; report cohort sizes, adoption and limitations.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                              2

<PARSED TEXT FOR PAGE: 3 / 22>

    2 | Users, delivery surfaces and MVP boundaries
      User                         Required access and workflows

      Teacher                      Own classes; draft feedback and comments; approve before publication;
                                   assignments and support referrals.

      Parent/guardian              Verified linked children; daily feed, official answers, requests and approved
                                   progress summaries.

      Student                      Age-appropriate tasks, revision and confidential help route under school policy.

      Pastoral/counsellor          Assigned support cases and authorised wellbeing signals; restricted notes.

      Safeguarding lead            Restricted report intake, triage, escalation and evidence management.

      Leadership                   Aggregated outcomes and authorised operational records; no blanket access
                                   to confidential case notes.

      School IT/admin              Roster mapping, connectors, policy configuration, audit and access
                                   administration.


    MVP inclusion
    One SIS connector and one LMS connector; roster/guardian verification; daily feed; approved circular search;
    teacher draft comments/feedback; rules-based support alerts; staff case ownership; audit logs and integration
    health.


    Deferred scope
    Confidential safeguarding intake, homework balancing, detailed mastery/exam tools, sports management and
    transport integrations require separate workflow validation. Native mobile apps, new ERP, biometric
    attendance, automated sanctions, mental-health diagnosis and autonomous final grading are outside the
    initial product.


    Procurement prerequisites
    A school sponsor, staff workflow owners, vendor API/export permission, data-processing agreement,
    approved hosting and AI provider, representative pilot classes, and a safeguarding escalation policy must
    exist before production use.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  3

<PARSED TEXT FOR PAGE: 4 / 22>

    3 | P01 — Teacher administrative overload

    Problem and evidence
    Teachers repeatedly assemble feedback, report comments and parent updates from separate records.
    Re-keying takes time and makes useful feedback harder to sustain.

    Evidence: E1; E4 review leads


    Written solution
    Provide an AI Teacher Copilot that prepares evidence-linked drafts for review. Teachers choose what to use
    and retain ownership of grades and communication.


    What to create
    Teacher portal with class selector, rubric upload, student-work viewer, draft editor and approval history.


    How technology integrates
    Fetch authorised assessment history and teacher notes; extract uploaded text; build a bounded prompt;
    return structured drafts with evidence references; save revisions and publish only after approval.


    Functional requirements
    • FR-T01: A teacher may generate drafts only for assigned classes and the selected reporting period.

    • FR-T02: Every factual statement links to a source record; insufficient evidence returns a missing-data
    warning.

    • FR-T03: Draft, edited, approved and published are separate states; bulk approval requires preview of each
    student.

    • FR-T04: Rubric suggestions never overwrite the authoritative grade without an explicit teacher action.


    Acceptance scenario
    Given two students with different records, drafts do not mix identities. Unapproved comments never reach
    parents. A corrected assessment generates a new draft version and preserves the previous audit history.

    Measure: Median minutes per comparable report; teacher edit effort; unsupported statement rate.

    Release/dependencies: MVP; requires roster, assessment history, rubrics and school writing policies.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                              4

<PARSED TEXT FOR PAGE: 5 / 22>

    4 | P02 — Disconnected parent and student platforms

    Problem and evidence
    Families must check several channels for homework, circulars, events and approvals; sibling information is
    easily missed.

    Evidence: E4 qualitative hypothesis


    Written solution
    Offer one daily view with source links and freshness badges, plus consolidated reminders.


    What to create
    Parent/student PWA with linked-child switcher, task feed, calendar, request centre and notification
    preferences.


    How technology integrates
    Map SIS child IDs to LMS users; ingest events and assignments; normalise and deduplicate records; expose
    a permission-filtered feed. Keep deep links when a vendor forbids writeback.


    Functional requirements
    • FR-F01: Parents see only verified linked children; custody/access changes revoke the relationship.

    • FR-F02: Every feed item shows source, last sync and status.

    • FR-F03: Notifications respect quiet hours except explicit emergency channels.

    • FR-F04: Sibling views separate schedules and show clashes.


    Acceptance scenario
    Changing a guardian link removes access on the next request. Repeated imports yield one item. During an
    LMS outage, cached items are marked stale and never shown as newly confirmed.

    Measure: Weekly active guardians; missed-action rate; duplicate notification count.

    Release/dependencies: MVP feed; payments and transport later.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                             5

<PARSED TEXT FOR PAGE: 6 / 22>

    5 | P03 — Cross-subject homework overload

    Problem and evidence
    Subject-level scheduling can create clustered deadlines. Total student workload is not visible to each teacher.

    Evidence: E4 interview and case-study leads


    Written solution
    Show aggregate workload before publishing an assignment and suggest less congested dates; teachers can
    override with reasons.


    What to create
    Teacher assignment planner, class workload heatmap and student evening plan.


    How technology integrates
    Import assignments; require teacher-estimated minutes; distribute work across available days using school
    policy and holidays; update totals when deadlines change. Estimates are not measured ability.


    Functional requirements
    • FR-H01: Homework requires duration estimate, class, due date and accommodations where authorised.

    • FR-H02: Configurable year-group thresholds show warnings rather than block teaching.

    • FR-H03: Override records rationale and notifies the year coordinator.

    • FR-H04: Deadline changes recalculate and notify affected students once.


    Acceptance scenario
    A 45-minute assignment pushes a class above its configured limit and displays affected dates before
    publication. A moved deadline removes the old reminder.

    Measure: Days above workload threshold; student-reported planning usefulness.

    Release/dependencies: Phase 2; assignment writeback depends on LMS permissions.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  6

<PARSED TEXT FOR PAGE: 7 / 22>

    6 | P04 — Student engagement changes noticed late

    Problem and evidence
    Attendance, missed tasks and changing attainment may sit in separate systems. Staff have no single queue
    for checking changes and following up.

    Evidence: E2; E3; local workflow validation needed


    Written solution
    Use explainable rules to suggest a human support check-in and track the intervention.


    What to create
    Pastoral support dashboard with evidence timeline, assigned owner, notes, action plan and review date.


    How technology integrates
    Calculate attendance over comparable periods, count missing submissions and check published attainment
    trends. Apply school-approved rules only when data completeness is sufficient.


    Functional requirements
    • FR-S01: Alerts list contributing signals, comparison periods and missing data.

    • FR-S02: No clinical diagnosis or automatic disciplinary action.

    • FR-S03: Owner records acknowledge, investigate, dismiss, support plan or closure with reason.

    • FR-S04: Review workload limits and fairness by year group and relevant authorised cohorts.


    Acceptance scenario
    A valid rule creates one open case, not duplicate daily alerts. Missing attendance produces an
    insufficient-data state. An authorised dismissal is audited and suppresses the same unchanged alert.

    Measure: Review timeliness; actionable-alert share; staff queue burden.

    Release/dependencies: MVP rules; wellbeing surveys and clinical notes excluded initially.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                           7

<PARSED TEXT FOR PAGE: 8 / 22>

    7 | P05 — Behaviour recorded without context

    Problem and evidence
    Separate incident logs can hide repeated locations, transitions or conflicts. Staff may respond inconsistently.

    Evidence: E4 employee review leads; E1 broad context


    Written solution
    Standardise incident capture and surface contextual patterns for pastoral review.


    What to create
    Staff incident form, student timeline and aggregated location/time dashboard.


    How technology integrates
    Normalise school-defined categories; link authorised incidents by student, time and place; apply configurable
    frequency rules and avoid unsupported causal conclusions.


    Functional requirements
    • FR-B01: Capture description, source, location, participants and verified/unverified status.

    • FR-B02: Positive behaviour and context are recorded alongside concerns.

    • FR-B03: Staff can correct an incident through versioned amendment.

    • FR-B04: Aggregate reports suppress small groups and avoid student rankings.


    Acceptance scenario
    Three independently entered events can be linked for review with their separate sources preserved. A
    corrected participant updates the pattern without deleting history.

    Measure: Repeat incident rate; recording time; consistency of follow-up.

    Release/dependencies: Phase 2; pastoral sign-off and taxonomy needed.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  8

<PARSED TEXT FOR PAGE: 9 / 22>

    8 | P06 — Bullying and safeguarding reporting trust

    Problem and evidence
    A student may hesitate to report concerns; receiving a report is only useful if responsible staff act and follow
    up.

    Evidence: E3; E4 unverified report leads


    Written solution
    Create confidential help intake with assigned case ownership, escalation and safe status updates.


    What to create
    Age-appropriate student help screen and separate restricted safeguarding console.


    How technology integrates
    Secure intake stores reports separately; deterministic urgent routing delivers to duty staff; evidence is
    access-controlled; missed acknowledgement escalates to a backup.


    Functional requirements
    • FR-C01: Explain confidentiality limits before submission; anonymous intake only if school policy supports it.

    • FR-C02: Do not send sensitive allegations in push/email previews.

    • FR-C03: Report survives notification failure; secondary alert and delivery monitoring are required.

    • FR-C04: Closure requires authorised review, action record and a safe follow-up plan.


    Acceptance scenario
    Submit a simulated urgent concern with primary delivery failure: the report remains stored, backup routing
    executes and duty staff can access it. Unauthorised staff and general AI search cannot retrieve the case.

    Measure: Acknowledgement time; overdue case count; safe follow-up completion.

    Release/dependencies: Phase 2 only after school-led safeguarding workflow acceptance.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                   9

<PARSED TEXT FOR PAGE: 10 / 22>

    9 | P07 — Repetitive parent enquiries

    Problem and evidence
    Routine questions compete with teaching and office work; answers may differ across email and informal
    channels.

    Evidence: E1 broad parent-pressure context; E4 hypothesis


    Written solution
    Answer from approved current circulars and route individual requests to staff.


    What to create
    Parent concierge, circular library and office request queue.


    How technology integrates
    Permission-filtered retrieval finds school-approved documents; responses include source and validity date;
    unknown answers become tickets. Personal requests use structured workflows.


    Functional requirements
    • FR-Q01: Answers cite an approved document or authorised structured record.

    • FR-Q02: No answer from expired circulars without a historical label.

    • FR-Q03: Early pickup uses approval, identity verification and security acknowledgement.

    • FR-Q04: AI cannot disclose another child’s data or safeguarding material.


    Acceptance scenario
    An unanswered policy question creates a ticket rather than invented guidance. Pickup is not confirmed until
    the authorised approver approves and the required recipients acknowledge.

    Measure: Routine tickets avoided; incorrect-answer rate; unresolved escalations.

    Release/dependencies: MVP official-information search; pickup workflow later.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                              10

<PARSED TEXT FOR PAGE: 11 / 22>

    10 | P08 — Progress feedback lacks actionable detail

    Problem and evidence
    A term percentage may not explain what a learner understands or what to practise next.

    Evidence: E4 assessment/inspection leads


    Written solution
    Publish teacher-approved learning summaries mapped to objectives and targeted practice.


    What to create
    Student learning passport and parent progress view.


    How technology integrates
    Map assessments to curriculum objective versions; distinguish assessment types; calculate mastery only
    where sufficient evidence exists and display confidence limitations.


    Functional requirements
    • FR-L01: Do not merge percentages from incompatible scales without school-approved mapping.

    • FR-L02: Teacher reviews strengths, gaps and recommended practice before sharing.

    • FR-L03: Display evidence date, objective and next review.

    • FR-L04: Accommodations and restricted notes follow role-specific permissions.


    Acceptance scenario
    One test item does not establish mastery. A summary with sparse data shows insufficient evidence, and
    changing an objective mapping creates a recalculation audit record.

    Measure: Feedback turnaround; approved plan completion; teacher usefulness rating.

    Release/dependencies: Phase 2; curriculum and item-level mapping required.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                         11

<PARSED TEXT FOR PAGE: 12 / 22>

    11 | P09 — Exam preparation and submission friction

    Problem and evidence
    Revision resources and deadlines can be scattered; students may lack proof that a submission succeeded.

    Evidence: E4 student workflow hypotheses


    Written solution
    Unify teacher-approved revision plans, syllabus-linked resources and reliable submission receipts.


    What to create
    Student exam planner, resource hub and submission status screen.


    How technology integrates
    Sync exams and assignments; verify file checksums and scan attachments; return server-issued receipts;
    map resources to objectives and respect licence restrictions.


    Functional requirements
    • FR-E01: Upload states are pending, received, processing, accepted or rejected; local upload is not proof of
    acceptance.

    • FR-E02: Receipt records server timestamp, file version and assignment ID.

    • FR-E03: Student sees late/missing policy and resubmission rules.

    • FR-E04: AI practice questions are teacher-approved; secure exam papers never enter general retrieval.


    Acceptance scenario
    A network interruption resumes safely without duplicate submission. Replacing a file creates a versioned
    receipt. An unauthorised student cannot obtain a restricted exam document.

    Measure: Failed submission rate; time spent finding resources; plan adherence.

    Release/dependencies: Phase 2; LMS receipt semantics and assessment integrity review.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                12

<PARSED TEXT FOR PAGE: 13 / 22>

    12 | P10 — Attendance records lack follow-up

    Problem and evidence
    Absence is captured but reconciliation, parent explanations and repeated lateness may be handled manually.

    Evidence: E2 attendance associations


    Written solution
    Reconcile attendance, track explanations and route recurring patterns for staff review.


    What to create
    Attendance dashboard, guardian explanation form and attendance officer queue.


    How technology integrates
    Read SIS registers as authoritative; distinguish absent, late, authorised and unknown; match timetable
    sessions and reject impossible dates.


    Functional requirements
    • FR-A01: Only authorised officers correct the official register via a supported workflow.

    • FR-A02: Pending or incomplete registers do not trigger absence notifications.

    • FR-A03: Explain absence with structured reasons and restricted attachments.

    • FR-A04: Longitudinal alerts link to the student-support case rather than duplicate it.


    Acceptance scenario
    A late teacher register does not notify parents that the child is absent. Corrected attendance withdraws the
    erroneous operational alert with a recorded amendment.

    Measure: False absence notifications; reconciliation time; unresolved explanations.

    Release/dependencies: MVP read-only signals; full absence workflow Phase 2.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                               13

<PARSED TEXT FOR PAGE: 14 / 22>

    13 | P11 — Sports and extracurricular coordination

    Problem and evidence
    Capacity, consent, clashes and cancellations may sit in spreadsheets or separate apps.

    Evidence: E4 operational hypothesis


    Written solution
    Offer booking, waiting lists, permissions and coordinated activity schedules.


    What to create
    Activities catalogue, parent booking, coach roster and attendance screen.


    How technology integrates
    Use transactional capacity controls; sync calendars; verify guardian consent; detect timetable/transport
    clashes; distribute cancellation events.


    Functional requirements
    • FR-X01: Enforce eligibility, capacity and required consent at booking.

    • FR-X02: Waiting-list promotion requires acceptance before its expiry.

    • FR-X03: Coaches see only necessary participant details.

    • FR-X04: Cancellation updates the parent, activity staff and relevant transport workflow.


    Acceptance scenario
    Two simultaneous requests for the final place create one confirmed booking. Withdrawing consent removes
    eligibility according to school policy and alerts the owner.

    Measure: Capacity utilisation; administrative time; missed cancellations.

    Release/dependencies: Phase 3; activity rules and provider agreements.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                           14

<PARSED TEXT FOR PAGE: 15 / 22>

    14 | P12 — Transport uncertainty and leadership blind
    spots

    Problem and evidence
    Parents may lack reliable bus status, while leaders lack consolidated operational measures and data-quality
    visibility.

    Evidence: E4 transport/dashboard hypotheses


    Written solution
    Integrate provider-approved bus events and produce actionable aggregate dashboards with owners.


    What to create
    Parent route status, transport operations queue and leadership dashboard.


    How technology integrates
    Ingest authorised GPS/events; calculate ETA with freshness; use student boarding events only where
    available. Join operational aggregates and expose connector reliability.


    Functional requirements
    • FR-O01: Show timestamp and uncertainty; stale GPS suppresses confident ETA.

    • FR-O02: Boarding claims require an explicit authorised event, not bus proximity.

    • FR-O03: Guardians see only assigned route information during permitted service windows.

    • FR-O04: Every dashboard metric has definition, denominator, freshness and accountable owner.


    Acceptance scenario
    A five-minute telemetry outage shows stale status instead of a precise arrival. A school-group user cannot
    drill into another campus without permission.

    Measure: ETA error when fresh; support calls; dashboard action completion.

    Release/dependencies: Phase 3; transport provider access is a dependency.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                              15

<PARSED TEXT FOR PAGE: 16 / 22>

    15 | Architecture and end-to-end processing

    Recommended initial design
    Use a modular backend with asynchronous integration jobs rather than many independent microservices.
    Deploy the web portal and PWA behind an authenticated API. Use a relational database for operational
    records, encrypted object storage for uploads, a durable job queue for imports and AI drafts, and a
    permission-filtered document index for approved circulars. These are design choices, not mandatory vendor
    selections.

      Layer                        Responsibilities

      Experience                   Teacher/admin browser portal; parent/student PWA; accessible English/Arabic
                                   layouts.

      Identity/API                 School SSO, guardian enrolment, server-side authorisation, tenant isolation,
                                   throttling and request validation.

      Domain services              Daily feed, draft approval, student-support cases, notifications, school policy
                                   configuration.

      Integration                  Vendor adapters, scheduled imports, webhooks where available, mapping and
                                   reconciliation.

      AI boundary                  Redaction, scoped retrieval, structured output validation, evidence links, draft
                                   version and usage cost logs.

      Data/operations              Relational records, encrypted attachments, access audit, job health, backup
                                   and restoration.


    Example: attendance to student support
    SIS export arrives → validate schema and school identity → map student IDs → reconcile the complete
    register → store source timestamp → emit attendance-changed event → evaluate eligible support rules →
    update one case → notify assigned staff → staff review evidence and record action.


    Failure behaviour
    Invalid rows enter a quarantine queue. Connector failure raises an IT alert and freshness banner. Rules
    pause when required data is stale. AI outage leaves source records and manual workflows usable.
    Notification failure does not delete cases; retry with deduplication and escalate delivery failures.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  16

<PARSED TEXT FOR PAGE: 17 / 22>

    16 | Data model, APIs and integration contract

    Core entities
    Tenant/School, User, RoleAssignment, Student, GuardianRelationship, ClassEnrolment, SourceMapping,
    Assignment, Submission, Assessment, Objective, AttendanceRecord, Incident, SupportCase, Intervention,
    Circular, Approval, Notification, ConsentRecord and AuditEvent. Safeguarding entities use a separate
    restricted data boundary.


    Record contract
    Every imported record carries tenant_id, source_system, source_record_id, source_updated_at, ingested_at,
    schema_version and validation_status. Canonical internal IDs remain stable; source IDs are preserved.
    Dates store UTC plus school timezone. Percentages retain scale and assessment type.


    Integration modes
    • Preferred: vendor-approved API or webhook with least-privilege service credentials.

    • Fallback: school-authorised scheduled CSV/SFTP import, reconciled with completeness checks.

    • Link-only: show an official deep link when data access or writeback is unavailable.

    • Never assume a specific SIS/LMS vendor supports the needed fields or licence tier.


    Proposed API surface
    GET /v1/me/children; GET /v1/students/{id}/feed; POST /v1/drafts; POST /v1/drafts/{id}/approve; GET
    /v1/support-cases; POST /v1/support-cases/{id}/actions; GET /v1/integrations/health. Each endpoint
    authorises tenant, role and record relationship on the server. Mutation requests use idempotency keys and
    version checks.


    Contract tests and ownership
    For each connector agree scope, rate limits, expected latency, identity mapping, deleted records, correction
    handling, historical coverage and writeback ownership. SIS owns roster/attendance; LMS owns
    assignments/submissions; this platform owns drafts, workflow states and its audit. Reconciliation must
    compare sample records and totals with the school before alerts activate.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                               17

<PARSED TEXT FOR PAGE: 18 / 22>

    17 | Permissions, student safety and AI controls

    Access and confidentiality
    • Use deny-by-default tenant and record access; verify guardian relationships through school-held records.

    • Require staff MFA and separate operational, pastoral and safeguarding roles. Audit support access and
    export.

    • Keep confidential reports, clinical details and safeguarding notes out of parent feeds and general AI
    retrieval.

    • Revoke access when enrolment, staff assignment or guardian rights change. Document emergency access
    with reason and review.


    AI release gates
    Approve provider terms, retention and training settings before using student data. Minimise identifiers and
    send only required fields. Filter retrieval by permissions before the model sees content. Treat uploaded
    documents as untrusted data, never as authority to change system instructions. Test injection attempts,
    cross-student leakage, unsupported statements, translation quality and model version regressions.

    Teacher-facing outputs remain drafts. Routine concierge answers need current source citations. Sensitive
    welfare and safeguarding advice routes to trained staff rather than an automated counsellor. Rule
    explanations show observable changes and do not label children as dangerous, depressed or dishonest.


    Policy-dependent decisions
    The school and qualified advisers must determine applicable data-protection obligations, processing basis,
    child/guardian notices, data residency, cross-border transfers, retention periods and access requests. This
    PRD specifies design controls and does not assert legal compliance. Record signed policy decisions before
    deployment.


    Retention and incident handling
    Set separate retention policies for source cache, drafts, audit, submissions and restricted cases; include
    backups and downstream processors. Restrict destructive deletion when an authorised hold exists. Test
    incident containment, access revocation, school notification and recovery using synthetic data.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                              18

<PARSED TEXT FOR PAGE: 19 / 22>

    18 | Non-functional requirements and operational design
      Proposed                     Verification / qualification
      requirement

      Availability                 99.5% monthly for MVP core workflows; agree maintenance windows. External
                                   vendor outages reported separately.

      Response time                p95 core reads under 2 seconds at agreed pilot load; long AI work uses
                                   asynchronous status and retries.

      Import freshness             API data within 15 minutes when vendor limits permit; export data follows
                                   agreed schedule. Show actual freshness everywhere.

      Load profile                 Initial target: one school, 2,000 students, 200 staff and 4,000 guardians;
                                   validate 500 concurrent sessions with synthetic data.

      Recovery                     Proposed RPO 24 hours and RTO 8 hours for MVP; safeguarding production
                                   needs a school-approved stronger continuity plan.

      Accessibility                Target WCAG 2.2 AA; test keyboard, screen reader, contrast and accessible
                                   forms; Arabic RTL and English.

      Mobile resilience            Retry/resume uploads; no sensitive offline case cache; visible receipt
                                   confirmation.

      Observability                Connector success/lag, failed jobs, notification delivery, AI latency/cost and
                                   access-denial metrics without sensitive payload logs.

      Security                     Encrypted transport and storage; secrets vault; scoped access; dependency
                                   scans and independent pre-launch review.


    Operational ownership
    Assign school IT for connector issues, department leads for draft quality, pastoral staff for support queues
    and safeguarding leads for restricted cases. Product support can inspect technical metadata by default;
    student content access requires a controlled authorised process.


    Cost control
    Track connector operations, storage, notification volume and AI tokens per school. Cache approved public
    answers appropriately; cap draft generation and queue long jobs. Set per-tenant budgets and show the
    school degraded AI service explicitly when a cap is reached.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                19

<PARSED TEXT FOR PAGE: 20 / 22>

    19 | Delivery plan, staffing and pilot economics
      Stage                        Deliverables and exit gate

      Weeks 1–2                    Interview users; map systems; baseline task times; approve school policy;
                                   secure vendor access. Exit: validated problem and connector sample.

      Weeks 3–5                    Identity, guardian verification, roster mappings, audit, SIS/LMS ingestion and
                                   health dashboard. Exit: reconciled data and isolation checks.

      Weeks 6–9                    Teacher draft workflow, daily feed and approved circular concierge. Exit:
                                   role-based UAT and no automatic publishing.

      Weeks 10–12                  Explainable rules, support queue, alerts and measures. Exit: staff ownership
                                   and tested failure recovery.

      Weeks 13–14                  Security/accessibility review, load tests, training and production readiness.
                                   Exit: documented school sign-off.

      Pilot: 6 weeks               Start with representative classes and consenting/authorised participants.
                                   Expand only after quality and adoption gates.
    Indicative schedule assumes available vendor APIs, one pilot school and timely school review. Discovery may
    change scope; it is not a fixed delivery promise.


    Team and effort assumption
    Suggested team: product/business analyst, technical lead, two engineers, UX designer, QA engineer and
    fractional security/data specialist; school IT, teachers and pastoral owners participate. MVP planning
    allowance: roughly 45–65 person-weeks, to be re-estimated after connector discovery.


    Budget method
    Estimate implementation as agreed person-weeks × blended delivery rate, plus connector licensing, hosting,
    AI usage, notification channels, security assessment, onboarding and support. No AED price is asserted
    without school scope and vendor quotes.


    Phase sequencing
    Phase 2: homework balancing, progress/exam tools, behaviour and properly staffed confidential reporting.
    Phase 3: transport, ECA and cross-campus analytics. Treat each as a separate adoption and integration
    decision.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                20

<PARSED TEXT FOR PAGE: 21 / 22>

    20 | Acceptance, pilot measurement and release gates

    Meaningful verification
    • Access matrix: attempt cross-school, cross-class and unlinked-child access through both UI and API; every
    unauthorised attempt must fail.

    • Data reconciliation: compare imported rosters, attendance and assignments with authoritative totals and
    sampled records; account for every exception.

    • AI evaluation: school-approved synthetic/de-identified set covering missing data, conflicting circulars,
    prompt injection, Arabic output and mixed identities; release only with zero observed critical leakage.

    • Workflow tests: draft rejection/editing, stale imports, duplicate events, corrected records, revoked guardian
    access, notification failures and restored backups.

    • User acceptance: teachers complete report tasks, parents find tonight’s actions, pastoral staff investigate
    and close simulated cases.


    Pilot design
    Collect baseline task times, office enquiry categories and support-review times before launch. Report
    medians and distribution rather than one anecdote. Log staff adoption and task complexity. Use a comparable
    group if feasible; otherwise state that changes cannot be attributed exclusively to the product.


    Go / revise / stop
    Go when school policy and owners are signed off, source records reconcile, permissions pass, unsupported
    AI statements are within the school-approved tolerance, and at least two core workflows improve without
    extra staff burden. Revise when integration friction or low adoption prevents useful measurement. Stop
    affected processing immediately on critical leakage, wrong-child publication or unsafe escalation failure.


    Feedback and decision log
    Maintain an issue owner, severity, evidence, remediation date and retest result. Review pilot findings weekly
    with school workflow owners. Do not use fewer reported incidents as proof that bullying decreased; reporting
    confidence and case outcomes must be considered together.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                  21

<PARSED TEXT FOR PAGE: 22 / 22>

    21 | Sources, validation backlog and open decisions

    Primary references checked on 6 October 2026
    E1: OECD (2021), teacher wellbeing chapter. Open primary source.

    E2: OECD, Dubai chapter using SSES 2023 data. Open primary source.

    E3: KHDA (7 December 2022), Wellbeing Matters. Open primary source.

    E4: Pasted text(1).txt, supplied discovery summary. Citation indices are unresolved in the attachment.
    Parent/teacher review allegations and school-specific case studies must be retrieved and verified before
    external use. No quotation or negative allegation about a named school is endorsed in this PRD.


    Discovery work still required
    • Interview 8–12 teachers, 5–8 parents, 2–3 pastoral leaders and school IT across at least two school
    contexts; student research follows school-approved safeguarding protocols.

    • Retrieve original review URLs, dates and exact context; distinguish genuine first-person reviews from
    vendor marketing and repeated claims.

    • Observe actual report-writing, homework publishing, absence reconciliation and support referral workflows.

    • Confirm SIS/LMS vendor, API fields, licence fees, export cadence, permitted writeback and deletion
    handling.

    • Validate the frequency of submission failures, transport uncertainty and ECA administration burden before
    building those modules.


    Decisions for school and product team
    Which curriculum/year groups form the pilot? Who owns support queues during holidays? Which data fields
    are permitted for AI? Which provider/hosting region is approved? What are guardian and student access
    rules? What retention periods apply? Which notifications are urgent? What baseline defines commercial
    success?


    Recommended next deliverable
    A school-specific integration discovery pack and prioritised backlog derived from this PRD, followed by tested
    teacher/parent prototypes before committing to Phase 2 modules.




DEVX | Dubai School Intelligence • Proposed PRD v1.0                                                                 22