# Logins

Every person here is invented. Sign in at the start page: choose Student, Parent or Teacher, then enter the login ID and
the initial passcode (see the README, "Accounts and the database"). Passcodes are stored in `school.db` as scrypt hashes.
This list is generated from the `accounts` table; run `npm run db:build` after changing the seed.

Login ID patterns:

| Who | Pattern | Example |
| --- | --- | --- |
| Student | `stu.<class>.<nn>` | `stu.cbse9.01` |
| Parent | `par.<class>.<nn>` | `par.igcse10.01` |
| Teacher | `tch.<family>.<subject>.<lower or upper>` | `tch.cbse.physics.upper` |

Class keys: `cbse9` `cbse10` `cbse11s` `cbse11c` `cbse12s` `cbse12c` (s = Science, c = Commerce), `icse9` `icse10`,
`isc11s` `isc11c` `isc12s` `isc12c`, `igcse10` `igcse11`, `ol10` `ol11` (O Level), `as12s` `as12b` (AS Level, Science
or Business), `al13s` `al13b` (A Level). Teacher families: `cbse`, `cisce` (ICSE and ISC), `cie-sec` (IGCSE and O Level),
`cie-adv` (AS and A Level). The original Year 7A people use short IDs such as `stu.sara`, `par.fatima` and `tch.nadia`.

Access follows the class: a student sees only their class's subjects, a parent only their own child, and a teacher only
the classes of their board and stage. Parents can also sign in for the first time with the six-digit invitation code
`482106` (Fatima Ahmed, parent of Sara and Adam).

#### AS and A Level · Years 12–13

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cie-adv.accounting.upper` | Salma Joshi | teacher |
| `tch.cie-adv.biology.upper` | Leena Pillai | teacher |
| `tch.cie-adv.business.upper` | Ishaan Thomas | teacher |
| `tch.cie-adv.chemistry.upper` | Khalid Qureshi | teacher |
| `tch.cie-adv.computer-science.upper` | Zayd Khoury | teacher |
| `tch.cie-adv.economics.upper` | Priya Al Suwaidi | teacher |
| `tch.cie-adv.mathematics.upper` | Omar Ansari | teacher |
| `tch.cie-adv.physics.upper` | Rohan Kapoor | teacher |

#### CBSE · Classes 11–12

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cbse.accountancy.upper` | Zayd Nair | teacher |
| `tch.cbse.biology.upper` | Omar Menon | teacher |
| `tch.cbse.business-studies.upper` | Ishaan Rahman | teacher |
| `tch.cbse.chemistry.upper` | Meera Siddiqui | teacher |
| `tch.cbse.computer-science.upper` | Khalid Desai | teacher |
| `tch.cbse.economics.upper` | Priya Bhatia | teacher |
| `tch.cbse.english-core.upper` | Leena Nasser | teacher |
| `tch.cbse.informatics-practices.upper` | Salma Sheikh | teacher |
| `tch.cbse.mathematics.upper` | Rohan Haddad | teacher |
| `tch.cbse.physics.upper` | Dev Reddy | teacher |

#### CBSE · Classes 9–10

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cbse.english.lower` | Ibrahim Mansoor | teacher |
| `tch.cbse.mathematics.lower` | Faisal Thomas | teacher |
| `tch.cbse.science.lower` | Ananya Al Suwaidi | teacher |
| `tch.cbse.social-science.lower` | Mariam Joshi | teacher |

#### Class 10 · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse10.01` | Hana Nair | parent |
| `par.cbse10.02` | Sameer Rahman | parent |
| `par.cbse10.03` | Fatima Bhatia | parent |
| `par.cbse10.04` | Hamza Sheikh | parent |
| `stu.cbse10.01` | Ananya Nair | student |
| `stu.cbse10.02` | Mariam Rahman | student |
| `stu.cbse10.03` | Ibrahim Bhatia | student |
| `stu.cbse10.04` | Dev Sheikh | student |

#### Class 10 · ICSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.icse10.01` | Leena Nair | parent |
| `par.icse10.02` | Zayd Rahman | parent |
| `par.icse10.03` | Ishaan Bhatia | parent |
| `par.icse10.04` | Priya Varma | parent |
| `stu.icse10.01` | Yusuf Nair | student |
| `stu.icse10.02` | Aarav Rahman | student |
| `stu.icse10.03` | Amira Bhatia | student |
| `stu.icse10.04` | Arjun Varma | student |

#### Class 11 Commerce · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse11c.01` | Yusuf Varma | parent |
| `par.cbse11c.02` | Aarav Ansari | parent |
| `par.cbse11c.03` | Amira Kapoor | parent |
| `par.cbse11c.04` | Arjun Qureshi | parent |
| `stu.cbse11c.01` | Leena Varma | student |
| `stu.cbse11c.02` | Zayd Ansari | student |
| `stu.cbse11c.03` | Ishaan Kapoor | student |
| `stu.cbse11c.04` | Priya Qureshi | student |

#### Class 11 Commerce · ISC

| Login ID | Who | Role |
| --- | --- | --- |
| `par.isc11c.01` | Hana Khoury | parent |
| `par.isc11c.02` | Sameer Thomas | parent |
| `par.isc11c.03` | Fatima Al Suwaidi | parent |
| `par.isc11c.04` | Hamza Joshi | parent |
| `stu.isc11c.01` | Ananya Khoury | student |
| `stu.isc11c.02` | Mariam Thomas | student |
| `stu.isc11c.03` | Ibrahim Al Suwaidi | student |
| `stu.isc11c.04` | Dev Joshi | student |

#### Class 11 Science · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse11s.01` | Tariq Gupta | parent |
| `par.cbse11s.02` | Nikhil Hashmi | parent |
| `par.cbse11s.03` | Aaliyah Iyer | parent |
| `par.cbse11s.04` | Kabir Farouk | parent |
| `stu.cbse11s.01` | Meera Gupta | student |
| `stu.cbse11s.02` | Omar Hashmi | student |
| `stu.cbse11s.03` | Rohan Iyer | student |
| `stu.cbse11s.04` | Khalid Farouk | student |

#### Class 11 Science · ISC

| Login ID | Who | Role |
| --- | --- | --- |
| `par.isc11s.01` | Salma Ansari | parent |
| `par.isc11s.02` | Rayan Kapoor | parent |
| `par.isc11s.03` | Layla Qureshi | parent |
| `par.isc11s.04` | Sana Pillai | parent |
| `stu.isc11s.01` | Diya Ansari | student |
| `stu.isc11s.02` | Noor Kapoor | student |
| `stu.isc11s.03` | Zoya Qureshi | student |
| `stu.isc11s.04` | Faisal Pillai | student |

#### Class 12 Commerce · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse12c.01` | Ananya Joshi | parent |
| `par.cbse12c.02` | Mariam Mansoor | parent |
| `par.cbse12c.03` | Ibrahim Reddy | parent |
| `par.cbse12c.04` | Dev Siddiqui | parent |
| `stu.cbse12c.01` | Hana Joshi | student |
| `stu.cbse12c.02` | Sameer Mansoor | student |
| `stu.cbse12c.03` | Fatima Reddy | student |
| `stu.cbse12c.04` | Hamza Siddiqui | student |

#### Class 12 Commerce · ISC

| Login ID | Who | Role |
| --- | --- | --- |
| `par.isc12c.01` | Yusuf Haddad | parent |
| `par.isc12c.02` | Aarav Desai | parent |
| `par.isc12c.03` | Amira Nasser | parent |
| `par.isc12c.04` | Arjun Nair | parent |
| `stu.isc12c.01` | Leena Haddad | student |
| `stu.isc12c.02` | Zayd Desai | student |
| `stu.isc12c.03` | Ishaan Nasser | student |
| `stu.isc12c.04` | Priya Nair | student |

#### Class 12 Science · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse12s.01` | Diya Pillai | parent |
| `par.cbse12s.02` | Noor Khoury | parent |
| `par.cbse12s.03` | Zoya Thomas | parent |
| `par.cbse12s.04` | Faisal Al Suwaidi | parent |
| `stu.cbse12s.01` | Salma Pillai | student |
| `stu.cbse12s.02` | Rayan Khoury | student |
| `stu.cbse12s.03` | Layla Thomas | student |
| `stu.cbse12s.04` | Sana Al Suwaidi | student |

#### Class 12 Science · ISC

| Login ID | Who | Role |
| --- | --- | --- |
| `par.isc12s.01` | Tariq Mansoor | parent |
| `par.isc12s.02` | Nikhil Reddy | parent |
| `par.isc12s.03` | Aaliyah Siddiqui | parent |
| `par.isc12s.04` | Kabir Menon | parent |
| `stu.isc12s.01` | Meera Mansoor | student |
| `stu.isc12s.02` | Omar Reddy | student |
| `stu.isc12s.03` | Rohan Siddiqui | student |
| `stu.isc12s.04` | Khalid Menon | student |

#### Class 9 · CBSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.cbse9.01` | Salma Menon | parent |
| `par.cbse9.02` | Rayan Haddad | parent |
| `par.cbse9.03` | Layla Desai | parent |
| `par.cbse9.04` | Sana Nasser | parent |
| `stu.cbse9.01` | Diya Menon | student |
| `stu.cbse9.02` | Noor Haddad | student |
| `stu.cbse9.03` | Zoya Desai | student |
| `stu.cbse9.04` | Faisal Nasser | student |

#### Class 9 · ICSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.icse9.01` | Meera Menon | parent |
| `par.icse9.02` | Omar Haddad | parent |
| `par.icse9.03` | Rohan Desai | parent |
| `par.icse9.04` | Khalid Nasser | parent |
| `stu.icse9.01` | Tariq Menon | student |
| `stu.icse9.02` | Nikhil Haddad | student |
| `stu.icse9.03` | Aaliyah Desai | student |
| `stu.icse9.04` | Kabir Nasser | student |

#### ICSE and ISC · Classes 11–12

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cisce.accountancy.upper` | Aarav Joshi | teacher |
| `tch.cisce.biology.upper` | Kabir Thomas | teacher |
| `tch.cisce.business-studies.upper` | Diya Nair | teacher |
| `tch.cisce.chemistry.upper` | Nikhil Pillai | teacher |
| `tch.cisce.commerce.upper` | Amira Mansoor | teacher |
| `tch.cisce.computer-science.upper` | Yusuf Al Suwaidi | teacher |
| `tch.cisce.economics.upper` | Arjun Nasser | teacher |
| `tch.cisce.mathematics.upper` | Aaliyah Khoury | teacher |
| `tch.cisce.physics.upper` | Tariq Qureshi | teacher |

#### ICSE and ISC · Classes 9–10

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cisce.biology.lower` | Hana Farouk | teacher |
| `tch.cisce.chemistry.lower` | Sana Iyer | teacher |
| `tch.cisce.computer-applications.lower` | Hamza Kapoor | teacher |
| `tch.cisce.geography.lower` | Fatima Ansari | teacher |
| `tch.cisce.history-and-civics.lower` | Sameer Varma | teacher |
| `tch.cisce.mathematics.lower` | Rayan Gupta | teacher |
| `tch.cisce.physics.lower` | Layla Hashmi | teacher |

#### IGCSE and O Level · Years 10–11

| Login ID | Who | Role |
| --- | --- | --- |
| `tch.cie-sec.accounting.lower` | Meera Varma | teacher |
| `tch.cie-sec.biology.lower` | Ananya Gupta | teacher |
| `tch.cie-sec.business-studies.lower` | Ibrahim Iyer | teacher |
| `tch.cie-sec.chemistry.lower` | Faisal Sheikh | teacher |
| `tch.cie-sec.computer-science.lower` | Mariam Hashmi | teacher |
| `tch.cie-sec.economics.lower` | Dev Farouk | teacher |
| `tch.cie-sec.mathematics.lower` | Noor Rahman | teacher |
| `tch.cie-sec.physics.lower` | Zoya Bhatia | teacher |

#### Year 10 · Cambridge IGCSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.igcse10.01` | Diya Rahman | parent |
| `par.igcse10.02` | Noor Bhatia | parent |
| `par.igcse10.03` | Zoya Sheikh | parent |
| `par.igcse10.04` | Faisal Gupta | parent |
| `stu.igcse10.01` | Salma Rahman | student |
| `stu.igcse10.02` | Rayan Bhatia | student |
| `stu.igcse10.03` | Layla Sheikh | student |
| `stu.igcse10.04` | Sana Gupta | student |

#### Year 10 · Cambridge O Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.ol10.01` | Meera Ansari | parent |
| `par.ol10.02` | Omar Kapoor | parent |
| `par.ol10.03` | Rohan Qureshi | parent |
| `par.ol10.04` | Khalid Pillai | parent |
| `stu.ol10.01` | Tariq Ansari | student |
| `stu.ol10.02` | Nikhil Kapoor | student |
| `stu.ol10.03` | Aaliyah Qureshi | student |
| `stu.ol10.04` | Kabir Pillai | student |

#### Year 11 · Cambridge IGCSE

| Login ID | Who | Role |
| --- | --- | --- |
| `par.igcse11.01` | Ananya Hashmi | parent |
| `par.igcse11.02` | Mariam Iyer | parent |
| `par.igcse11.03` | Ibrahim Farouk | parent |
| `par.igcse11.04` | Dev Varma | parent |
| `stu.igcse11.01` | Hana Hashmi | student |
| `stu.igcse11.02` | Sameer Iyer | student |
| `stu.igcse11.03` | Fatima Farouk | student |
| `stu.igcse11.04` | Hamza Varma | student |

#### Year 11 · Cambridge O Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.ol11.01` | Leena Khoury | parent |
| `par.ol11.02` | Zayd Thomas | parent |
| `par.ol11.03` | Ishaan Al Suwaidi | parent |
| `par.ol11.04` | Priya Haddad | parent |
| `stu.ol11.01` | Yusuf Khoury | student |
| `stu.ol11.02` | Aarav Thomas | student |
| `stu.ol11.03` | Amira Al Suwaidi | student |
| `stu.ol11.04` | Arjun Haddad | student |

#### Year 12 Business · Cambridge AS Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.as12b.01` | Hana Bhatia | parent |
| `par.as12b.02` | Sameer Sheikh | parent |
| `par.as12b.03` | Fatima Gupta | parent |
| `par.as12b.04` | Hamza Hashmi | parent |
| `stu.as12b.01` | Ananya Bhatia | student |
| `stu.as12b.02` | Mariam Sheikh | student |
| `stu.as12b.03` | Ibrahim Gupta | student |
| `stu.as12b.04` | Dev Hashmi | student |

#### Year 12 Science · Cambridge AS Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.as12s.01` | Salma Desai | parent |
| `par.as12s.02` | Rayan Nasser | parent |
| `par.as12s.03` | Layla Nair | parent |
| `par.as12s.04` | Sana Rahman | parent |
| `stu.as12s.01` | Diya Desai | student |
| `stu.as12s.02` | Noor Nasser | student |
| `stu.as12s.03` | Zoya Nair | student |
| `stu.as12s.04` | Faisal Rahman | student |

#### Year 13 Business · Cambridge A Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.al13b.01` | Yusuf Kapoor | parent |
| `par.al13b.02` | Aarav Qureshi | parent |
| `par.al13b.03` | Amira Pillai | parent |
| `par.al13b.04` | Arjun Khoury | parent |
| `stu.al13b.01` | Leena Kapoor | student |
| `stu.al13b.02` | Zayd Qureshi | student |
| `stu.al13b.03` | Ishaan Pillai | student |
| `stu.al13b.04` | Priya Khoury | student |

#### Year 13 Science · Cambridge A Level

| Login ID | Who | Role |
| --- | --- | --- |
| `par.al13s.01` | Tariq Iyer | parent |
| `par.al13s.02` | Nikhil Farouk | parent |
| `par.al13s.03` | Aaliyah Varma | parent |
| `par.al13s.04` | Kabir Ansari | parent |
| `stu.al13s.01` | Meera Iyer | student |
| `stu.al13s.02` | Omar Farouk | student |
| `stu.al13s.03` | Rohan Varma | student |
| `stu.al13s.04` | Khalid Ansari | student |

#### Year 4 · 4B

| Login ID | Who | Role |
| --- | --- | --- |
| `stu.adam` | Adam Ahmed | student |

#### Year 7 and school parents

| Login ID | Who | Role |
| --- | --- | --- |
| `par.fatima` | Fatima Ahmed | parent |
| `par.khalid` | Khalid Khan | parent |
| `par.mariam` | Mariam Ali | parent |
| `par.rania` | Rania Hassan | parent |

#### Year 7 and school staff

| Login ID | Who | Role |
| --- | --- | --- |
| `staff.aisha` | Aisha Rahman | admin |
| `staff.karim` | Karim Mansour | admin |
| `staff.layla` | Layla Haddad | admin |
| `staff.samira` | Samira Qureshi | admin |
| `tch.daniel` | Daniel Reed | teacher |
| `tch.huda` | Huda Al Mansoori | teacher |
| `tch.james` | James Carter | teacher |
| `tch.nadia` | Nadia Farooq | teacher |
| `tch.priya` | Priya Menon | teacher |

#### Year 7 · 7A

| Login ID | Who | Role |
| --- | --- | --- |
| `stu.hamdan` | Hamdan Saleh | student |
| `stu.hana` | Hana Yousef | student |
| `stu.ibrahim` | Ibrahim Noor | student |
| `stu.leo` | Leo Martins | student |
| `stu.lina` | Lina Hassan | student |
| `stu.noor` | Noor Aziz | student |
| `stu.sara` | Sara Ahmed | student |
| `stu.yusuf` | Yusuf Ali | student |
| `stu.zara` | Zara Malik | student |

#### Year 8 · 8B

| Login ID | Who | Role |
| --- | --- | --- |
| `stu.omar` | Omar Khan | student |

#### Year 9 · 9C

| Login ID | Who | Role |
| --- | --- | --- |
| `stu.maya` | Maya Said | student |
