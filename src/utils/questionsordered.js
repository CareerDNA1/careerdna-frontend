// questions.js
// Total: 96 questions, 4 per subdimension across 24 subdimensions, for CareerDNA survey (14-22-year-olds)
// Likert: 1-5 scale (Strongly Disagree to Strongly Agree), Forced: A/B choice, Reverse: true for inverted scoring

const questions = [
  {
    id: "Q1",
    dimension: "Who You Are",
    subdimension: "Curiosity & Openness",
    type: "likert",
    text: "I enjoy trying out unusual ideas or hobbies, even if they seem a bit strange at first.",
    reverse: false
  },
  {
    id: "Q2",
    dimension: "Who You Are",
    subdimension: "Curiosity & Openness",
    type: "likert",
    text: "I often come up with different or creative ways to do a project or solve a problem.",
    reverse: false
  },
  {
    id: "Q3",
    dimension: "Who You Are",
    subdimension: "Curiosity & Openness",
    type: "forced",
    text: "When working on projects or schoolwork: A: I prefer sticking to what I know well. B: I like trying out new, unusual approaches.",
    reverse: false
  },
  {
    id: "Q4",
    dimension: "Who You Are",
    subdimension: "Curiosity & Openness",
    type: "likert",
    text: "I’d rather stick to familiar topics than explore new ones.",
    reverse: true
  },
  {
    id: "Q5",
    dimension: "Who You Are",
    subdimension: "Reliability & Focus",
    type: "likert",
    text: "I make sure to finish my work or tasks on time, even if they get boring or difficult.",
    reverse: false
  },
  {
    id: "Q6",
    dimension: "Who You Are",
    subdimension: "Reliability & Focus",
    type: "likert",
    text: "I like planning my day or projects step by step.",
    reverse: false
  },
  {
    id: "Q7",
    dimension: "Who You Are",
    subdimension: "Reliability & Focus",
    type: "forced",
    text: "For group work: A: I prefer focusing on my part. B: I like helping organise the whole task.",
    reverse: false
  },
  {
    id: "Q8",
    dimension: "Who You Are",
    subdimension: "Reliability & Focus",
    type: "likert",
    text: "I often leave things until the last minute.",
    reverse: true
  },
  {
    id: "Q9",
    dimension: "Who You Are",
    subdimension: "Emotional Stability",
    type: "likert",
    text: "I stay calm when things go wrong",
    reverse: false
  },
  {
    id: "Q10",
    dimension: "Who You Are",
    subdimension: "Emotional Stability",
    type: "likert",
    text: "I can handle challenges at school or with friends without getting too upset.",
    reverse: false
  },
  {
    id: "Q11",
    dimension: "Who You Are",
    subdimension: "Emotional Stability",
    type: "forced",
    text: "During tough times: A: I feel overwhelmed quickly. B: I keep a level head and move on.",
    reverse: false
  },
  {
    id: "Q12",
    dimension: "Who You Are",
    subdimension: "Emotional Stability",
    type: "likert",
    text: "I tend to get worried or anxious easily about small things.",
    reverse: true
  },
  {
    id: "Q13",
    dimension: "Who You Are",
    subdimension: "Uncertainty Tolerance",
    type: "likert",
    text: "I like trying activities that might be a bit scary or uncertain, like new sports.",
    reverse: false
  },
  {
    id: "Q14",
    dimension: "Who You Are",
    subdimension: "Uncertainty Tolerance",
    type: "likert",
    text: "I feel comfortable in situations where I don't know what will happen.",
    reverse: false
  },
  {
    id: "Q15",
    dimension: "Who You Are",
    subdimension: "Uncertainty Tolerance",
    type: "forced",
    text: "When you’re not sure how something will turn out: A: I go for the safe option. B: I choose the new option, even if it’s less certain, if it might be worth it.",
    reverse: false
  },
  {
    id: "Q16",
    dimension: "Who You Are",
    subdimension: "Uncertainty Tolerance",
    type: "likert",
    text: "I prefer situations where I have a good idea of what will happen",
    reverse: true
  },
  {
    id: "Q17",
    dimension: "Who You Are",
    subdimension: "Perseverance",
    type: "likert",
    text: "I keep working on things even when they get tough.",
    reverse: false
  },
  {
    id: "Q18",
    dimension: "Who You Are",
    subdimension: "Perseverance",
    type: "likert",
    text: "I don’t give up easily when something matters to me.",
    reverse: false
  },
  {
    id: "Q19",
    dimension: "Who You Are",
    subdimension: "Perseverance",
    type: "forced",
    text: "When goals are tough: A: I’d rather change to a different goal. B: I like to keep working on the same goal",
    reverse: false
  },
  {
    id: "Q20",
    dimension: "Who You Are",
    subdimension: "Perseverance",
    type: "likert",
    text: "I tend to quit things quickly if they're too difficult.",
    reverse: true
  },
  {
    id: "Q21",
    dimension: "Who You Are",
    subdimension: "Sociability & Extroversion",
    type: "likert",
    text: "I enjoy talking and hanging out with lots of people at school events.",
    reverse: false
  },
  {
    id: "Q22",
    dimension: "Who You Are",
    subdimension: "Sociability & Extroversion",
    type: "likert",
    text: "In groups, I often take the lead in conversations",
    reverse: false
  },
  {
    id: "Q23",
    dimension: "Who You Are",
    subdimension: "Sociability & Extroversion",
    type: "forced",
    text: "At parties or gatherings: A: I stay quiet in the background. B: I chat with everyone.",
    reverse: false
  },
  {
    id: "Q24",
    dimension: "Who You Are",
    subdimension: "Sociability & Extroversion",
    type: "likert",
    text: "I prefer being alone or with one good friend rather than in big groups.",
    reverse: true
  },
  {
    id: "Q25",
    dimension: "What You Love",
    subdimension: "Investigative Curiosity",
    type: "likert",
    text: "I like digging into questions that don’t have easy answers.",
    reverse: false
  },
  {
    id: "Q26",
    dimension: "What You Love",
    subdimension: "Investigative Curiosity",
    type: "likert",
    text: "I enjoy researching topics that make me question and learn more.",
    reverse: false
  },
  {
    id: "Q27",
    dimension: "What You Love",
    subdimension: "Investigative Curiosity",
    type: "forced",
    text: "When learning about something: A: I like fast answers. B: I enjoy working through complex ideas.",
    reverse: false
  },
  {
    id: "Q28",
    dimension: "What You Love",
    subdimension: "Investigative Curiosity",
    type: "likert",
    text: "I lose interest when a topic needs thorough investigation.",
    reverse: true
  },
  {
    id: "Q29",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I enjoy expressing myself through art, design, writing, music or making things that show my imagination.",
    reverse: false
  },
  {
    id: "Q30",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "Coming up with creative ideas is something I do often.",
    reverse: false
  },
  {
    id: "Q31",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "forced",
    text: "When working on a project or task I prefer: A: Solving a set problem with one clear solution. B: Creating my own idea and developing it.",
    reverse: false
  },
  {
    id: "Q32",
    dimension: "What You Love",
    subdimension: "Creative Expression",
    type: "likert",
    text: "I avoid activities that require coming up with original ideas.",
    reverse: true
  },
  {
    id: "Q33",
    dimension: "What You Love",
    subdimension: "Helping Orientation",
    type: "likert",
    text: "I feel good when I support classmates who need help.",
    reverse: false
  },
  {
    id: "Q34",
    dimension: "What You Love",
    subdimension: "Helping Orientation",
    type: "likert",
    text: "I notice when someone is struggling or left out and step in to help.",
    reverse: false
  },
  {
    id: "Q35",
    dimension: "What You Love",
    subdimension: "Helping Orientation",
    type: "forced",
    text: "In group work I focus more on: A: My own tasks. B: Making sure everyone is included",
    reverse: false
  },
  {
    id: "Q36",
    dimension: "What You Love",
    subdimension: "Helping Orientation",
    type: "likert",
    text: "I don't really enjoy dealing with other people's problems.",
    reverse: true
  },
  {
    id: "Q37",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "Coming up with new business or project ideas excites me.",
    reverse: false
  },
  {
    id: "Q38",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "I often think about ways to improve how things are done",
    reverse: false
  },
  {
    id: "Q39",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "forced",
    text: "When there’s a chance to start something new: A: I prefer to follow others' ideas. B: I like to push ideas forward myself.",
    reverse: false
  },
  {
    id: "Q40",
    dimension: "What You Love",
    subdimension: "Entrepreneurial Drive",
    type: "likert",
    text: "I usually wait for someone else to set up a new project before I get involved.",
    reverse: true
  },
  {
    id: "Q41",
    dimension: "What You Love",
    subdimension: "Hands-On Engagement",
    type: "likert",
    text: "I enjoy working with tools, materials or technology to build things.",
    reverse: false
  },
  {
    id: "Q42",
    dimension: "What You Love",
    subdimension: "Hands-On Engagement",
    type: "likert",
    text: "I prefer learning through action instead of watching or listening.",
    reverse: false
  },
  {
    id: "Q43",
    dimension: "What You Love",
    subdimension: "Hands-On Engagement",
    type: "forced",
    text: "When learning: A: I like reading about things. B: I like doing things physically.",
    reverse: false
  },
  {
    id: "Q44",
    dimension: "What You Love",
    subdimension: "Hands-On Engagement",
    type: "likert",
    text: "I avoid tasks that involve building or making things.",
    reverse: true
  },
  {
    id: "Q45",
    dimension: "What You Love",
    subdimension: "Novelty & Variety Seeking",
    type: "likert",
    text: "I get bored with the same routine and crave new activities.",
    reverse: false
  },
  {
    id: "Q46",
    dimension: "What You Love",
    subdimension: "Novelty & Variety Seeking",
    type: "likert",
    text: "Trying different hobbies or experiences keeps me interested.",
    reverse: false
  },
  {
    id: "Q47",
    dimension: "What You Love",
    subdimension: "Novelty & Variety Seeking",
    type: "forced",
    text: "For weekends I prefer: A: Same old plans. B: Something new and different.",
    reverse: false
  },
  {
    id: "Q48",
    dimension: "What You Love",
    subdimension: "Novelty & Variety Seeking",
    type: "likert",
    text: "I’m more comfortable when my days are mostly the same with no surprises.",
    reverse: true
  },
  {
    id: "Q49",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I want my work or studies to make a positive difference in the world.",
    reverse: false
  },
  {
    id: "Q50",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "Helping society or causes motivates me more than personal gain.",
    reverse: false
  },
  {
    id: "Q51",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "forced",
    text: "When thinking about my career what matters more is: A: My own goals. B: Goals that help others or a cause.",
    reverse: false
  },
  {
    id: "Q52",
    dimension: "What Matters",
    subdimension: "Purpose & Impact",
    type: "likert",
    text: "I don’t really think about whether my work helps anyone else.",
    reverse: true
  },
  {
    id: "Q53",
    dimension: "What Matters",
    subdimension: "Independence & Autonomy",
    type: "likert",
    text: "Deciding my own steps and priorities energises me.",
    reverse: false
  },
  {
    id: "Q54",
    dimension: "What Matters",
    subdimension: "Independence & Autonomy",
    type: "likert",
    text: "I do my best when I have the freedom to choose what I do.",
    reverse: false
  },
  {
    id: "Q55",
    dimension: "What Matters",
    subdimension: "Independence & Autonomy",
    type: "forced",
    text: "A: I often need direction to stay focused. B: I do best when I lead myself.",
    reverse: false
  },
  {
    id: "Q56",
    dimension: "What Matters",
    subdimension: "Independence & Autonomy",
    type: "likert",
    text: "I prefer when others set the next steps instead of me",
    reverse: true
  },
  {
    id: "Q57",
    dimension: "What Matters",
    subdimension: "Stability & Predictability",
    type: "likert",
    text: "I value stable routines and knowing what to expect each day.",
    reverse: false
  },
  {
    id: "Q58",
    dimension: "What Matters",
    subdimension: "Stability & Predictability",
    type: "likert",
    text: "I feel better when things are planned out ahead of time.",
    reverse: false
  },
  {
    id: "Q59",
    dimension: "What Matters",
    subdimension: "Stability & Predictability",
    type: "forced",
    text: "A: I like surprises. B: I like knowing what’s coming.",
    reverse: false
  },
  {
    id: "Q60",
    dimension: "What Matters",
    subdimension: "Stability & Predictability",
    type: "likert",
    text: "Frequent changes to rules or plans don’t bother me.",
    reverse: true
  },
  {
    id: "Q61",
    dimension: "What Matters",
    subdimension: "Recognition & Visibility",
    type: "likert",
    text: "I enjoy being recognized when I do a good job.",
    reverse: false
  },
  {
    id: "Q62",
    dimension: "What Matters",
    subdimension: "Recognition & Visibility",
    type: "likert",
    text: "Being noticed for my efforts motivates me to work harder.",
    reverse: false
  },
  {
    id: "Q63",
    dimension: "What Matters",
    subdimension: "Recognition & Visibility",
    type: "forced",
    text: "When I achieve something: A: I like to keep things private. B: I like it being seen and acknowledged.",
    reverse: false
  },
  {
    id: "Q64",
    dimension: "What Matters",
    subdimension: "Recognition & Visibility",
    type: "likert",
    text: "When I achieve something, I'd rather keep a low profile",
    reverse: true
  },
  {
    id: "Q65",
    dimension: "What Matters",
    subdimension: "Financial Ambition",
    type: "likert",
    text: "Earning good money is an important goal for me.",
    reverse: false
  },
  {
    id: "Q66",
    dimension: "What Matters",
    subdimension: "Financial Ambition",
    type: "likert",
    text: "I care about finding careers that are financially rewarding.",
    reverse: false
  },
  {
    id: "Q67",
    dimension: "What Matters",
    subdimension: "Financial Ambition",
    type: "forced",
    text: "If you had to choose, which matters more? A: A path that feels meaningful to me. B: A path that pays more.",
    reverse: false
  },
  {
    id: "Q68",
    dimension: "What Matters",
    subdimension: "Financial Ambition",
    type: "likert",
    text: "Money isn’t a big factor in my choices.",
    reverse: true
  },
  {
    id: "Q69",
    dimension: "What Matters",
    subdimension: "Belonging & Connection",
    type: "likert",
    text: "It’s important for me to feel part of a team or group.",
    reverse: false
  },
  {
    id: "Q70",
    dimension: "What Matters",
    subdimension: "Belonging & Connection",
    type: "likert",
    text: "I feel best when I’m surrounded by people",
    reverse: false
  },
  {
    id: "Q71",
    dimension: "What Matters",
    subdimension: "Belonging & Connection",
    type: "forced",
    text: "A: I like working alone. B: I like working as part of a group.",
    reverse: false
  },
  {
    id: "Q72",
    dimension: "What Matters",
    subdimension: "Belonging & Connection",
    type: "likert",
    text: "I do just as well without feeling connected to others.",
    reverse: true
  },
  {
    id: "Q73",
    dimension: "How You Work Best",
    subdimension: "Pace & Intensity Preference",
    type: "likert",
    text: "I enjoy fast-paced days with lots to do",
    reverse: false
  },
  {
    id: "Q74",
    dimension: "How You Work Best",
    subdimension: "Pace & Intensity Preference",
    type: "likert",
    text: "Frequent deadlines push me to do my best.",
    reverse: false
  },
  {
    id: "Q75",
    dimension: "How You Work Best",
    subdimension: "Pace & Intensity Preference",
    type: "forced",
    text: "When working on tasks I prefer to: A: Take it easy and take my time. B: Go full speed and work intensely.",
    reverse: false
  },
  {
    id: "Q76",
    dimension: "How You Work Best",
    subdimension: "Pace & Intensity Preference",
    type: "likert",
    text: "When working on something I prefer a calm, slow pace with low pressure",
    reverse: true
  },
  {
    id: "Q77",
    dimension: "How You Work Best",
    subdimension: "Organisation & Systems Orientation",
    type: "likert",
    text: "I enjoy coming up with organised systems of working for my class or team",
    reverse: false
  },
  {
    id: "Q78",
    dimension: "How You Work Best",
    subdimension: "Organisation & Systems Orientation",
    type: "likert",
    text: "I like organizing things into systems or lists.",
    reverse: false
  },
  {
    id: "Q79",
    dimension: "How You Work Best",
    subdimension: "Organisation & Systems Orientation",
    type: "forced",
    text: "When working as part of a team I would rather A: Keep things flexible. B: Have a clear system with rules and steps.",
    reverse: false
  },
  {
    id: "Q80",
    dimension: "How You Work Best",
    subdimension: "Organisation & Systems Orientation",
    type: "likert",
    text: "I’d rather keep things flexible than set up a clear system.",
    reverse: true
  },
  {
    id: "Q81",
    dimension: "How You Work Best",
    subdimension: "Clarity & Structure Preference",
    type: "likert",
    text: "I prefer tasks with clear instructions and structure.",
    reverse: false
  },
  {
    id: "Q82",
    dimension: "How You Work Best",
    subdimension: "Clarity & Structure Preference",
    type: "likert",
    text: "I’m more effective when there’s a clear plan.",
    reverse: false
  },
  {
    id: "Q83",
    dimension: "How You Work Best",
    subdimension: "Clarity & Structure Preference",
    type: "forced",
    text: "For assignments, which do you prefer? A: Open projects. B: Those with clear rules and directions.",
    reverse: false
  },
  {
    id: "Q84",
    dimension: "How You Work Best",
    subdimension: "Clarity & Structure Preference",
    type: "likert",
    text: "Unclear goals don’t really bother me.",
    reverse: true
  },
  {
    id: "Q85",
    dimension: "How You Work Best",
    subdimension: "Team Collaboration",
    type: "likert",
    text: "I enjoy working with others on teams or groups.",
    reverse: false
  },
  {
    id: "Q86",
    dimension: "How You Work Best",
    subdimension: "Team Collaboration",
    type: "likert",
    text: "Sharing ideas in a group setting motivates me.",
    reverse: false
  },
  {
    id: "Q87",
    dimension: "How You Work Best",
    subdimension: "Team Collaboration",
    type: "forced",
    text: "How do you usually like to work? A: Do things on my own. B: Work with others as part of a group.",
    reverse: false
  },
  {
    id: "Q88",
    dimension: "How You Work Best",
    subdimension: "Team Collaboration",
    type: "likert",
    text: "I prefer working alone most of the time.",
    reverse: true
  },
  {
    id: "Q89",
    dimension: "How You Work Best",
    subdimension: "Independent Working Approach",
    type: "likert",
    text: "I like figuring things out on my own without much guidance.",
    reverse: false
  },
  {
    id: "Q90",
    dimension: "How You Work Best",
    subdimension: "Independent Working Approach",
    type: "likert",
    text: "I feel more confident when I have clear direction.",
    reverse: true
  },
  {
    id: "Q91",
    dimension: "How You Work Best",
    subdimension: "Independent Working Approach",
    type: "forced",
    text: "When you’re given a goal, what helps you most? A: Figuring out the steps on my own. B: Being told exactly what to do.",
    reverse: true 
  },
  {
    id: "Q92",
    dimension: "How You Work Best",
    subdimension: "Independent Working Approach",
    type: "likert",
    text: "When working on a project, I usually seek a lot of advice.",
    reverse: true
  },
  {
    id: "Q93",
    dimension: "How You Work Best",
    subdimension: "Attention to Detail",
    type: "likert",
    text: "I tend to check my work carefully for small mistakes.",
    reverse: false
  },
  {
    id: "Q94",
    dimension: "How You Work Best",
    subdimension: "Attention to Detail",
    type: "likert",
    text: "I prefer finishing one task before starting another.",
    reverse: false
  },
  {
    id: "Q95",
    dimension: "How You Work Best",
    subdimension: "Attention to Detail",
    type: "forced",
    text: "When you finish work, what do you focus on more? A: The big picture. B: Small details and accuracy",
    reverse: false
  },
  {
    id: "Q96",
    dimension: "How You Work Best",
    subdimension: "Attention to Detail",
    type: "likert",
    text: "When working on something I overlook small details often.",
    reverse: true
  }
];

export default questions;