// questions.js
// CareerDNA v2 — 100 assessment items across 25 behavioural dimensions.
// Ordered by dimension group and subdimension.
// Likert 1-5 scale. reverse: true = inverted scoring.
// Source of truth: CareerDNA Model Specification v2.

const questions = [

  // ────────────────────────────────────────────────────────────
  // WHO YOU ARE
  // ────────────────────────────────────────────────────────────

  // Originality
  {
    id: "Q01",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I often come up with ideas that others have not thought of before.",
    tip: "Think about group work, class projects, or collaborative tasks. Do you tend to suggest something nobody else has mentioned? Or do you usually build on ideas that are already on the table? Some people naturally think differently from the crowd; others are strongest at developing and improving existing ideas. Both are genuinely valuable.",
    reverse: false
  },
  {
    id: "Q02",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "When solving a problem, I prefer to explore unusual approaches before settling on the obvious one.",
    tip: "When you face a tricky problem, do you tend to ask what if we tried something completely different before going with the obvious solution? Or do you go straight for what you know works? Neither is better; they suit different kinds of work.",
    reverse: false
  },
  {
    id: "Q03",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I tend to stick with tried-and-tested approaches rather than experimenting with new ones.",
    tip: "When you start a new task or project, are you more likely to use a method you know will work? Or do you tend to experiment and try a fresh angle, even if it is less certain? Think about subjects or activities you enjoy. Do you follow the standard approach or look for your own way in?",
    reverse: true
  },
  {
    id: "Q04",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I find it exciting to combine ideas from completely different areas.",
    tip: "Have you ever connected two very different subjects or ideas together in a way that felt exciting or useful, like borrowing an idea from music to solve a design problem, or applying a concept from science to understand a social situation? Does that kind of cross-domain thinking energise you? Or do you prefer to stay focused within one area at a time?",
    reverse: false
  },

  // Reliability
  {
    id: "Q05",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I usually complete tasks by the deadline, even when I have a heavy workload.",
    tip: "Think about a time you had multiple deadlines at once. Did you find a way to get everything done on time? Or do things tend to slip when pressure builds? Some people excel at steady delivery under load; others work in bursts and struggle when multiple things compete.",
    reverse: false
  },
  {
    id: "Q06",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I keep track of my commitments and rarely let important things slip through.",
    tip: "Do you naturally stay on top of what you have promised to do, assignments, plans, responsibilities, without needing constant reminders? Or do things sometimes fall through the cracks when you are juggling multiple things? Some roles reward precision and follow-through; others reward big-picture thinking.",
    reverse: false
  },
  {
    id: "Q07",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I often start projects with enthusiasm but find it hard to sustain that effort to the end.",
    tip: "Think about projects you have started, like a new hobby, a personal project, or a creative idea. Did you begin with real energy but find it harder to keep going as the initial excitement faded? Or do you tend to push through to the finish even when it gets less exciting? Both patterns point to different strengths.",
    reverse: true
  },
  {
    id: "Q08",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "People who know me would say I always follow through on what I promise.",
    tip: "If a close friend or family member needed to rely on you for something important, would they be confident you would come through, even if it became inconvenient? Or might they have a backup plan just in case? The ability to be genuinely relied on is something people notice and value in every kind of work.",
    reverse: false
  },

  // Resilience
  {
    id: "Q09",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "After experiencing a setback, I tend to recover and move forward fairly quickly.",
    tip: "Think about something that did not go the way you hoped, like a bad result or a disappointment. Did you find yourself bouncing back fairly quickly? Or does it take a while to feel ready to move forward? Both a fast recovery and a slower one are completely normal. The question here is about your tendency to get back on track, not whether the setback affects you at all.",
    reverse: false
  },
  {
    id: "Q10",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "I find it genuinely difficult to cope when things do not go as planned.",
    tip: "When your plans fall apart, like a cancelled event, a project going wrong, or unexpected bad news, how do you typically react? Some people feel genuinely thrown and need time to regroup; others shake it off and adapt quickly. Think about a real example from your own life, not how you think you should react.",
    reverse: true
  },
  {
    id: "Q11",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "I am able to stay focused on a long-term goal even when progress is slow or frustrating.",
    tip: "Think about something you have been working towards that has taken time, like learning a skill or sticking with a subject that is difficult. Have you been able to keep at it even during stretches where it felt like you were going nowhere? Or does slow progress tend to knock your motivation significantly?",
    reverse: false
  },
  {
    id: "Q12",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "When a project becomes very difficult, I am likely to give up before completing it.",
    tip: "Imagine you are in the middle of something hard, a challenging piece of work that is not coming together, and stopping would be easy. How likely are you to walk away? Or do you tend to keep going even when it would be simpler to quit? Think of a real situation where you had that choice and what you actually did.",
    reverse: true
  },

  // Adaptability
  {
    id: "Q14",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "I tend to feel energised rather than anxious when my plans change unexpectedly.",
    tip: "Imagine you had planned something carefully and then it had to change completely at the last minute. Would you feel excited by the new direction? Or would the disruption stress you out? Think about how you actually react when this happens, not how you think you should.",
    reverse: false
  },
  {
    id: "Q15",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "I adapt well when the rules or expectations around me shift significantly.",
    tip: "Think about a time when the way something worked changed, like a teacher who changed how lessons run, or the rules for a group that shifted. Did you adjust comfortably and get on with it? Or do significant changes to expectations tend to throw you off for a while? Both reactions point to different work strengths.",
    reverse: false
  },
  {
    id: "Q16",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "I prefer situations where I know exactly what to expect from one day to the next.",
    tip: "Do you feel most comfortable and effective when each day follows a predictable pattern, with familiar tasks and clear expectations? Or do you prefer having variety and not always knowing exactly what is coming? Think about whether a very structured or a more unpredictable environment genuinely suits you better.",
    reverse: true
  },
  {
    id: "Q17",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "When a situation is genuinely uncertain and could go several different ways, I find that unsettling rather than exciting.",
    tip: "Think about a situation where you genuinely did not know how something would turn out, like waiting on a decision or a project with an unclear outcome. Did the not-knowing bother you? Or were you comfortable sitting with the uncertainty? Some people need clarity to feel settled; others find open-endedness energising.",
    reverse: true
  },

  // Social Confidence
  {
    id: "Q18",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "I feel energised after spending time in a large group of people.",
    tip: "Think about a time you spent several hours with a big group, like a social event, a party, or a sports day. When it was over, did you feel buzzing and ready to keep going? Or did you need some quiet time alone to feel like yourself again? You might thoroughly enjoy the experience and still need time alone to recharge, or you might feel energised by it. The question is about what big social time does to your energy, not whether you enjoyed it.",
    reverse: false
  },
  {
    id: "Q19",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "I am comfortable starting conversations with people I have never met before.",
    tip: "Picture yourself walking into a room where you do not know anyone, like a new class, a new club, or an event. Would you naturally go up to someone and start talking? Or would you prefer to wait to be introduced, or stick with whoever you already know? People who find this easy are not necessarily more likeable. It is a real wiring difference.",
    reverse: false
  },
  {
    id: "Q20",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "After socialising for a while, I usually need time alone to recharge.",
    tip: "After a big social day, like a trip, a family event, or an afternoon with a group of friends, do you typically need some quiet time alone before you feel fully yourself again? Or are you perfectly fine jumping straight into more social activity? Both are completely normal. Some people genuinely recharge alone, others recharge with others.",
    reverse: true
  },
  {
    id: "Q21",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "Speaking up and contributing in group settings comes naturally to me.",
    tip: "In a class discussion, group meeting, or team activity, do you find it natural to share your thoughts and take part actively? Or does speaking up in a group feel awkward or take real effort, even when you have something to say? Think about whether being heard in a group feels easy or takes conscious courage.",
    reverse: false
  },

  // Empathy
  {
    id: "Q92",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "I am genuinely affected by the emotional atmosphere around me, even when people have not said how they are feeling.",
    tip: "Think about being in a room where the mood shifts, maybe someone is upset or things feel tense. Does that atmosphere genuinely affect how you feel and where your attention goes? Or can you notice it and carry on as normal? Some people are deeply sensitive to the emotional climate around them; others can acknowledge it without being drawn in.",
    reverse: false
  },
  {
    id: "Q93",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "When someone I know is going through a hard time, I feel genuinely affected by what they are experiencing.",
    tip: "If a close friend or family member is going through something difficult, does it genuinely weigh on you? Does their situation affect how you feel too? Or do you feel sympathetic but mostly remain unaffected in yourself? Think about a real example. Neither makes you a better or worse friend. They describe different ways of connecting with others.",
    reverse: false
  },
  {
    id: "Q94",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "I tend to focus on getting things done rather than on how people around me are feeling.",
    tip: "When you are working on something alongside other people, where does your attention naturally go? On completing the task well and efficiently? Or on how the people around you are doing? Most people lean one way. Think about your natural pull, not what you think you should do.",
    reverse: true
  },
  {
    id: "Q95",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "Understanding what makes other people tick comes naturally to me and genuinely interests me.",
    tip: "Are you naturally curious about why people behave the way they do, like why someone reacted a certain way, what is driving their choices, or what they are really like underneath? Does that kind of curiosity feel natural? Or do you tend to take people at face value rather than wondering about their motivations? Both are valid. It is a genuine difference in what people find interesting.",
    reverse: false
  },

  // ────────────────────────────────────────────────────────────
  // WHAT YOU LOVE
  // ────────────────────────────────────────────────────────────

  // Analytical Curiosity
  {
    id: "Q22",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "Looking through data or information to spot patterns and figure out why things happen genuinely interests me.",
    tip: "Think about any subject where you have had to look at a lot of information, like maths, science, history, or sports statistics. Did you enjoy finding patterns in it and working out what it all means? Or did you prefer the bigger picture idea or the end result, rather than analysing the detail? Think about where you actually direct your energy.",
    reverse: false
  },
  {
    id: "Q23",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "Researching a topic in depth and understanding it fully gives me real satisfaction.",
    tip: "When you are curious about something, do you go deep, reading multiple sources, wanting to understand the detail and the reasons behind things, not stopping until you really get it? Or do you prefer a solid overview and then move on? Think about something you have been curious about recently and how far you actually went with it.",
    reverse: false
  },
  {
    id: "Q24",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "Carefully examining how systems, situations, or processes work is something I find fascinating.",
    tip: "Do you genuinely want to understand how things work under the surface, like how an app is built, how a social system functions, or how a historical event unfolded step by step? Or are you more drawn to outcomes and ideas than to the mechanics of how things operate? Think about what holds your attention in the subjects you study.",
    reverse: false
  },
  {
    id: "Q25",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "I am drawn to activities that involve investigating problems and figuring out what the evidence actually shows.",
    tip: "Imagine a situation where people disagree about something and you need to work out what is actually true. Would you enjoy gathering the evidence and working it out methodically? Or would you rather hear a clear summary and make a judgement from there? Think about subjects or situations where this kind of evidence-gathering comes up.",
    reverse: false
  },

  // Creative Expression
  {
    id: "Q26",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I am drawn to activities where I can make or design something original.",
    tip: "Do you genuinely seek out activities where the output is something you have made or designed yourself, like a piece of writing, a drawing, a design, a piece of code, or something physical? Or do you find the making and designing part less compelling than other aspects of a task? There are brilliant careers on both sides of this.",
    reverse: false
  },
  {
    id: "Q27",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "Creative expression through art, music, writing, design, or performance is genuinely important to who I am.",
    tip: "Think about art, music, writing, design, theatre, photography, or any creative form. Does engaging with one or more of these feel like a core part of who you are, not just a hobby but something that really matters to you? Or is it more of an interest alongside other things that feel equally or more central to how you see yourself?",
    reverse: false
  },
  {
    id: "Q28",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I rarely feel the urge to express myself through creative work.",
    tip: "Outside of what is required of you, do you feel a genuine pull toward making or creating something, like writing, drawing, designing, building, or performing? Or does that urge rarely come from you unprompted? Think about what you do in your own time, rather than what you enjoy once someone else has set it up.",
    reverse: true
  },
  {
    id: "Q29",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "The quality and style of what I produce, how it looks, reads, or sounds, matters to me just as much as whether it simply does what it is supposed to do.",
    tip: "When you complete something, like a piece of writing, a presentation, or a project, does the quality of how it looks or sounds matter a lot to you, beyond just whether it does what it needs to do? Or are you more focused on the result and the content than on the style and presentation? Some people care deeply about the aesthetic; others find it less important than the substance.",
    reverse: false
  },

  // Helping & Caring
  {
    id: "Q30",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "One of the most rewarding things I can do is help someone improve or overcome a challenge.",
    tip: "When someone you know is struggling with something, like a subject, a personal problem, or a skill they are trying to develop, and you help them get past it, how does that feel? Is it one of the things that makes a day feel genuinely worthwhile? Or do you feel pleased to help, but it is not particularly what drives you?",
    reverse: false
  },
  {
    id: "Q31",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "I actively enjoy supporting others through difficult situations.",
    tip: "When someone is going through a hard time, do you tend to want to be there for them, to listen, help, and support them through it? Does being that person for someone feel genuinely good? Or do you care, but prefer to show it differently, giving people space rather than actively stepping in?",
    reverse: false
  },
  {
    id: "Q32",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "Helping others learn something, improve at a skill, or work through a challenge is something I would find genuinely fulfilling on a regular basis.",
    tip: "Can you imagine a job where a significant part of what you do every day is helping other people get better at something, like a subject, a skill, or a mindset? Does that sound genuinely fulfilling? Or would you prefer to be the person getting things done yourself, rather than supporting others to do so?",
    reverse: false
  },
  {
    id: "Q33",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "Spending most of my time and effort on other people's needs would feel draining rather than rewarding.",
    tip: "Imagine a role where the majority of your day was focused on other people's needs, listening, supporting, helping them through challenges. Would that feel meaningful and energising? Or would focusing mainly on other people's needs, day after day, start to feel tiring? Both are honest reactions and point to very different career paths.",
    reverse: true
  },

  // Entrepreneurial Drive
  {
    id: "Q34",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "The idea of spotting a gap or problem and building something new to address it genuinely excites me.",
    tip: "Picture this: you notice that something is missing or could work much better, like a service, a product, or a way of doing something. Does the idea of building a solution from scratch excite you? Or do you prefer to contribute to something that already exists rather than starting from nothing? Think about whether the building from scratch part is the exciting bit or the daunting bit.",
    reverse: false
  },
  {
    id: "Q35",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "I like taking charge and making things happen rather than waiting to be directed.",
    tip: "In group situations, like projects, events, or activities, do you tend to be the one who starts organising and driving things forward? Or do you prefer for someone else to set the direction while you contribute your own part? Neither is passive. Some people are energised by leading, others by doing excellent work within someone else's plan.",
    reverse: false
  },
  {
    id: "Q36",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "The idea of leading a team to achieve a significant goal or build something new genuinely excites me.",
    tip: "Imagine being given responsibility for leading a group toward an ambitious goal, managing different people and decisions along the way. Does that kind of challenge genuinely excite you? Or does the idea of being the one in charge feel more daunting than appealing? Think about whether leadership feels like an opportunity or a burden.",
    reverse: false
  },
  {
    id: "Q37",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "I prefer developing deep expertise in one area to taking charge and starting new projects.",
    tip: "If you had to choose between two career paths, one where you gradually become a real expert in a specific area, and one where you are constantly launching and leading new ventures, which genuinely appeals more? Both lead to rewarding careers. They just suit very different temperaments and ways of working.",
    reverse: true
  },

  // Technical Curiosity
  {
    id: "Q38",
    dimension: "What You Love",
    subdimension: "Technical Curiosity",
    type: "likert",
    text: "I enjoy working with tools, equipment, systems, or physical materials.",
    tip: "Think about activities where you are actually working with something, like software, machines, instruments, physical objects, or materials. Does that kind of hands-on engagement genuinely appeal to you? Or do you prefer activities that are more conceptual, people-based, or creative, rather than technical and physical?",
    reverse: false
  },
  {
    id: "Q39",
    dimension: "What You Love",
    subdimension: "Technical Curiosity",
    type: "likert",
    text: "I do my best work when I am hands on with physical or technical things, such as building, fixing, making or operating them.",
    tip: "Think about tasks where you feel most capable and in your element. Is it when you are building or making something, fixing a problem, assembling or programming something, operating something complex? Or do you shine more in other types of activity, like communicating, analysing, organising, or creating?",
    reverse: false
  },
  {
    id: "Q40",
    dimension: "What You Love",
    subdimension: "Technical Curiosity",
    type: "likert",
    text: "I prefer thinking about ideas and theories over hands-on, practical tasks.",
    tip: "When you have a choice, do you prefer to engage with the conceptual side of something, the ideas, the theory, the bigger picture, rather than getting into practical, hands-on execution? Or do you prefer to be directly involved in making or doing things, rather than discussing or theorising about them?",
    reverse: true
  },
  {
    id: "Q41",
    dimension: "What You Love",
    subdimension: "Technical Curiosity",
    type: "likert",
    text: "I get real satisfaction from making or building something that actually works the way it should.",
    tip: "Have you ever built, fixed, coded, or assembled something and felt genuine satisfaction when it worked exactly as it should? Does that feeling, of making something function properly, feel rewarding in itself? Or is the outcome less important to you than other aspects, like the creativity, the thinking, or the teamwork involved?",
    reverse: false
  },

  // Cultural & Global Curiosity
  {
    id: "Q42",
    dimension: "What You Love",
    subdimension: "Cultural & Global Curiosity",
    type: "likert",
    text: "I find myself drawn to understanding different cultures, languages, or the way societies are organised.",
    tip: "Are you genuinely curious about how people live differently in other parts of the world, their languages, traditions, social structures, and values? Does learning about a culture very different from your own feel engaging? Or do you find it less compelling than other areas? Think about what you actually read, watch, or talk about when you have a free choice.",
    reverse: false
  },
  {
    id: "Q43",
    dimension: "What You Love",
    subdimension: "Cultural & Global Curiosity",
    type: "likert",
    text: "Questions about fairness, politics, and why the world is the way it is genuinely engage and energise me.",
    tip: "When you hear about something unjust, a political decision, or a social pattern, does it make you want to understand it more deeply? Do you find yourself drawn into discussions about how society works and should work? Or do you prefer to stay out of those topics and focus on things that feel more personal or practical?",
    reverse: false
  },
  {
    id: "Q44",
    dimension: "What You Love",
    subdimension: "Cultural & Global Curiosity",
    type: "likert",
    text: "Reading about history, philosophy, current world events, or how different countries relate to each other is something I seek out.",
    tip: "In your own time, not for an assignment, do you seek out articles, books, or documentaries about history, world events, or how different countries relate to each other? Or is that something you engage with when required but do not particularly seek out? Think about what you actually choose to read or watch when you have complete freedom.",
    reverse: false
  },
  {
    id: "Q45",
    dimension: "What You Love",
    subdimension: "Cultural & Global Curiosity",
    type: "likert",
    text: "I love thinking about big questions, like why societies change, how governments work, or what makes some communities thrive while others struggle.",
    tip: "Do you find yourself genuinely absorbed by big-picture questions about how the world works, like why some countries are richer than others, why revolutions happen, or why some communities are safer or healthier than others? Or do you find those questions interesting in passing, but not the kind of thing that really grabs you?",
    reverse: false
  },

  // Data Curiosity
  {
    id: "Q96",
    dimension: "What You Love",
    subdimension: "Data Curiosity",
    type: "likert",
    text: "Working with numbers, data, or detailed records is something I find genuinely satisfying.",
    tip: "Think about activities that involve working with numbers, like spreadsheets, calculations, statistics, databases, or detailed records. Do you find that kind of work genuinely satisfying in itself, not just when it produces a useful result? Or is it something you can do but that does not particularly engage you?",
    reverse: false
  },
  {
    id: "Q97",
    dimension: "What You Love",
    subdimension: "Data Curiosity",
    type: "likert",
    text: "I enjoy sorting through and organising large amounts of information to make sense of it.",
    tip: "Imagine being given a large dataset or a lot of records to sort through, finding patterns, organising it into categories, making sense of what it is saying. Does that kind of task feel absorbing and satisfying? Or does it feel like careful but slightly tedious work? There are careers where this is exactly what you do all day.",
    reverse: false
  },
  {
    id: "Q98",
    dimension: "What You Love",
    subdimension: "Data Curiosity",
    type: "likert",
    text: "Tracking figures, spotting errors in data, or making sure the numbers add up appeals to me.",
    tip: "If you were given the job of checking through a detailed set of figures, spotting mistakes, making sure things add up, would that careful, accurate work feel satisfying? Or would it feel like the kind of task you would want to finish quickly and hand off? Think about how you feel about accuracy checking in practice, not in theory.",
    reverse: false
  },
  {
    id: "Q99",
    dimension: "What You Love",
    subdimension: "Data Curiosity",
    type: "likert",
    text: "I could genuinely enjoy a career where a large part of my time was spent analysing data, working with numbers, or maintaining detailed records.",
    tip: "Imagine a typical working day where several hours are spent looking at data, running calculations, or checking and maintaining records. For some people, that sounds like engaging, purposeful work. For others, it sounds monotonous. Which is closer to how you would feel? Think about the difference between being capable at maths and genuinely wanting to spend your time in it.",
    reverse: false
  },

  // ────────────────────────────────────────────────────────────
  // WHAT MATTERS
  // ────────────────────────────────────────────────────────────

  // Purpose & Impact
  {
    id: "Q46",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "It is important to me that what I do contributes to something bigger than my own success.",
    tip: "When you think about the kind of work you would find most meaningful, does it matter that it adds up to something beyond your own achievement, something significant at a bigger scale? Or would you find work deeply satisfying if it was excellent, absorbing, and well-rewarded, even without a larger cause behind it? Both are genuinely valid ways to find meaning in a career.",
    reverse: false
  },
  {
    id: "Q47",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I find it hard to stay motivated in work that does not feel connected to a larger goal or meaningful outcome.",
    tip: "Think about work or tasks that felt completely disconnected from anything that mattered, routine tasks with no clear purpose. Does that kind of disconnection bother you and affect your motivation? Or can you stay fully engaged through skill, interest, or quality alone, even without a clear bigger purpose? Some people need the why; others are driven by the what.",
    reverse: false
  },
  {
    id: "Q48",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I could feel satisfied doing work that is interesting and rewarding, even if it makes no wider difference to a community, a field or the world.",
    tip: "Think about the kind of work you imagine doing in the future. If it was genuinely interesting and rewarding but had no real impact beyond your own life and career, would that feel fine? Or would you need to know that your work was contributing to something bigger, like a field, a community, or the way something works in the world, to feel it was truly worthwhile? Some people are driven by the bigger picture; others find that personal interest and reward are enough on their own.",
    reverse: true
  },
  {
    id: "Q49",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "Knowing that my work could have a lasting impact on a field, a community, or how something works in the future would be an important source of meaning for me.",
    tip: "Does the idea that your work could matter beyond your own career, that it might influence how something is done, contribute to a field, or make a lasting difference at scale, feel genuinely motivating to you? Or is that a nice bonus rather than something that actually drives you? Think about what kinds of significance or contribution actually feel meaningful.",
    reverse: false
  },

  // Autonomy
  {
    id: "Q50",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "Having the freedom to decide how I approach my own work is very important to me.",
    tip: "Think about how you work best. Is it important that you can figure out your own method, your own order, your own approach, without being told exactly how to do everything? Or are you comfortable with, or even helped by, a clearly defined process to follow? Some people need room to do things their own way; others find that level of freedom adds stress.",
    reverse: false
  },
  {
    id: "Q51",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I do my best work when I can decide for myself how to approach a task, rather than following close guidance from others.",
    tip: "Imagine a teacher or manager who checks in very frequently and gives you detailed instructions on exactly what to do next. Would that feel reassuring and helpful? Or would it feel suffocating, like you are not trusted to work it out yourself? Some people do their very best with that level of structure; others find it deeply restrictive.",
    reverse: false
  },
  {
    id: "Q52",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I am happy to be guided and directed by others, as long as what I am doing is genuinely interesting.",
    tip: "Can you feel satisfied and engaged in a role where someone else decides what you work on and how, as long as the actual work interests you? Or do you need genuine input into your own direction to feel motivated, regardless of how interesting the content is? Think about whether the freedom or the content matters more to your sense of motivation.",
    reverse: true
  },
  {
    id: "Q53",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "Having the freedom to choose what I work on, not just how I do it, matters a great deal to me.",
    tip: "Does it matter to you that you have genuine say in what you work on at all, the direction, the focus, the projects? Or are you content for someone else to set the agenda, as long as you have some freedom in how you execute it? Think about what genuinely frustrates you when you do not have it.",
    reverse: false
  },

  // Belonging
  {
    id: "Q54",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "Feeling like a genuine part of a team or community is important to me in whatever I do.",
    tip: "Does it matter to you to feel genuinely included and part of a group, like a sports team, a friendship circle, a society, or a club? Or can you do your best work and feel content even when you are more of an independent contributor? Think about whether the sense of belonging feels necessary to your motivation, or more of a nice bonus.",
    reverse: false
  },
  {
    id: "Q55",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "Having close, supportive relationships and a real team spirit matters a great deal to me.",
    tip: "In a work or study context, does having close bonds with the people around you, where you genuinely support each other and there is real team spirit, matter deeply to how good you feel about what you are doing? Or can you work well and feel satisfied in a more independent environment, where relationships are positive but not central to your motivation?",
    reverse: false
  },
  {
    id: "Q56",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "I could happily work mostly alone, as long as the work itself is interesting enough.",
    tip: "If you had a job where you mostly worked on your own, with minimal team interaction day to day, could that feel genuinely satisfying, as long as the work itself was absorbing? Or would the lack of close working relationships feel like something important was missing, regardless of how good the work is?",
    reverse: true
  },
  {
    id: "Q57",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "Being accepted and valued by the people around me is an important source of motivation for me.",
    tip: "Does feeling genuinely valued and accepted by the people around you, like classmates, teachers, or teammates, play a significant role in keeping you motivated? Or are you more internally driven, and while you appreciate positive relationships, they do not particularly affect how motivated you feel?",
    reverse: false
  },

  // Achievement
  {
    id: "Q58",
    dimension: "What Matters",
    subdimension: "Achievement",
    type: "likert",
    text: "Reaching the top of a field or being recognised as genuinely excellent at what I do is one of my real ambitions.",
    tip: "When you think about what you want from your career, does standing out as genuinely excellent, being someone others would recognise as at the top of their field, feel like an important goal? Or is being capable and doing the work well sufficient, without particularly needing to be seen as among the best? Some people are genuinely driven by the idea of being outstanding; others find that kind of ambition less compelling than other goals.",
    reverse: false
  },
  {
    id: "Q59",
    dimension: "What Matters",
    subdimension: "Achievement",
    type: "likert",
    text: "I am motivated by the idea of becoming really successful and being recognised for it.",
    tip: "Does the idea of being genuinely successful in a visible, recognised way feel like a real motivator? Not just doing good work privately, but being known as someone who has achieved something significant? Or do you find recognition and status less important than other things, like the quality of your work or the impact it has?",
    reverse: false
  },
  {
    id: "Q60",
    dimension: "What Matters",
    subdimension: "Achievement",
    type: "likert",
    text: "Being well-off financially is one of the things I am motivated to achieve.",
    tip: "Is financial success a genuine part of what motivates you to work hard and build a career, not just as a basic need, but as something that genuinely matters to you as a marker of having done well? Or does money feel less important to you than other measures of success? Both are honest answers, and both lead to fulfilling careers.",
    reverse: false
  },
  {
    id: "Q62",
    dimension: "What Matters",
    subdimension: "Achievement",
    type: "likert",
    text: "I would be happy doing meaningful work even if very few people noticed or gave me credit for it.",
    tip: "If you were doing work that you found genuinely valuable and meaningful, but it brought little public recognition, would that feel fine? Or would the lack of acknowledgement feel like something important was missing? This is a genuine difference in what drives people. Some are energised by visibility, others primarily by the work itself.",
    reverse: true
  },

  // Security
  {
    id: "Q63",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "If I had to choose, I would pick a stable career with a reliable income over a more exciting but uncertain one, even if the uncertain option had more potential.",
    tip: "As you think about the kind of career you would want, how much does it matter that the path you choose is stable, with reliable employment and a dependable income? Or would you be drawn to something more uncertain if it was exciting or had high potential upside? Think about whether stability or possibility feels more important to you in a career choice.",
    reverse: false
  },
  {
    id: "Q64",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would avoid pursuing a career if I was not convinced the skills involved would still be in demand ten or more years from now.",
    tip: "When you think about what to study or what career to build, does it matter to you that the skills you develop will still be useful and in demand in ten or twenty years? Or are you more drawn to what interests you now, even if it is less certain what demand for it will look like? Think about whether future-proofing your path feels important or like something you can work out later.",
    reverse: false
  },
  {
    id: "Q65",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would rather take on something risky and exciting than choose the safe, predictable path.",
    tip: "If you had a real choice between two career directions, one stable and reliable, the other exciting but uncertain, which genuinely appeals more? The stable option guarantees security; the risky one has higher highs but real uncertainty. Be honest about which actually draws you, not which sounds more impressive. Both paths lead to fulfilling careers.",
    reverse: true
  },
  {
    id: "Q13",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I feel more confident choosing a career direction when I can see a clear, established route to a stable outcome.",
    tip: "Does having a clear, established route into a career, where you know the steps, the qualifications, and what to expect, feel reassuring and motivating? Or do you prefer an open-ended path where you figure it out as you go, even if it is less certain? Think about whether knowing the roadmap in advance or having the freedom to explore suits you better.",
    reverse: false
  },

  // Mastery
  {
    id: "Q100",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "Becoming genuinely expert at something I care about is one of my strongest motivators.",
    tip: "Does the idea of becoming truly excellent at something, not just good at it, but deeply skilled and knowledgeable, feel like a major pull for you? Or do you find breadth and variety more motivating than depth? Think about subjects or activities you have invested time in. Were you most motivated to become genuinely great, or to explore widely?",
    reverse: false
  },
  {
    id: "Q101",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "I find deep satisfaction in practising and refining a skill until I have truly mastered it.",
    tip: "Think about something you have practised deliberately, like a sport, an instrument, a skill, or a subject. Did the process of getting progressively better, bit by bit, feel genuinely satisfying in itself? Or do you prefer to get reasonably good at something and then move on to something new? Some people love the depth of sustained practice; others prefer variety.",
    reverse: false
  },
  {
    id: "Q102",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "Knowing I am getting better and more capable over time motivates me more than external recognition.",
    tip: "When you have improved at something, what feels more motivating, the private knowledge that you are better than you were? Or the recognition from others that you have done well? Some people are primarily driven by their own internal sense of progress; others need external validation to feel motivated. Think about where your drive actually comes from.",
    reverse: false
  },
  {
    id: "Q103",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "Once I am good enough at something, I rarely feel the urge to keep pushing to improve it.",
    tip: "When you have become reasonably competent at something, good enough to get by or even to be well-regarded, do you still feel pulled to keep pushing for the next level? Or does that drive tend to fade once you have reached a solid standard? Think about something specific you have been good at. Did you keep trying to improve, or were you content once you hit a good level?",
    reverse: true
  },

  // ────────────────────────────────────────────────────────────
  // HOW YOU WORK BEST
  // ────────────────────────────────────────────────────────────

  // Structure
  {
    id: "Q67",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I work best when I have a clear plan or structured approach to follow.",
    tip: "Think about your most productive working sessions. Do you tend to start with a plan, knowing what you are going to do and in what order? And does that plan help you? Or do you find that figuring things out as you go feels just as natural and effective? Think about specific study sessions or projects where this has made a difference.",
    reverse: false
  },
  {
    id: "Q68",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I naturally create routines and organised ways of working to stay on top of things.",
    tip: "Left to your own devices, do you tend to build routines, a regular way of organising your work, a system for keeping track of things, a consistent pattern to your day? Or do you tend to take each day as it comes and organise more spontaneously? Think about your actual habits, not what you think would be ideal.",
    reverse: false
  },
  {
    id: "Q70",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I find it genuinely difficult to work effectively when the environment around me is disorganised.",
    tip: "If the space you are working in is messy and the process is unclear, with different things happening at once and no clear order, does that genuinely affect how well you can work? Or can you focus and perform just as well even in a chaotic environment? Think about study sessions or group projects where things were disorganised and what effect it actually had on you.",
    reverse: false
  },
  {
    id: "Q71",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I prefer to work things out as I go rather than planning everything carefully in advance.",
    tip: "When you approach a new task or project, do you prefer to dive in and figure it out as you go, adapting as you learn more? Or do you feel much more comfortable when you have planned things out carefully in advance? Think about the approach that actually works best for you, even if it is not the one you think you should prefer.",
    reverse: true
  },

  // Collaboration
  {
    id: "Q72",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I do my best work when collaborating closely with others toward a shared goal.",
    tip: "Think about projects where you have worked closely with other people toward a common goal. Did you find that the collaboration made your work noticeably better, with more ideas, more energy, and better output? Or do you tend to produce your best work when you can focus on your own and bring it to the group?",
    reverse: false
  },
  {
    id: "Q73",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "Working through problems jointly with a team produces better results for me than working alone.",
    tip: "When you are tackling a difficult problem, does having other people to work it through with genuinely help, producing better thinking than you would do alone? Or do you tend to think more clearly and reach better solutions when you work through problems by yourself first? Think about specific problems you have faced in subjects you find challenging.",
    reverse: false
  },
  {
    id: "Q74",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I find tasks that require constant coordination with others energising and motivating.",
    tip: "Think about tasks that need a lot of back and forth, coordinating, checking in, jointly deciding, adapting to each other constantly. Does that level of interaction energise you and make the work feel more engaging? Or does it slow you down and feel like it gets in the way of getting things done? Think about whether the coordination itself feels like a feature or a friction.",
    reverse: false
  },
  {
    id: "Q75",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I prefer to work independently rather than as part of a closely collaborating team.",
    tip: "When you have the choice, do you naturally prefer to take on tasks you can own and complete independently, without needing to coordinate constantly with others? Or do you prefer the dynamic of working closely as part of a group? Think about your most productive and satisfying working experiences. Were you mostly on your own or part of a team working closely together?",
    reverse: true
  },

  // Independence
  {
    id: "Q76",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I am significantly more productive when I can work independently, with minimal interruptions from others.",
    tip: "Compare your most focused working sessions. Are you noticeably more productive when working alone, without interruptions or coordination? Or does the presence of others, for accountability, ideas, or energy, tend to help rather than hinder you? Think about studying for an exam versus working on a group project. Which actually produces better output from you?",
    reverse: false
  },
  {
    id: "Q77",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I prefer tasks I can own and complete entirely on my own from start to finish.",
    tip: "Do you prefer having a task that is entirely yours, where you have full control from beginning to end, and the result reflects your own work and decisions? Or do you prefer the shared ownership of a team effort? There are major career differences between roles built around personal ownership and those built around shared contribution.",
    reverse: false
  },
  {
    id: "Q78",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I do my best thinking in quiet, uninterrupted conditions rather than in group settings.",
    tip: "Where do your best ideas actually come from? Is it in quiet, uninterrupted time on your own, when you can really focus without distraction? Or do you find that being around others and bouncing ideas around in discussion tends to produce better thinking than working alone? Think about specific moments of good thinking and where they happened.",
    reverse: false
  },
  {
    id: "Q79",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I find it genuinely difficult to do my best work without regular input and interaction from others.",
    tip: "Working completely independently, with minimal check-ins, no collaboration, just you and the task, is that something you find energising and effective? Or do you genuinely need regular input from others to do your best work, not just because it is useful, but because working in isolation genuinely does not bring out your best?",
    reverse: true
  },

  // Precision
  {
    id: "Q84",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I notice errors and inconsistencies that others tend to overlook.",
    tip: "When reading through something, like a document, a set of figures, or a plan, do you find yourself naturally spotting small mistakes, inconsistencies, or things that do not add up? Or do you tend to get the overall picture right and rely on others or a later review to catch the detail?",
    reverse: false
  },
  {
    id: "Q85",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "Producing high-quality, accurate work is something I take real pride in.",
    tip: "When you finish a piece of work, does the quality and accuracy of it genuinely matter to your sense of how well you have done, not just whether it got done, but whether it is actually right and good? Or do you value output and progress more than precision, preferring to get something done and move on rather than refine it further?",
    reverse: false
  },
  {
    id: "Q86",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I am comfortable submitting work that is good enough, even if more care could improve it.",
    tip: "When something is functionally done, acceptable, probably fine, are you comfortable moving on? Or do you find it hard to stop refining and checking, because good enough does not sit well with you? Think about school assignments. Is there a clear threshold where you decide it is done, or do you always feel it could be better?",
    reverse: true
  },
  {
    id: "Q87",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I tend to check my work carefully before considering it complete.",
    tip: "Before you submit or hand over a piece of work, do you typically go back and check it carefully, reading through, double-checking key points, looking for mistakes? Or once you have done something, are you generally confident in it and ready to move on without a detailed review?",
    reverse: false
  },

  // Pace
  {
    id: "Q88",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I thrive in fast-paced environments where there is always something new to tackle.",
    tip: "Think about working environments that are busy and fast-moving, with lots happening, new things coming in constantly, and high energy. Does that kind of environment bring out the best in you? Or do you find that pace overwhelming or distracting, and tend to do better when things are calmer and more manageable?",
    reverse: false
  },
  {
    id: "Q89",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I tend to perform well under pressure and rise to the occasion when the stakes are high.",
    tip: "When the pressure is on, like an important test, a significant deadline, or a high-stakes situation, do you tend to focus and perform well, maybe even better than usual? Or does pressure tend to knock your performance, and you do better when you have time and space? Think honestly about how you have actually performed in high-pressure moments.",
    reverse: false
  },
  {
    id: "Q90",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I prefer a steady, manageable workload to one that frequently demands urgent bursts of effort.",
    tip: "Between two types of work, one consistent and steady with manageable amounts each day, and one with quieter periods followed by intense bursts, which genuinely suits you better? Some people find intensity energising and steady pace boring; others find a steady rhythm much more sustainable. Think about which describes you better.",
    reverse: true
  },
  {
    id: "Q91",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "A high-energy, fast-moving environment energises rather than exhausts me.",
    tip: "After spending time in a high-energy environment, like a busy event, a fast-paced team, or an intense project period, do you come away feeling energised and ready for more? Or do you feel drained and in need of recovery time? Think about the difference between an environment that feels exciting and one that just feels overwhelming.",
    reverse: false
  },

  // Variety
  {
    id: "Q104",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "I work best when my tasks are varied and no two days look quite the same.",
    tip: "Think about your most productive and engaged periods. Did they involve a lot of variety, with different types of tasks and different challenges each day? Or did they involve a focused routine with mostly similar work? Some people find variety keeps them energised; others find that consistency helps them do their best work. Which describes you better?",
    reverse: false
  },
  {
    id: "Q105",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "Doing the same type of task repeatedly, day after day, would make it very hard for me to stay engaged.",
    tip: "Imagine a job where you do broadly the same type of work every day, similar tasks, similar structure. Would that feel comfortable and productive? Or would it become hard to stay engaged relatively quickly? Think about subjects or activities you have stuck with versus ones you have got bored of. What caused the difference?",
    reverse: false
  },
  {
    id: "Q106",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "I am most productive when I have a predictable routine and consistent types of tasks.",
    tip: "Are you genuinely most productive when your work follows a predictable pattern, with familiar tasks and a consistent environment? Or does that kind of consistency tend to feel monotonous and make it harder to stay at your best? Think about study sessions or projects where you had both types. Which brought out better work from you?",
    reverse: true
  },
  {
    id: "Q107",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "Switching between very different types of work in the same day energises rather than exhausts me.",
    tip: "Think about days where you have switched between very different things, like a creative task, then an analytical one, then something practical, all in the same day. Does that kind of switching feel energising, like it keeps things fresh? Or does it feel disruptive and tiring, and would you prefer to spend longer blocks focused on one type of thing?",
    reverse: false
  }
];

export default questions;