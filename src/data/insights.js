// Insights: evidence-based articles shown on the Profile page.
// Add new articles at the top. `audience`: 'school', 'university' or 'all'.
//
// Body lines:
//   "## Heading"      a subheading
//   "- text"          a bullet
//   "@chart:<id>"     the chart from CHARTS with that id
//   anything else     a paragraph
// Inside a paragraph, [1] becomes a small linked number pointing at
// sources[0] (opens in a new tab), and *text* is set in italics.
//
// Text approved by George, 6 Nov 2026 (CareerDNA Insights articles.docx).

export const AUTHOR = {
  name: 'George Alexandridis',
  role: 'Founder & CEO, CareerDNA',
};

// Chart data. type 'bars': one bar per row (negative values draw to the left
// of a centre line). type 'groups': a few bars per row, one per series.
export const CHARTS = {
  fit: {
    type: 'bars',
    title: 'When a job fits you, almost everything about work gets better',
    subtitle: 'How strongly fitting your job is linked to each outcome, from 172 studies',
    rows: [
      { label: 'Happier in the job', value: 0.56, tag: 'strong', accent: true },
      { label: 'More committed to the employer', value: 0.47, tag: 'strong' },
      { label: 'Less likely to plan to quit', value: 0.46, tag: 'strong' },
      { label: 'Less stress at work', value: 0.28, tag: 'moderate' },
      { label: 'Better performance', value: 0.2, tag: 'small' },
    ],
    format: 'r',
    max: 0.6,
    note: 'The scale runs from 0 (no link) to 1 (a perfect link). In studies of people, anything above 0.4 is a strong link.',
    source: 'Kristof-Brown, Zimmerman & Johnson (2005), Personnel Psychology. 172 studies combined.',
  },
  gaps: {
    type: 'groups',
    title: 'More than half of employers now say new graduates lack self-awareness',
    subtitle: 'Share of UK graduate employers saying new hires fell short of expectations',
    series: ['2023', '2024', '2025'],
    rows: [
      { label: 'Self-awareness', values: [35, 43, 54], accent: true },
      { label: 'Resilience', values: [30, 37, 46] },
    ],
    format: 'pct',
    max: 60,
    source: 'Institute of Student Employers, Student Development Survey 2025.',
  },
  apps: {
    type: 'bars',
    title: 'Graduate jobs in tech and finance draw more than 180 applications each',
    subtitle: 'Applications per graduate vacancy, UK employers, 2023/24',
    rows: [
      { label: 'Digital and IT', value: 205, accent: true },
      { label: 'Financial and professional services', value: 188, accent: true },
      { label: 'Built environment', value: 85 },
      { label: 'Charity and public sector', value: 74 },
    ],
    max: 220,
    reference: { value: 140, label: 'All employers: 140' },
    source: 'Institute of Student Employers, Student Recruitment Survey 2024.',
  },
  levels: {
    type: 'groups',
    title: 'Higher-level apprenticeships rose from 13% to 40% of all starts',
    subtitle: 'Share of apprenticeship starts in England, by level',
    series: ['2017/18', '2024/25'],
    rows: [
      { label: 'Intermediate (Level 2)', values: [43, 19] },
      { label: 'Advanced (Level 3)', values: [44, 42] },
      { label: 'Higher and degree (Level 4 to 7)', values: [13, 40], accent: true },
    ],
    format: 'pct',
    max: 50,
    source: 'Department for Education, Apprenticeships: academic year 2024/25.',
  },
  skills: {
    type: 'bars',
    title: 'Leadership, resilience and AI skills gained the most ground with employers',
    subtitle: 'Rise in the share of employers calling each a core skill, 2023 to 2025',
    rows: [
      { label: 'Leadership and social influence', value: 22, accent: true },
      { label: 'Resilience, flexibility and agility', value: 17, accent: true },
      { label: 'AI and big data', value: 17, accent: true },
    ],
    format: 'points',
    max: 25,
    source: 'World Economic Forum, Future of Jobs Report 2025.',
  },
  ai: {
    type: 'bars',
    title: 'In economies like the UK, about 60% of jobs are exposed to AI',
    subtitle: 'Share of jobs where AI could change the work, IMF estimate, January 2024',
    rows: [
      { label: 'Advanced economies, like the UK', value: 60, accent: true },
      { label: 'Emerging markets', value: 40 },
      { label: 'Low-income countries', value: 26 },
    ],
    format: 'pct',
    max: 70,
    reference: { value: 40, label: 'Worldwide: almost 40%' },
    note: 'Exposed means AI could change the tasks. The IMF expects about half of exposed jobs to benefit from it.',
    source: 'International Monetary Fund, Gen-AI: Artificial Intelligence and the Future of Work, January 2024.',
  },
  ps: {
    type: 'bars',
    title: 'Same A-level grades, different outcomes: 70% against 50%',
    subtitle: "Share of 309 applicants with identical A-levels who ended up at one of the UK's highest-ranked universities",
    rows: [
      { label: 'Independent schools', value: 70, accent: true },
      { label: 'Comprehensives and colleges', value: 50 },
    ],
    format: 'pct',
    max: 100,
    source: 'Jones, S. (2012), The Personal Statement, The Sutton Trust.',
  },
};

const INSIGHTS = [
  {
    id: 'career-identity',
    audience: 'all',
    tag: 'Career identity',
    minutes: 4,
    date: '2026-11-06',
    title: 'Know who you are before you choose what to do',
    summary: 'Few things predict whether you will enjoy your work as strongly as how well it fits who you are. Most young people choose without knowing that part.',
    body: [
      'Ask a room of sixteen-year-olds what they want to do and you will hear the same handful of answers. When the OECD analysed the career plans of 15-year-olds across 41 countries for its *Dream Jobs?* report, launched at the World Economic Forum in Davos, nearly half expected to work in one of just ten jobs[1]. In the UK, a survey of 7,000 young people by the charity Education and Employers found five times as many wanted to work in art, culture, entertainment and sport as there are jobs in those fields, and that many of these ideas take shape as early as age seven[2].',
      'The problem is that most choices are made from a short list of jobs people have heard of, rather than from a clear sense of who they are.',
      '## Why fit matters more than the job title',
      'Researchers at the University of Iowa combined 172 studies of people at work to see what happens when a job suits the person doing it[3]. The link with job satisfaction was strong, stronger than most findings in workplace psychology. People whose work fitted them were happier in it, more committed to it and far less likely to want to leave.',
      '@chart:fit',
      'The effect also lasts. A team at the University of Tübingen followed school leavers for ten years and found that their interests at the end of school predicted how their education and careers turned out, even after taking intelligence and personality into account[4]. What you are drawn to at 17 keeps shaping your working life long after.',
      '## Where young people get it wrong',
      'Most decisions are made on borrowed reasons: the subject you were best at, the job a relative does, what pays well or what sounds impressive. None of these are bad reasons, but none of them tell you whether you will enjoy the work on an ordinary Tuesday. The cost often shows up later. In the 2025 Student Academic Experience Survey of more than 10,000 undergraduates, 11% said that, knowing what they know now, they would not have gone into higher education at all, nearly double the year before[5].',
      "What is missing is career identity: an honest picture of what interests you, what motivates you, how you like to work and where your strengths lie. Young people who have it make choices that hold up. Those who don't tend to follow the crowd and find out the hard way.",
      '## Where CareerDNA comes in',
      'CareerDNA was built to give you that picture before the big decisions. It brings together the four parts of career identity in a single assessment: your interests, motivations, working style and strengths. Its scientifically validated question assessment measures all four at once and turns your answers into a profile across 24 traits. Every career world, pathway, role, degree and apprenticeship on the platform is mapped to those same 24 traits, based on what the research shows makes people satisfied in that kind of work. Your profile is then compared with each one, and the traits that matter most in each field count the most. What you get is a ranked map of bespoke pathway options, each with the reasons it fits you, so you can explore them further in the platform and talk them through with the people who know you best or your AI advisor.',
      'From there you can save your favourites, explore the roles inside each pathway, compare universities using our subject rankings and your predicted grades, find live apprenticeships and graduate jobs, and track every application in one place. A personal AI advisor, which already knows your profile, is on hand at every step to help you weigh up the options and decide what to do next.',
    ],
    sources: [
      { text: "OECD (2020). Dream Jobs? Teenagers' Career Aspirations and the Future of Work.", url: 'https://oecdedutoday.com/dream-jobs/', label: 'oecdedutoday.com' },
      { text: 'Education and Employers (2020). Disconnected: Career aspirations and jobs in the UK.', url: 'https://www.educationandemployers.org/disconnected/', label: 'educationandemployers.org' },
      { text: "Kristof-Brown, A. L., Zimmerman, R. D. & Johnson, E. C. (2005). Consequences of individuals' fit at work. Personnel Psychology, 58(2), 281–342.", url: 'https://doi.org/10.1111/j.1744-6570.2005.00672.x', label: 'doi.org' },
      { text: 'Stoll, G., et al. (2017). Vocational interests assessed at the end of high school predict life outcomes assessed 10 years later. Journal of Personality and Social Psychology, 113(1), 167–184.', url: 'https://doi.org/10.1037/pspp0000117', label: 'doi.org' },
      { text: 'Advance HE and HEPI (2025). Student Academic Experience Survey 2025.', url: 'https://www.hepi.ac.uk/reports/student-academic-experience-survey-2025/', label: 'hepi.ac.uk' },
    ],
  },
  {
    id: 'employers-self-awareness',
    audience: 'university',
    tag: 'Employability',
    minutes: 3,
    date: '2026-11-06',
    title: 'What graduate employers say they cannot find',
    summary: 'Graduate jobs now draw 140 applications each. The quality employers say is most often missing is not grades. It is self-awareness.',
    body: [
      "Graduate jobs are harder to win than at any point in more than thirty years. The Institute of Student Employers, which surveys the UK's largest graduate recruiters every year, found that employers received an average of 140 applications for each graduate vacancy in both 2024 and 2025, the highest since it began counting in 1991[1]. In 2025, graduate hiring also fell by 8%[1].",
      'So what separates the people who get hired? When the same employers rated the graduates they had just taken on, the gap they named most often was self-awareness: knowing your strengths, your limits and how you come across to others. More than half now say new graduates fall short on it, up from about a third two years earlier[2].',
      '@chart:gaps',
      'Resilience comes close behind. Neither has much to do with your grades. Both come down to how well you know yourself, and whether you can talk about it honestly.',
      'This matters even more now that AI helps write so many applications. When every CV reads well, employers lean harder on interviews and assessment centres, where you have to explain in your own words what you are good at and how you handle things going wrong. No tool can do that part for you.',
      "Experience is the other thing they look for. 77% of employers agree that graduates who did an internship or placement arrive more ready for work[2]. Those places are competitive too, so don't overlook a part-time job, a society role or a project you ran yourself. They all count, as long as you can explain what you learned.",
      "My advice is to get clear on your strongest traits before you write a single application, with a real example ready for each. Apply to fewer roles that you can show fit you, rather than dozens that don't, and have one honest story ready about a setback and what you did about it. That is exactly the self-awareness employers say they struggle to find. Your CareerDNA report is a good place to begin, because it helps you build a narrative around your strengths and traits and the kind of work they suit.",
    ],
    sources: [
      { text: "Institute of Student Employers (2025). 5 trends you need to know from ISE's Student Recruitment Survey 2025.", url: 'https://ise.org.uk/knowledge/insights/498/5_trends_you_need_to_know_from_ises_recruitment_survey_2025/', label: 'ise.org.uk' },
      { text: 'Institute of Student Employers (2025). ISE top 10 stats of 2025 you need to know.', url: 'https://ise.org.uk/knowledge/insights/513/ise_top_10_stats_of_2025_you_need_to_know/', label: 'ise.org.uk' },
    ],
  },
  {
    id: 'graduate-cover-letter',
    audience: 'university',
    tag: 'Applying',
    minutes: 4,
    date: '2026-11-06',
    title: 'How to write a graduate cover letter that gets read',
    summary: 'Most cover letters now read the same. The ones that work show the employer you know who you are and why this job fits.',
    body: [
      'Recruiters are reading more applications than ever. In its 2024 survey, the Institute of Student Employers found that the most popular graduate fields, digital and IT and financial and professional services, drew more than 180 applications for every job[1].',
      '@chart:apps',
      'Many of those applications now look alike. A 2026 survey of 5,000 students and graduates by Prospects at Jisc found that 46% had used AI to write a CV or cover letter, and that people sending more than 100 applications were the most likely to lean on it[2]. Employers have noticed. Stephen Isherwood, joint chief executive of the ISE, warns that applications “must be authentic otherwise candidates may find themselves in the wrong job”[1].',
      '## What a good letter does',
      'A cover letter is not a summary of your CV. It answers the two questions a CV cannot: why this employer, and why you.',
      'Start with them, not with yourself. Show that you have looked into the organisation, what it does and where it is heading, and pick one specific thing that drew you to it. “A leading firm” tells the reader nothing. A project, a client, a value or a recent decision tells them you have done your homework.',
      'Then make the link to you. Choose one or two strengths that matter for this role and back each with a real example: a placement, a project, a part-time job, a society you helped run. Say what you did and what changed because of it. One good example is worth more than five adjectives. Close with a couple of sentences on what you hope to learn and contribute, and keep the whole letter to a page.',
      '## Use AI as an editor, not an author',
      'Almost half of graduate employers say they are happy for candidates to use AI on cover letters and CVs[1], and it is useful for checking grammar or tightening a paragraph. But the reasons and the examples have to be yours, because they are exactly what an interviewer will ask you about.',
      '## Fewer, better applications',
      'When Prospects asked students what actually worked, the top answers were tailoring applications, researching employers and talking to careers advisers and people in the industry[2]. Ten letters written for ten jobs you want will do more for you than a hundred sent to anything. Your CareerDNA report helps here, because it shows which pathways fit you and why, which is the “why this job” a recruiter wants to read.',
    ],
    sources: [
      { text: 'Institute of Student Employers (2024). Record graduate job applications.', url: 'https://ise.org.uk/knowledge/insights/410/record_graduate_job_applications', label: 'ise.org.uk' },
      { text: 'Prospects at Jisc (2026). 1 in 5 graduates apply for more than 100 jobs (Early Careers Survey).', url: 'https://luminate.prospects.ac.uk/1-in-5-graduates-apply-for-more-than-100-jobs', label: 'luminate.prospects.ac.uk' },
    ],
  },
  {
    id: 'apprenticeships-plan-a',
    audience: 'school',
    tag: 'Routes',
    minutes: 4,
    date: '2026-11-06',
    title: 'Apprenticeships are no longer plan B',
    summary: 'Four in ten apprenticeships in England now lead to higher-level qualifications, many to a full degree. Here is why the route is growing, and what to know before you apply.',
    body: [
      'For years, apprenticeships were seen as the route for people who were not going to university. The numbers now tell a different story. According to the Department for Education, only 13% of apprenticeship starts in England were at a higher level in 2017/18. By 2024/25 it was 40%, the highest number on record[1].',
      '@chart:levels',
      "Degree apprenticeships, where you finish with a full bachelor's or master's degree, are growing fastest. Starts at these levels rose by a fifth in a single year, from 50,110 to 60,350[1].",
      '## Why it is growing',
      'Employers now design apprenticeships themselves, building them around the skills they find hardest to hire. And the deal is a good one: you earn a salary, your training is paid for and you finish without student debt. As Sir Peter Lampl, founder of the Sutton Trust, puts it, they let young people “earn while they learn, come out with no debt”[2].',
      'Young people have noticed. A UCAS and Sutton Trust study found that 40% of UCAS applicants, around 430,000 people, were interested in an apprenticeship[2]. Employers are shifting too. In 2025 the Institute of Student Employers reported that hiring of school and college leavers rose by 8%, while graduate hiring fell by 8%[3].',
      '## What to know before you apply',
      "The hard part is finding a place, not wanting one. In the same UCAS study, one in three interested students said they could not find a role in the career they wanted, and three in five could not find one where they lived[2]. Places are competitive, with employers receiving an average of 113 applications for every school leaver role in 2024[4]. Funding rules are changing as well: from January 2026, master's-level apprenticeships are only government-funded for apprentices aged 16 to 21 and a few other groups[1].",
      'My advice is to treat an apprenticeship as a real option from the start, alongside university rather than behind it. Start looking early, because application windows vary widely between employers and some close long before results day. And choose by fit, just as you would a degree. An apprenticeship is a job from the first day, so the work has to suit you. The Training & Work tab in your CareerDNA report shows the apprenticeships linked to the pathways that fit you best.',
    ],
    sources: [
      { text: 'Department for Education (2025). Apprenticeships: academic year 2024/25.', url: 'https://explore-education-statistics.service.gov.uk/find-statistics/apprenticeships/2024-25', label: 'explore-education-statistics.service.gov.uk' },
      { text: 'UCAS and the Sutton Trust (2023). Where next? What influences the choices of would-be apprentices?', url: 'https://www.ucas.com/advisers/guides-and-resources/adviser-news/news/new-report-highlights-soaring-demand-apprenticeships', label: 'ucas.com' },
      { text: "Institute of Student Employers (2025). 5 trends you need to know from ISE's Student Recruitment Survey 2025.", url: 'https://ise.org.uk/knowledge/insights/498/5_trends_you_need_to_know_from_ises_recruitment_survey_2025/', label: 'ise.org.uk' },
      { text: 'Institute of Student Employers (2024). Record graduate job applications.', url: 'https://ise.org.uk/knowledge/insights/410/record_graduate_job_applications', label: 'ise.org.uk' },
    ],
  },
  {
    id: 'graduate-skills',
    audience: 'university',
    tag: 'Skills',
    minutes: 4,
    date: '2026-11-06',
    title: 'The skills graduate employers want most, and how to build them',
    summary: "Analytical thinking still tops employers' lists, but leadership, resilience and AI skills are rising fastest. You can build all of them before you graduate.",
    body: [
      "Every two years the World Economic Forum asks the world's largest employers which skills matter most. In its 2025 Future of Jobs Report, analytical thinking came top again, with seven in ten employers calling it essential. It was followed by resilience, flexibility and agility, then leadership and social influence, creative thinking, and motivation and self-awareness[1].",
      'The bigger story is which skills are rising. Compared with two years earlier, many more employers now treat these three as core[1]:',
      '@chart:skills',
      'Employers also expect 39% of the skills workers rely on today to change by 2030[1]. That is why the habit of learning matters as much as anything you learn now.',
      '## How to build them',
      'Few of these skills are taught as a module. They are built by doing things, and university is one of the best places to do them.',
      'Analytical thinking grows when you work on real problems with real evidence: a dissertation on a question you care about, a research project with a lecturer, or the numbers behind a society or part-time job that you try to make sense of.',
      "Resilience grows when you take on things that might not work out, such as standing for a committee role, entering a competition or applying for an internship you are not sure you will get. Employers don't want to hear that nothing went wrong. They want to hear what you did when it did.",
      'Leadership does not need a title. Organising an event, training new staff at your part-time job or getting a stuck group project moving all count.',
      'AI skills are now expected in most graduate jobs, not just technical ones. Learn to use AI tools well in your own subject, understand their limits, and be ready to explain how you used them and why.',
      'Self-awareness ties it all together. UK employers say it is the quality new graduates most often lack[2], and it is what lets you explain every other skill in an interview. Your CareerDNA report names your strongest traits, so start there: build on what comes naturally, collect evidence for it, and pick one area to stretch this year.',
    ],
    sources: [
      { text: 'World Economic Forum (2025). Future of Jobs Report 2025, chapter 3: Skills outlook.', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/3-skills-outlook/', label: 'weforum.org' },
      { text: 'Institute of Student Employers (2025). ISE top 10 stats of 2025 you need to know.', url: 'https://ise.org.uk/knowledge/insights/513/ise_top_10_stats_of_2025_you_need_to_know/', label: 'ise.org.uk' },
    ],
  },
  {
    id: 'ai-future-jobs',
    audience: 'all',
    tag: 'Future of work',
    minutes: 4,
    date: '2026-11-06',
    title: 'AI and your future job: what the evidence says',
    summary: 'AI will change most jobs rather than end them. The research is clear about which kinds of work it touches most, and what stays human.',
    body: [
      'In January 2024 the International Monetary Fund estimated that almost 40% of jobs worldwide are exposed to AI. In richer economies like the UK, the figure rises to about 60%[1].',
      '@chart:ai',
      'Exposed does not mean the job disappears. The IMF expects roughly half of those jobs to benefit, with AI making people more productive. In the other half, AI may take over key tasks, which could mean fewer people hired and lower pay[1].',
      '## Which jobs feel it most',
      "AI is strongest at screen-based work that follows patterns: writing, summarising, coding, calculating and sorting information. In the World Economic Forum's 2025 survey, employers listed cashiers, administrative assistants, printing workers, and accountants and auditors among the fastest-declining roles, and for the first time graphic designers and legal secretaries appeared close behind[2]. In the UK, a 2023 Department for Education study found finance and insurance to be the most exposed sector, with solicitors, management consultants and business analysts among the most exposed jobs. It also found that people with degrees are more exposed than people without[3].",
      "Young people are seeing the first effects. Researchers at Stanford's Digital Economy Lab, tracking payroll records for millions of US workers, reported in August 2026 that employment of 22 to 25 year olds in the most AI-exposed jobs is now 19% below where it would otherwise be, mostly because companies are hiring fewer of them. Experienced workers show no such gap, and in jobs where AI supports people rather than replacing their tasks, employment is flat or rising[4].",
      '## What stays human',
      "When the WEF and Indeed assessed more than 2,800 work skills, none were judged highly replaceable by today's AI, and 69% had low or very low potential to be replaced. Empathy, active listening and hands-on physical skills showed none at all[5]. Meanwhile, AI and data specialists and software developers are among the fastest-growing jobs, and nursing and care roles are among those adding the most jobs overall[2].",
      '## What this means for you',
      'Choose work that suits you, then learn to use AI inside it. The people employers want combine human strengths with AI skills. Look for roles where AI supports the work rather than replaces it: anything built on judgement, relationships, care, physical skill or creativity with a purpose. And get advice. In a 2026 Prospects survey, students who had received careers guidance about AI were more than twice as likely to think it would increase their opportunities[6]. Your CareerDNA report shows the worlds and pathways that fit you, and your advisor can talk you through how AI is changing any of them.',
    ],
    sources: [
      { text: "International Monetary Fund (2024). AI will transform the global economy. Let's make sure it benefits humanity.", url: 'https://www.imf.org/en/Blogs/Articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity', label: 'imf.org' },
      { text: 'World Economic Forum (2025). Future of Jobs Report 2025, chapter 2: Jobs outlook.', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/2-jobs-outlook/', label: 'weforum.org' },
      { text: 'Department for Education (2023). The impact of AI on UK jobs and training.', url: 'https://www.gov.uk/government/publications/the-impact-of-ai-on-uk-jobs-and-training', label: 'gov.uk' },
      { text: 'Brynjolfsson, E., Chandar, B. & Chen, R. (2025, revised August 2026). Canaries in the Coal Mine? Stanford Digital Economy Lab.', url: 'https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/', label: 'digitaleconomy.stanford.edu' },
      { text: 'World Economic Forum (2025). Future of Jobs Report 2025, chapter 3: Skills outlook.', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/3-skills-outlook/', label: 'weforum.org' },
      { text: 'Prospects at Jisc (2026). 1 in 5 graduates apply for more than 100 jobs (Early Careers Survey).', url: 'https://luminate.prospects.ac.uk/1-in-5-graduates-apply-for-more-than-100-jobs', label: 'luminate.prospects.ac.uk' },
    ],
  },
  {
    id: 'personal-statement',
    audience: 'school',
    tag: 'Applying',
    minutes: 4,
    date: '2026-11-06',
    title: 'Your personal statement: what actually makes the difference',
    summary: 'Students with identical grades can get very different outcomes. The personal statement is often where they pull apart, and the difference is reflection, not a longer list.',
    body: [
      'In 2012, Dr Steven Jones at the University of Manchester read 309 personal statements, all sent to the same department of the same Russell Group university by students with exactly the same A-level results[1]. On paper they were identical applicants. Their statements were not. Clear writing errors were three times more common among sixth form college students than among independent school students, and independent school applicants described more, and more impressive, work experience. Their outcomes followed.',
      '@chart:ps',
      'The study, published by the Sutton Trust, did not conclude that some students are more able than others. It concluded that some get far more help, and it recommended that applicants reflect on what they would bring to a course rather than list everything they have done[1]. That is good news, because reflection is something any student can learn.',
      '## What has changed',
      'From 2026 entry, UCAS replaced the single blank page with three questions: why you want to study the course, how your studies have prepared you for it, and what else you have done outside education to prepare. Each answer needs at least 350 characters, and the total is still 4,000[2]. The new format rewards exactly what the research found mattered: clear thinking about why this subject fits you.',
      '## What a strong answer looks like',
      'Pick one experience and go deep. “I volunteered at a care home” tells a tutor very little. “Talking to residents with dementia made me want to understand why memory fades for some people and not others, so I started reading about how the brain stores memories” tells them how you think.',
      'What happened, what you noticed, what you did next and how it links to the course: that simple shape works for most answers. Your Saturday job counts. Looking after a younger brother or sister counts. A book that changed your mind counts. Tutors are not counting activities. They are looking for what you took from them.',
      '## For parents',
      'Your part is to help your child think, not to write it for them. Ask the questions that draw out real reasons, such as “what did you actually enjoy about that?” or “why this subject and not the one next to it?”, because their answers often become the best sentences in the statement. Read the final draft for mistakes, since writing errors were the most visible gap in the Sutton Trust study. And leave the voice alone. Tutors read thousands of statements and can tell when an adult has written one, and UCAS checks every statement for copied text.',
      '## Where CareerDNA helps',
      "The first question, why this subject, is the one most students find hardest, and it is where self-knowledge shows. Your CareerDNA report sets out your interests, your strengths and the pathways that fit you. Don't quote it. Use it to find the moments in your own life where those traits showed up, and write about those.",
    ],
    sources: [
      { text: 'Jones, S. (2012). The Personal Statement: A fair way to assess university applicants? The Sutton Trust.', url: 'https://www.suttontrust.com/?p=14154', label: 'suttontrust.com' },
      { text: 'UCAS. The new personal statement for 2026 entry.', url: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/the-new-personal-statement-for-2026-entry', label: 'ucas.com' },
    ],
  },
];

export function getInsight(id) {
  return INSIGHTS.find((a) => a.id === id) || null;
}

export function insightsFor(stage = 'school') {
  return INSIGHTS.filter((a) => a.audience === 'all' || a.audience === stage);
}

export default INSIGHTS;
