// Typical UK entry subjects (A-levels and useful GCSEs) for each of the 116
// university degrees, keyed by subject id. Shown to every school student as a
// fifth "Typical A-levels & GCSEs" section on the Further Study degree cards.
//
// These are TYPICAL, publicly known patterns (UCAS, Russell Group "Informed
// Choices", common admissions profiles), never per-university grades or points.
// Each entry ends by reminding the student that requirements vary by university
// and course. UK context only. No dashes in the prose (house style).

const SUBJECT_ENTRY_SUBJECTS = {
  // ── Data, Analytics & Quantitative Insight ──────────────────────────────
  sub_mathematics_and_statistics: `Almost all Mathematics and Statistics degrees require A-level Mathematics, usually at a high grade, and many prefer or require Further Mathematics too. A science or Economics can strengthen an application but is rarely essential. At GCSE, aim for strong grades in Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_data_science: `Most Data Science degrees require A-level Mathematics, and Further Mathematics or a science such as Computer Science or Physics is welcomed. At GCSE, strong grades in Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_statistics: `Statistics degrees require A-level Mathematics, usually at a high grade, and Further Mathematics is often preferred. A second quantitative subject helps but is rarely required. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course.`,

  sub_actuarial_science: `Actuarial Science almost always requires A-level Mathematics at a high grade, and Further Mathematics is preferred or required by many of the most competitive courses. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_mathematics: `A Mathematics degree requires A-level Mathematics, and most competitive courses either require or strongly prefer Further Mathematics as well. The most competitive courses may also require an admissions test such as the TMUA or STEP. At GCSE, aim for strong grades in Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_operational_research: `Operational Research degrees require A-level Mathematics, and Further Mathematics or a subject such as Economics or Computer Science is welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university, and the subject is also widely offered at master's level, so check each course.`,

  sub_financial_mathematics: `Financial Mathematics requires A-level Mathematics, usually at a high grade, and Further Mathematics is preferred by many courses. Economics is helpful but rarely essential. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course.`,

  // ── Software, AI & Digital Systems ──────────────────────────────────────
  sub_computer_science_and_artificial_intelligence: `Most Computer Science and Artificial Intelligence degrees require A-level Mathematics, and the more competitive courses prefer Further Mathematics as well. A-level Computer Science or Physics is welcomed but rarely essential. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_software_engineering: `Software Engineering degrees usually require or strongly prefer A-level Mathematics, and A-level Computer Science is welcomed. At GCSE, strong Maths and English are expected. Some courses accept a broader mix of subjects, so always check the specific entry profile.`,

  sub_computer_science_with_cyber_security: `This degree usually requires A-level Mathematics, with Computer Science or Physics welcomed. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_artificial_intelligence: `Artificial Intelligence degrees require A-level Mathematics, and Further Mathematics or a science is welcomed given how much the field relies on maths. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_computer_science: `Most competitive Computer Science degrees require A-level Mathematics, though some courses accept strong applicants without it. Further Mathematics or A-level Computer Science is welcomed but rarely essential, and a few competitive courses also require an admissions test such as the TMUA. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_cyber_security: `Cyber Security degrees often require or prefer A-level Mathematics, and Computer Science is welcomed. Some courses accept a wider range of subjects. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_games_technology: `Games Technology degrees usually require or prefer A-level Mathematics, with Computer Science or Physics welcomed, and more design-focused courses may ask for a portfolio. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_human_computer_interaction: `Entry varies widely: some Human Computer Interaction courses ask for A-level Mathematics or Computer Science, others accept a design or social science background or a portfolio. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course carefully.`,

  // ── Engineering, Manufacturing & Infrastructure ─────────────────────────
  sub_mechanical_engineering: `Mechanical Engineering requires A-level Mathematics and Physics, and Further Mathematics is welcomed by the most competitive courses. At GCSE, aim for strong grades in Maths, English and a science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_civil_engineering: `Civil Engineering requires A-level Mathematics, with Physics usually required (some courses accept another science or Design and Technology instead). At GCSE, strong Maths, English and a science are expected. Requirements vary by university, so check each course.`,

  sub_electrical_and_electronic_engineering: `This degree requires A-level Mathematics and Physics, and Further Mathematics is welcomed. At GCSE, aim for strong Maths, English and a science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_chemical_engineering: `Chemical Engineering requires A-level Mathematics and Chemistry, with Physics often preferred as a third subject. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_aeronautical_and_aerospace_engineering: `Aeronautical and Aerospace Engineering requires A-level Mathematics and Physics, with Further Mathematics welcomed by competitive courses. At GCSE, aim for strong Maths, English and a science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_manufacturing_engineering: `Manufacturing Engineering usually requires A-level Mathematics and Physics, though some courses accept Design and Technology or another science alongside Maths. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_robotics_and_mechatronic_engineering: `Robotics and Mechatronic Engineering requires A-level Mathematics and Physics, and Computer Science or Further Mathematics is welcomed. At GCSE, aim for strong Maths, English and a science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_biomedical_engineering: `Biomedical Engineering requires A-level Mathematics plus a science, most often Physics, though some courses accept Biology or Chemistry. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_systems_engineering: `Systems Engineering usually requires A-level Mathematics and Physics, with Further Mathematics or Computer Science welcomed. At GCSE, aim for strong Maths, English and a science. Requirements vary by university and course, so always check the specific entry profile.`,

  // ── Architecture, Built Environment & Spatial Design ────────────────────
  sub_architecture: `Most Architecture degrees specify no required subjects but expect a strong portfolio of creative work, and A-level Art or Design is helpful. Maths or Physics is welcomed by some courses, and Art at GCSE is useful. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_architecture_and_urban_planning: `This degree usually specifies no required subjects but values a portfolio and subjects such as Art, Geography or Maths. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile and any portfolio requirement.`,

  sub_architectural_technology: `Architectural Technology often prefers A-level Mathematics or a science, and Design and Technology or Art is welcomed, sometimes with a portfolio. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course.`,

  sub_construction_management: `Construction Management usually specifies no required subjects, though Maths and a science are helpful and welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_interior_architecture_and_design: `Most Interior Architecture and Design courses ask for a portfolio rather than specific subjects, with A-level Art or Design helpful. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_landscape_architecture: `Landscape Architecture usually specifies no required subjects but values a portfolio, with Art, Geography or a science helpful. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_urban_planning_and_development: `Urban Planning and Development typically specifies no required subjects, though Geography, Economics or a social science is helpful. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course.`,

  // ── Scientific Discovery & Innovation ───────────────────────────────────
  sub_biomedical_science: `Biomedical Science usually requires A-level Biology and Chemistry, with a third subject such as Maths or Physics welcomed. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_biochemistry: `Biochemistry requires A-level Chemistry and usually Biology, with Maths or Physics welcomed as a third subject. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_chemistry: `Chemistry degrees require A-level Chemistry, and most also require or strongly prefer Mathematics, with a second science welcomed. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_biology: `Biology degrees require A-level Biology, and most require or prefer a second science, usually Chemistry. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_physics: `Physics degrees require A-level Physics and Mathematics, and Further Mathematics is welcomed or required by the most competitive courses. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_neuroscience: `Neuroscience usually requires A-level Biology and Chemistry, with Maths, Physics or Psychology welcomed. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_biotechnology: `Biotechnology usually requires A-level Biology and Chemistry, with Maths welcomed as a third subject. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_natural_sciences: `Natural Sciences degrees are competitive and usually require two or three of Mathematics, Physics, Chemistry and Biology at A-level, depending on the specialisms you plan to study. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course carefully.`,

  sub_pharmacology: `Pharmacology usually requires A-level Chemistry and Biology, with Maths welcomed as a third subject. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  // ── Health Care & Medicine ──────────────────────────────────────────────
  sub_medicine: `Medicine requires A-level Chemistry at almost every school, and most also require Biology, though a few accept Physics or Maths instead, usually at high grades and often with a third strong subject. Almost all schools require an admissions test, now the UCAT. Strong GCSEs are expected, typically including Maths, English and the sciences. Requirements vary between medical schools, so check each one's entry profile and admissions test carefully.`,

  sub_dentistry: `Dentistry requires A-level Chemistry at almost every school, and most also require Biology, usually at high grades, with a free choice of third subject. Almost all schools require an admissions test, now the UCAT. Strong GCSEs are expected, including Maths, English and science. Requirements vary between dental schools, so check each one's entry profile and admissions test carefully.`,

  sub_pharmacy: `Pharmacy (MPharm) requires A-level Chemistry, plus a second science or Maths, usually Biology. At GCSE, aim for strong Maths, English and science. Requirements vary by university, so check each course.`,

  sub_nursing: `Nursing degrees usually ask for a broad range of subjects, with a science such as Biology preferred by many courses. At GCSE, strong grades in Maths, English and science are expected. Entry routes and requirements vary by university, so check each course.`,

  sub_midwifery: `Midwifery usually prefers or requires a science at A-level, most often Biology. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course and any additional entry requirements.`,

  sub_physiotherapy: `Physiotherapy usually requires a science at A-level, most often Biology or PE. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_occupational_therapy: `Occupational Therapy usually asks for a broad mix of subjects, with a science or social science preferred by some courses. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_paramedic_science: `Paramedic Science usually prefers a science at A-level, often Biology, and many courses have additional requirements such as a driving licence and health checks. At GCSE, aim for strong Maths, English and science. Requirements vary by university, so check each course carefully.`,

  sub_social_work: `Social Work degrees usually specify no required subjects, though a social science is helpful. At GCSE, strong grades in Maths and English are expected, and courses include interviews and background checks. Requirements vary by university, so check each course.`,

  sub_sport_and_exercise_science: `Sport and Exercise Science usually prefers a science at A-level, most often Biology or PE. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_diagnostic_radiography: `Diagnostic Radiography usually requires a science at A-level, often Physics or Biology. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course and any additional entry requirements.`,

  sub_optometry: `Optometry usually requires two sciences at A-level from Biology, Chemistry, Physics and Maths. At GCSE, aim for strong Maths, English and science. Requirements vary by university, so check each course.`,

  // ── Psychology & Human Behaviour ────────────────────────────────────────
  sub_psychology: `Many BSc Psychology degrees ask for a science, Maths or Psychology at A-level, while BA routes are often more flexible. Some universities set a GCSE Maths grade requirement, so aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_counselling_and_psychotherapy: `Counselling and Psychotherapy degrees usually specify no required subjects, though Psychology or a social science is helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_cognitive_science: `Cognitive Science often prefers Maths or a science at A-level given its links to psychology, computing and linguistics, but requirements vary. At GCSE, aim for strong Maths and English. Always check each course's specific entry profile.`,

  sub_forensic_psychology: `Forensic Psychology usually prefers a science, Maths or Psychology at A-level, in line with most psychology degrees. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_behavioural_science: `Behavioural Science often prefers Maths or a science at A-level, reflecting its use of data and statistics. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_psychology_with_neuroscience: `This degree usually requires or prefers Biology, and often Chemistry, at A-level, with Maths welcomed. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  // ── Education & Teaching ────────────────────────────────────────────────
  sub_education_studies: `Education Studies usually specifies no required A-level subjects. Most courses require GCSE Maths and English, and often Science, at grade 4 (C) or above. Requirements vary by university, so check each course.`,

  sub_primary_education_qts: `Primary Education with QTS usually specifies no required A-level subjects but has firm GCSE requirements: Maths, English and Science at grade 4 (C) or above. Courses include interviews and background checks. Requirements vary by university, so always check the specific entry profile.`,

  sub_early_years_education_and_care: `Early Years Education and Care usually specifies no required A-level subjects, with GCSE Maths and English expected at grade 4 (C) or above. Courses include interviews and background checks. Requirements vary by university, so check each course.`,

  sub_secondary_education_qts: `Secondary Education with QTS usually asks for an A-level in the subject you want to teach, for example Mathematics to teach maths. GCSE Maths and English at grade 4 (C) or above are required, and courses include interviews and background checks. Requirements vary by university and specialism, so always check the specific entry profile.`,

  sub_sports_coaching_and_development: `Sports Coaching and Development usually prefers PE or a science at A-level, though many courses accept a broad mix. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  // ── Law & Governance ────────────────────────────────────────────────────
  sub_law: `Most Law (LLB) degrees specify no required subjects and accept a wide range of A-levels. Essay-based subjects such as History, English or Politics help build the reading, writing and argument the course demands, and a few universities ask for at least one essay subject or the LNAT admissions test. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_politics: `Politics degrees usually specify no required subjects, though essay-based subjects such as History, Politics or Economics help build the skills the course uses. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_social_and_public_policy: `Social and Public Policy usually specifies no required subjects, with essay-based or social science subjects helpful. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_criminology: `Criminology usually specifies no required subjects, though social sciences such as Sociology or Psychology are helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_philosophy_politics_and_economics_ppe: `PPE is competitive and many courses require or strongly prefer A-level Mathematics for the economics, alongside essay-based subjects that support the philosophy and politics. At GCSE, aim for strong Maths and English. Requirements vary by university, and some require Maths, so always check the specific entry profile.`,

  sub_law_with_criminology: `Law with Criminology usually specifies no required subjects, with essay-based subjects helping build the reading and argument the course demands. At GCSE, strong Maths and English are expected. Some courses ask for the LNAT, so check each one's entry profile.`,

  // ── Business Strategy & Management ──────────────────────────────────────
  sub_business_management: `Most Business Management degrees specify no required subjects, though Maths or Economics is helpful and welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_business_analytics: `Business Analytics usually requires or prefers A-level Mathematics given its focus on data. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_international_business: `International Business usually specifies no required subjects, with a modern language or Economics helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_human_resource_management: `Human Resource Management usually specifies no required subjects, with a social science or business subject helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_operations_and_supply_chain_management: `Operations and Supply Chain Management usually specifies no required subjects, though Maths is helpful given the quantitative content. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  // ── Finance, Economics & Investment ─────────────────────────────────────
  sub_accounting: `Accounting degrees usually specify no required subjects, though Maths is preferred or required by some, and A-level Accounting or Economics is welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_finance: `Finance degrees often require or prefer A-level Mathematics, with Economics welcomed. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_accounting_and_finance: `Accounting and Finance usually prefers or requires A-level Mathematics at more competitive universities, with Economics or Accounting welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_economics: `Most competitive Economics degrees require A-level Mathematics, and top universities treat it as essential, with Further Mathematics or Economics welcomed. A few of the most competitive courses, such as LSE, also require an admissions test such as the TMUA. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_finance_and_financial_technology: `Finance and Financial Technology usually requires or prefers A-level Mathematics, with Computer Science or Economics welcomed given the technology focus. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_economics_with_data_science: `This degree requires A-level Mathematics, and Further Mathematics or a science is welcomed given the data focus. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_investment_management: `Investment Management usually requires or prefers A-level Mathematics, with Economics welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  // ── Entrepreneurship & New Ventures ─────────────────────────────────────
  sub_entrepreneurship_and_innovation: `Entrepreneurship and Innovation degrees usually specify no required subjects, with Maths or Economics helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_business_management_with_entrepreneurship: `This degree usually specifies no required subjects, though Maths or a business subject is helpful. At GCSE, aim for strong Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_social_enterprise_and_community_development: `Social Enterprise and Community Development usually specifies no required subjects, with a social science helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_innovation_and_technology_management: `Innovation and Technology Management usually specifies no required subjects, though Maths or Computer Science is helpful given the technology focus. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course.`,

  // ── Marketing, Media & Communication ────────────────────────────────────
  sub_marketing: `Marketing degrees usually specify no required subjects, with Business, Economics or a creative subject helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_public_relations_and_communications: `Public Relations and Communications usually specifies no required subjects, with English or Media helpful. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course.`,

  sub_digital_media_production_and_technology: `Digital Media Production and Technology usually specifies no required subjects, though Media, Film or Computing is helpful, and some courses ask for a portfolio or showreel. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and any portfolio requirement.`,

  sub_digital_marketing_and_social_media: `Digital Marketing and Social Media usually specifies no required subjects, with Business or a creative subject helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_journalism: `Journalism degrees usually specify no required subjects, though English is helpful, and some courses value writing samples or other evidence of your interest. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course.`,

  sub_advertising_and_brand_management: `Advertising and Brand Management usually specifies no required subjects, with Business, Media or a creative subject helpful, and more creative routes may ask for a portfolio. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course.`,

  sub_media_studies: `Media Studies usually specifies no required subjects, with Media or English helpful. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course.`,

  // ── Creative Arts, Design & Experience ──────────────────────────────────
  sub_product_design: `Product Design usually asks for a portfolio, with A-level Art, Design or Design and Technology helpful. Many students take an Art Foundation year first. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_graphic_design: `Graphic Design almost always requires a portfolio, with A-level Art or Design helpful, and many students complete an Art Foundation year first. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_animation: `Animation almost always requires a portfolio, with A-level Art or Design helpful, and an Art Foundation year is common. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_ux_design_and_interaction_design: `UX and Interaction Design courses often ask for a portfolio, with Art, Design or Computing helpful. At GCSE, aim for strong Maths and English. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_game_design: `Game Design usually asks for a portfolio, with Art, Design or Computing helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_fashion_design: `Fashion Design almost always requires a portfolio, with A-level Art or Textiles helpful, and an Art Foundation year is common. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_fine_art: `Fine Art requires a strong portfolio, usually with A-level Art, and most students complete an Art Foundation year before applying. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_film_and_television_production: `Film and Television Production courses often ask for a portfolio or showreel, with Media or Film helpful. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  sub_illustration: `Illustration requires a strong portfolio, usually with A-level Art, and an Art Foundation year is common. At GCSE, strong English and Maths are expected. Requirements vary by university, so check each course and its portfolio expectations.`,

  // ── Environment, Earth & Sustainability ─────────────────────────────────
  sub_geography: `Geography degrees usually prefer or require A-level Geography, and a science or Maths strengthens applications to more scientific (BSc) courses. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_environmental_science: `Environmental Science usually requires one or two sciences at A-level from Geography, Biology, Chemistry, Physics and Maths. At GCSE, aim for strong Maths, English and science. Requirements vary by university, so check each course.`,

  sub_environmental_management: `Environmental Management usually prefers Geography or a science at A-level, though many courses accept a broad mix. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_ecology_and_conservation_biology: `Ecology and Conservation Biology usually requires A-level Biology, with a second science or Geography welcomed. At GCSE, aim for strong Maths, English and science. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_climate_science_and_sustainability: `Climate Science and Sustainability usually requires or prefers a science or Maths at A-level, often Geography, Physics or Chemistry. At GCSE, strong Maths, English and science are expected. Requirements vary by university, so check each course.`,

  sub_sustainable_development: `Sustainable Development usually specifies no strict subjects, though Geography or a social science is helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  // ── Society, Culture & Global Perspectives ──────────────────────────────
  sub_modern_languages: `Modern Languages degrees usually require an A-level in the language you plan to continue, while beginner (ab initio) routes are more flexible. Essay-based subjects help. At GCSE, strong grades in Maths, English and a language are expected. Requirements vary by university, so check each course.`,

  sub_sociology: `Sociology usually specifies no required subjects, with essay-based or social science subjects helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_anthropology: `Anthropology usually specifies no required subjects, though a science can help for the biological side and essay subjects for the social side. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_international_relations: `International Relations usually specifies no required subjects, with essay-based subjects such as History, Politics or a language helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_history: `History degrees usually require or strongly prefer A-level History, with other essay-based subjects welcomed. At GCSE, strong Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_philosophy: `Philosophy usually specifies no required subjects, with essay-based subjects, and sometimes Maths, helpful for the reasoning it demands. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_global_development_studies: `Global Development Studies usually specifies no required subjects, with essay-based or social science subjects helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_real_estate_and_property: `Real Estate and Property usually specifies no required subjects, though Maths or Geography is helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_hospitality_tourism_and_events_management: `Hospitality, Tourism and Events Management usually specifies no required subjects, with a modern language or Business helpful. At GCSE, strong Maths and English are expected. Requirements vary by university, so check each course.`,

  sub_music: `Most Music degrees expect A-level Music, and many ask for a practical grade on your instrument or voice (often Grade 5 or above) plus Grade 5 music theory. Performance based courses and conservatoires usually audition. At GCSE, aim for strong grades in Music and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_music_technology: `Music Technology degrees usually welcome A-level Music, Music Technology, Physics or Maths, and some ask for a portfolio of your produced work. Practical experience with recording or production software helps. At GCSE, strong grades in Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_drama_and_theatre_studies: `Drama and Theatre Studies degrees value A-level Drama or Theatre Studies and often English, and some courses hold an audition or interview. Performance experience strengthens an application. At GCSE, aim for strong grades in English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_dance: `Most Dance degrees select mainly by audition, so training and technique matter more than specific A-levels, though A-level Dance or Performing Arts helps. At GCSE, aim for solid grades including English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_musical_theatre: `Musical Theatre courses almost always select by audition across acting, singing and dance, so preparation and experience matter most. A-level Drama, Music or Dance is useful but rarely essential. At GCSE, aim for solid grades including English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_technical_theatre_and_stage_management: `Technical Theatre and Stage Management courses value any A-levels, with Drama, Design Technology or Physics useful, and they care about practical experience and interest in live production. At GCSE, aim for solid grades including Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,


  sub_veterinary_medicine: `Veterinary Medicine is highly competitive and almost always requires A-level Biology and Chemistry at high grades, often with a third science or Maths, plus relevant work experience with animals. At GCSE, strong grades across the sciences, Maths and English are expected. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_animal_science: `Most Animal Science degrees ask for A-level Biology, with Chemistry, Maths or another science welcomed, and any animal or lab experience helps. At GCSE, aim for strong grades in the sciences, Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_agriculture: `Agriculture degrees usually welcome A-level Biology or another science, with Geography, Environmental Science or practical land experience useful, though some courses are flexible on subjects. At GCSE, aim for solid grades in the sciences, Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_forestry: `Forestry and arboriculture degrees typically welcome A-level Biology, Geography or Environmental Science, and value an interest in the outdoors and practical work. At GCSE, aim for solid grades in the sciences, Maths and English. Requirements vary by university and course, so always check the specific entry profile.`,

  sub_heritage_and_museum_studies: `Heritage and Museum Studies degrees usually welcome essay-based A-levels such as History, Art History, English, Geography or Archaeology. At GCSE, aim for strong grades including English. Requirements vary by university and course, so always check the specific entry profile.`,

};

module.exports = { SUBJECT_ENTRY_SUBJECTS };
