# Curriculum data for Grades 9 to 13

The demo now includes real syllabus structure for the boards a Dubai private school typically teaches, with invented
people. This page says what is real, where it came from, what may be reused, and what is still missing.

## What is real

| Board | Grades | Subjects in the demo | Source of chapter and topic titles |
| --- | --- | --- | --- |
| CBSE | Class 9, 10, 11, 12 (Science and Commerce streams from 11) | Maths, Science, Social Science, English; Physics, Chemistry, Biology, Maths, Computer Science, Accountancy, Business Studies, Economics, Informatics Practices, English Core | NCERT textbook contents pages (`ncert.nic.in`), 2026-27 curriculum on `cbseacademic.nic.in` |
| ICSE | Class 9, 10 | Maths, Physics, Chemistry, Biology, History and Civics, Geography, Computer Applications | CISCE syllabus PDFs (Year 2027; Computer Applications Year 2028) |
| ISC | Class 11, 12 (Science and Commerce) | Physics, Chemistry, Maths, Biology, Computer Science, Accountancy, Commerce, Economics, Business Studies | CISCE ISC syllabus PDFs (Year 2027) |
| Cambridge IGCSE | Year 10, 11 | Maths 0580, Physics 0625, Chemistry 0620, Biology 0610, Computer Science 0478, Business Studies 0450, Economics 0455 | Cambridge syllabus PDFs (cambridgeinternational.org) |
| Cambridge O Level | Year 10, 11 | Maths D 4024, Physics 5054, Chemistry 5070, Biology 5090, Computer Science 2210, Accounting 7707, Economics 2281 | same |
| Cambridge AS Level | Year 12 (Science, Business) | Maths 9709, Physics 9702, Chemistry 9701, Biology 9700, Computer Science 9618, Business 9609, Economics 9708, Accounting 9706 | same; AS topics only |
| Cambridge A Level | Year 13 (Science, Business) | same subjects | same; A Level (A2) topics only |

The full catalogue (142 courses, about 1,400 topics, including subjects the demo classes do not take) is
`services/api/src/curriculum/catalogue.json`. Each course has its official source URL. Cambridge topics carry the
syllabus sub-topic headings. Two-year IGCSE and O Level courses are split across Year 10 and Year 11.

Year numbering follows each board: Indian boards use Class 9 to 12; Cambridge uses Year 10 to 13. Age-wise Year 10 is
about Class 9 and Year 13 about Class 12. Year 9 (the start of some IGCSE courses) is not seeded.

## What the demo contains

* 20 classes, 4 students and 4 parents each (invented), 46 subject teachers shared by board and stage, a tutor per class.
* 112 subjects, about 940 topics, one syllabus guide per topic, and a 30-lesson weekly timetable per class.
* 206 login IDs: see [demo-accounts.md](demo-accounts.md).

A "syllabus guide" is not teaching content. It states the syllabus reference (board, code, chapter), lists the official
sub-topics where published, links the official source, and links free reading (Wikipedia and Wikibooks searches).
Teachers add their own notes, worksheets and questions.

## Licensing: what was and was not copied

* **Copied:** subject names, official subject codes, chapter or topic numbers and titles. These are facts about a
  published curriculum, and each course links to its source.
* **Not copied:** textbook text (NCERT's notice prohibits redistribution), syllabus body text, past papers, mark
  schemes, examiner reports. CBSE, CISCE and Cambridge materials are all-rights-reserved. They are not open licensed.
  Past papers are listed by official location only.
* **Open sources worth using next:** Wikipedia, Wikibooks and Wikiversity (CC BY-SA 4.0, with attribution); Oak National
  Academy (OGL v3.0, needs an API key); Hugging Face sets ARC (CC BY-SA 4.0), QASC (CC BY 4.0) and MMLU high-school
  subsets (MIT) for generic science and maths questions. OpenStax is mostly CC BY-NC-SA now, so link, do not copy.
  PhET, Khan Academy, CK-12 and MIT OCW are non-commercial, so link only.
* **Not suitable:** Hugging Face datasets of CBSE or IGCSE past papers carry licences the uploaders cannot grant;
  `KadamParth/Ncert_dataset` is generated from copyrighted NCERT text.

## Known gaps

* No question bank for the new subjects yet. Nothing open is syllabus-aligned for CBSE, ICSE or Cambridge, so questions
  need to be written by teachers or generated and reviewed. The Year 7A demo keeps its question bank.
* Hindi, languages and CBSE Class 11 and 12 History, Geography, Political Science, Psychology and Sociology titles were
  not extracted. English has no chapter list for Cambridge or CISCE.
* ISC and Cambridge sub-topics were extracted from PDFs by script and spot-checked, not proofread. A few Cambridge
  syllabuses have no sub-topic headings.
* The CBSE Class 10 two-board-exam rules came from news reports, not a CBSE circular.
* Edexcel and IB are not included.

Check anything you rely on against the board's current syllabus.
