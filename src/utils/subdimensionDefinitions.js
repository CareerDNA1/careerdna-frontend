// src/utils/subdimensionDefinitions.js
// CareerDNA v5 (bank v2): definitions for all 27 traits, keyed by the trait
// names used in questions_v2.js and archetypeWeights_v2.js.
// Each one says what the scale measures, what a higher score means and what a
// lower score means, in plain second person for students aged 13+. Neither end
// is better. The same text is shown in tooltips and given to the prose and
// Advisor models. Source: CareerDNA_v5.xlsx, Definitions sheet (29 Oct 2026).
// Mirror: careerdna-backend/src/lib/subdimensionDefinitions.js.
// Bank v1 trait names: look up through canonicalTraitName (utils/traitNames).

const SUBDIMENSION_DEFINITIONS = {

  // WHO YOU ARE
  "Originality":
    "How much you come up with new ideas and new ways of doing things. A higher score means ideas that others have not thought of come easily to you: you look for a different way when there is a usual one, and you enjoy linking ideas from unrelated areas. A lower score means you prefer methods that are known to work, and you are strong at improving and developing ideas that already exist.",

  "Reliability":
    "How consistently you follow through on what you have committed to. A higher score means you keep track of your promises without reminders, finish things when you said you would and see tasks through even when they turn dull. A lower score means you work more flexibly: things sometimes run later than planned, and you find it harder to push on with a task once it stops being interesting.",

  "Resilience":
    "How quickly you recover when things go wrong, and how steady you stay under pressure. A higher score means setbacks do not stay with you for long and you keep calm when things go badly. A lower score means you feel setbacks more deeply and take longer to get back to your usual self, often because you care a lot about how things turn out.",

  "Adaptability":
    "How comfortable you are when things change around you. A higher score means you take last-minute changes, new expectations and new places in your stride and adjust quickly. A lower score means you like to settle into a way of doing things, so you take a little longer to adjust when plans, places or ways of working change.",

  "Social Confidence":
    "How at ease you feel speaking up and dealing with people you do not know. A higher score means you are comfortable starting conversations, speaking in a group and presenting in front of others. A lower score means you prefer to listen, let others lead the discussion and work behind the scenes, and you tend to warm up once you know people.",

  "Empathy":
    "How readily you notice and understand what other people are feeling. A higher score means you pick up on feelings before people say anything, even when you are busy, and you can see why someone feels the way they do. A lower score means you stay focused on the task in hand and tend to find out how people feel when they tell you.",


  // WHAT YOU LOVE
  "Analytical Curiosity":
    "How much you want to understand why things are the way they are. A higher score means you enjoy researching a topic, asking questions and thinking a problem through until it makes sense. A lower score means you are practical: you are happy to use what works without needing to know why, and you prefer questions with a clear, quick answer.",

  "Creative Expression":
    "How much you want to make things that express your own ideas, such as writing, music, art, design or performance. A higher score means being creative is part of who you are, you make things in your own time, you want a creative side to your work and you care how your work looks or sounds. A lower score means you are happy in work with no creative side and judge your work mainly by whether it does the job.",

  "Helping & Caring":
    "How much you enjoy supporting other people directly. A higher score means you like teaching people, being someone others turn to in a hard time and looking after people who are ill or in need. A lower score means you would rather put your energy into tasks, ideas or things than into caring for people, and you prefer work that is not centred on looking after others.",

  "Leading & Starting Things":
    "How much you want to take charge, get things started and win people over. A higher score means you enjoy leading, persuading others to back your ideas and starting something of your own. A lower score means you prefer a supporting part in a team, and you are happy to be given a clear job to do rather than run the show.",

  "Hands-On & Technical":
    "How much you enjoy making, fixing and working out how things work, physical or digital. A higher score means you like working with tools, machines and materials, building things with technology and understanding how engines, circuits or apps work. A lower score means you are less drawn to practical and technical tasks, and you would rather someone else handled the making and fixing.",

  "Society & World Curiosity":
    "How interested you are in how societies work and why the world is the way it is. A higher score means you follow history and world events, enjoy talking about politics and wonder how life differs from country to country. A lower score means your interest lies more in what is happening around you and in practical, everyday questions than in big questions about society.",

  "Numbers & Data Curiosity":
    "How much you enjoy working with numbers and information. A higher score means you like working things out with figures and spreadsheets, spotting what a chart or a set of numbers shows and keeping records in order. A lower score means you would rather work with words, people or ideas than with numbers, and you are happy to leave record-keeping to others.",


  // WHAT MATTERS
  "Purpose & Impact":
    "How much you need your work to make a difference to the world. A higher score means you want to work for a cause you believe in and be part of changing things for the better. A lower score means you judge work by what it is like to do and how well you do it, and you could be happy in a job you enjoy even if it changes little in the world.",

  "Autonomy":
    "How much freedom you want over how and what you work on. A higher score means you want to decide how you do your work, choose what you work on and be trusted without close supervision. A lower score means you are comfortable with someone else setting the goals and the method, and you are happy to do things the way you are asked.",

  "Belonging":
    "How important it is to you to feel part of a group where you work or study. A higher score means belonging to a group is a big part of who you are, and being accepted as one of the group and feeling close to the people around you matter a lot to you. A lower score means you can get on well with people and enjoy your work without needing to feel part of a close group.",

  "Recognition & Reward":
    "How much being seen to succeed, and being well paid for it, motivates you. A higher score means you want to be well known for what you do, earn good money and have your work noticed. A lower score means knowing you have done a good job is enough for you, and you would choose an interesting job over a better-paid one.",

  "Security":
    "How much you want stability and certainty in your work. A higher score means you want a job that will last, steady pay you can count on and a clear path ahead. A lower score means you are comfortable with short-term work, pay that goes up and down and some uncertainty, and you are open to taking a chance for the right opportunity.",

  "Mastery":
    "How much you want to become an expert and keep improving for its own sake. A higher score means you want to get really good at something, enjoy being stretched by what you cannot do yet and keep improving once you are good enough. A lower score means you would rather be good at many things than an expert in one, and you like to move on to something new once you can do it well.",

  "Work-Life Balance":
    "How much you want work to leave room for the rest of your life. A higher score means you want to switch off at the end of the day, and you would turn down a job that took over your evenings and weekends. A lower score means you are willing to put work first and give it extra hours when it matters to you.",


  // HOW YOU WORK BEST
  "Structure":
    "How much you like a clear plan and clear expectations before you start. A higher score means you work best with a set plan or process and want to know exactly what is expected of you. A lower score means you are happy to start without a full brief and to work things out as you go.",

  "Collaboration":
    "How much you like working closely with other people. A higher score means you enjoy sharing the work and the decisions with others and being part of a team where everyone relies on each other. A lower score means you prefer to own your part of the work, and you often get more done on your own than in a group.",

  "Independence":
    "How well you work on your own, in your own way. A higher score means that, given some quiet, you can concentrate alone for hours and do your best thinking by yourself. A lower score means you get restless working alone for long stretches and would rather work with other people around you.",

  "Precision":
    "How much you focus on accuracy and detail. A higher score means you notice small mistakes others miss, double-check your work and aim to get it exactly right. A lower score means you focus on the big picture, are happy with work that is good enough and leave the fine detail to others.",

  "Pace":
    "How much you like work that moves fast. A higher score means a busy, fast-moving day gives you energy and you are comfortable making quick decisions on the spot. A lower score means you prefer a steady workload and like to take your time to do things properly.",

  "Variety":
    "How much change you want in your work. A higher score means you want varied tasks, different places to work and plenty of switching between them. A lower score means you like a familiar routine and prefer to stick with one kind of task rather than switch between very different ones.",

  "Active & Outdoors":
    "How much you want work that keeps you active and away from a desk. A higher score means you would enjoy being on your feet, on the move and outside. A lower score means you are happy working indoors, at a desk or screen, for most of the day.",

};

export default SUBDIMENSION_DEFINITIONS;
