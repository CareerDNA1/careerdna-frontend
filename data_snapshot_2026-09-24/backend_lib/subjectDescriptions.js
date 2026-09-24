// Long-form definitions for the 114 university degrees, keyed by subject id.
// Written for school students exploring degrees in Further Study. Each value is
// a multi-paragraph string (paragraphs separated by a blank line) covering: what
// the degree is about, typical modules, where it leads (mapped pathways), and how
// the field is evolving plus who tends to fit it (mapped subdimensions).
// No short definitions by design. No dashes in the prose.

const SUBJECT_DESCRIPTIONS = {
  // ── Data, Analytics & Quantitative Insight ──────────────────────────────
  sub_mathematics_and_statistics: `Mathematics and Statistics teaches you two connected skills: how to reason with abstract structure, and how to measure uncertainty in the real world. You spend time proving why methods work, not just applying them, and you learn to ask what data can and cannot tell you. The degree trains a careful, evidence led way of thinking that transfers to almost any field that runs on numbers.

Early years build the foundations, calculus, linear algebra, probability and mathematical analysis, alongside the core of statistics such as estimation, hypothesis testing and regression. As you progress you choose from areas like statistical modelling, stochastic processes, machine learning and optimisation, and you usually learn to program in a language such as R or Python. Most courses end with a project or dissertation where you apply these tools to a real dataset or open problem.

Graduates move into work built on data and quantitative judgement, including core data analysis and business insight, business intelligence and reporting, data science and advanced modelling, and risk and quantitative analysis. The degree is deliberately broad, so it opens doors across finance, technology, research, government and consultancy rather than a single job. Strong mathematical and statistical training is also a common route into further study.

The field is being reshaped by larger datasets, automation and machine learning, which makes people who understand both the maths behind the methods and their limits increasingly valuable. It tends to suit people with strong analytical and data curiosity, a taste for mastery, and a liking for precision, the kind who enjoy getting an answer exactly right and knowing why it holds.`,

  sub_data_science: `Data Science sits where statistics, computing and real world knowledge meet. You learn to collect, clean and explore data, then build models that can classify, predict or recommend, and explain what you find to people who are not specialists. The emphasis is as much on doing, writing code and running experiments, as on theory.

First years usually cover programming (commonly Python and R), probability and statistics, databases and the mathematics behind algorithms. Later modules move into statistical machine learning, deep learning and neural networks, data visualisation and handling data at scale, often with SQL and industry standard tools. Courses are typically hands on, with practical assignments and a substantial final project on a real problem.

Graduates go into core data analysis and business insight, data science and advanced modelling, data engineering, and machine learning and applied AI. Because almost every sector now generates data, the degree leads into technology, healthcare, finance, retail and research, and one skill set opens several of these at once.

The field moves quickly as models, tools and computing power keep advancing, so the ability to keep learning matters as much as any single technique. It fits people who combine analytical and data curiosity with technical curiosity and a bit of originality, who enjoy building things and are precise enough to trust their own results.`,

  sub_statistics: `Statistics teaches you how to move from data to reliable conclusions, and how to judge how confident you should be in them. You learn to design how data is collected, choose appropriate models, and separate real signal from random noise. It is a discipline built on careful thinking about evidence, which is why it underpins so much of science, medicine, business and policy.

Core modules cover probability, statistical inference, and linear regression, with an emphasis on confidence intervals, hypothesis testing and modelling relationships between variables. Later you can specialise in areas such as statistical machine learning, medical statistics, time series or Bayesian methods, and you learn statistical software such as R to put the theory into practice. A final project usually asks you to analyse real data from start to finish.

Graduates work wherever decisions rest on evidence, including core data analysis and business insight, business intelligence and reporting, data science and advanced modelling, and risk and quantitative analysis. The training is valued across pharmaceuticals, finance, government, technology and research, so it leads to a range of destinations rather than one.

As data grows and machine learning spreads, demand is rising for people who understand not just how to run a method but whether its assumptions hold. It suits people with strong analytical and data curiosity, a drive for mastery and a real care for precision, who want their conclusions to stand up to scrutiny.`,

  sub_actuarial_science: `Actuarial Science is about understanding risk in numbers and money. You learn to model events that may or may not happen, how long people live, when accidents occur, how markets move, and to work out what they are worth today. It is a highly applied discipline that connects probability directly to real financial decisions.

The curriculum combines mathematics and statistics with finance and economics. Early modules cover calculus, probability, financial mathematics and the time value of money, then build into life contingencies, risk theory, loss distributions, stochastic modelling and financial economics. Many courses align with professional actuarial exams, so passing modules can earn exemptions towards qualifying as an actuary.

Graduates move into risk and quantitative analysis, core data analysis and business insight, and insurance and actuarial work, in insurers, pension schemes, consultancies and increasingly in banking and wider finance. Even outside the traditional actuarial route, the blend of statistics and financial judgement is widely valued.

The role is broadening beyond insurance and pensions into areas like data science, climate risk and banking, as the same modelling skills apply to new kinds of uncertainty. It suits people who combine analytical and data curiosity with a strong drive for mastery, real precision, and an appreciation of security and stability in their work.`,

  sub_mathematics: `A Mathematics degree develops the ability to think with complete rigour. You learn to define ideas precisely, prove that they are true, and apply them to problems ranging from the purely abstract to the immediately practical. More than any single topic, the degree trains a powerful and flexible way of reasoning that employers and researchers value highly.

The first years introduce the pillars of the subject, calculus, linear algebra, mathematical analysis, algebra and differential equations, usually alongside probability and some programming. Later you choose your own direction across pure mathematics, applied mathematics, statistics, operational research and mathematical physics, and most courses finish with a project or dissertation on a topic you choose.

Because it is so general, Mathematics leads into many quantitative careers, including risk and quantitative analysis, data science and advanced modelling, and machine learning and applied AI, as well as finance, technology, teaching and research. Employers often value the proven reasoning ability as much as the specific content, so the degree keeps a wide range of paths open.

Mathematics increasingly powers modern technology, from cryptography and AI to modelling complex systems, which keeps demand for strong mathematicians high. It fits people with deep analytical curiosity, a love of mastery and originality, and the patience and precision to keep working at a hard problem until it yields.`,

  sub_operational_research: `Operational Research, sometimes called the science of better decisions, is about improving how systems and organisations operate. You learn to represent a real problem, scheduling, routing, staffing or supply chains, as a mathematical model, then find the best possible solution within real constraints. It is mathematics aimed squarely at practical impact.

Modules build the analytical toolkit: probability and statistics, linear and integer programming, optimisation, simulation and decision analysis, usually with programming and specialist software. You learn techniques such as convex optimisation and mathematical programming, and courses often include a project applying them to a genuine organisational problem.

Graduates go into core data analysis and business insight, risk and quantitative analysis, and business intelligence and reporting, working in logistics, consultancy, transport, healthcare, government and finance. The skill of modelling a problem and optimising it transfers across sectors, so the degree leads to varied analytical and decision support roles.

As organisations collect more data and automate more decisions, the ability to model a problem clearly and optimise it is in growing demand, often alongside data science. It suits people with strong analytical and data curiosity, a drive for mastery and precision, and a practical streak, they want the answer to be usable, not just correct.`,

  sub_financial_mathematics: `Financial Mathematics is where rigorous mathematics meets the financial markets. You learn to model how asset prices move, how to value complex products like options and derivatives, and how to measure and manage financial risk. The degree blends deep quantitative theory with a clear commercial purpose.

You start with the mathematical and statistical foundations, calculus, probability, linear algebra and statistics, plus core finance and economics. Later modules move into stochastic processes and stochastic calculus, derivative pricing, asset pricing and corporate finance, and you often implement these models in code. A project or dissertation typically applies the theory to real financial data or a pricing problem.

Graduates head into risk and quantitative analysis and data science and advanced modelling, working in investment banks, hedge funds, asset managers, insurers and fintech, often in quantitative or analyst roles. The combination of high level mathematics and financial understanding is sought after, and the quantitative skills also transfer beyond finance.

The field keeps evolving as markets adopt more computation, machine learning and algorithmic methods, so strong programming increasingly sits alongside the mathematics. It suits people with strong analytical and data curiosity, a drive for mastery and precision, who are drawn to applying difficult mathematics where the stakes, and the pace, are high.`,

  // ── Software, AI & Digital Systems ──────────────────────────────────────
  sub_computer_science_and_artificial_intelligence: `Computer Science and Artificial Intelligence combines the foundations of computing with the techniques that let machines learn and make decisions. You study how software and systems work from the ground up, then learn how to build programs that recognise patterns, predict outcomes and act on data. It is a degree about both how computers work and how to make them intelligent.

Early modules cover programming, data structures and algorithms, computer systems and mathematics for computing, alongside an introduction to machine learning. Later you move into areas such as neural networks, natural language processing, computer vision and intelligent systems, and you build real applications in team projects and a substantial final project. Most courses balance theory with a lot of hands on coding.

Graduates go into software engineering, backend and platform engineering, and frontend and web development, as well as roles focused on building AI features into products. Because software and AI now sit inside almost every industry, the degree leads into technology, finance, healthcare, gaming and research, and often into fast moving product teams.

Artificial intelligence is one of the fastest changing areas in technology, so the ability to keep learning new tools and methods is central to the career. It suits people with strong technical and analytical curiosity, a drive for mastery and autonomy, and a streak of originality, the kind who like building things and figuring out how to make them cleverer.`,

  sub_software_engineering: `Software Engineering is about building software that is reliable, maintainable and works at scale, not just code that runs once. You learn how to design systems, work in teams, test thoroughly and ship products that real people depend on. The focus is as much on the discipline of building software well as on the programming itself.

The curriculum covers programming, data structures and algorithms, and databases, then moves into software design, architecture, testing and quality assurance, and the methods teams use to deliver projects. You typically work on group projects that mirror industry practice, use version control and modern tooling, and complete a large individual project or a placement in industry.

Graduates move into software engineering, backend and platform engineering, and quality assurance and test engineering, across technology companies, finance, gaming, public services and almost any organisation that builds its own systems. The skills transfer widely, so one degree opens many kinds of engineering role.

The field keeps evolving with new languages, cloud platforms and AI assisted development, so engineers are always learning and adapting. It fits people who combine analytical and technical curiosity with a drive for mastery, real precision and the independence to own a piece of work from idea to delivery.`,

  sub_computer_science_with_cyber_security: `Computer Science with Cyber Security gives you a full grounding in computing and then focuses it on keeping systems and data safe. You learn how software, networks and systems work, and how they can be attacked, defended and made resilient. It is a degree for people who want to understand technology deeply and protect it.

You start with the core of computer science, programming, algorithms, systems and networks, then specialise into areas such as cryptography, network and systems security, ethical hacking, digital forensics and secure software development. Courses are practical, with labs and projects where you test defences and respond to realistic threats, often ending in a substantial security focused project.

Graduates go into cyber security roles, protecting organisations, investigating incidents and building secure systems, and can also move into wider software engineering. Demand comes from almost every sector, including finance, government, healthcare, defence and technology, wherever data and systems need protecting.

Cyber threats change constantly, so the field rewards people who stay curious and adapt quickly to new attacks and tools. It suits people with strong analytical and technical curiosity, real adaptability and originality, who enjoy thinking a step ahead of a problem and staying calm under pressure.`,

  sub_artificial_intelligence: `Artificial Intelligence is the study of how to make machines learn, reason and make decisions. You explore how systems can recognise images and language, predict outcomes and improve from experience, and you learn to build and train the models that make this possible. It is a degree focused squarely on one of the most influential technologies of our time.

Modules cover programming, mathematics and statistics for AI, and machine learning fundamentals, then move into deep learning and neural networks, natural language processing, computer vision, reinforcement learning and the ethics of AI. You work with real data and modern frameworks throughout, and usually build a significant AI system in your final project.

Graduates move into data engineering, AI and machine learning engineering, and machine learning and applied AI, building intelligent features and systems in technology, finance, healthcare, research and beyond. As organisations race to adopt AI, these skills are in high demand across many industries.

The field advances at remarkable speed, with new models and capabilities appearing constantly, so continuous learning is part of the job. It fits people with strong technical, analytical and data curiosity, a drive for mastery and originality, and the independence to experiment, since much of the work is about trying ideas and learning what works.`,

  sub_computer_science: `Computer Science is the study of computation, from the theory of what problems can be solved to the practical craft of building software. You learn how computers and systems work at every level, how to design efficient algorithms, and how to turn ideas into working programs. It is a broad, powerful degree that underpins the whole of the technology world.

The first years build the essentials, programming, data structures and algorithms, computer systems, networks and the mathematics of computing. Later you choose from areas such as artificial intelligence, software engineering, databases, graphics, security and distributed systems, and you usually complete a major individual project and sometimes a year in industry.

Graduates go into software engineering, backend and platform engineering, frontend and web development, and AI and machine learning engineering, across technology, finance, gaming, healthcare and research. Because the training is so general and in demand, it leads to one of the widest ranges of career options of any degree.

Computing keeps reinventing itself, from cloud and mobile to AI, so the degree teaches you how to keep learning as much as any single technology. It suits people with strong technical and analytical curiosity, a drive for mastery and originality, and the autonomy to teach themselves new tools as the field moves on.`,

  sub_cyber_security: `Cyber Security is about protecting systems, networks and data from attack, and responding when things go wrong. You learn how digital systems can be compromised and how to defend them, from the technical detail of vulnerabilities to the wider picture of risk and resilience. It is a degree for people who like solving puzzles with real consequences.

Modules cover the fundamentals of computing and networks, then specialise into cryptography, network and systems security, ethical hacking and penetration testing, digital forensics, and security operations. Courses are hands on, with labs where you probe and defend systems, simulate incidents and analyse real threats, often building to a substantial practical project.

Graduates work in cyber security roles such as defending organisations, testing systems for weaknesses and investigating breaches, and can also move into broader software engineering. Every sector needs these skills, so opportunities span finance, government, healthcare, defence, retail and technology.

Attackers and defences evolve constantly, so the field rewards curiosity, quick learning and the ability to think like an adversary. It fits people with strong analytical and technical curiosity, real adaptability, autonomy and originality, who enjoy staying one move ahead and thrive when a problem is live and urgent.`,

  sub_games_technology: `Games Technology is about the engineering behind video games and interactive experiences. You learn to build the systems that make games work, graphics, physics, gameplay and performance, combining strong programming with a feel for how games play. It is a degree for people who want to create the technology behind interactive entertainment.

You study programming, mathematics for graphics and physics, and data structures, then move into games engines, real time rendering, artificial intelligence for games, and multiplayer and networked systems. Courses are highly practical, with team based game projects that mirror studio work and a major final project you can show to employers.

Graduates go into software engineering and frontend and web development, in games studios and beyond, since the skills in real time systems, graphics and performance transfer to simulation, visualisation, film and any interactive software. Many also move into wider technology roles.

The games industry adopts new hardware, engines and techniques quickly, including AI and immersive technologies, so the field rewards people who keep experimenting. It suits people with strong technical and analytical curiosity, a drive for mastery, autonomy and originality, and a genuine creative streak, they want to build things that are technically demanding and fun to use.`,

  sub_human_computer_interaction: `Human-Computer Interaction is about designing technology that people can actually use and enjoy. You learn how people think and behave, how to design interfaces around them, and how to test whether a product really works. It sits at the meeting point of computing, design and psychology.

Modules cover interaction design, usability and user research, prototyping, and the psychology of how people perceive and use technology, alongside enough programming to build and test working interfaces. Courses are project based, so you research users, design solutions, build prototypes and evaluate them, usually finishing with a substantial design led project.

Graduates go into frontend and web development and software engineering, as well as design and research roles, wherever digital products are built, including technology, finance, healthcare and public services. The ability to make technology genuinely usable is valued across almost every industry.

As products become more complex and more central to daily life, good design and research are increasingly what set them apart, and AI is opening new kinds of interface to design for. It fits people with technical curiosity and strong originality and creative expression, combined with analytical curiosity and the autonomy to advocate for the user throughout a project.`,

  // ── Engineering, Manufacturing & Infrastructure ─────────────────────────
  sub_mechanical_engineering: `Mechanical Engineering is about how things move, work and are made, from tiny mechanisms to large machines and engines. You learn the science of forces, materials, energy and motion, and how to turn that understanding into designs that function reliably in the real world. It is one of the broadest and most versatile branches of engineering.

The curriculum covers mechanics, thermodynamics, materials and mathematics, then moves into design, manufacturing, fluid dynamics, control systems and computer aided design. Courses are practical, with laboratory work, design and build projects and often a year in industry, ending in a substantial engineering project.

Graduates go into mechanical design and development engineering, manufacturing and production engineering, and robotics and automation engineering, working in sectors such as automotive, aerospace, energy, manufacturing and product design. The breadth of the degree means it opens many kinds of engineering career.

Mechanical engineering is being reshaped by automation, electrification and sustainable design, so modern engineers increasingly work alongside software and data. It suits people with strong technical and analytical curiosity, a drive for mastery and achievement, real precision and originality, who like understanding how things work and making them better.`,

  sub_civil_engineering: `Civil Engineering is about designing and building the world around us, roads, bridges, buildings, water systems and the infrastructure that societies depend on. You learn how structures stand up, how materials behave and how large projects are planned and delivered safely. It is engineering with a visible, lasting impact on people's lives.

Modules cover structural mechanics, materials, geotechnics, hydraulics and mathematics, then move into structural design, construction management, transport and environmental engineering. Courses combine theory with laboratory work, site visits and design projects, and often include a placement, building towards a major individual project.

Graduates go into civil and structural engineering, infrastructure, maintenance and asset engineering, and systems engineering, working for consultancies, contractors and public bodies on everything from buildings to national infrastructure. The work is essential everywhere, so opportunities are stable and widespread.

The field is increasingly shaped by sustainability, resilience to climate change and digital tools like modelling and smart infrastructure. It fits people with strong technical and analytical curiosity, real resilience and a drive for achievement and mastery, who want to see tangible results and can see a long project through to completion.`,

  sub_electrical_and_electronic_engineering: `Electrical and Electronic Engineering is about the systems that generate, control and use electricity and electronic signals, from power grids to microchips. You learn how circuits, devices and systems work, and how to design the technology behind almost everything electronic. It underpins modern life, from energy to communications to computing hardware.

The curriculum covers circuit theory, electronics, signals and systems, and mathematics, then specialises into areas such as power systems, control, communications, embedded systems and microelectronics. Courses are hands on, with laboratory and design work and often an industrial placement, finishing with a substantial technical project.

Graduates go into electrical and electronic engineering, robotics and automation engineering, and systems engineering, across energy, electronics, telecommunications, manufacturing and technology. The skills are fundamental and in demand across many high technology industries.

The field sits at the heart of major shifts like renewable energy, electric transport and connected devices, so it keeps expanding into new areas. It suits people with strong technical and analytical curiosity, a drive for mastery and originality, who enjoy understanding systems at a deep level and designing the hardware others build on.`,

  sub_chemical_engineering: `Chemical Engineering is about turning raw materials into useful products at scale, from fuels and medicines to food and materials. You learn how chemical and physical processes work and how to design the plants and systems that run them safely and efficiently. It combines science with large scale, real world engineering.

Modules cover chemistry, thermodynamics, fluid flow, heat and mass transfer and mathematics, then move into reaction engineering, process design, control and safety. Courses include laboratory and design work, plant simulations and often an industrial placement, building to a major process design project.

Graduates go into process and industrial engineering, manufacturing and production engineering, and chemical and process engineering, working in energy, pharmaceuticals, food, chemicals, water and increasingly in sustainability focused industries. The degree also transfers well into wider technical and management roles.

The field is central to the shift towards cleaner energy, sustainable materials and greener processes, which is opening new directions for chemical engineers. It fits people with strong analytical and technical curiosity, a drive for achievement, mastery and precision, who like working on complex systems where getting the details right really matters.`,

  sub_aeronautical_and_aerospace_engineering: `Aeronautical and Aerospace Engineering is about the design of aircraft and spacecraft and everything that lets them fly. You learn the science of flight, aerodynamics, propulsion, structures and control, and how to engineer machines that perform safely in extreme conditions. It is a demanding, exciting field for people fascinated by flight and space.

The curriculum covers aerodynamics, mechanics, materials, propulsion and mathematics, then specialises into aircraft and spacecraft design, avionics, structures and flight dynamics. Courses combine theory with laboratory and simulation work and design projects, often including a placement, and finish with a substantial engineering project.

Graduates go into mechanical design and development engineering, systems engineering, and aerospace and defence engineering, working in aviation, space, defence and high performance industries, and the strong analytical training also transfers to other sectors.

The field is being reshaped by sustainable aviation, electric propulsion, drones and a fast growing space industry, which is creating new kinds of work. It suits people with strong technical and analytical curiosity, a drive for mastery and originality, who are drawn to complex, high stakes engineering and precise, careful design.`,

  sub_manufacturing_engineering: `Manufacturing Engineering is about how products are actually made, and how to make them better, faster and more efficiently. You learn to design and improve the processes and systems that turn designs into finished goods at scale. It connects engineering, technology and operations in a very practical way.

Modules cover materials and manufacturing processes, design, automation and mathematics, then move into production systems, quality engineering, lean manufacturing and supply chains, increasingly with data and digital tools. Courses are hands on, with laboratory and project work and often an industrial placement.

Graduates go into manufacturing and production engineering, process and industrial engineering, and operations and supply chain roles, across automotive, aerospace, electronics, consumer goods and other manufacturers. The blend of technical and operational skills opens both engineering and management routes.

Modern manufacturing is being transformed by automation, robotics and data driven production, often called Industry 4.0, so the field keeps evolving. It fits people with strong analytical, technical and data curiosity, a drive for achievement, precision and mastery, who like improving real systems and seeing measurable results.`,

  sub_robotics_and_mechatronic_engineering: `Robotics and Mechatronic Engineering brings together mechanical, electronic and software engineering to build machines that sense, decide and act. You learn how to design robots and smart systems that combine hardware and intelligent control. It is a hands on, forward looking field at the cutting edge of engineering.

The curriculum covers mechanics, electronics, programming and control, then specialises into robotics, sensors and actuators, embedded systems, automation and artificial intelligence for machines. Courses are highly practical, with design and build projects where you create working robotic systems, finishing with a substantial project.

Graduates go into robotics and automation engineering, mechanical design and development engineering, and electrical and electronic engineering, across manufacturing, automotive, healthcare, logistics and technology. The multidisciplinary skill set is increasingly sought after.

Robotics and automation are expanding rapidly across industries, from factories to surgery to warehouses, so demand keeps growing. It suits people with strong technical and analytical curiosity, a drive for mastery and originality, who enjoy combining several disciplines and building systems that physically do something in the world.`,

  sub_biomedical_engineering: `Biomedical Engineering applies engineering to medicine and the human body, designing the devices, systems and technologies that improve health care. You learn to bridge engineering and biology, creating things like prosthetics, medical imaging, monitoring devices and implants. It is engineering with a direct human benefit.

Modules cover mechanics, electronics, materials and mathematics alongside human biology and physiology, then move into medical devices, biomechanics, medical imaging, signal processing and biomaterials. Courses combine laboratory and design work with projects, often including a placement in a clinical or industry setting.

Graduates go into systems engineering, mechanical design and development engineering, and electrical and electronic engineering, working in medical technology companies, health services and research. The mix of engineering and medical knowledge suits a growing sector.

Health care technology is advancing quickly, with growth in wearable devices, AI in diagnostics and personalised medicine, opening new opportunities. It fits people with strong technical and analytical curiosity, a drive for mastery and originality, who want to apply engineering to problems that directly improve people's lives.`,

  sub_systems_engineering: `Systems Engineering is about designing and managing complex systems as a whole, making sure that many parts work together to do what they should. You learn to see the big picture, coordinate different engineering disciplines, and deliver large, complicated projects that meet real requirements. It is engineering focused on integration and reliability.

The curriculum covers engineering fundamentals, mathematics and design, then specialises into systems modelling, requirements and architecture, reliability, project delivery and control. Courses emphasise team projects that mirror real engineering programmes, often with a placement, building towards a substantial systems project.

Graduates go into systems engineering, aerospace and defence engineering, and infrastructure, maintenance and asset engineering, working on large projects in aerospace, defence, transport, energy and technology. The ability to manage complexity is valued across many high stakes industries.

As products and infrastructure become more connected and complex, the demand for people who can make whole systems work together keeps rising. It suits people with strong technical and analytical curiosity, real resilience, and a drive for achievement and mastery, who like coordinating the whole rather than just one part.`,

  // ── Architecture, Built Environment & Spatial Design ────────────────────
  sub_architecture: `Architecture is about designing buildings and spaces that are functional, beautiful and right for the people who use them. You learn to combine creative vision with technical understanding, turning ideas into designs that can actually be built. It is a discipline that balances art, science and human need.

The course is studio based, so much of your time is spent designing projects and presenting them, alongside modules in design, history and theory, construction and materials, structures, and environmental design. You build a portfolio, learn to draw and model by hand and with software, and work towards increasingly ambitious design projects. Architecture usually involves further study and professional training to fully qualify.

Graduates go into architecture and architectural technology and building information modelling, working in practices of all sizes on homes, public buildings, workplaces and whole neighbourhoods. The design and problem solving skills also transfer into related fields across the built environment.

Architecture is being reshaped by sustainability, new materials and digital design tools, so today's architects design with energy and climate firmly in mind. It suits people with strong originality, creative expression and technical curiosity, along with real precision and the autonomy to develop and defend their own design ideas.`,

  sub_architecture_and_urban_planning: `Architecture and Urban Planning looks beyond single buildings to how whole places work, combining building design with the planning of towns and cities. You learn to think about spaces at every scale, from a room to a region, and how design shapes the way communities live. It is a degree for people who want to improve the built environment as a whole.

Modules cover architectural design and technology alongside urban planning, sustainability, transport and the social and environmental factors that shape places. Courses are project based, mixing studio design work with analysis of real urban problems, and often include modelling, mapping and community focused projects.

Graduates go into town planning and urban development and sustainability and building performance, working for planning authorities, consultancies and design practices on how places are designed, developed and made more sustainable. The broad training opens roles across the built environment.

Cities face big challenges around sustainability, housing and climate, so people who can plan better places are increasingly in demand. It fits people with strong analytical and technical curiosity, a drive for achievement and purpose and impact, and the originality to imagine how places could be better.`,

  sub_architectural_technology: `Architectural Technology focuses on the science and detail of how buildings are actually put together. You learn to turn design ideas into technically sound, buildable solutions, bridging the gap between the architect's vision and the construction site. It is the more technical, detail driven side of designing buildings.

The curriculum covers building construction and materials, design technology, structures, building performance and digital tools like building information modelling. Courses are practical and project based, so you produce detailed technical drawings and specifications and learn how buildings perform in the real world, often with an industrial placement.

Graduates go into architectural technology and building information modelling and sustainability and building performance, working in architecture and engineering practices, contractors and specialist consultancies. The technical focus makes graduates highly employable in the building industry.

Digital design, off site construction and the drive for energy efficient buildings are transforming how buildings are delivered, keeping the field current. It suits people with strong technical curiosity and precision, alongside analytical curiosity and originality, who enjoy solving the practical puzzle of how to actually build something well.`,

  sub_construction_management: `Construction Management is about planning, coordinating and delivering building projects, making sure they are completed safely, on time and on budget. You learn how construction projects work from start to finish and how to lead the people, resources and processes that deliver them. It is a practical, leadership focused route into the built environment.

Modules cover construction technology and materials, project planning and management, health and safety, contracts and cost control, alongside the business side of the industry. Courses combine classroom learning with site visits and real project work, and usually include a placement that gives direct industry experience.

Graduates go into construction project delivery and surveying and cost consultancy, working for contractors, developers and consultancies on projects from individual buildings to major infrastructure. The demand for skilled managers in construction is consistently strong.

The industry is modernising with digital planning tools, off site methods and a growing focus on sustainability, which is changing how projects are run. It fits people with a drive for achievement, real resilience and adaptability, and enough technical and analytical curiosity to understand the work they are coordinating and keep complex projects on track.`,

  sub_interior_architecture_and_design: `Interior Architecture and Design is about shaping the spaces inside buildings so they work well and feel right for the people who use them. You learn to design interiors that combine function, atmosphere and technical detail, from homes to workplaces to public spaces. It blends creativity with a strong understanding of how spaces are built.

The course is studio based, with modules in spatial design, materials and construction, lighting, sustainability and the history and theory of design. You build a portfolio, learn to draw and model by hand and with software, and develop increasingly complex design projects that respond to real briefs.

Graduates go into architecture and architectural technology and building information modelling, working in interior and architectural practices, design studios and related creative industries. The skills also transfer into set, exhibition and experience design.

Growing interest in wellbeing, sustainability and flexible spaces is expanding the role of interior designers. It suits people with strong originality, creative expression and technical curiosity, along with precision and the autonomy to develop a personal design voice while meeting practical needs.`,

  sub_landscape_architecture: `Landscape Architecture is about designing outdoor spaces, from parks and gardens to public squares and whole landscapes, so they work for people and for nature. You learn to shape the environment between and around buildings, balancing beauty, ecology and use. It is a degree for people who care about the outdoor world and how we live in it.

Modules cover landscape design, planting and ecology, environmental science, and the technical side of building outdoor spaces, alongside studio design projects. Courses are practical and creative, mixing design work with site analysis, and often include field work and real project briefs.

Graduates go into town planning and urban development and sustainability and building performance, working in landscape practices, planning bodies and environmental consultancies on parks, developments, green infrastructure and public spaces. The field connects design, environment and community.

Climate change, biodiversity and healthier cities are pushing landscape architecture up the agenda, creating growing demand. It fits people with strong analytical and technical curiosity, a real sense of purpose and impact, and the originality to design places that are both beautiful and good for the planet.`,

  sub_urban_planning_and_development: `Urban Planning and Development is about how towns and cities grow and change, and how to guide that change for the better. You learn to shape where homes, workplaces, transport and green spaces go, balancing the needs of people, the economy and the environment. It is a degree with a direct influence on how communities live.

The curriculum covers planning systems and policy, urban design, transport, sustainability, and the social and economic forces that shape places, alongside the tools planners use like mapping and data analysis. Courses combine theory with real world projects and often a placement in a planning setting.

Graduates go into town planning and urban development, sustainability and building performance, and surveying and cost consultancy, working for local authorities, consultancies and developers. Planning is essential to development, so the skills are consistently needed.

Housing pressures, climate goals and the drive for sustainable, liveable cities are making planning increasingly important and data driven. It suits people with strong analytical and technical curiosity, a drive for achievement and purpose and impact, and the originality to imagine and argue for better places.`,

  // ── Scientific Discovery & Innovation ───────────────────────────────────
  sub_biomedical_science: `Biomedical Science is the study of how the human body works and what happens when disease strikes. You learn the biology behind health and illness and the laboratory science used to diagnose and understand conditions. It is the science that underpins modern medicine, worked out in the lab rather than at the bedside.

Modules cover human anatomy and physiology, cell biology, biochemistry, microbiology, immunology and genetics, with a strong emphasis on laboratory skills and how tests are used in diagnosis. Courses are practical, with regular lab work, data analysis and often a research project or placement in a clinical laboratory.

Graduates go into biomedical and clinical research, laboratory science, and clinical science and laboratory diagnostics, working in hospitals, research institutes, universities and industry. The degree is also a strong foundation for further study and specialist scientific careers.

Advances in genetics, personalised medicine and diagnostic technology are opening new directions across the field. It suits people with strong analytical and technical curiosity, a drive for mastery and precision, who enjoy careful laboratory work and want their science to make a difference to health.`,

  sub_biochemistry: `Biochemistry is the study of the chemistry of life, the molecules and reactions that make living things work. You learn how proteins, genes and cells function at a molecular level, and how understanding this can lead to new medicines and technologies. It sits at the meeting point of biology and chemistry.

The curriculum covers cell biology, chemistry, molecular biology, genetics and metabolism, with a strong focus on laboratory techniques and experimental design. Courses are lab intensive, so you spend real time running experiments and analysing results, usually completing a research project in your final year.

Graduates go into laboratory science, research and development science, and biomedical and clinical research, working in pharmaceuticals, biotechnology, universities and research institutes. It is also an excellent springboard into postgraduate research.

Biochemistry drives progress in areas like drug discovery, genetic medicine and biotechnology, so the field keeps generating new opportunities. It fits people with strong analytical and technical curiosity, a drive for mastery, precision and originality, who are fascinated by how life works at the smallest scale.`,

  sub_chemistry: `Chemistry is the study of matter and how it changes, the substances that make up everything and the reactions between them. You learn to understand, analyse and create materials and molecules, from the theory to the hands on craft of the laboratory. It is a central science that connects to almost every other field.

Modules cover the core branches, organic, inorganic and physical chemistry, alongside analytical techniques and mathematics, then specialise into areas such as materials, medicinal or environmental chemistry. Courses are strongly practical, with extensive laboratory work and a research project, and often the option of a placement.

Graduates go into materials and chemical analysis, laboratory science, research and development science, and forensic science, working across pharmaceuticals, materials, energy, consumer products and research. The analytical training also transfers widely beyond the lab.

Chemistry is central to challenges like clean energy, sustainable materials and new medicines, which keeps demand strong. It suits people with strong analytical and technical curiosity, a drive for mastery, precision and originality, who enjoy both the theory and the practical work of creating and understanding substances.`,

  sub_biology: `Biology is the study of living things, from molecules and cells to whole organisms and ecosystems. You explore how life works, evolves and interacts, building a broad understanding of the natural world. It is a wide ranging science that can take you in many directions.

The curriculum covers cell biology, genetics, physiology, ecology and evolution, with a strong emphasis on laboratory and sometimes field work. Courses combine theory with practical skills and data analysis, and you usually specialise in later years before completing a research project.

Graduates go into research and development science, biomedical and clinical research, clinical trials and translational research, and forensic science, working in research, health care, industry, conservation and education. The breadth of the degree keeps many options open.

Biology is being transformed by genomics, data and biotechnology, blurring the line between life science and computing. It fits people with strong analytical curiosity, a drive for mastery, precision and originality, who are curious about living things and enjoy investigating how they work.`,

  sub_physics: `Physics is the study of the fundamental laws that govern the universe, from the smallest particles to the largest structures in space. You learn to describe how the world works using mathematics and experiment, and to solve problems from first principles. It is the most fundamental of the sciences and a powerful training in reasoning.

Modules cover mechanics, electromagnetism, quantum physics, thermodynamics and relativity, all supported by strong mathematics, alongside laboratory and computational work. Courses combine deep theory with experiments and often programming, and you usually complete a research project in an area that interests you.

Graduates go into research and development science and scientific data and bioinformatics, but the analytical and quantitative skills are prized far more widely, including in technology, finance, engineering and data science. Physics keeps an unusually broad set of doors open.

Physics underlies advances in areas like quantum technology, energy, computing and space, so it remains at the frontier of science. It suits people with strong analytical, technical and data curiosity, a drive for mastery and precision, and the independence to think deeply and work through hard problems on their own.`,

  sub_neuroscience: `Neuroscience is the study of the brain and nervous system, how they work, how they shape behaviour and what happens when they go wrong. You learn to investigate one of the most complex systems in nature, combining biology, chemistry, psychology and data. It is a fast growing field at the frontier of understanding the mind.

The curriculum covers neurobiology, physiology, genetics and the chemistry of the brain, alongside research methods, data analysis and often elements of psychology. Courses are strongly practical, with laboratory work and data driven projects, usually building to a research project in your final year.

Graduates go into biomedical and clinical research, research and development science, and scientific data and bioinformatics, working in research institutes, universities, health care and industry. It is also a strong route into postgraduate research and specialist careers.

Brain research is advancing rapidly with new imaging, genetics and computational methods, opening major opportunities. It fits people with strong analytical, technical and data curiosity, a drive for mastery and precision, and the independence to pursue difficult questions about how the brain works.`,

  sub_biotechnology: `Biotechnology uses living systems and organisms to create useful products and technologies, from medicines and vaccines to sustainable materials and foods. You learn to harness biology for practical, real world applications, combining scientific understanding with an eye for innovation. It is science aimed at making things that improve life.

Modules cover molecular biology, genetics, biochemistry and microbiology, then move into genetic engineering, bioprocessing, and the industrial and ethical side of applying biology. Courses are lab intensive and often industry focused, with practical projects and sometimes a placement.

Graduates go into research and development science, biomedical and clinical research, and materials and chemical analysis, working in pharmaceuticals, biotech companies, agriculture and research. The applied focus makes graduates attractive to a growing industry.

Biotechnology is one of the most dynamic areas of science, driving breakthroughs in medicine, sustainability and food, so opportunities keep expanding. It suits people with strong analytical and technical curiosity, a drive for mastery, precision and originality, who want to turn biological science into real products.`,

  sub_natural_sciences: `Natural Sciences lets you study across the sciences rather than specialising in just one, combining subjects like physics, chemistry, biology and mathematics. You build a broad, connected understanding of the natural world and the freedom to shape your own scientific path. It is a flexible degree for genuinely curious scientists.

The curriculum lets you choose modules across several sciences while building strong foundations and laboratory skills in each. Courses are demanding and interdisciplinary, so you learn to connect ideas across fields, usually completing a research project in a chosen area.

Graduates go into research and development science, laboratory science, and scientific data and bioinformatics, and the interdisciplinary training is valued in research, technology, industry and beyond. The breadth suits people who want to keep their options open.

Many of today's biggest scientific challenges sit between traditional subjects, which makes interdisciplinary scientists increasingly valuable. It fits people with strong analytical, technical and data curiosity, a drive for mastery and precision, and the independence to design their own route through the sciences.`,

  sub_pharmacology: `Pharmacology is the science of how drugs work in the body, from the molecular level to their effect on whole systems. You learn how medicines are discovered, tested and used, and why they help or harm. It is the science behind every drug treatment and a key part of developing new medicines.

Modules cover physiology, biochemistry, cell biology and the principles of drug action, then move into areas such as drug discovery, toxicology and clinical pharmacology. Courses are practical, with laboratory work and data analysis and usually a research project, sometimes with a placement in industry or research.

Graduates go into biomedical and clinical research, research and development science, laboratory science, and clinical trials and translational research, working in pharmaceuticals, biotech, research institutes and health care. The degree is central to the medicines industry.

Drug discovery is being transformed by genomics, data and new therapies, creating fresh opportunities in the field. It suits people with strong analytical and technical curiosity, a drive for mastery, precision and originality, who want their science to lead directly to better treatments.`,

  // ── Health Care & Clinical Practice ─────────────────────────────────────
  sub_medicine: `Medicine trains you to diagnose, treat and care for people across the whole range of human illness. You learn the science of the body in depth and then how to apply it at the bedside, combining knowledge, judgement and communication to help patients. It is a long, demanding degree that leads directly to life as a doctor.

The early years cover anatomy, physiology, biochemistry and the science of disease, usually with early contact with patients. Later years are clinical, spent in hospitals and community settings rotating through specialties, learning to examine, diagnose and manage real patients. Qualifying leads into structured further training as a junior doctor.

Graduates become doctors across areas such as clinical medicine, surgery and procedural medicine, acute, emergency and critical care, mental health and behavioural medicine, and diagnostic and investigative medicine. Medicine offers an unusually wide choice of specialties and settings over a career.

Medicine is being reshaped by new treatments, technology and data, but the core of caring for people remains constant. It suits people with strong analytical curiosity and a genuine drive to help and care, combined with mastery, precision, empathy and a real sense of purpose and impact.`,

  sub_dentistry: `Dentistry is about diagnosing and treating problems with teeth, gums and the mouth, and helping people keep them healthy. You learn the science of oral health and the practical, hands on skills to carry out treatment with great precision. It combines clinical knowledge with fine manual craft.

The course mixes biomedical science with clinical training from early on. You study anatomy, physiology and oral biology, then spend increasing time in clinics treating patients under supervision, learning procedures from examinations to fillings and beyond. Qualifying leads into professional practice and often further specialisation.

Graduates go into dentistry and specialist dentistry, working in general practice, hospitals and specialist clinics. It is a career with clear routes, good stability and the option to specialise or run your own practice.

Dentistry is advancing with new materials, digital imaging and techniques, but the emphasis on precise, careful treatment remains central. It fits people with a drive for mastery, precision and achievement, real skill with their hands, and the care and analytical curiosity to look after patients well.`,

  sub_pharmacy: `Pharmacy is about medicines, how they work, how they are used safely, and how to advise patients and other health professionals about them. You become an expert in drugs and their effects, playing a central role in safe and effective treatment. It combines science with direct patient contact.

The curriculum covers pharmacology, chemistry, physiology and the science of medicines, alongside patient care, clinical skills and the law and practice of pharmacy. Courses are practical, with placements in community and hospital settings, and qualifying involves a period of supervised training before registration.

Graduates go into clinical pharmacy and community pharmacy, working in hospitals, community pharmacies, primary care and industry. The role is expanding as pharmacists take on more direct clinical responsibility.

Pharmacy is changing as pharmacists do more prescribing and patient care, and as new medicines and digital tools emerge. It suits people who combine a real drive to help and care with mastery, achievement, social confidence and the analytical curiosity to get medicines right.`,

  sub_nursing: `Nursing is about caring for people through illness, recovery and everyday health needs, combining clinical skill with genuine human compassion. You learn to assess, treat and support patients and to be their advocate at some of the most important moments of their lives. It is one of the most trusted and needed professions.

The course blends theory with a large amount of supervised clinical placement. You study anatomy, physiology, health and the science of care, then apply it in hospitals and community settings, building practical skills across different areas of nursing. Around half the degree is spent in practice, and qualifying leads to professional registration.

Graduates go into nursing across hospitals, community care, mental health, children's services and many specialties, with strong demand and clear routes to progress. Nurses can go on to advanced and specialist roles throughout their careers.

Nursing is expanding as nurses take on more advanced clinical roles and as care moves into the community. It fits people with a strong drive to help and care, real empathy, mastery and a deep sense of purpose and impact, who want work that matters every single day.`,

  sub_midwifery: `Midwifery is about supporting women and families through pregnancy, birth and the early days of a new baby's life. You learn the clinical skills to keep mothers and babies safe and the human skills to support people through a profound experience. It is a specialised, deeply rewarding branch of health care.

The course combines theory with extensive clinical placement. You study the science of pregnancy, birth and newborn care alongside communication, ethics and hands on skills, spending much of the degree in maternity settings under supervision. Qualifying leads directly to professional registration as a midwife.

Graduates go into midwifery, working in hospitals, birth centres and the community, supporting families through pregnancy and birth. It is a focused career with strong demand and the chance to specialise over time.

Midwifery continues to evolve with new evidence and a focus on personalised, family centred care. It suits people with a strong drive to help and care, real empathy and a deep sense of purpose and impact, combined with the mastery and calm to handle a role where the stakes are high.`,

  sub_physiotherapy: `Physiotherapy is about helping people move and function better, whether recovering from injury, managing a condition or improving performance. You learn how the body moves and how to restore and maintain that movement through hands on treatment and exercise. It is a practical, people centred health profession.

The curriculum covers anatomy, physiology and the science of movement, alongside assessment, treatment techniques and rehabilitation, with a large amount of supervised clinical placement. Courses are hands on from early on, and qualifying leads to professional registration.

Graduates go into rehabilitation and functional independence roles, working in hospitals, clinics, sport, community care and private practice. Physiotherapists are in demand across health care and increasingly in prevention and wellbeing.

The profession is growing as populations age and as the focus shifts towards keeping people active and independent. It fits people with a strong drive to help and care, combined with analytical curiosity, mastery, precision and a real sense of purpose and impact.`,

  sub_occupational_therapy: `Occupational Therapy helps people do the everyday activities that matter to them, whether after illness, injury or because of disability. You learn to support people to live as independently and fully as possible, adapting tasks, environments and approaches to their needs. It is a creative, practical caring profession.

Modules cover anatomy, physiology, psychology and the science of occupation and rehabilitation, alongside assessment and intervention skills, with substantial supervised placement. Courses are practical and person centred, and qualifying leads to professional registration.

Graduates go into rehabilitation and functional independence roles, working in hospitals, community services, mental health, social care and beyond. Occupational therapists are needed across health and social care and increasingly in the community.

The profession is expanding as care focuses more on independence, prevention and quality of life. It suits people with a strong drive to help and care, combined with analytical curiosity, mastery, precision and a genuine sense of purpose and impact.`,

  sub_paramedic_science: `Paramedic Science trains you to provide emergency and urgent care, often as the first health professional on the scene. You learn to assess and treat patients quickly and safely in unpredictable situations, from accidents to serious illness. It is a fast paced, high responsibility health profession.

The curriculum covers anatomy, physiology and the science of illness and injury, alongside emergency care skills, decision making and how to work under pressure, with extensive placement on ambulances and in clinical settings. Qualifying leads to professional registration as a paramedic.

Graduates go into paramedic practice and emergency care, working in ambulance services, urgent care and increasingly in wider community and primary care roles. Demand is strong and the role is expanding into new settings.

The role is broadening as paramedics take on more advanced clinical responsibilities beyond the ambulance. It fits people with a strong drive to help and care, real resilience and comfort with a fast pace, and the analytical curiosity and precision to make good decisions when it counts.`,

  sub_social_work: `Social Work is about supporting people through difficult times and protecting those who are vulnerable, from children to older adults. You learn to assess needs, work with families and communities, and navigate complex situations to help people and keep them safe. It is a demanding profession built on care and judgement.

The course combines social science, law and ethics with practical skills and substantial supervised placement. You study human development, safeguarding, policy and intervention methods, and spend significant time working with people in real settings. Qualifying leads to professional registration.

Graduates go into social work and safeguarding roles, working in children's and adults' services, mental health, and community and voluntary organisations. Social workers are consistently in demand across the public and voluntary sectors.

The profession continues to evolve with changing policy and a focus on early support and protecting the vulnerable. It suits people with a strong drive to help and care, a deep sense of purpose and impact, real empathy, and the analytical curiosity and precision to make careful decisions in hard situations.`,

  sub_sport_and_exercise_science: `Sport and Exercise Science is the study of how the body responds to physical activity and how to improve health and performance. You learn the science behind movement, fitness and sport, from physiology to psychology, and how to apply it to real people. It connects science, health and human performance.

Modules cover anatomy, physiology, biomechanics and sport and exercise psychology, alongside research methods and practical testing skills. Courses are hands on, with laboratory and field work measuring performance and health, often with a placement and a research project.

Graduates go into rehabilitation and functional independence and public health and health improvement roles, as well as sport, fitness and coaching, and the science training also supports further study into clinical fields. The degree spans health and performance.

Growing focus on physical activity for health, alongside data and technology in sport, is expanding the field. It fits people with a strong drive to help and care, combined with analytical curiosity, mastery, precision and a real sense of purpose and impact.`,

  sub_diagnostic_radiography: `Diagnostic Radiography is about producing and interpreting the medical images that help diagnose illness and injury, using technologies like X-ray, CT and MRI. You learn to operate advanced imaging equipment safely and to work closely with patients and clinical teams. It combines technology, science and patient care.

The curriculum covers anatomy, physiology and imaging science alongside the practical skills of using imaging equipment, with substantial clinical placement in hospitals. Courses are hands on from early on, and qualifying leads to professional registration.

Graduates go into diagnostic and investigative medicine and clinical science and laboratory diagnostics, working in hospitals and imaging services. Radiographers are in steady demand as imaging becomes ever more central to diagnosis.

Medical imaging is advancing rapidly, including the use of AI to support diagnosis, which is expanding the role. It suits people with strong analytical and technical curiosity, mastery and precision, and a real sense of purpose and impact, who enjoy working with technology to help patients.`,

  sub_optometry: `Optometry is about examining eyes, diagnosing vision and eye health problems, and prescribing corrections and treatment. You learn the science of vision and the clinical skills to test, diagnose and care for patients' eyes. It combines precise clinical work with regular patient contact.

The curriculum covers the science of the eye and vision alongside clinical examination and diagnosis skills, with substantial supervised clinical practice. Courses are practical, and qualifying involves a period of supervised training before registration as an optometrist.

Graduates go into diagnostic and investigative medicine and clinical science and laboratory diagnostics, working in high street practice, hospitals and specialist clinics. It is a stable career with clear routes and the option to run your own practice.

Optometry is expanding as optometrists take on more clinical responsibility and as imaging and technology improve eye care. It fits people with strong analytical and technical curiosity, mastery and precision, and a genuine sense of purpose and impact in caring for patients.`,

  // ── Psychology, Behaviour & Human Insight ───────────────────────────────
  sub_psychology: `Psychology is the scientific study of the mind and behaviour, how people think, feel, learn and act. You learn to understand human behaviour through evidence and research rather than guesswork, exploring everything from memory and emotion to mental health and social life. It is a science with wide reaching applications.

The curriculum covers the core areas, cognitive, developmental, social, biological and abnormal psychology, alongside strong training in research methods and statistics. Courses combine theory with practical studies where you design and run research, usually completing a research project in your final year.

Graduates go into a wide range of paths, including clinical psychology and mental health support, counselling and therapeutic practice, people analytics and workplace behaviour, user experience research and behavioural insight, and learning and behaviour support. Many clinical routes require further study, but the degree opens doors across health, business, research and beyond.

Psychology is increasingly data driven and applied, from mental health to how people use technology, keeping demand strong. It suits people with a genuine drive to help and care, combined with analytical curiosity, empathy, mastery and a real sense of purpose and impact.`,

  sub_counselling_and_psychotherapy: `Counselling and Psychotherapy is about helping people work through emotional and psychological difficulties through skilled, supportive conversation. You learn the theory of how people change and the practical skills to build trust, listen deeply and support others. It is a degree focused on directly helping people.

Modules cover counselling theories and approaches, human development and mental health, and ethics, with a strong emphasis on developing practical skills through supervised practice and often personal reflection. Courses build towards real counselling experience, and full professional practice usually requires further accredited training.

Graduates go into counselling and psychotherapy and therapeutic practice, clinical and mental health support, and learning and behaviour support, working in health services, charities, education and private practice. Demand for mental health support continues to grow.

Awareness of mental health has risen sharply, expanding the need for skilled practitioners across many settings. It fits people with a strong drive to help and care, real empathy and social confidence, combined with the analytical curiosity and mastery to understand people and support change.`,

  sub_cognitive_science: `Cognitive Science is the study of how the mind works, drawing together psychology, neuroscience, computing, linguistics and philosophy. You explore how people perceive, think, learn and make decisions, and how these processes can be understood and even modelled. It is a genuinely interdisciplinary way of understanding the mind.

The curriculum blends psychology and research methods with elements of computing, neuroscience and data analysis, exploring topics like perception, language, memory and reasoning. Courses combine theory with practical and data driven work, often including projects that model or test how the mind functions.

Graduates go into user experience research and behavioural insight, people analytics and workplace behaviour, and learning and behaviour support, working in technology, research, business and beyond. The mix of human insight and analytical skill is increasingly valued.

As technology relies more on understanding human behaviour, from AI to product design, cognitive science is highly relevant. It suits people with strong analytical curiosity and originality, a drive to understand and help people, combined with data curiosity, social confidence and mastery.`,

  sub_forensic_psychology: `Forensic Psychology applies psychology to crime, the justice system and rehabilitation. You learn to understand why people offend, how to assess risk and how psychological knowledge can support justice and help people change. It combines the science of behaviour with a focus on crime and the law.

Modules cover core psychology and research methods alongside forensic topics such as criminal behaviour, risk assessment, and psychology in the legal system. Courses combine theory with applied study, and full professional practice as a forensic psychologist requires further training after the degree.

Graduates go into justice, rehabilitation and behaviour change and clinical and mental health support roles, working in prisons, probation, secure services, police and research. The degree also supports wider careers across psychology and criminal justice.

Growing focus on rehabilitation, risk and mental health in justice keeps the field relevant. It fits people with a strong drive to help and care and a clear sense of purpose and impact, combined with empathy, analytical curiosity and the mastery to work in demanding settings.`,

  sub_behavioural_science: `Behavioural Science is the study of why people do what they do, and how understanding this can improve decisions, policies and products. You learn to combine psychology, economics and data to explain and influence real behaviour. It is a practical, applied way of using human insight.

The curriculum covers psychology and behavioural theory alongside research methods, data analysis and how behaviour is shaped in areas like health, finance and public policy. Courses are evidence based and applied, often including projects that test how to change behaviour in real settings.

Graduates go into people analytics and workplace behaviour, user experience research and behavioural insight, and learning and behaviour support, working in business, government, consultancy and technology. The ability to turn behavioural insight into action is increasingly sought after.

Organisations increasingly use behavioural science to design better services, products and policies, expanding the field. It suits people with strong analytical and data curiosity and originality, a drive to understand and help people, combined with social confidence and mastery.`,

  sub_psychology_with_neuroscience: `Psychology with Neuroscience combines the study of behaviour with the biology of the brain, linking what people do with what happens in the nervous system. You learn to understand the mind from both a psychological and a biological angle, giving a fuller picture of how thought and behaviour arise. It bridges social and life science.

Modules cover core psychology and research methods alongside neuroscience, exploring how the brain shapes perception, emotion, memory and mental health. Courses combine theory with laboratory and data driven work, usually completing a research project that draws on both fields.

Graduates go into clinical and mental health support and learning and behaviour support, as well as research and applied roles, with the combined training also supporting further study into clinical or research careers. The dual perspective opens doors across health and research.

Advances in brain imaging and neuroscience are deepening our understanding of behaviour and mental health, keeping the field current. It fits people with a strong drive to help and care, real empathy and social confidence, combined with analytical curiosity, mastery and a sense of purpose and impact.`,

  // ── Education, Coaching & People Development ─────────────────────────────
  sub_education_studies: `Education Studies is about how people learn and how education shapes individuals and society. Rather than training you to teach a specific class, it explores learning, teaching, policy and the role of education more broadly. It is a flexible degree for people fascinated by learning and how to improve it.

The curriculum covers learning theory, child development, the psychology and sociology of education, and education policy and practice. Courses combine theory with practical study and often placements or projects in educational settings, building a broad understanding of how education works.

Graduates go into a range of paths, including education support, outreach and student services, learning design and educational technology, training and development, early years and family support, and academic research, and it is also a common route towards teaching with further training. The breadth keeps many options open.

Education is changing with technology, new approaches to learning and a focus on inclusion, creating varied opportunities. It suits people with a strong drive to help and care, a sense of belonging and purpose and impact, combined with empathy, analytical curiosity and social confidence.`,

  sub_primary_education_qts: `Primary Education with Qualified Teacher Status trains you to teach children in their early school years across the whole curriculum. You learn how children learn and how to bring every subject to life for them, combining knowledge with the craft of the classroom. It is a direct route into becoming a primary teacher.

The course blends the theory of learning and child development with subject knowledge and teaching skills, and includes substantial school placements. You spend significant time in classrooms under supervision, and the degree leads to qualified teacher status on completion.

Graduates go into primary teaching and classroom practice and special educational needs and inclusion support, working in primary schools and related settings. Teaching offers a stable, meaningful career with clear routes to progress.

Teaching continues to evolve with technology, inclusion and new approaches to learning, but the heart of the role stays the same. It fits people with a strong drive to help and care, real empathy and a sense of belonging and purpose and impact, combined with social confidence and creativity.`,

  sub_early_years_education_and_care: `Early Years Education and Care focuses on the learning and development of children in their earliest years, when the foundations for later life are laid. You learn how very young children grow, learn and thrive, and how to support them and their families. It is a degree for people who want to make a difference at the very start of life.

The curriculum covers child development, early learning, health and wellbeing, and working with families, alongside the practical skills of caring for and teaching young children. Courses include substantial placement in early years settings, combining theory with hands on experience.

Graduates go into early years and family support roles, working in nurseries, early years settings, children's services and family support. It is a growing area with a clear social purpose and routes into leadership and further teaching qualifications.

Recognition of how important the early years are is increasing investment and focus in this area. It suits people with a strong drive to help and care, real empathy and a sense of belonging and purpose and impact, combined with social confidence and creativity.`,

  sub_secondary_education_qts: `Secondary Education with Qualified Teacher Status trains you to teach a specific subject to older school students. You develop deep subject knowledge and the skills to teach it well, helping young people learn, grow and reach their potential. It is a direct route into becoming a secondary teacher.

The course combines subject expertise with the theory of learning and adolescent development and the practical craft of teaching, including substantial school placements. You spend significant time teaching under supervision, and the degree leads to qualified teacher status on completion.

Graduates go into secondary teaching, education support, outreach and student services, and special educational needs and inclusion support, working in secondary schools and colleges. Teaching offers a stable, meaningful career with clear progression.

Teaching keeps evolving with technology, inclusion and changing curricula, while the core purpose remains helping young people learn. It fits people with a strong drive to help and care, real empathy and a sense of belonging and purpose and impact, combined with social confidence and creativity.`,

  sub_sports_coaching_and_development: `Sports Coaching and Development is about helping people improve, achieve and benefit through sport and physical activity. You learn the science and skill of coaching and how sport can develop individuals and communities. It combines a love of sport with the ability to teach and inspire.

The curriculum covers coaching theory and practice, the science of performance, and the role of sport in development and communities, alongside practical coaching experience. Courses are hands on, with real coaching placements and projects, building both technical and people skills.

Graduates go into training, learning and development and education support and outreach roles, as well as coaching, sport development and community programmes. The people and leadership skills also transfer well beyond sport.

Growing focus on physical activity, wellbeing and community sport is expanding opportunities in the field. It suits people with a strong drive to help and care, a sense of belonging and purpose and impact, combined with empathy and social confidence, who want to develop others through sport.`,

  // ── Law, Governance & Public Impact ─────────────────────────────────────
  sub_law: `Law is the study of the rules that govern society and how they are made, interpreted and applied. You learn to read and analyse the law with precision, build arguments and understand how legal principles shape everyday life and major decisions. It is a rigorous training in reasoning and clear thinking as much as in the law itself.

The curriculum covers the foundations, contract, criminal, public, tort and property law, alongside legal method and how to research and construct arguments. Courses involve close reading, case analysis, essays and often mooting or advocacy practice, with the option to specialise in later years. Becoming a practising lawyer requires further professional training after the degree.

Graduates go into legal support and casework, governance, risk and compliance, and towards qualifying as a barrister or solicitor, working in law firms, chambers, businesses, government and the courts. The analytical skills also open careers well beyond law.

Law is being reshaped by technology, regulation and global business, changing how legal work is done. It suits people with strong analytical curiosity, mastery and precision, real reliability, and the autonomy and originality to build and defend a clear argument.`,

  sub_politics: `Politics is the study of power, government and how decisions that affect society are made. You learn how political systems work, how policies are shaped, and how to analyse debates about how we should be governed. It is a degree for people who want to understand and influence the world around them.

The curriculum covers political theory, national and international politics, government and policy, alongside research methods for analysing political questions. Courses involve reading, debate, essays and analysis of real political issues, with the freedom to specialise in areas that interest you.

Graduates go into policy and public sector analysis and public affairs and advocacy, working in government, think tanks, campaigning organisations, consultancy and the media. The skills in analysis and argument transfer widely across public life and business.

Politics is increasingly shaped by data, media and global challenges, keeping the field dynamic and relevant. It fits people with a strong sense of purpose and impact, analytical curiosity and social confidence, combined with originality, mastery and the autonomy to form and argue their own views.`,

  sub_social_and_public_policy: `Social and Public Policy is about how societies tackle problems like health, education, poverty and inequality through the decisions of government and other institutions. You learn to analyse social issues and evaluate the policies designed to address them. It connects understanding society with the practical business of improving it.

Modules cover social science, policy analysis, and the systems behind areas such as welfare, health and education, alongside research methods and data. Courses combine theory with the study of real policies and their effects, often including applied projects.

Graduates go into policy and public sector analysis, public affairs and advocacy, and social research and cultural analysis, working in government, charities, research organisations and consultancy. The ability to analyse and shape policy is valued across the public and voluntary sectors.

Pressing social challenges and a growing use of evidence in policy keep this field important. It suits people with a strong sense of purpose and impact, analytical curiosity and social confidence, combined with cultural and global curiosity and mastery.`,

  sub_criminology: `Criminology is the study of crime, why it happens, how society responds, and how justice works. You explore the causes of crime, the workings of the police, courts and prisons, and the wider social factors involved. It brings together social science, law and psychology to understand one of society's biggest challenges.

The curriculum covers criminological theory, the justice system, and research methods, alongside topics such as policing, punishment and the causes of offending. Courses combine theory with the analysis of real data and issues, often including applied or research projects.

Graduates go into legal support and casework, investigations and financial crime, and governance, risk and compliance, working in policing, justice, security, research and the voluntary sector. The analytical and research skills also transfer to wider roles.

Growing focus on data, prevention and rehabilitation is shaping how crime and justice are understood. It fits people with strong analytical curiosity and a clear sense of purpose and impact, combined with reliability, security minded thinking, mastery and precision.`,

  sub_philosophy_politics_and_economics_ppe: `Philosophy, Politics and Economics brings together three disciplines that together explain how societies think, govern and organise their resources. You learn to reason rigorously, understand political systems and analyse economic decisions, gaining a powerful and flexible way of thinking about the world. It is a demanding, wide ranging degree favoured by future leaders and thinkers.

The curriculum lets you study philosophy, politics and economics together or focus on the areas you prefer, covering logic and ethics, political systems and theory, and economic analysis. Courses emphasise argument, analysis and clear writing, with the freedom to specialise as you progress.

Graduates go into policy and public sector analysis, public affairs and advocacy, and governance, risk and compliance, and the broad training also opens careers in finance, consultancy, media and beyond. Few degrees keep as many high level doors open.

The combination is well suited to a world where politics, economics and ethics are deeply intertwined. It suits people with a strong sense of purpose and impact, analytical curiosity and social confidence, combined with originality, reliability and a taste for big questions.`,

  sub_law_with_criminology: `Law with Criminology combines the rigorous study of the law with an understanding of crime and the justice system. You learn to analyse the law precisely while also exploring why crime happens and how society responds. It is a strong combination for people interested in law with a focus on justice.

The curriculum covers the foundations of law alongside criminology, so you study areas like criminal and public law together with the causes of crime, policing and punishment. Courses combine legal analysis with social science and research, and qualifying as a practising lawyer requires further professional training.

Graduates go towards solicitor practice, legal support and casework, and investigations and financial crime, working in law, justice, policing and related fields. The mix of legal and criminological insight suits careers across the justice system.

Technology, data and reform are changing both law and criminal justice, keeping the field current. It fits people with strong analytical curiosity, mastery and precision, real reliability and a sense of purpose and impact, who want to combine legal rigour with a focus on crime and justice.`,

  // ── Business Strategy, Commercial & Leadership ──────────────────────────
  sub_business_management: `Business Management is about how organisations work and how to lead them well. You learn the core areas of running a business, strategy, finance, marketing, operations and people, and how they fit together. It is a broad, practical degree that prepares you to understand and improve almost any kind of organisation.

The curriculum covers management, marketing, finance and accounting, operations and organisational behaviour, alongside strategy and often data analysis. Courses combine theory with case studies, group projects and real business problems, and frequently include a placement year that gives valuable experience.

Graduates go into a wide range of paths, including consulting and strategic improvement, business analysis, project and transformation work, operations and supply chain, business intelligence, people and HR, business development, and even founding their own venture. Few degrees lead to as broad a set of options.

Business is being reshaped by data, technology and sustainability, so modern managers need to be analytical as well as commercial. It suits people with analytical curiosity and a drive for achievement, social confidence and entrepreneurial drive, who enjoy variety and working with others.`,

  sub_business_analytics: `Business Analytics is about using data to make better business decisions. You learn to gather, analyse and interpret data and turn it into insight that helps organisations act. It combines business understanding with practical analytical and technical skills, sitting where management meets data.

The curriculum covers business and management alongside statistics, data analysis and analytics tools, teaching you to work with data and present findings clearly. Courses are applied, with projects using real datasets and business problems, and often a placement.

Graduates go into operations and supply chain, business analysis, and consulting and strategic improvement, working across almost every sector, since all organisations now rely on data. The blend of commercial and analytical skill is in strong demand.

As data becomes central to how businesses compete, analysts who can turn numbers into decisions are increasingly valuable. It fits people with strong analytical and data curiosity, a drive for achievement, and an appetite for variety and solving practical problems.`,

  sub_international_business: `International Business is about how organisations operate across countries and cultures. You learn the core of business alongside the challenges and opportunities of working globally, from trade and strategy to culture and international markets. It is a degree for people drawn to business with a global outlook.

The curriculum covers management, marketing, finance and strategy with an international focus, alongside global trade, cross cultural working and often a language. Courses frequently include study abroad or an international placement, giving real experience of working across borders.

Graduates go into generalist business programmes, commercial partnerships and account growth, and business development, working in multinational companies, trade, consultancy and global organisations. The international perspective opens doors in many sectors.

Global business keeps evolving with technology, shifting trade patterns and a more connected world, keeping the field dynamic. It suits people with social confidence, a drive for achievement and entrepreneurial drive, real adaptability, and analytical and data curiosity to navigate different markets.`,

  sub_human_resource_management: `Human Resource Management is about how organisations get the best from their people. You learn to recruit, develop, support and lead employees, and to shape the culture and policies that help both people and organisations thrive. It combines business understanding with a genuine focus on people.

The curriculum covers management and organisational behaviour alongside recruitment, employment law, learning and development, reward and employee relations. Courses combine theory with real workplace scenarios and often a placement, building both business and people skills.

Graduates go into people and HR roles and consulting and strategic improvement, working across almost every kind of organisation, since all of them need to manage people well. The skills are broadly transferable and always in demand.

The role of HR is expanding as organisations focus more on wellbeing, culture, data and the future of work. It fits people with a strong drive to help and care, a sense of belonging, and analytical curiosity, combined with a drive for achievement and an appetite for variety and working with others.`,

  sub_operations_and_supply_chain_management: `Operations and Supply Chain Management is about how goods and services are produced and delivered, efficiently and reliably, from raw materials to the customer. You learn to design and improve the processes and networks that make organisations work. It is a practical, in demand area of business.

The curriculum covers operations, logistics, procurement and supply chain design, alongside data analysis, quality and project management. Courses combine theory with real business problems and often a placement, increasingly using data and digital tools.

Graduates go into operations and supply chain, project and transformation work, and business analysis, working in manufacturing, retail, logistics, consultancy and beyond. The skills are essential to almost every organisation that makes or moves things.

Supply chains are being transformed by data, automation and a focus on resilience and sustainability, keeping the field current. It suits people with strong analytical and data curiosity, a drive for achievement, an appetite for a fast pace, and a liking for working with others to keep complex systems running.`,

  // ── Finance, Economics & Investment ─────────────────────────────────────
  sub_accounting: `Accounting is the language of business, the way organisations record, report and understand their finances. You learn how money flows through a business, how to prepare and interpret financial information, and how to make sure it is accurate and trustworthy. It is a precise, respected discipline at the heart of every organisation.

The curriculum covers financial and management accounting, taxation, audit and business finance, alongside the law and ethics of the profession. Courses are practical and often aligned with professional accountancy qualifications, so studying can earn exemptions towards becoming a qualified accountant, and many include a placement.

Graduates go into treasury and liquidity, risk, compliance and controls, and accounting, audit and assurance, working in accountancy firms, businesses and the public sector. Accounting offers a stable, well respected career with clear routes to qualify and progress.

Automation and data are changing routine accounting work, shifting the focus towards analysis and advice. It suits people with strong reliability, security minded thinking and analytical curiosity, combined with precision, data curiosity and a drive for achievement.`,

  sub_finance: `Finance is about how money is raised, invested and managed, by individuals, companies and markets. You learn how financial decisions are made, how markets work and how to value and manage investments and risk. It is a fast moving, commercial field that sits at the centre of the economy.

The curriculum covers corporate finance, investments, financial markets and analysis, alongside accounting, economics and quantitative methods. Courses combine theory with real world analysis and often a placement, and use of financial data and tools throughout.

Graduates go into a wide range of paths, including investment banking and corporate finance, equity and investment research, asset and wealth management, corporate banking, markets and trading, risk and compliance, sustainable finance, financial analysis, fintech and private equity. Few degrees open as many routes within a single industry.

Finance is being transformed by technology, data and a growing focus on sustainable investing, creating new kinds of role. It fits people with strong analytical and data curiosity, entrepreneurial drive and a drive for achievement, combined with precision and an appetite for a commercial, fast paced world.`,

  sub_accounting_and_finance: `Accounting and Finance combines the discipline of accounting with the broader world of finance, giving you both the detail and the big picture. You learn to record and interpret financial information and to understand how money is raised, invested and managed. It is a versatile degree that keeps many financial careers open.

The curriculum covers financial and management accounting, corporate finance, investments and financial markets, alongside economics and quantitative methods. Courses are practical, often aligned with professional qualifications for exemptions, and frequently include a placement.

Graduates go into corporate banking, treasury and liquidity, risk and compliance, accounting, audit and assurance, investment banking, asset and wealth management, and financial analysis. The combination suits people who want breadth across finance and accountancy.

Data and technology are reshaping both accounting and finance, moving the emphasis towards analysis and insight. It suits people with strong analytical and data curiosity, a drive for achievement, security minded thinking and real precision.`,

  sub_economics: `Economics is the study of how people, businesses and societies use their resources and make decisions. You learn to analyse how markets, incentives and policies shape the world, using both reasoning and data. It is a powerful way of understanding almost any issue, from personal choices to global crises.

The curriculum covers microeconomics and macroeconomics, alongside strong training in mathematics, statistics and econometrics, then specialises into areas such as finance, development, behaviour or policy. Courses combine theory with data analysis and real world application, often including a placement.

Graduates go into policy and public sector analysis, investment banking and corporate finance, equity and investment research, consulting and business analysis, and the analytical training is prized across finance, government and business. Economics keeps a very wide range of doors open.

Economics is increasingly data driven, drawing on large datasets and new methods to understand behaviour and policy. It fits people with strong analytical and data curiosity, a drive for achievement and entrepreneurial drive, combined with precision and a taste for big questions.`,

  sub_finance_and_financial_technology: `Finance and Financial Technology combines the world of finance with the technology that is transforming it. You learn how money and markets work and how digital innovation, from payments to algorithms, is reshaping the industry. It is a forward looking degree for people drawn to both finance and technology.

The curriculum covers corporate finance, markets and investments alongside data, programming and the technologies behind fintech such as digital payments, blockchain and automation. Courses are applied, combining financial understanding with hands on technical work, and often a placement.

Graduates go into fintech and digital finance, investment banking and corporate finance, and markets and trading, working in banks, fintech firms, technology companies and startups. The blend of finance and tech skills is in growing demand.

Fintech is one of the fastest changing areas of finance, with technology constantly opening new possibilities. It suits people with strong analytical and technical curiosity, entrepreneurial drive and a drive for achievement, combined with social confidence and an appetite for a fast pace.`,

  sub_economics_with_data_science: `Economics with Data Science combines economic thinking with the tools to analyse large amounts of data. You learn to understand how the economy and markets work and to use data science to test ideas and make predictions. It is a strong combination for a world where economic questions are increasingly answered with data.

The curriculum covers microeconomics and macroeconomics alongside statistics, programming and machine learning, teaching you to apply data science to economic and financial problems. Courses are applied, with real datasets and projects, and often a placement.

Graduates go into financial analysis, equity and investment research, and risk and compliance, working in finance, consultancy, technology and government. The mix of economics and data skills is highly employable.

As economics and finance become ever more data driven, this combination is increasingly valuable. It fits people with strong analytical and data curiosity, a drive for achievement and entrepreneurial drive, combined with reliability and security minded thinking.`,

  sub_investment_management: `Investment Management is about how money is invested to grow wealth over time, for individuals, funds and institutions. You learn how to analyse assets, build and manage portfolios, and balance risk and return. It is a focused, analytical route into the world of investing.

The curriculum covers investments, financial markets and portfolio management alongside corporate finance, economics and quantitative analysis. Courses are applied, using real financial data and often aligned with professional investment qualifications, and frequently include a placement.

Graduates go into asset and wealth management, equity and investment research, and private equity and venture capital, working in fund managers, banks, wealth firms and investment houses. It is a specialised route into a competitive and rewarding field.

Investing is being reshaped by data, technology and a rising focus on sustainable and responsible investment. It suits people with strong analytical and data curiosity, entrepreneurial drive and a drive for achievement, combined with precision and sound judgement.`,

  // ── Entrepreneurship, Innovation & Venture Building ─────────────────────
  sub_entrepreneurship_and_innovation: `Entrepreneurship and Innovation is about turning ideas into real ventures and finding new ways to create value. You learn how to spot opportunities, test ideas, and build and grow a business or a new product. It is a practical, action focused degree for people who want to make things happen.

The curriculum covers the fundamentals of business alongside idea generation, product development, funding and growth, and the mindset and skills of building something new. Courses are hands on, with real projects where you develop and pitch ventures, and often work with startups or run your own.

Graduates go into venture building and founding, start up operations, product growth and business development in start ups, and venture capital and innovation support, working in startups, scale ups, innovation teams and their own ventures. The skills also make graduates valuable inside larger organisations.

Innovation is central to the modern economy, and technology keeps lowering the barriers to starting something new. It fits people with strong entrepreneurial drive and a drive for achievement, real autonomy and originality, combined with analytical curiosity and adaptability.`,

  sub_business_management_with_entrepreneurship: `Business Management with Entrepreneurship gives you a full grounding in business alongside the skills to create and grow new ventures. You learn how organisations work and how to apply that knowledge to build something of your own or drive innovation within a company. It combines broad business understanding with an entrepreneurial edge.

The curriculum covers management, marketing, finance and strategy alongside entrepreneurship, innovation and new venture development. Courses combine theory with practical projects where you develop business ideas, and often include a placement or the chance to work on real ventures.

Graduates go into start up operations, product growth and business development in start ups, and venture building and founding, working in startups, growing companies and innovation roles, as well as their own ventures. The mix of management and entrepreneurship is broadly useful.

As organisations of all sizes need to innovate, people who can combine business skill with entrepreneurial thinking are in demand. It suits people with a drive for achievement and entrepreneurial drive, real autonomy and originality, combined with analytical curiosity and a liking for working with others.`,

  sub_social_enterprise_and_community_development: `Social Enterprise and Community Development is about using business and enterprise to create social good. You learn to build ventures and projects that tackle social and community problems while being sustainable. It is a degree for people who want to combine purpose with practical action.

The curriculum covers enterprise and business skills alongside community development, social impact and how to run organisations that balance mission and money. Courses are practical and community focused, often involving real projects with social enterprises or community organisations.

Graduates go into venture building and founding and start up operations, working in social enterprises, charities, community organisations and impact focused ventures, and the skills also transfer into wider business and public roles. The focus is on making a difference through enterprise.

Growing interest in purpose driven business and social impact is expanding this field. It fits people with strong entrepreneurial drive, originality and autonomy, a drive for achievement and a liking for working with others, who want their work to benefit people and communities.`,

  sub_innovation_and_technology_management: `Innovation and Technology Management is about how organisations create, manage and profit from new technology and ideas. You learn to bridge the worlds of business and technology, turning innovation into real value. It is a degree for people who want to lead change and manage the technologies shaping the future.

The curriculum covers management and strategy alongside innovation, technology and how new products and ideas move from concept to market. Courses combine business understanding with the practical management of innovation, often including projects with real organisations and a placement.

Graduates go into venture capital and innovation support, start up operations, and product growth and business development in start ups, working in technology companies, innovation teams, consultancies and startups. The blend of business and technology insight is increasingly valued.

Rapid technological change means organisations constantly need people who can manage innovation well. It suits people with strong analytical curiosity and entrepreneurial drive, a drive for achievement, real adaptability and autonomy, and a liking for working across business and technology.`,

  // ── Marketing, Media & Communication ────────────────────────────────────
  sub_marketing: `Marketing is about understanding what people want and connecting them with products, services and ideas. You learn how to research audiences, build brands, and create campaigns that persuade and engage. It blends creativity with analysis, since modern marketing is driven as much by data as by ideas.

The curriculum covers marketing principles, consumer behaviour, branding and communications, alongside market research, digital marketing and analytics. Courses are practical, with real campaign projects and case studies, and often a placement that gives industry experience.

Graduates go into brand and marketing strategy, performance marketing and growth, market research and audience insight, and content and social media, working across almost every sector, since all organisations need to reach customers. The field offers a wide mix of creative and analytical roles.

Marketing has been transformed by digital channels, data and social media, and continues to change fast. It suits people with analytical and data curiosity and originality, combined with social confidence and entrepreneurial drive, who enjoy mixing creative ideas with evidence.`,

  sub_public_relations_and_communications: `Public Relations and Communications is about how organisations build and protect their reputation and connect with the public. You learn to craft messages, manage relationships with media and audiences, and communicate clearly, especially when it matters most. It is a people focused field built on strong communication.

The curriculum covers communication theory and practice, media relations, campaign planning and managing reputation, alongside writing and digital communication. Courses are practical, with real campaign and writing projects, and often a placement in a communications role.

Graduates go into public relations and communications and content and social media, working in agencies, in house communications teams, charities, government and the media. Strong communicators are needed across every kind of organisation.

Communication is being reshaped by social media, real time news and the constant management of reputation online. It fits people with strong social confidence and a sense of purpose and impact, combined with originality, entrepreneurial drive and analytical curiosity.`,

  sub_digital_media_production_and_technology: `Digital Media Production and Technology is about creating digital content and understanding the technology behind it, from video and audio to interactive media. You learn both the creative craft and the technical skills to produce media for a digital world. It combines storytelling with hands on production.

The curriculum covers media production, digital tools and platforms, and the technology that powers digital content, alongside creative and storytelling skills. Courses are highly practical, with real production projects and a portfolio, and often a placement in the media industry.

Graduates go into content and social media, digital design and multimedia, and journalism and editorial, working in media, marketing, entertainment and technology. The blend of creative and technical skills opens varied roles.

Digital media keeps evolving with new platforms, formats and technologies, including AI in content creation. It suits people with strong originality and creative expression, technical curiosity and social confidence, combined with analytical curiosity and entrepreneurial drive.`,

  sub_digital_marketing_and_social_media: `Digital Marketing and Social Media focuses on reaching and engaging audiences through online channels. You learn to plan and run digital campaigns, grow a presence on social platforms, and use data to measure and improve results. It is a practical, fast moving branch of marketing built for the online world.

The curriculum covers digital marketing strategy, social media, content and search and paid advertising, alongside analytics and how to measure performance. Courses are hands on, with real campaign projects and use of live platforms and data, often including a placement.

Graduates go into performance marketing and growth, content and social media, and brand and marketing strategy, working in agencies, in house teams, startups and across almost every sector. Digital skills are in high and growing demand.

Digital and social marketing changes constantly as platforms and technologies evolve, so continuous learning is part of the job. It fits people with strong analytical and data curiosity and originality, combined with social confidence and entrepreneurial drive.`,

  sub_journalism: `Journalism is about finding, checking and telling stories that inform the public. You learn to research, investigate and report clearly across different media, and to hold power to account. It is a degree for curious, driven people who want to tell true stories that matter.

The curriculum covers reporting, writing and interviewing, media law and ethics, and producing content across print, broadcast and digital platforms. Courses are highly practical, with real reporting projects and a portfolio, and often placements in newsrooms or media organisations.

Graduates go into journalism and editorial and content and social media, working in news, broadcasting, digital media, magazines and communications. The research and storytelling skills also transfer widely across media and communication.

Journalism is being reshaped by digital platforms, social media and the challenge of misinformation, making skilled, trustworthy reporters more important than ever. It suits people with strong originality and analytical curiosity, social confidence and entrepreneurial drive, and a genuine sense of purpose and impact.`,

  sub_advertising_and_brand_management: `Advertising and Brand Management is about building brands and creating advertising that shapes how people see and choose them. You learn how brands are built and managed and how persuasive, creative campaigns are made. It combines big creative ideas with strategy and insight.

The curriculum covers branding, advertising, consumer behaviour and campaign development, alongside market research and analytics. Courses are practical, with real campaign and brand projects and a portfolio, and often a placement in an agency or brand team.

Graduates go into brand and marketing strategy, public relations and communications, and performance marketing and growth, working in agencies, brand teams and across many sectors. The mix of creativity and strategy opens a range of roles.

Advertising is being transformed by digital channels, data and new forms of media, keeping the field dynamic. It fits people with strong social confidence and originality, analytical and data curiosity, and a sense of purpose and impact, who enjoy combining creative ideas with strategy.`,

  sub_media_studies: `Media Studies is about understanding media in all its forms, how it is made, how it works and how it shapes society. You learn to analyse media critically and often to create it, exploring everything from film and television to social media and news. It combines analysis with creativity and a broad view of communication.

The curriculum covers media theory and analysis, the media industries, and often practical production, alongside audiences, culture and research methods. Courses combine critical study with creative and analytical projects, and often a placement.

Graduates go into journalism and editorial, content and social media, and market research and audience insight, working in media, marketing, communications and the creative industries. The mix of analytical and creative skills opens varied paths.

Media keeps changing rapidly with digital platforms, streaming and social media reshaping how people consume content. It suits people with strong analytical curiosity and originality, social confidence and a sense of purpose and impact, combined with data curiosity and entrepreneurial drive.`,

  // ── Creative Arts, Design & Experience ──────────────────────────────────
  sub_product_design: `Product Design is about creating the physical and digital products people use every day, making them work well, feel right and solve real problems. You learn to combine creativity with technical skill and an understanding of the people you are designing for. It is a discipline where imagination meets practical engineering.

The course is studio based, with modules in design process, materials and manufacturing, prototyping, and increasingly digital and user centred design. You build a portfolio, learn to sketch, model and use design software, and work through real design briefs from idea to finished prototype.

Graduates go into product and industrial design, digital design and multimedia, and user experience and interface design, working in design studios, manufacturers, technology companies and consultancies. The problem solving and design skills transfer across many creative industries.

Product design is increasingly shaped by sustainability, digital tools and the blend of physical and connected products. It suits people with strong originality and creative expression, technical and analytical curiosity, and the mastery and autonomy to develop their own design solutions.`,

  sub_graphic_design: `Graphic Design is about communicating ideas visually, through type, image, colour and layout. You learn to design everything from brand identities to digital interfaces, combining creativity with a strong sense of how visuals carry meaning. It is a craft that shapes how we see and understand the world around us.

The course is studio based, with modules in typography, branding, layout, digital design and the history and theory of design. You build a portfolio, master industry standard design software, and work through real briefs that develop both your creativity and your technical skill.

Graduates go into graphic design and visual communication and digital design and multimedia, working in design studios, agencies, in house teams and as freelancers across almost every industry. Strong visual communicators are widely needed.

Design is increasingly digital and motion based, and tools including AI are changing how designers work. It fits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy to develop a distinctive visual voice.`,

  sub_animation: `Animation is about bringing characters, stories and ideas to life through moving images. You learn the art and technology of animation, from drawing and movement to digital techniques and storytelling. It combines creative craft with technical skill to create worlds that move.

The course is studio based, with modules in animation techniques, storytelling, character and movement, and digital tools, across styles from traditional to 3D and digital. You build a portfolio and showreel, work through real animation projects, and develop both artistic and technical abilities.

Graduates go into animation and motion design and digital design and multimedia, working in film, television, games, advertising and digital media. The skills also transfer into wider creative and visual roles.

Animation is expanding with games, streaming, immersive media and new tools including AI assisted production. It suits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy and patience to craft their own work.`,

  sub_ux_design_and_interaction_design: `UX Design and Interaction Design is about designing digital products and services that are easy, useful and enjoyable to use. You learn to understand users, design how they interact with technology, and test and refine your designs. It sits where creativity, technology and human understanding meet.

The curriculum covers user research, interaction and interface design, prototyping, and the psychology of how people use technology, alongside design tools and methods. Courses are project based, so you research users, design and prototype products, and test them, building a strong portfolio.

Graduates go into user experience and interface design and digital design and multimedia, working in technology companies, agencies, and in house product teams across almost every sector. Good UX designers are in strong and growing demand.

As digital products become more central and complex, the demand for thoughtful, user focused design keeps rising. It fits people with strong originality and creative expression, analytical and technical curiosity, and the mastery and autonomy to advocate for the user throughout a project.`,

  sub_game_design: `Game Design is about creating the ideas, worlds and systems that make games engaging to play. You learn how games work, how to design compelling experiences, and how to combine creativity with an understanding of players. It is a degree for people who want to shape interactive entertainment.

The curriculum covers game design principles, level and systems design, storytelling and player experience, alongside the tools and technology used to build games. Courses are highly practical, with team based game projects that mirror studio work and a portfolio you can show to employers.

Graduates go into digital design and multimedia and animation and motion design, working in games studios and the wider interactive and creative industries. The design and creative skills also transfer to other digital experiences.

The games industry keeps growing and adopting new technologies, from immersive experiences to AI, opening new creative possibilities. It suits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy to develop and refine their own ideas.`,

  sub_fashion_design: `Fashion Design is about creating clothing and accessories that combine creativity, craft and an understanding of people and culture. You learn to design and make garments, from initial idea to finished piece, developing both your artistic vision and practical skills. It is a demanding, expressive creative field.

The course is studio based, with modules in design, pattern cutting and garment construction, textiles, and fashion history and culture. You build a portfolio and collections, learn both hand and digital skills, and work through real design briefs, often showing your work at the end.

Graduates go into product and industrial design and the wider fashion and creative industries, working as designers, in design teams, or building their own labels. The creative and practical skills also transfer to related design fields.

Fashion is being reshaped by sustainability, digital design and new ways of making and selling clothes. It fits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy to develop a personal creative identity.`,

  sub_fine_art: `Fine Art is about developing your own creative practice and ideas through media such as painting, sculpture, installation and digital art. You learn to make work, think critically about it, and find your own voice as an artist. It is a degree centred on creativity, experimentation and personal expression.

The course is studio based, giving you time and space to make work, alongside critical study, art history and theory, and regular critique. You experiment across media, build a body of work and a portfolio, and often exhibit your work at the end of the course.

Graduates go into graphic design and visual communication and product and industrial design, as well as their own artistic practice, and the creative thinking transfers into many creative and cultural roles. Fine art develops originality that is valued widely.

The art world keeps evolving with digital media, new platforms and changing ways of showing and selling work. It suits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy and self direction to drive their own practice.`,

  sub_film_and_television_production: `Film and Television Production is about making moving image content, from short films to television and online video. You learn the craft of production, from directing and camera to editing and sound, and how to tell stories on screen. It combines creative storytelling with technical and teamwork skills.

The curriculum covers production skills across the whole process, alongside storytelling, and the technology and roles involved in making film and television. Courses are highly practical, with real production projects and a showreel, and often placements in the industry.

Graduates go into animation and motion design and digital design and multimedia, working in film, television, streaming, advertising and digital media. The production and storytelling skills open a range of creative roles.

The industry is being transformed by streaming, digital production and new formats, creating fresh opportunities. It fits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy to develop their own creative work while collaborating in teams.`,

  sub_illustration: `Illustration is about creating images that tell stories, explain ideas or capture a mood, for books, media, products and beyond. You learn to develop your own visual style and apply it across different contexts and media. It combines artistic skill with communication and commercial awareness.

The course is studio based, with modules in drawing, visual storytelling, digital illustration and the business of being an illustrator. You build a portfolio, experiment across traditional and digital media, and work through real briefs that develop both creativity and professionalism.

Graduates go into graphic design and visual communication and digital design and multimedia, working in publishing, media, advertising and as freelancers. The strong visual and creative skills open a range of creative industry roles.

Illustration is increasingly digital and appears across new platforms and media, while tools including AI are changing the field. It suits people with strong originality and creative expression, technical curiosity and mastery, and the autonomy to build a distinctive personal style.`,

  // ── Environment, Sustainability & Planetary Futures ─────────────────────
  sub_geography: `Geography is the study of the world, its landscapes, environments and the people who live in them, and how they all interact. You learn to understand both the physical world and human society, and the relationships between them. It is a broad, connecting subject that spans science and social science.

The curriculum covers physical geography, such as climate, landscapes and ecosystems, and human geography, such as cities, development and society, alongside skills like mapping, data analysis and fieldwork. Courses combine classroom study with real field trips and projects, often with a dissertation on a topic you choose.

Graduates go into environmental science and monitoring, environmental policy and impact assessment, and conservation and land management, and the broad skills also support careers in planning, data and beyond. Geography keeps a wide range of options open.

Climate change, sustainability and data are making geographical skills increasingly relevant. It suits people with technical and analytical curiosity and a genuine sense of purpose and impact, who are curious about the world and how it works.`,

  sub_environmental_science: `Environmental Science is the study of the natural environment and the impact humans have on it. You learn to understand ecosystems, pollution, climate and resources using science, and to find solutions to environmental problems. It brings together biology, chemistry, geography and data to tackle some of the biggest challenges we face.

The curriculum covers ecology, earth and atmospheric science, and pollution and resources, alongside strong training in data analysis and fieldwork. Courses combine laboratory and field study with real environmental problems, usually including a research project.

Graduates go into environmental science and monitoring, environmental policy and impact assessment, sustainability and environmental social and governance advisory, and conservation and land management, working in consultancies, government, industry and research. Demand is rising as sustainability becomes a priority.

Climate change and sustainability are pushing environmental science up the agenda across every sector. It fits people with a strong sense of purpose and impact, technical and analytical curiosity, combined with entrepreneurial drive, cultural curiosity and originality.`,

  sub_environmental_management: `Environmental Management is about how organisations and societies use resources responsibly and reduce their impact on the planet. You learn to combine environmental understanding with the practical skills to manage sustainability in the real world. It connects science, business and policy to deliver change.

The curriculum covers environmental science and sustainability alongside management, policy and the tools for assessing and reducing impact, such as environmental assessment and resource management. Courses are applied, with real case studies and projects, and often a placement.

Graduates go into sustainability and environmental social and governance advisory, circular economy and sustainable supply chains, net zero and sustainability strategy, and conservation and land management, working in businesses, consultancies, government and charities. The practical focus makes graduates highly employable in a growing field.

Pressure to cut emissions and manage resources responsibly is making environmental management essential across sectors. It suits people with a strong sense of purpose and impact, analytical curiosity and entrepreneurial drive, combined with originality, cultural curiosity and technical curiosity.`,

  sub_ecology_and_conservation_biology: `Ecology and Conservation Biology is the study of living things and their environments, and how to protect nature and biodiversity. You learn how ecosystems work and how to conserve species and habitats under pressure. It is a science driven by a genuine care for the natural world.

The curriculum covers ecology, biodiversity, and conservation science, with a strong emphasis on fieldwork and data analysis. Courses combine laboratory and field study, real conservation projects and often a research project, giving hands on experience in the natural environment.

Graduates go into conservation and land management and environmental science and monitoring, working in conservation organisations, government agencies, consultancies and research. The field appeals to people who want their work to protect nature.

Biodiversity loss and climate change are making conservation science more urgent and valued. It fits people with a strong sense of purpose and impact and real technical and analytical curiosity, who care deeply about the natural world.`,

  sub_climate_science_and_sustainability: `Climate Science and Sustainability is about understanding the climate crisis and how to respond to it. You learn the science of climate change and the strategies, technologies and policies for building a sustainable future. It is a degree aimed squarely at one of the defining challenges of our time.

The curriculum covers climate and earth science alongside sustainability, energy and policy, with strong training in data and analysis. Courses combine scientific understanding with real world problem solving, often including projects on climate and sustainability challenges.

Graduates go into net zero and sustainability strategy and environmental policy and impact assessment, working in business, government, consultancy and research. Demand is growing quickly as organisations respond to climate goals.

Climate action is becoming central to policy and business, creating rapidly expanding opportunities. It suits people with a strong sense of purpose and impact, analytical and technical curiosity, and originality, combined with entrepreneurial drive and cultural curiosity.`,

  sub_sustainable_development: `Sustainable Development is about meeting people's needs today without harming the ability of future generations to meet theirs. You learn to balance social, economic and environmental goals and to design solutions that are genuinely sustainable. It combines environmental awareness with development, economics and policy.

The curriculum covers sustainability, development and the environment alongside economics, policy and data, exploring challenges like poverty, resources and climate together. Courses are applied and interdisciplinary, often including real world projects and a placement.

Graduates go into sustainability and environmental social and governance advisory, net zero and sustainability strategy, and circular economy and sustainable supply chains, working in business, government, charities and international organisations. The broad, purpose driven training opens many doors.

Sustainability is now central to business, government and global agendas, driving strong demand. It fits people with a strong sense of purpose and impact, analytical curiosity and entrepreneurial drive, combined with originality, data curiosity and cultural curiosity.`,

  // ── Society, Culture, Languages & Global Affairs ────────────────────────
  sub_modern_languages: `Modern Languages is about learning to speak, read and understand other languages, and the cultures and societies behind them. You become fluent in one or more languages while gaining a deep understanding of how other people think and live. It opens both your mind and the wider world.

The curriculum builds language skills through speaking, reading, writing and translation, alongside the literature, culture, history and politics of the countries whose languages you study. Most courses include a year abroad, studying or working in another country, which transforms your fluency and confidence.

Graduates go into languages, translation and localisation, and the skills are valued across international business, diplomacy, media and beyond. Fluency and cultural understanding open doors in a globalised world.

Global connection and technology are changing how languages are used, but human fluency and cultural insight remain highly valued. It suits people with strong cultural and global curiosity and mastery, combined with analytical curiosity, autonomy and originality.`,

  sub_sociology: `Sociology is the study of society, how people live together, form groups, and are shaped by culture, institutions and power. You learn to understand social behaviour and the forces behind issues like inequality, identity and change. It gives you a critical, evidence based way of understanding the world around you.

The curriculum covers sociological theory and key social issues, alongside strong training in research methods and data analysis. Courses combine theory with the study of real social questions, usually including a research project on a topic you choose.

Graduates go into social research and cultural analysis and international development and non governmental organisation programmes, working in research, government, charities, media and beyond. The analytical and research skills transfer widely.

Data and pressing social questions are keeping sociology relevant and increasingly evidence driven. It fits people with strong cultural and global curiosity and analytical curiosity, a sense of purpose and impact, combined with collaboration, mastery and autonomy.`,

  sub_anthropology: `Anthropology is the study of humanity, how people live, think and organise their lives across different cultures and throughout history. You learn to understand human diversity deeply, often through close, first hand study of communities. It builds real insight into what it means to be human.

The curriculum covers anthropological theory and key themes such as culture, society and identity, alongside research methods, especially the close observational study of people. Courses combine theory with real research, often including fieldwork and a project.

Graduates go into social research and cultural analysis and international development and non governmental organisation programmes, working in research, development, the public and voluntary sectors, and increasingly in areas like user research. The deep human insight is valued in many fields.

As organisations seek genuine understanding of people and cultures, anthropological skills are increasingly applied beyond academia. It suits people with strong cultural and global curiosity and analytical curiosity, a sense of purpose and impact, combined with collaboration, mastery and autonomy.`,

  sub_international_relations: `International Relations is the study of how countries, organisations and peoples interact on the world stage. You learn about global politics, diplomacy, conflict and cooperation, and how to analyse the forces shaping international affairs. It is a degree for people fascinated by the wider world and how it works.

The curriculum covers international politics and theory, global institutions, security and diplomacy, alongside research and analytical skills. Courses combine theory with the study of real global issues, often including the option of a language or study abroad.

Graduates go into international relations, policy and geopolitical analysis, international development and non governmental organisation programmes, and policy and public sector analysis, working in government, diplomacy, international organisations, think tanks and beyond. The global perspective opens doors across public life.

A more connected and often unstable world keeps international expertise in demand. It fits people with strong analytical and cultural and global curiosity and a sense of purpose and impact, combined with collaboration, mastery and autonomy.`,

  sub_history: `History is the study of the past and how it shapes the present, from major events to the lives of ordinary people. You learn to research, analyse evidence and build persuasive arguments about what happened and why it matters. It is a rigorous training in thinking, writing and judgement as much as in the past itself.

The curriculum covers a range of periods and themes, alongside how to study history, use sources critically and construct arguments. Courses involve wide reading, essays and analysis, with the freedom to specialise and usually a dissertation on a topic you choose.

Graduates go into social research and cultural analysis and international relations, policy and geopolitical analysis, and the strong research and writing skills open careers across many fields including law, media and the public sector. History keeps a wide range of doors open.

The skills of weighing evidence and building arguments are more valuable than ever in a world of information and misinformation. It suits people with strong analytical and cultural and global curiosity and mastery, combined with a sense of purpose and impact, autonomy and originality.`,

  sub_philosophy: `Philosophy is the study of fundamental questions about knowledge, reality, ethics and how we should live. You learn to think with exceptional clarity and rigour, to analyse arguments and to reason about difficult and abstract ideas. It is one of the purest trainings in careful thinking there is.

The curriculum covers areas such as logic, ethics, the theory of knowledge and the history of ideas, teaching you to read closely, argue precisely and write clearly. Courses centre on discussion, analysis and essays, with the freedom to explore the questions that interest you most.

Graduates go into social research and cultural analysis, and the powerful reasoning and writing skills are valued across law, policy, technology, business and beyond. Philosophy develops a way of thinking that transfers almost anywhere.

Questions of ethics and reasoning are increasingly important in areas like technology and AI, giving philosophy fresh relevance. It fits people with strong analytical and cultural and global curiosity and mastery, combined with a sense of purpose and impact, autonomy and originality.`,

  sub_global_development_studies: `Global Development Studies is about understanding and tackling global challenges like poverty, inequality and sustainable development. You learn how societies develop, why inequalities persist, and how change can be brought about across the world. It is a degree for people who want to make a difference on a global scale.

The curriculum covers development theory and practice, global economics and politics, and key issues such as poverty, health and the environment, alongside research methods. Courses are often applied and interdisciplinary, sometimes including fieldwork or a placement.

Graduates go into international development and non governmental organisation programmes and international relations, policy and geopolitical analysis, working in charities, international organisations, government and research. The purpose driven, global focus attracts people who want to help.

Global challenges from inequality to climate keep development work important and evolving. It suits people with strong cultural and global curiosity and a deep sense of purpose and impact, combined with collaboration, analytical curiosity, mastery and autonomy.`,
  "sub_real_estate_and_property": `Real Estate and Property is about how land and buildings are valued, developed, financed, bought, sold and managed. You learn how property markets work, how to appraise a building or site, and how commercial decisions about space are made. It is a practical, commercial field that combines finance, law, design and management around the places where people live and work.

The curriculum typically covers property valuation and appraisal, real estate finance and investment, development, planning and construction, property law and market analysis, often with professional body accreditation and a placement. You learn to read a market, run the numbers on a scheme, and understand the rules that shape what can be built and where.

Graduates move into real estate investment and finance, property development and asset management, commercial valuation and surveying, property and facilities management, and real estate agency and brokerage. Related routes include asset and wealth management, investment banking and corporate finance, and commercial banking.

Sustainability, the changing use of buildings and more data driven decisions are reshaping property, raising the value of good analysis and judgement. It suits people with strong analytical curiosity and a drive for achievement, combined with structure, precision and a commercial, practical outlook.`,
  "sub_hospitality_tourism_and_events_management": `Hospitality, Tourism and Events Management is about creating and running experiences for people, from hotels, restaurants and venues to festivals, conferences and whole destinations. You learn how these operations work commercially, how to lead teams and deliver great service, and how to plan and run events that meet a clear goal. It is a people centred, fast paced field where the customer experience is the product.

The curriculum covers operations and service management, marketing and customer experience, event planning and production, finance and revenue, and tourism and destination management, usually with a strong placement or industry project. You learn to balance guest satisfaction with running a profitable, well organised operation.

Graduates go into hospitality and hotel management, events and experience management, tourism and destination management, and food and beverage operations. Related routes include operations and supply chain, business development and commercial partnerships, and brand and marketing strategy.

Rising expectations, technology and a focus on sustainable and experiential travel are reshaping the sector and creating new kinds of role. It suits people who are socially confident and driven, genuinely enjoy looking after others, and combine adaptability and collaboration with the pace to thrive when things get busy.`,
  // ── Added degree subjects for previously-orphaned pathways ──
  sub_agriculture: `Agriculture is the science and business of producing food, fibre and other materials from the land, and managing that land responsibly. You study how crops and livestock grow and thrive, how soils and ecosystems work, and how to run a productive farm or agricultural business, blending biological science with economics, technology and hands-on management.

Early years build the foundations in crop and soil science, animal production, and agricultural economics, alongside the practical skills of farm management and mechanisation. As you progress you can specialise in areas such as precision and data-driven agriculture, livestock or arable production, agri-business, or sustainable land and environmental management. Most courses include a placement or a research project on a real agricultural problem.

It leads into roles such as farm and estate manager, agronomist, agricultural consultant and agri-business specialist, and connects closely to land management, conservation and sustainable supply chains. Agriculture is being transformed by precision technology, robotics, data and the push to net zero, so graduates who can combine practical knowledge with science and technology are in growing demand.

It tends to suit practical, analytical people who care about the land, food and the environment, and who enjoy solving real problems with evidence.`,
  sub_forestry: `Forestry is the science and management of trees, woodlands and forests. You study how forests grow and function as ecosystems, how to plant, tend and harvest them sustainably, and how to balance the many demands placed on woodland, from timber and recreation to carbon storage and wildlife.

Early years cover forest and tree ecology, silviculture (the growing and tending of trees), and woodland management, alongside practical skills such as forest measurement, mapping and geographic information systems. As you progress you can specialise in areas such as sustainable forest management, urban trees and arboriculture, conservation, or forest economics and policy. Fieldwork and a project are central.

It leads into roles such as forester, woodland and estate manager, arboricultural manager and forestry consultant, and connects closely to land management and conservation. As tree planting, carbon and climate resilience rise up the agenda, and the field adopts new data and remote-sensing tools, skilled forestry graduates are increasingly valued.

It tends to suit practical, outdoorsy, analytical people who care about trees, nature and the long-term health of the land.`,
  sub_veterinary_medicine: `Veterinary Medicine trains you to diagnose, treat and prevent illness and injury in animals, from pets and horses to farm and exotic species. It is a demanding, hands-on clinical degree that combines deep biological science with practical skill, judgement and genuine care for animals and their owners.

The early years build the science foundations, anatomy, physiology, biochemistry, animal husbandry, pathology and pharmacology, before moving into clinical medicine and surgery across different species. A large amount of supervised clinical placement (extra-mural studies) is built in, so you graduate ready to practise. The degree is longer than most, usually five years, and is accredited so that graduates can register as veterinary surgeons.

It leads into work as a vet in small animal, farm, equine or mixed practice, and into research, public health, industry and government. Demand for vets is strong, with growing areas in animal welfare, One Health, food-chain health and advanced diagnostics.

It suits academically strong, resilient, caring people who love animals, cope well under pressure, and want a science-rich clinical career.`,
  sub_animal_science: `Animal Science is the study of the biology, behaviour, health and welfare of animals, and how they are cared for, managed and produced. It is a science degree rather than a clinical one, giving you a rigorous understanding of how animals work and thrive, from physiology and nutrition to genetics and behaviour.

You study animal anatomy and physiology, nutrition, genetics and breeding, behaviour and welfare, and animal health and disease, usually with strong laboratory and practical components and a research project. Many courses let you specialise, for example in welfare, nutrition, conservation or livestock production, and include a placement in industry, research or animal care.

It leads into roles such as animal nutritionist, welfare and behaviour specialist, research technician or scientist, and into agriculture, conservation and the wider animal industries; it can also be a route towards further study, including graduate-entry veterinary or research degrees. With rising focus on animal welfare, sustainable livestock and genetics, science-trained animal specialists are increasingly valued.

It suits curious, analytical people who love animals and enjoy understanding the science behind how they live and are cared for.`,
  sub_heritage_and_museum_studies: `Heritage and Museum Studies is about how societies preserve, interpret and share their history and culture. You study the objects, collections, records and places that hold our past, and learn how to care for them, research them, and help the public discover and understand them.

The degree combines the history and theory of museums and heritage with practical skills: collections care and conservation, curating and designing exhibitions, managing archives and records, and cultural policy. Placements in museums, galleries, archives or heritage sites are common, and you usually complete a research project. Many specialist roles also draw on a postgraduate qualification.

It leads into work as a curator, archivist, conservator, or heritage and collections manager, across museums, galleries, archives, heritage sites and cultural organisations. Digitisation, wider access and fresh debates about how history is told are reshaping the sector and creating new roles.

It suits curious, careful, culturally minded people with a strong sense of custodianship, who want to protect the past and share it with others.`,


  sub_music: `Music is the study of how music works and how it is made, combining performance, composition and an understanding of the industry around it. You develop your instrument or voice, train your ear, and learn to read, write and analyse music across styles from classical to contemporary. It blends creative expression with real technical discipline.

Early modules cover performance, music theory and analysis, history and the basics of composition, often alongside music technology. As you progress you specialise in areas such as performance, composition and arranging, conducting, or the business of music, and most courses end with a recital, portfolio or final project. You perform regularly and build a body of work.

Graduates go into performance, composition, production and teaching, as well as roles across the wider music and events industry. Many build portfolio careers that combine several of these, and the transferable skills in discipline, collaboration and creativity are valued well beyond music.

It suits people who love music deeply, enjoy both the creative and the technical side, and are willing to practise and perform. A strong ear, self-motivation and a willingness to keep improving matter more than any single starting point.`,

  sub_music_technology: `Music Technology is where musical creativity meets the technology behind modern sound. You learn how music and audio are recorded, mixed, produced and designed, blending studio craft with the science of how sound behaves. It suits people who want to make music using the tools that shape almost everything we hear today.

Modules cover recording and mixing, sound design, studio production and the fundamentals of acoustics and audio, often with programming and digital audio workstations. You build a portfolio of produced work, and later options can include game and film audio, live sound, or software and signal processing.

Graduates work as sound engineers, music producers and audio developers across studios, live events, games, film and streaming. Because audio is everywhere, the skills open several industries at once, and many graduates freelance or run their own studios.

It fits people who are both creative and technical, enjoy problem solving, and like building things and hearing the results. Curiosity about how sound works and patience for detail go a long way.`,

  sub_drama_and_theatre_studies: `Drama and Theatre Studies explores how theatre is made and what it means, combining practical performance with the history and theory behind it. You act, direct, devise and write, while also studying how plays and live performance work on an audience. It develops confidence, creativity and a sharp understanding of people.

You study acting and voice, directing and devising, playwriting and theatre history, usually with regular practical projects and a final production or performance. Many courses include collaboration with other students and opportunities to work on real shows.

Graduates work as actors, directors and theatre-makers, and move into related fields such as television, education, arts administration and community work. The communication, teamwork and creativity the degree builds are valued across many careers, not only the stage.

It suits expressive, collaborative people who enjoy performing or making work with others, and who are resilient enough for an industry built on auditions and projects. Curiosity about people and stories is at its heart.`,

  sub_dance: `Dance trains you as a performer and creator of movement, combining technique, choreography and an understanding of the body. You study across styles, build strength and control, and learn to make as well as perform work. It is a physically demanding, deeply creative discipline.

Modules cover technique in styles such as ballet, contemporary and commercial dance, choreography, performance, and often dance science and the health of the dancing body. You perform regularly and usually create and present your own choreography by the final year.

Graduates perform, choreograph and teach, and work across stage, screen, commercial and community dance. Many build portfolio careers, and the discipline, resilience and creativity dance builds transfer well into wider arts, education and wellbeing roles.

It suits dedicated, physically committed people who love movement and performance and can handle the discipline of daily training. Resilience and self-motivation matter as much as talent.`,

  sub_musical_theatre: `Musical Theatre trains you as a triple-threat performer across acting, singing and dance. You develop all three disciplines together and learn how they combine in the demanding, fast-moving world of stage shows. It suits people who want to perform and thrive on variety.

You study acting, singing and musicianship, and dance, alongside audition technique, repertoire and the craft of performing in a company. Courses are practical and intensive, usually building to showcases and full productions in front of an audience.

Graduates perform in musicals and stage shows, in the West End, on tour, on cruise ships and in regional theatre, and often move between performing, teaching and related creative work. Versatility keeps them working across a competitive industry.

It suits energetic, resilient performers who love all three disciplines and enjoy the discipline of constant rehearsal and audition. Stamina, collaboration and a positive attitude are as important as raw talent.`,

  sub_technical_theatre_and_stage_management: `Technical Theatre and Stage Management is the craft and organisation behind live performance. Rather than being on stage, you make the show happen: lighting, sound, set, staging and the coordination that keeps a complex production safe and running on cue. It blends creativity with real practical and organisational skill.

You study lighting and sound, set and staging, stage management and production planning, alongside health and safety and the realities of running live events. Courses are hands-on and usually include working on real productions from planning through to performance.

Graduates work as stage managers, lighting and sound technicians and production crew across theatre, live events, touring and broadcast. Demand for skilled technical crew is steady, and the organisational skills transfer widely into events and production roles.

It suits practical, organised and calm people who enjoy solving problems, working in a team and making things run smoothly under pressure. A cool head and attention to detail matter most.`,

};

module.exports = { SUBJECT_DESCRIPTIONS };
