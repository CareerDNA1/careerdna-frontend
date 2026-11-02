// questions_v2.js
// CareerDNA question bank v2: 108 items across 27 sub-dimensions (4 each).
// Canonical order: by group, then sub-dimension. Likert 1 to 5.
// reverse: true = reverse-keyed (scored 6 minus the answer).
// Source of truth: CareerDNA_v5.xlsx, Question Bank sheet (29 Oct 2026).
// Generated; do not edit by hand. Item ids are NOT comparable with bank v1:
// the same id can hold a different item, so answers are always scored with
// the bank they were given on (see utils/banks).

const questions = [
  {
    id: "Q01",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I often come up with ideas that others have not thought of before.",
    tip: "Think about group work or shared projects. Are you often the one suggesting something nobody else has mentioned, or do you build on ideas already there?",
    reverse: false
  },
  {
    id: "Q02",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I would rather stick with a way I know works than try a new one.",
    tip: "Think about something you already know how to do well, like a route, a recipe or a way of revising. When a new way comes along, do you stick with what you know works, or do you like trying the new way?",
    reverse: true
  },
  {
    id: "Q03",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I am better at building on other people's ideas than coming up with my own.",
    tip: "Think about ideas you have worked on with other people. Are you usually the one who had the idea, or the one who took someone else's idea and made it better?",
    reverse: true
  },
  {
    id: "Q04",
    dimension: "Who You Are",
    subdimension: "Originality",
    type: "likert",
    text: "I find it exciting to combine ideas from completely different areas.",
    tip: "Have you ever linked two very different areas, like music and maths, or sport and science? Does mixing ideas like that excite you, or do you prefer to go deep in one area at a time?",
    reverse: false
  },
  {
    id: "Q05",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I rarely have to ask for more time to finish something.",
    tip: "Think about the last few things you had to finish by a set time. Did you make it without asking for extra time, or did you often need a bit longer?",
    reverse: false
  },
  {
    id: "Q06",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I rarely need reminding about things I have agreed to do.",
    tip: "Think about things you have said you would do for other people. Do you usually do them without being chased, or do people have to remind you?",
    reverse: false
  },
  {
    id: "Q07",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "I sometimes end up finishing things later than I said I would.",
    tip: "Think about things you have said you would finish by a certain time, for yourself or for other people. Do you usually finish when you said you would, or do things often run later than planned?",
    reverse: true
  },
  {
    id: "Q08",
    dimension: "Who You Are",
    subdimension: "Reliability",
    type: "likert",
    text: "Once a task stops being interesting, I find it hard to make myself finish it.",
    tip: "Think about projects that started well but became boring halfway through. Do you usually push on to the end, or find it hard to finish?",
    reverse: true
  },
  {
    id: "Q09",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "When something goes badly for me, I get over it fairly quickly.",
    tip: "Think about a recent time something went badly, like a poor result or losing a match. Did you shake it off fairly soon, or did it take a while to feel normal again?",
    reverse: false
  },
  {
    id: "Q11",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "When things go wrong, I am usually calmer than the people around me.",
    tip: "Think about the last time something went badly in a group. Were you one of the calmer people, or one of the more rattled ones?",
    reverse: false
  },
  {
    id: "Q10",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "When something goes wrong, it stays on my mind for the rest of the day.",
    tip: "After a bad moment, like a mistake in front of others or an argument, does it keep coming back to you for the rest of the day, or can you put it aside and get on?",
    reverse: true
  },
  {
    id: "Q12",
    dimension: "Who You Are",
    subdimension: "Resilience",
    type: "likert",
    text: "When I fail at something, it takes me a while to feel confident again.",
    tip: "Think about a time you failed at something, like a test or a trial. Did your confidence bounce back quickly, or take a while?",
    reverse: true
  },
  {
    id: "Q14",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "I am fine with it when my plans change at the last minute.",
    tip: "Think about plans that changed suddenly, like a trip moved or plans with friends changed at the last minute. Do you go with it easily, or find it unsettling?",
    reverse: false
  },
  {
    id: "Q15",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "When what is expected of me changes, I adjust quickly.",
    tip: "Think about times when what you were asked to do changed partway through, like a change of plan in a team or club, or being asked to do a project a different way. Do you switch quickly, or take a while to get used to it?",
    reverse: false
  },
  {
    id: "Q16",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "I need time to get used to a new way of doing things.",
    tip: "Think about times you had to change how you do something you were used to, like a new way of revising, new rules in a sport or game, or a different way of doing a task you know well. Do you pick up the new way quickly, or need time before it feels normal?",
    reverse: true
  },
  {
    id: "Q17",
    dimension: "Who You Are",
    subdimension: "Adaptability",
    type: "likert",
    text: "Starting somewhere new, like a new school or job, takes me a while to settle into.",
    tip: "Think about starting at a new school, job or club, where the people, places and ways of doing things are all new. Do you feel at home quickly, or does it take you a while to settle?",
    reverse: true
  },
  {
    id: "Q18",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "I feel confident in a group of people I do not know well.",
    tip: "Picture a group where you know almost nobody, like a new club or a party. Do you feel confident there, or more on edge?",
    reverse: false
  },
  {
    id: "Q19",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "I am comfortable starting conversations with people I have never met before.",
    tip: "Picture walking into a room where you know no one. Would you start a conversation yourself, or wait for someone to come to you?",
    reverse: false
  },
  {
    id: "Q20",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "I would rather work behind the scenes than present in front of others.",
    tip: "In a group project, would you rather present the work to everyone, or do the work behind the scenes and let someone else present?",
    reverse: true
  },
  {
    id: "Q21",
    dimension: "Who You Are",
    subdimension: "Social Confidence",
    type: "likert",
    text: "In group discussions, I usually let others do most of the talking.",
    tip: "Think about group discussions. Do you usually share your views, or mostly listen and let others do the talking?",
    reverse: true
  },
  {
    id: "Q92",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "I am usually the first to notice when someone is upset, before they say anything.",
    tip: "When a friend is having a bad day, are you usually the one who spots it first, or do you tend to find out when they tell you?",
    reverse: false
  },
  {
    id: "Q93",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "I can see why someone feels the way they do, even when I would feel differently.",
    tip: "Think of a time a friend got upset about something that would not have bothered you. Could you understand why it mattered so much to them, or did it just seem like an overreaction?",
    reverse: false
  },
  {
    id: "Q94",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "When I am busy, I often miss how the people around me are feeling.",
    tip: "Think about times when you are busy with something. Some people still pick up on how those around them are feeling. Others are so focused they only notice later, or when someone mentions it. Which is more like you?",
    reverse: true
  },
  {
    id: "Q95",
    dimension: "Who You Are",
    subdimension: "Empathy",
    type: "likert",
    text: "I rarely notice that something is bothering someone before they tell me.",
    tip: "Think about someone you know who is upset but has not said anything. Do you usually pick up on it from their face, voice or mood, or do you tend to find out when they tell you?",
    reverse: true
  },
  {
    id: "Q22",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "I will spend time working out why something happened even when knowing will not change anything.",
    tip: "Think about a time something odd happened and it did not really matter why. Did you still want to get to the bottom of it, or did you let it go?",
    reverse: false
  },
  {
    id: "Q23",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "When something interests me, I end up finding out far more about it than I meant to.",
    tip: "Think about the last thing that caught your interest. Did you look it up once and move on, or did one thing lead to another until you had lost track of time?",
    reverse: false
  },
  {
    id: "Q24",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "I am happy to follow a method that works without knowing why it works.",
    tip: "Think about a method you have been shown, like a way of solving a maths problem, a recipe or a tactic in a sport. Do you just follow it because it works, or do you want to understand why it works?",
    reverse: true
  },
  {
    id: "Q25",
    dimension: "What You Love",
    subdimension: "Analytical Curiosity",
    type: "likert",
    text: "Long explanations of why something happens usually lose my interest.",
    tip: "When someone starts explaining why something happens, like why prices go up or why the sky is blue, do you want to hear the whole explanation, or do you switch off once you have the basic idea?",
    reverse: true
  },
  {
    id: "Q26",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I would be happy in a job with no creative side to it.",
    tip: "Think about jobs where the work is mostly practical, like checking, organising or following set steps, with no room to make, design or write anything of your own. Would that suit you fine, or would you miss having something creative to do?",
    reverse: true
  },
  {
    id: "Q27",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "Being creative (for example art, music, writing, design or performing) is an important part of who I am.",
    tip: "Think about art, music, writing, design, drama or dance. Is being creative a big part of who you are, or more something you do sometimes?",
    reverse: false
  },
  {
    id: "Q28",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "In my own time, I would rather do other things than make something creative.",
    tip: "When you have free time, would you rather make something, like drawing, music, writing, videos or designs, or do other things?",
    reverse: true
  },
  {
    id: "Q29",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I care a lot about how my work looks or sounds, not just whether it works.",
    tip: "When you finish a piece of work, do you care a lot about how it looks or sounds, or mainly that it does the job?",
    reverse: false
  },
  {
    id: "Q30",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "I like showing other people how to do something.",
    tip: "Think about times you have explained something to someone, like helping a friend with a game, a recipe or a piece of work. Do you enjoy teaching people, or would you rather they worked it out themselves?",
    reverse: false
  },
  {
    id: "Q31",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "I like being the person people come to when they are having a hard time.",
    tip: "When a friend is going through something difficult, are you usually the one they talk to? Do you like being that person, or does it feel like a lot to take on?",
    reverse: false
  },
  {
    id: "Q32",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "Of all the kinds of work I could do, looking after or supporting people would be near the bottom of my list.",
    tip: "Think about all the kinds of work you could do, like building, creating, selling, researching, organising or looking after people. Where would looking after or supporting people, like patients, children or people going through a hard time, come on your list?",
    reverse: true
  },
  {
    id: "Q33",
    dimension: "What You Love",
    subdimension: "Helping & Caring",
    type: "likert",
    text: "Spending most of my time on other people's needs would wear me out.",
    tip: "Imagine a job where most of your day is spent on other people's needs. Would that energise you, or wear you out?",
    reverse: true
  },
  {
    id: "Q34",
    dimension: "What You Love",
    subdimension: "Leading & Starting Things",
    type: "likert",
    text: "I would love to start something of my own, like a club, business or project.",
    tip: "Think about clubs, small businesses, online channels or events. Have you ever wanted to set one up yourself, or are you happier joining something someone else has started?",
    reverse: false
  },
  {
    id: "Q35",
    dimension: "What You Love",
    subdimension: "Leading & Starting Things",
    type: "likert",
    text: "In a group, I would rather play my part than be the one in charge.",
    tip: "Think about group projects, teams or clubs. Some people like being in charge: making the calls and keeping everyone on track. Others prefer to play their part well and let someone else lead. Which is more like you?",
    reverse: true
  },
  {
    id: "Q36",
    dimension: "What You Love",
    subdimension: "Leading & Starting Things",
    type: "likert",
    text: "I enjoy persuading people to go along with my ideas.",
    tip: "Think about times you have tried to get others behind your idea, like choosing a film or a weekend plan. Do you enjoy making the case and winning people over, or would you rather go along with what the group decides?",
    reverse: false
  },
  {
    id: "Q37",
    dimension: "What You Love",
    subdimension: "Leading & Starting Things",
    type: "likert",
    text: "I would rather be given a job to do than run something of my own.",
    tip: "Imagine you could either be given a clear part to do in a project, or be the one running the whole thing and making the decisions. Which would you choose?",
    reverse: true
  },
  {
    id: "Q38",
    dimension: "What You Love",
    subdimension: "Hands-On & Technical",
    type: "likert",
    text: "I enjoy working with tools, machines or materials with my hands.",
    tip: "Think about building, fixing, cooking, crafting or working with tools. Do you enjoy getting your hands busy making things, or would you rather leave that kind of practical work to others?",
    reverse: false
  },
  {
    id: "Q39",
    dimension: "What You Love",
    subdimension: "Hands-On & Technical",
    type: "likert",
    text: "If something breaks, I would rather get someone else to fix it.",
    tip: "When something breaks, like a bike, a gadget or a piece of furniture, do you try to fix it yourself or get someone else to?",
    reverse: true
  },
  {
    id: "Q40",
    dimension: "What You Love",
    subdimension: "Hands-On & Technical",
    type: "likert",
    text: "I switch off when someone explains how an engine, a circuit or an app works.",
    tip: "When someone explains how a machine, a circuit or an app works, do you find it interesting, or does your attention drift?",
    reverse: true
  },
  {
    id: "Q41",
    dimension: "What You Love",
    subdimension: "Hands-On & Technical",
    type: "likert",
    text: "I enjoy making things with technology, like coding a game or building a circuit.",
    tip: "Think about coding, building a website, making a game or putting together electronics. Is that something you would happily spend hours on, or does it not really appeal?",
    reverse: false
  },
  {
    id: "Q42",
    dimension: "What You Love",
    subdimension: "Society & World Curiosity",
    type: "likert",
    text: "I tend to skip news about politics and world events.",
    tip: "Think about news on politics, elections or what is happening in other countries. Do you usually stop and read or watch it, or scroll past to something else?",
    reverse: true
  },
  {
    id: "Q43",
    dimension: "What You Love",
    subdimension: "Society & World Curiosity",
    type: "likert",
    text: "I like talking about politics and how society should be run.",
    tip: "Think about conversations about politics, fairness or how the country should be run. Do you enjoy joining in and sharing your views, or would you rather talk about something else?",
    reverse: false
  },
  {
    id: "Q44",
    dimension: "What You Love",
    subdimension: "Society & World Curiosity",
    type: "likert",
    text: "In my own time I read or watch things about history or world events.",
    tip: "Think about what you choose to watch, read or scroll through when nobody is making you. How often is it history, the news, documentaries or what is happening in other countries?",
    reverse: false
  },
  {
    id: "Q45",
    dimension: "What You Love",
    subdimension: "Society & World Curiosity",
    type: "likert",
    text: "I prefer practical, everyday questions to big questions about society and the world.",
    tip: "Some people are most interested in practical questions, like how to fix something or what to do this weekend. Others are drawn to big questions, like why countries go to war or how society could be fairer. Which pulls you more?",
    reverse: true
  },
  {
    id: "Q96",
    dimension: "What You Love",
    subdimension: "Numbers & Data Curiosity",
    type: "likert",
    text: "I enjoy working with numbers and data.",
    tip: "Think about things like keeping track of money, working out scores or looking at results and figures. Do you enjoy that kind of number work, or would you rather avoid it?",
    reverse: false
  },
  {
    id: "Q97",
    dimension: "What You Love",
    subdimension: "Numbers & Data Curiosity",
    type: "likert",
    text: "I like looking at numbers or charts to work out what is going on.",
    tip: "When you see a chart or a table of figures, like football stats or survey results, do you enjoy digging in to work out what it shows, or do you usually skip past it?",
    reverse: false
  },
  {
    id: "Q98",
    dimension: "What You Love",
    subdimension: "Numbers & Data Curiosity",
    type: "likert",
    text: "I find working with numbers and figures boring.",
    tip: "Think about tasks like working out a budget, filling in a spreadsheet or reading a chart of results. Do you find that kind of work boring, or do you quite enjoy it?",
    reverse: true
  },
  {
    id: "Q99",
    dimension: "What You Love",
    subdimension: "Numbers & Data Curiosity",
    type: "likert",
    text: "I would rather leave keeping records and figures to someone else.",
    tip: "If someone had to keep the records and figures up to date, like a budget or a list of results, would you rather it was you or someone else?",
    reverse: true
  },
  {
    id: "Q46",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "To stay interested in a job, I would need to feel it is making a difference to the world.",
    tip: "Imagine a job you enjoy but that does not really change anything, compared with one that is part of making the world better, like protecting the environment, tackling unfairness or advancing science. Would enjoying the first be enough to keep you interested, or would you need to feel your work made a difference?",
    reverse: false
  },
  {
    id: "Q47",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I would take less pay to work for a cause I believe in.",
    tip: "Think about causes people care about, like the environment, fairness, health or science. Would you take a lower salary to work on something you believe in, or would pay matter more to you?",
    reverse: false
  },
  {
    id: "Q48",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I would be happy in a job I enjoy, even if it did not make a difference to the world.",
    tip: "Imagine a job you really enjoy that is useful but does not change much in the wider world, like testing video games or working in a shop you like. Would enjoying it be enough for you, or would you want your work to make a bigger difference?",
    reverse: true
  },
  {
    id: "Q49",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I care more about doing my own job well than about changing things in the world.",
    tip: "Some people are driven by doing their own work really well. Others want their work to be part of changing something bigger, like how people live or how the world works. Which matters more to you?",
    reverse: true
  },
  {
    id: "Q50",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I would rather work out how to do something myself than be shown the best way to do it.",
    tip: "Think about learning something new, like a game, a recipe or a skill. Would you rather be shown the best way to do it, or be left to find your own way even if it takes longer?",
    reverse: false
  },
  {
    id: "Q51",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I am happy to do things the way I am asked, even if I would have done them differently.",
    tip: "If someone in charge, like a coach, a team captain or a group leader, asks you to do something their way when you would have done it differently, do you go along with it happily, or does it bother you?",
    reverse: true
  },
  {
    id: "Q52",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I work better when someone is keeping an eye on how I am getting on.",
    tip: "Think about how you work when someone checks in on you regularly compared with when you are left alone. Which way do you get more done?",
    reverse: true
  },
  {
    id: "Q53",
    dimension: "What Matters",
    subdimension: "Autonomy",
    type: "likert",
    text: "I would rather set my own targets than be given clear ones to work towards.",
    tip: "Clear targets from someone else make things easier: you know exactly what to aim for. Setting your own gives you more freedom, but more to work out. Which suits you better?",
    reverse: false
  },
  {
    id: "Q54",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "It matters to me that the people I work or study with see me as one of them.",
    tip: "Think about the people you study or work with. Does it matter to you that they see you as part of the group, or are you happy on the edge of it?",
    reverse: false
  },
  {
    id: "Q55",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "Being part of a group, like a team, a club or a friendship group, is a big part of who I am.",
    tip: "Think about the groups you are part of, like a team, a club or your friends. For some people, belonging to a group is a big part of who they are. Others feel just as much themselves on their own or moving between different groups. Which is more like you?",
    reverse: false
  },
  {
    id: "Q56",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "At work or school, I am happy to get on with people without needing to be close to them.",
    tip: "Some people want to feel close to the people they work or study with, like part of a group. Others get on well with everyone but do not need that closeness to be happy. Which is more like you?",
    reverse: true
  },
  {
    id: "Q57",
    dimension: "What Matters",
    subdimension: "Belonging",
    type: "likert",
    text: "I can enjoy my work without necessarily feeling part of a team or group.",
    tip: "Imagine work you enjoy, but where you do not feel part of a team or a group. Would you still be happy there, or would something important be missing?",
    reverse: true
  },
  {
    id: "Q58",
    dimension: "What Matters",
    subdimension: "Recognition & Reward",
    type: "likert",
    text: "I would rather be well known for my work than quietly good at it.",
    tip: "Imagine two people who are equally good at their job. One is well known and praised for it. The other does great work quietly, without much attention. Which would you rather be?",
    reverse: false
  },
  {
    id: "Q59",
    dimension: "What Matters",
    subdimension: "Recognition & Reward",
    type: "likert",
    text: "I would choose a more interesting job over a better-paid one.",
    tip: "Imagine two job offers: one is more interesting but pays less, the other pays more but is less interesting. Which would you take?",
    reverse: true
  },
  {
    id: "Q60",
    dimension: "What Matters",
    subdimension: "Recognition & Reward",
    type: "likert",
    text: "Earning a lot of money is one of the main things I want from my future career.",
    tip: "Think about what you want from a future career: interesting work, helping people, free time, a secure job, good pay. How high does earning a lot of money come on your list?",
    reverse: false
  },
  {
    id: "Q62",
    dimension: "What Matters",
    subdimension: "Recognition & Reward",
    type: "likert",
    text: "Knowing I have done a good job is enough for me, even if nobody else notices.",
    tip: "Think about finishing something you are proud of. Is it enough for you to know you did it well, or does it matter to you that other people see it and recognise it?",
    reverse: true
  },
  {
    id: "Q63",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would choose a steady job I know will last over a more exciting one that might not.",
    tip: "Imagine two jobs: one you know will still be there in ten years, and one that is more exciting but might disappear. Which would you choose?",
    reverse: false
  },
  {
    id: "Q64",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would choose a job with the same pay every month over one where pay goes up and down but could be higher.",
    tip: "Some jobs pay the same amount every month. Others, like freelance work, sales or running your own business, pay more in good months and less in quiet ones. Would you rather have the steady pay, or the chance of earning more?",
    reverse: false
  },
  {
    id: "Q65",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would take a chance on an uncertain job if it could lead to something better.",
    tip: "Imagine being offered a job that might not work out, like joining a new start-up or a short project, but that could lead somewhere really good. Would you take the chance, or stick with something certain?",
    reverse: true
  },
  {
    id: "Q13",
    dimension: "What Matters",
    subdimension: "Security",
    type: "likert",
    text: "I would happily take a job that might only last a year or two.",
    tip: "Some jobs are short contracts, like a one-year project, seasonal work or a fixed-term role. Would you be happy taking one if it sounded good, or would you want something you knew would last?",
    reverse: true
  },
  {
    id: "Q100",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "I spend a lot of my own time getting better at one particular thing, like a sport, an instrument, a craft or a subject.",
    tip: "Is there one thing you keep practising in your own time, like a sport, an instrument, a craft or a subject, because you want to be really good at it? Or do you mostly do things for fun without working to improve?",
    reverse: false
  },
  {
    id: "Q101",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "I would rather take on a task that challenges me than one I know I can do well.",
    tip: "Imagine choosing between a task that is a bit beyond you, where you would learn a lot but might not do it perfectly, and one you know you can do well. Which would you usually pick?",
    reverse: false
  },
  {
    id: "Q102",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "I would rather be good at lots of things than an expert in one.",
    tip: "Some people like to try lots of things and be decent at all of them; others want to go deep and become really expert in one. Which sounds more like you?",
    reverse: true
  },
  {
    id: "Q103",
    dimension: "What Matters",
    subdimension: "Mastery",
    type: "likert",
    text: "Once I can do something well enough, I would rather spend my time on other things than keep improving.",
    tip: "Think about a skill you have, like cooking, a sport, an instrument or using a computer program. Once you are good enough to do what you need, do you keep working to get better, or put your time into other things?",
    reverse: true
  },
  {
    id: "Q108",
    dimension: "What Matters",
    subdimension: "Work-Life Balance",
    type: "likert",
    text: "I would turn down a job I liked if it meant working very long hours.",
    tip: "Imagine a job you would really enjoy, but with very long hours. Would you take it anyway, or turn it down to keep time for your life outside work?",
    reverse: false
  },
  {
    id: "Q109",
    dimension: "What Matters",
    subdimension: "Work-Life Balance",
    type: "likert",
    text: "I keep my evenings and weekends free from work or study whenever I can.",
    tip: "Some people do a bit of work or study most evenings and weekends; others keep that time for themselves as much as they can. Which is more like you?",
    reverse: false
  },
  {
    id: "Q110",
    dimension: "What Matters",
    subdimension: "Work-Life Balance",
    type: "likert",
    text: "I would be fine with a job that often took up my evenings and weekends.",
    tip: "Some jobs, like running a business, working in a restaurant or some city jobs, often take up evenings and weekends. Would you be fine with that if you liked the job, or would you want to protect your free time?",
    reverse: true
  },
  {
    id: "Q111",
    dimension: "What Matters",
    subdimension: "Work-Life Balance",
    type: "likert",
    text: "I would happily give up a lot of my free time if my work or studies needed it.",
    tip: "Think about times when something needed extra hours, like a big project, revising for exams or a part-time job. Were you happy to give up evenings or weekends for it, or do you prefer to protect your free time?",
    reverse: true
  },
  {
    id: "Q67",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I need a clear plan before I can get started on something.",
    tip: "Some people cannot get going until they know the steps; others start and work it out on the way. Which is more like you?",
    reverse: false
  },
  {
    id: "Q68",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I am happy to start a task without knowing exactly what is expected.",
    tip: "Think about being given a task with only a vague idea of what is wanted. Are you happy to get started and work it out, or do you need to know exactly what is expected first?",
    reverse: true
  },
  {
    id: "Q70",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I would rather be told exactly what the finished work should look like than decide that myself.",
    tip: "Imagine being asked to make a poster or plan an event. Would you rather be told exactly what the end result should be, or be given a rough idea and decide the rest yourself?",
    reverse: false
  },
  {
    id: "Q71",
    dimension: "How You Work Best",
    subdimension: "Structure",
    type: "likert",
    text: "I would rather work things out as I go than plan in advance.",
    tip: "When you start something new, like a project, a trip or a piece of work, do you like to plan it out first, or get started and work it out as you go?",
    reverse: true
  },
  {
    id: "Q72",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I enjoy working with others on the same piece of work, sharing the tasks and decisions.",
    tip: "Think about working with others on one shared piece of work, like planning an event together, where you split the tasks and make the decisions as a group. Do you enjoy that, or would you rather have a part that is fully yours?",
    reverse: false
  },
  {
    id: "Q73",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I enjoy working in a team where we all rely on each other to get things done.",
    tip: "Think about a team where each person's part depends on the others, like a kitchen, a sports team or a group project. Do you enjoy working like that, or would you rather your work depended only on you?",
    reverse: false
  },
  {
    id: "Q74",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I would rather have my own part of a project than share every part of it with others.",
    tip: "In a group project, some people like to split the work so each person owns one part; others like to do every part together. Which way do you prefer to work?",
    reverse: true
  },
  {
    id: "Q75",
    dimension: "How You Work Best",
    subdimension: "Collaboration",
    type: "likert",
    text: "I usually get more done working on my own than in a group.",
    tip: "Think about the last few times you worked in a group. Did you get more done than you would have alone, or less?",
    reverse: true
  },
  {
    id: "Q76",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I can happily work alone on one thing for hours at a stretch.",
    tip: "Think about a long stretch of time working alone on one thing. Is that something you enjoy, or something you put up with?",
    reverse: false
  },
  {
    id: "Q77",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I get restless if I have to work on my own for a long time.",
    tip: "Think about a long stretch working alone, like a whole day on a project with nobody around. Do you settle into it happily, or after a while do you start wanting to talk to someone or be around people?",
    reverse: true
  },
  {
    id: "Q78",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I do my best thinking when I am on my own in a quiet place.",
    tip: "When you need to think something through, like planning a piece of work or solving a problem, where does it go best: alone somewhere quiet, or talking it through with other people around?",
    reverse: false
  },
  {
    id: "Q79",
    dimension: "How You Work Best",
    subdimension: "Independence",
    type: "likert",
    text: "I would rather work in a busy room with other people than in a quiet room on my own.",
    tip: "Picture two places to work: a busy room with other people coming and going, or a quiet room on your own. Which would help you get more done and feel more like yourself?",
    reverse: true
  },
  {
    id: "Q112",
    dimension: "How You Work Best",
    subdimension: "Active & Outdoors",
    type: "likert",
    text: "I enjoy work that gets me outside.",
    tip: "Think about jobs that are mostly outside, like gardening, farming, building, sports coaching or working with animals. Would you enjoy being outdoors for much of the day, or prefer to be inside?",
    reverse: false
  },
  {
    id: "Q113",
    dimension: "How You Work Best",
    subdimension: "Active & Outdoors",
    type: "likert",
    text: "I like work that keeps me moving and on my feet.",
    tip: "Think about jobs where you are on your feet all day, like working in a kitchen, on a building site, on a hospital ward or coaching sport. Would you enjoy being active like that, or prefer to sit for most of the day?",
    reverse: false
  },
  {
    id: "Q114",
    dimension: "How You Work Best",
    subdimension: "Active & Outdoors",
    type: "likert",
    text: "I would be happy sitting at a desk or screen for most of the day.",
    tip: "Think about a day spent at a desk or a laptop: writing, planning, working on a screen. Could you do that most days and feel fine, or would you start wanting to get up, move about and be somewhere else?",
    reverse: true
  },
  {
    id: "Q115",
    dimension: "How You Work Best",
    subdimension: "Active & Outdoors",
    type: "likert",
    text: "I prefer to work indoors.",
    tip: "Picture two jobs you would otherwise enjoy equally: one mostly in an office or studio, the other mostly outside in all weathers. Which would you choose?",
    reverse: true
  },
  {
    id: "Q84",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I notice small mistakes that other people miss.",
    tip: "Think about reading something someone else has written, like a message, a poster or a piece of work. Do you often spot small mistakes, like spelling or wrong numbers, that others missed, or do they usually slip past you?",
    reverse: false
  },
  {
    id: "Q85",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I double-check small details that most people would not bother with.",
    tip: "Think about the last thing you finished. Did you go back and check small details, like spelling, numbers or instructions, or were you happy once it was done?",
    reverse: false
  },
  {
    id: "Q86",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I am happy to hand in work that is good enough rather than perfect.",
    tip: "When a piece of work is good enough to pass, do you hand it in and move on, or keep going over it until it is as close to perfect as you can get?",
    reverse: true
  },
  {
    id: "Q87",
    dimension: "How You Work Best",
    subdimension: "Precision",
    type: "likert",
    text: "I focus on the big picture and leave the fine detail to others.",
    tip: "In a project, some people like to set the overall direction and leave others to check the small details. Others like to make sure every detail is right themselves. Which are you?",
    reverse: true
  },
  {
    id: "Q88",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I like it when work is busy and fast-moving.",
    tip: "Think about days with lots happening at once, like a match day, an event you are helping to run or a day when lots is due. Do you enjoy that energy, or do you prefer calmer days where you can take things one at a time?",
    reverse: false
  },
  {
    id: "Q89",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "In my work or studies, I like having to make quick decisions on the spot.",
    tip: "Think about times when something changes suddenly or a problem comes up and someone has to make the call straight away. Do you enjoy deciding quickly, or would you rather have time to think it through?",
    reverse: false
  },
  {
    id: "Q90",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I prefer a steady workload to one with lots of urgent rushes.",
    tip: "Think about weeks when lots of things were due at once, compared with weeks where the work was spread out evenly. Did the rush give you a buzz, or did you much prefer the steady weeks?",
    reverse: true
  },
  {
    id: "Q91",
    dimension: "How You Work Best",
    subdimension: "Pace",
    type: "likert",
    text: "I would rather take my time over a piece of work than get it done quickly.",
    tip: "Some people like to work slowly and carefully; others like to get things done fast and move on. When you have a piece of work to do, which suits you better?",
    reverse: true
  },
  {
    id: "Q104",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "I would enjoy a job where I do something different every day.",
    tip: "Picture a job where one day you are meeting people, the next solving a problem and the next making something. Would that keep you interested, or would you rather do the same kind of work and get really good at it?",
    reverse: false
  },
  {
    id: "Q105",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "I would enjoy a job where I work in different places from week to week.",
    tip: "Picture a job where one week you are in an office, the next on a site or visiting customers, and the week after somewhere else again. Would that keep things interesting for you, or would you rather have one regular place to work?",
    reverse: false
  },
  {
    id: "Q106",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "At work or school, I prefer doing the same kind of tasks from one day to the next.",
    tip: "Imagine doing much the same kind of work every day, in the same way. Would you find that comfortable, because you get into a rhythm and get good at it, or would it start to feel boring?",
    reverse: true
  },
  {
    id: "Q107",
    dimension: "How You Work Best",
    subdimension: "Variety",
    type: "likert",
    text: "Switching between very different tasks in one day tires me out.",
    tip: "Think about days with lots of very different tasks. Does switching between them tire you out, or keep you going?",
    reverse: true
  }
];

export default questions;
