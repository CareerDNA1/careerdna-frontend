// src/utils/subdimensionTooltipDefinitions.js
// CareerDNA v2 — short neutral definitions for Discover More chip tooltips.
// Keys match the subdimension label strings used in questions.js and archetypeWeights.js.
// These avoid linking traits back to archetypes so the tooltip stays focused on the trait itself.

const SUBDIMENSION_TOOLTIP_DEFINITIONS = {

  // WHO YOU ARE
  "Originality":           "Reflects a tendency to generate novel ideas, take unconventional approaches, and make original connections.",
  "Reliability":           "Reflects consistent follow-through, self-discipline, and the ability to complete work on time and to a high standard.",
  "Resilience":            "Reflects the capacity to recover from setbacks and keep making progress under sustained difficulty or frustration.",
  "Adaptability":          "Reflects comfort with change, ambiguity, and shifting expectations in unpredictable situations.",
  "Social Confidence":     "Reflects comfort and energy in social settings, and ease of communication and interaction with others.",
  "Empathy":               "Reflects sensitivity to how others feel and a natural consideration for the emotional impact of decisions.",

  // WHAT YOU LOVE
  "Analytical Curiosity":       "Reflects a drive to investigate, question, and understand complex ideas through deep analysis and reasoning.",
  "Creative Expression":        "Reflects motivation to make or design original work, and care about the quality and style of what is created.",
  "Helping & Caring":           "Reflects intrinsic motivation to support, teach, or improve outcomes for other people.",
  "Entrepreneurial Drive":      "Reflects energy from identifying opportunities, taking initiative, and leading the building of something new.",
  "Technical Curiosity":        "Reflects interest in how tools, systems, and materials work, and satisfaction from practical hands-on engagement.",
  "Cultural & Global Curiosity": "Reflects interest in diverse cultures, global affairs, philosophy, history, and big questions about the world.",
  "Data Curiosity":             "Reflects intrinsic interest in working with numbers, data, and information, and satisfaction from organising and making sense of it.",

  // WHAT MATTERS
  "Purpose & Impact": "Reflects motivation to contribute to something larger than personal success and a need for meaning through helping others.",
  "Autonomy":         "Reflects the need for freedom and self-determination in how work is approached, with discomfort under close direction.",
  "Belonging":        "Reflects the need for meaningful connection, inclusion, and team identity as an important source of motivation.",
  "Achievement":      "Reflects the drive for success, recognition, and high performance, including financial reward as a marker of achievement.",
  "Security":         "Reflects preference for career stability, predictable income, and low occupational risk.",
  "Mastery":          "Reflects the drive to develop deep expertise and intrinsic satisfaction from the sustained pursuit of excellence in a skill.",

  // HOW YOU WORK BEST
  "Structure":     "Reflects preference for clear processes, organised environments, and well-defined procedures and expectations.",
  "Collaboration": "Reflects preference for working with others and motivation from shared goals and team dynamics.",
  "Independence":  "Reflects preference for working alone and comfort with self-directed tasks requiring minimal supervision.",
  "Precision":     "Reflects attention to accuracy, detail, and quality, and thoroughness in completing tasks to a high standard.",
  "Pace":          "Reflects comfort with and energy from fast-paced, high-intensity, dynamic, and pressured work environments.",
  "Variety":       "Reflects preference for diverse tasks and changing environments, with discomfort from repetitive or monotonous work.",

};

export default SUBDIMENSION_TOOLTIP_DEFINITIONS;
