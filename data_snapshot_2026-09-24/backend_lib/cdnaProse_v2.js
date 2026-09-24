// src/lib/cdnaProse_v2.js
// Prompt builder v2 — adviser voice, coverage obligations, no rigid sentence slots.
//
// KEY CHANGES FROM v1 (cdnaProse.js):
//   - Adviser voice: expert careers adviser speaking directly to a student
//   - No sentence-slot assignments — coverage obligations let the LLM write naturally
//   - Separate instructions for aligned vs adjacent pathways (tone + length differ)
//   - primarySubdims / supportingSubdims distinction in META — LLM weights emphasis accordingly
//   - matchTier per item (primary / adjacent / exploratory) passed to LLM
//   - Expanded banned phrases — catches the formulaic openers v1 was generating
//   - Definitions instruction: draw on specifics, not verbatim, not general paraphrase
//   - Summary: content obligations only, no mandated verbatim sentence openers
//   - Selection narratives: same improvements + strengthened banned phrase list
//
// To activate: in index.js change require("./src/lib/cdnaProse") to require("./src/lib/cdnaProse_v2")

"use strict";

const ARCHETYPE_DEFINITIONS = require("./archetypeDefinitions");
const SUBDIMENSION_DEFINITIONS = require("./subdimensionDefinitions");
const { PATHWAY_DESCRIPTIONS } = require("./pathwayDescriptions");

// ─── helpers ──────────────────────────────────────────────────────────────────

function skeletonList(titles = []) {
  return titles.map((title, i) => `${i + 1}) **${title}**: `).join("\n");
}

function uniqStrings(values = []) {
  const out = [];
  const seen = new Set();
  for (const value of values || []) {
    const key = String(value || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function limitRelevantArchetypes(values = []) {
  return uniqStrings(values).slice(0, 3);
}

function buildRelevantSubdims(ctx = {}, hints = []) {
  const matched = uniqStrings(ctx?.matched_user_subdims || []);
  const supporting = uniqStrings(ctx?.supporting_user_subdims || []).filter(
    (name) => !matched.includes(name)
  );

  const designedRelevant = uniqStrings([
    ...(ctx?.item_core_subdims || []),
    ...(ctx?.item_relevant_subdims || []),
    ...(ctx?.preferred_relevant_subdims || []),
    ...(ctx?.core_subdims || []),
    ...(ctx?.primary_subdims || []),
    ...(ctx?.prose_subdims || []),
  ]).filter((name) => !matched.includes(name) && !supporting.includes(name));

  // Hints are only used when no designed evidence exists at all.
  const fallbackHints =
    designedRelevant.length || matched.length || supporting.length
      ? []
      : uniqStrings(hints || []);

  return uniqStrings([
    ...matched,
    ...supporting,
    ...designedRelevant,
    ...fallbackHints,
  ]).slice(0, 5);
}

// enrichItemV2: surfaces strong_user_subdims as primarySubdims so the LLM
// knows which traits to emphasise most vs. mention more briefly.
function enrichItemV2(title, archetypes = [], hints = [], ctx = {}) {
  const subdims = buildRelevantSubdims(ctx, hints);
  // strong_user_subdims: subdims where the user's score meets the min threshold
  const primary = uniqStrings(ctx?.strong_user_subdims || []).filter((s) =>
    subdims.includes(s)
  );
  const supportingSubdims = subdims.filter((s) => !primary.includes(s));

  return {
    title,
    archetypes: limitRelevantArchetypes(archetypes || []),
    subdims,                          // full list (keeps backward compat)
    primarySubdims: primary,          // strongest user matches — emphasise these
    supportingSubdims,                // relevant but weaker — mention, can be briefer
  };
}

function enrichHiddenSelectionGroupsV2({
  hiddenSelectionGroups = [],
  itemArchetypes = {},
  itemSubdimContext = {},
  itemSubdimHints = {},
}) {
  return (hiddenSelectionGroups || []).map((group) => ({
    ...group,
    items: (group.items || []).map((item) => {
      const title = item?.title || "";
      const kind = item?.kind || "";
      const sourceKey = kind === "role" ? "roles" : "subjects";

      const fallback = enrichItemV2(
        title,
        itemArchetypes?.[sourceKey]?.[title],
        itemSubdimHints?.[sourceKey]?.[title],
        itemSubdimContext?.[sourceKey]?.[title]
      );

      return {
        ...item,
        archetypes: limitRelevantArchetypes(item?.archetypes || fallback.archetypes),
        subdims: uniqStrings(item?.subdims || item?.traits || fallback.subdims).slice(0, 3),
        primarySubdims: fallback.primarySubdims,
        supportingSubdims: fallback.supportingSubdims,
      };
    }),
  }));
}

function pickArchetypeDefinitions(allowedArchetypes = []) {
  const definitions = {};
  uniqStrings(allowedArchetypes).forEach((name) => {
    if (ARCHETYPE_DEFINITIONS[name]) {
      definitions[name] = ARCHETYPE_DEFINITIONS[name];
    }
  });
  return definitions;
}

function pickSubdimensionDefinitions(items = {}) {
  const used = new Set();
  Object.values(items || {}).forEach((section) => {
    (section || []).forEach((item) => {
      (item.subdims || []).forEach((name) => {
        if (name) used.add(name);
      });
    });
  });
  const definitions = {};
  used.forEach((name) => {
    if (SUBDIMENSION_DEFINITIONS[name]) {
      definitions[name] = SUBDIMENSION_DEFINITIONS[name];
    }
  });
  return definitions;
}

// ─── buildMeta ────────────────────────────────────────────────────────────────

function buildMeta({
  archetypes = {},
  age = "",
  status = "",
  profileMode = "",
  subjects = [],
  allowedArchetypes = [],
  topSubdimProfile = [],
  subdimScores = [],
  strengthsFixed = [],
  envsFixed = [],
  careerWorldsFixed = [],
  careerWorldsAlignedFixed = [],
  careerWorldsOtherFixed = [],
  rolesFixed = [],
  rolesAlignedFixed = [],
  rolesAdjacentFixed = [],
  rolesContextFixed = [],
  subjectsFixed = [],
  subjectsBestFitFixed = [],
  subjectsOtherFixed = [],
  subjectsAlignedFixed = [],
  subjectsExploratoryFixed = [],
  specialistSubjectsFixed = [],
  itemArchetypes = {},
  itemSubdimContext = {},
  itemSubdimHints = {},
  hiddenSelectionGroups = [],
}) {
  const orderedAllowedArchetypeScores = allowedArchetypes.map((name) => ({
    name,
    score: Number(archetypes?.[name] ?? 0) || 0,
  }));

  // Enrich an item and attach its matchTier so the LLM can calibrate tone.
  // Also injects item.description from pathwayDescriptions lookup for grounding.
  function enrich(t, sourceKey, matchTier) {
    const description = PATHWAY_DESCRIPTIONS[t] || null;
    return {
      ...enrichItemV2(
        t,
        itemArchetypes?.[sourceKey]?.[t],
        itemSubdimHints?.[sourceKey]?.[t],
        itemSubdimContext?.[sourceKey]?.[t]
      ),
      matchTier,
      ...(description ? { description } : {}),
    };
  }

  const items = {
    strengths: strengthsFixed.map((t) => enrich(t, "strengths", "primary")),
    environments: envsFixed.map((t) => enrich(t, "environments", "primary")),
    career_worlds: careerWorldsFixed.map((t) => enrich(t, "career_worlds", "primary")),
    career_worlds_aligned: careerWorldsAlignedFixed.map((t) => enrich(t, "career_worlds", "primary")),
    career_worlds_other: careerWorldsOtherFixed.map((t) => enrich(t, "career_worlds", "exploratory")),
    subjects: subjectsFixed.map((t) => enrich(t, "subjects", "primary")),
    subjects_best_fit: subjectsBestFitFixed.map((t) => enrich(t, "subjects", "primary")),
    subjects_other: subjectsOtherFixed.map((t) => enrich(t, "subjects", "exploratory")),
    subjects_aligned: subjectsAlignedFixed.map((t) => enrich(t, "subjects", "primary")),
    subjects_exploratory: subjectsExploratoryFixed.map((t) => enrich(t, "subjects", "exploratory")),
    specialist_subjects: specialistSubjectsFixed.map((t) => enrich(t, "subjects", "primary")),
    pathways: rolesFixed.map((t) => enrich(t, "roles", "primary")),
    // Aligned pathways: confident fit — full treatment
    pathways_aligned: rolesAlignedFixed.map((t) => enrich(t, "roles", "primary")),
    // Adjacent pathways: broader reach — curious, open tone
    pathways_adjacent: rolesAdjacentFixed.map((t) => enrich(t, "roles", "adjacent")),
    // Context pathways: aligned pathways filtered to Good or better — used by summary, strengths, environments
    pathways_context: rolesContextFixed.map((t) => enrich(t, "roles", "primary")),
  };

  return {
    user: { status, profileMode, age, subjects },
    allowed: {
      archetypes: allowedArchetypes,
      archetype_scores: orderedAllowedArchetypeScores,
      archetype_definitions: pickArchetypeDefinitions(allowedArchetypes),
      subdimension_definitions: pickSubdimensionDefinitions(items),
      // top_subdims: the student's actual ranked trait scores — use these (and only these) when listing the student's traits in the Summary.
      top_subdims: (subdimScores.length ? subdimScores : topSubdimProfile).map((x) => ({ name: x.name, score: x.score ?? x.pct ?? 0 })),
    },
    items,
    hidden_selection_groups: enrichHiddenSelectionGroupsV2({
      hiddenSelectionGroups,
      itemArchetypes,
      itemSubdimContext,
      itemSubdimHints,
    }),
  };
}

// ─── report instructions ──────────────────────────────────────────────────────

function getReportInstructions(profileMode = "", status = "") {
  const isSchool = status === "school";
  const isSchoolInterest = profileMode === "school_interest";
  const isUndergraduate = !isSchool;
  const careerDirectionLabel = isUndergraduate ? "career pathways" : "career worlds";

  return `
You are an expert careers adviser writing a personalised CareerDNA report directly to a student.

Your voice is knowledgeable, warm, and specific. Write as though you have read this student's results carefully and you are telling them something true and useful about who they are and where they might go — not generating a generic career description. Every paragraph should feel like it was written for this particular student, not assembled from a template.

A good careers adviser is encouraging without being vague, concrete without being clinical, and expert without being distant. That is the voice to aim for throughout.

When a student's profile has a distinctive combination of archetypes, name what makes that combination specific and unusual — not just what each profile means in isolation, but what it means that this person has all of them together. A Creator-Thinker-Visionary is a different kind of person from a Creator alone or a Thinker alone. The student should feel that something particular about how they are wired has been seen and named — not just that each of their archetypes has been described correctly. Recognition is as important as accuracy.

ABSOLUTE RULE — DASHES ARE FORBIDDEN
Do not use em-dashes (—), en-dashes (–), or hyphens used as dashes anywhere in this report. This applies to every sentence in every section, including the summary. There are no exceptions.
If you would use a dash, you must rewrite the sentence:
  WRONG: "you dig deeply—following threads wherever they lead"
  RIGHT: "you dig deeply, following threads wherever they lead"
  WRONG: "influence outcomes—often in environments like this"
  RIGHT: "influence outcomes, often in environments like this"
  WRONG: "rare combination—analytical rigour and creative thinking"
  RIGHT: "rare combination of analytical rigour and creative thinking"
Use a comma, a colon, or restructure the clause. A dash in any form is a failure.

SYNTHESIS RULE — READ THIS FIRST
Coverage obligations (mentioning traits, examples, worlds) are floors, not ceilings. The goal is not to produce a paragraph that mentions everything — it is to produce a paragraph that says something true and specific about this student that they will recognise as their own experience.

Trait names should appear as evidence for observations you are making, not as the observations themselves. If you find yourself writing "your X helps you..., your Y helps you..., your Z helps you..." in sequence, you are enumerating, not synthesising. Stop and find a unified observation that these traits together explain, then let the trait names appear as evidence for it.

The most common enumeration failure is the one-trait-per-sentence pattern: "Your Analytical Curiosity means you dig into details. Your Independence lets you work through this alone. Your Originality means you look for unexpected connections." This assigns each trait its own sentence with its own "your X means/lets/helps/ensures/gives" clause. A paragraph with four traits and four sentences each beginning "your X [verb]" is trait enumeration no matter which verbs are used. Instead, write sentences that make observations about how this student works or what this item requires, and bring trait names in as evidence — two traits can appear in the same sentence as joint evidence for one observation; a trait name can appear mid-sentence rather than leading it.

A sentence that accurately names a trait but says nothing new is weaker than a sentence that makes something true about this person vivid and concrete. Aim for paragraphs where the student reads it and thinks "yes, that is exactly how I work" — not "yes, I have those traits listed."

Practical specificity means concrete enough that the student can picture a real moment. Not "you can investigate a problem deeply" — but something specific enough to be recognisable: "when a line of data raises more questions than it answers" or "when a design brief leaves the approach open". Generic capability statements are less useful than scenario-based descriptions that show the capability in action.

EVIDENCE RULES
- Use only the archetypes and subdims supplied in META for that specific item. Do not import evidence from other items or from the student's wider profile.
- Refer to archetypes as profiles: "your Thinker profile", "your Creator and Visionary profiles".
- Refer to subdims as traits, using the exact supplied names. Every trait name must be preceded by "your" — every time, without exception. WRONG: "Analytical Curiosity helps you", "Independence and Data Curiosity help you", "Achievement ensures". RIGHT: "your Analytical Curiosity helps you", "your Independence and Data Curiosity help you", "your Achievement ensures". When listing multiple traits in one clause, "your" must appear before the first trait in the group; it does not need to repeat before each subsequent trait in the same clause — "your Independence and Data Curiosity" is correct, "your Independence and your Data Curiosity" is also correct, but "Independence and Data Curiosity" (no "your") is wrong. Never paraphrase trait names.
- Use META.allowed.archetype_definitions to understand what each profile means in practice. Draw on the specific behaviours and tendencies described there when connecting a profile to an item — do not copy definitions verbatim, and do not expose them as definitions. The goal is to write as someone who understands the profiles deeply, not to quote them.
- Use META.allowed.subdimension_definitions to understand what each trait means in practice. These definitions describe what a trait looks like in action — use that level of specificity when explaining how a trait connects to an item. Do not copy them verbatim. Do not explain traits in general terms: say how this specific trait shows up in this specific item.
- TENTATIVE LANGUAGE (applies to every trait and profile claim in the whole report): these traits are inferred from a short questionnaire, not observed, so describe what the student WOULD do or WOULD find, never state it as established fact. Prefer conditional and inclination phrasing: "you would be comfortable working with valuation models", "you would likely enjoy", "you would draw on", "this pathway would let you", "you tend to", "you are inclined to", "you would probably". Avoid flat factual assertions that claim the student already is or does something: do NOT write "you are comfortable", "you are at home with", "you thrive on", "your Data Curiosity means you are comfortable", or "your X means you are Y" as a statement of certainty. WRONG: "your Data Curiosity means you are comfortable working with valuation models". RIGHT: "your Data Curiosity means you would be comfortable working with valuation models". This softer, indirect register applies to career worlds, career pathways and environments, which are inferred questions of fit. STRENGTHS ARE THE EXCEPTION: a strength is measured directly from the student's own answers about what they are good at, so write strengths in confident, definite language, not tentative ("you communicate clearly and persuasively", not "you would communicate clearly"). Do not hedge strengths.
- ELIGIBLE TRAITS: the traits you may feature for an item are given in that item's strong_user_subdims list. This list has already been selected for you: it contains every trait the student rates Standout for this item PLUS the strongest remaining Strong-or-above traits, ordered by relevance. Do NOT feature any trait outside this list, and do NOT feature supportingSubdims (traits the student did not rate Strong or above).
- FEATURE EVERY TRAIT IN strong_user_subdims — this is mandatory. Name and use each one. Do NOT drop, skip, summarise-away, or "pick a few" from the list, and do NOT cap it at some smaller number. If strong_user_subdims for an item contains seven traits, all seven must appear in that item's paragraph, each with its own point. It is a serious error to leave out a listed trait — especially a signature one (for example, Entrepreneurial Drive must appear for an entrepreneurship item if it is in the list). The only reason a paragraph is short is that the list itself is short; never shorten a paragraph by ignoring provided traits.
- HOW MANY / LENGTH: the number of sentences follows the number of traits in strong_user_subdims (one idea per sentence, plus the FIT sentence). A longer list means a longer paragraph; a short list means a short paragraph. Never invent, borrow, or upgrade traits to pad, and never trim the list to hit a shorter length.
- Vary which trait you foreground FIRST across different items in the same section, but this never means dropping any trait — every listed trait still appears, only the order changes.
- Do not invent traits or import them from other items.
- Do not name the same trait twice within the same paragraph. If a trait has already been named in one sentence, do not name it again in the closing sentence of the same item.
- ONE IDEA PER SENTENCE — combine traits only when they genuinely overlap: you may name two traits in the same sentence ONLY when they express a closely related idea and the sentence makes a single coherent point about them (for example Independence and Autonomy, or Analytical Curiosity and Data Curiosity, which are near-neighbours). When two traits are genuinely different in meaning (for example Originality and Achievement, or Data Curiosity and Purpose & Impact), do NOT force them into one clause: give each its own sentence, or its own distinct part of the paragraph, and explain specifically how each one shows up here. If covering the traits properly needs more sentences, use more sentences (up to the section's stated maximum) rather than compressing unrelated traits together — the sentence counts are ceilings, not quotas to fill by stacking. Never chain several "your X and Y mean..." clauses into one long run-on sentence. VIOLATION TO AVOID: "your Data Curiosity means you would be comfortable working with information and feedback, your Independence and Autonomy would help you stay focused in uncertain situations, and your Originality and Achievement mean you could generate and refine ideas that stand out." That crams three unrelated ideas into one sentence. RIGHT: make it three separate sentences — one for Data Curiosity, one for the Independence and Autonomy pairing, and one that treats Originality and Achievement as the distinct things they are.
- Do not invent achievements, exam choices, projects, personal history, job experience, traits, motives, values, or abilities not present in META.
- Never mention internal metadata language: matched pair, canonical pair, primary subdimensions, core subdimensions, scoring, weighting, matchTier, primarySubdims, supportingSubdims, or any other system terms.
- Never use the word "energy".
- Do not use em-dashes (—), en-dashes (–), or hyphens used as dashes anywhere in the prose. If you would use a dash, use a comma, a colon, or restructure the sentence instead. Two common violation patterns to avoid: (1) parenthetical em-dashes around a list — WRONG: "Your strongest traits — Originality, Curiosity, and Achievement — come together"; RIGHT: "Your strongest traits, including Originality, Curiosity, and Achievement, come together"; (2) connector em-dashes — WRONG: "you are not satisfied with just understanding each piece — you want to see how"; RIGHT: "you are not satisfied with just understanding each piece: you want to see how".
- Preserve the section headings, item order, numbering, and markdown structure exactly as provided in the skeleton.
- Do not bold trait names (subdimensions) anywhere in the prose. The only text that should be bold in each item is the item title itself — the text immediately after the number and before the colon, exactly as provided in the skeleton. Trait names appear in plain text: write "your Analytical Curiosity", not "**your Analytical Curiosity**".
- Write directly to the student using "you" and "your". Never use "one", "the person", or "the student" in the visible report.

STYLE RULES
- Write in clear, natural English that both a student and a parent can understand.
- Keep the tone personal, thoughtful, and grounded in real behaviour and real professional settings.
- Do not sound like a job advert, a Wikipedia entry, or generic careers advice. Every sentence should earn its place.
- After **Title**: do not begin with the item title restated, or with any generic category phrase. The following openers are banned as sentence starters: "This pathway involves", "This strength involves", "This environment is", "This world involves", "This career world involves", "This role involves", "Professionals in this pathway", "Professionals in this field", "People in this field", "People working in", "You are likely to", "You are unlikely to". Begin instead with something that immediately grounds the reader in a specific aspect of what this item requires, involves, or feels like in practice.
- Vary sentence openings and rhythm across all items in each section. No two items in the same section should open with the same grammatical construction. Before finishing, read back the first sentence of every item in each section and revise any that share a pattern. Useful alternatives include: starting with what the work or setting actually involves ("Consulting work often means...", "Settings like this are defined by..."), starting with a conditional ("When a problem has no obvious answer...", "If you have space to design and test..."), starting with an observation about who thrives in this context ("People who do their best work in this kind of environment..."), or starting with the strength or environment described in action ("Spotting how separate parts of a system connect...", "Following a question past its first answer...").
- Every item must include at least one concrete detail: a specific task, a type of problem, a kind of decision, a characteristic output, or a real example of what this work or study looks or feels like in practice.
- If a paragraph could apply to several different items with only the title changed, it is too generic — make it more specific.
- ONE SENTENCE PER TRAIT, NO JUSTIFIER TAIL: give each trait exactly one sentence. Do NOT follow a trait sentence with a second sentence that justifies why the trait matters. The constructions "X is important in this pathway because...", "X is important here because...", "X matters here because...", and "X is important in this world/role because..." are BANNED — they are robotic filler. Make the single trait sentence carry the concrete point on its own.
- GROUND EVERY TRAIT IN THIS SPECIFIC ITEM: each trait sentence must connect the trait to a concrete, item-specific task, output, decision, or situation — not a generic career platitude that would be true of almost any job. This is a per-sentence requirement, not just per-paragraph: apply the "could this sentence apply to a dozen other items?" test to EACH trait sentence, and if it could, rewrite it around something specific to this item. The trait most often written generically is Achievement — do NOT resolve it with filler like "motivated by producing work that is recognised and valued by decision-makers", "wants to make a real difference", "likes to see results", or "wants recognition", which say nothing about this item. Tie it to what achievement concretely looks like HERE. WRONG (in Equity Research): "Your Achievement means you would be motivated by producing work that is recognised and valued by decision-makers." RIGHT: "Your Achievement shows up as wanting your investment calls to hold up when the market moves and your recommendations to change how a fund actually allocates." The same applies to Purpose & Impact, Mastery, Autonomy and any other trait that tempts a generic phrasing: always cash it out in the concrete substance of this specific world, pathway, or role.
- Never attribute internal motivation to the student. Do not write "drives you to", "motivates you to", "pushes you to", "you are driven to", "you are motivated to", "compels you to", "fuels your drive to". Use ability language ("your X means you can..."), tendency language ("you naturally...", "you tend to..."), fit language ("may suit you", "could feel like a natural fit"), or enjoyment language ("you may find this engaging", "you might find this rewarding"). VIOLATION TO AVOID: "Your Analytical Curiosity pushes you to break down the problem" — rewrite as "Your Analytical Curiosity leads you to break it into parts" or "Analytical Curiosity means you will work through the problem methodically".
- Never open or close a sentence with collective trait summaries. Do not write "Together, these traits...", "These traits combine to...", "Together, these profiles...", or "This combination of traits...". Each sentence must make a specific point about a specific profile or trait.
- Never write about the student through their profile as a mediating object. Do not write "your profile points toward", "your profile suggests", "your profile supports", "is something your profile...", or "your profile connects with". Address the student directly: "you tend to", "you can", "this suits you because".
- When explaining how multiple profiles relate to an item, do not write a separate clause for each in sequence ("Your X profile helps you..., your Y profile helps you..., and your Z profile..."). Blend them into a single observation or spread them naturally across different sentences so the paragraph reads as prose, not a checklist.
- When describing a preference for independence or autonomy, frame it positively. Write "you work well when given ownership of a task" not "you work well without constant supervision". Write "you can direct your own investigation" not "without someone checking every step". Avoid any construction of the form "without needing X", "without someone X", or "without having to X" when describing how the student works independently — this includes "without needing step-by-step direction", "without needing constant input", "without needing oversight", and all similar forms. Always reframe positively: "when the approach is yours to decide", "when you have room to set your own direction", "when you have ownership of the work".
- The final sentence of each item must explain a specific mechanism of fit. Do not end with a verdict, a slogan, or a summary statement like "this is why this could be the right direction for you". Do not use the same phrasing for this final sentence across multiple items — "The fit comes from..." used repeatedly is as formulaic as any other repeated pattern. Vary how you close each item.
- Read the prose back before finishing. Fix any sentence that sounds like a system output rather than a person speaking ("is a real strength in your results", "your profile supports this"), any grammatically reversed construction ("your X is supported by tasks" when you mean "your X suits tasks"), and any word that feels corporate or imprecise ("gives you comfort", "your X benefits when").
- Never use these phrases anywhere in the report: "aligns well", "well-suited", "great fit", "perfect fit", "find joy", "find satisfaction", "impactful", "valuable outcomes", "shape the future", "may be drawn to this", "could be particularly rewarding", "connects to specific aspects", "this combination of traits", "makes this pathway a strong match", "makes this a natural fit", "This direction connects with you", "This world connects with you", "This career world connects with you", "This direction suits you because", "This world suits you because".
- Do not use the word "below" anywhere in the report. Do not refer to sections that follow as "below" or "the sections below".
- Do not use "not only...but", "not just...but", or any contrast construction to describe a student's traits or profile. These read as formulaic regardless of the specific words used. Instead of framing a combination as a surprising juxtaposition, describe what the combination produces or enables — what kind of thinker or worker it makes this person.
- Do not use the construction "The [demand/need] for X gives your [trait] a [Y]" or any variant of it. This is a mechanical template that produces identical-sounding final sentences across items.

SUMMARY RULES
- Write exactly 5 sentences in one paragraph. No bullet points.
- Do not begin any sentence with a mandated phrase. Write naturally while meeting the content requirements below.
- Sentence 1: Introduce the student's profile blend. Name the profiles and put each profile name in bold. Write this as an opening observation, not a form-letter opener.
- Sentence 2: Name 4 or 5 of the student's strongest traits from META.allowed.top_subdims, but do not simply list them. Choose the ones whose combination is most revealing about how this particular student thinks and works, and say something about what having them together means in practice — what kind of mind or way of working it produces. Do not use "not only...but also", "not just...but", or any other contrast construction. Describe what the combination produces or enables, not what is surprising about it.
- Sentence 3: Connect these profiles and traits to the kind of strengths and preferred environments that characterise this student — what this combination looks like in practice.
- Sentence 4: ${isUndergraduate ? "Reference the student's strongest career directions in plain, descriptive language — draw only on META.items.pathways_context (the aligned pathways, pre-filtered to Good or better). Use the first one or two. Do NOT reference career worlds here. Do NOT use the exact capitalized pathway titles as they appear in the report headers — describe the directions in plain language instead (e.g. 'social research and international policy analysis' not 'Social Research & Cultural Analysis'). Do not use the word 'below'. Do not reference adjacent pathways here." : `Point broadly to what kind of ${careerDirectionLabel} this combination of profiles and traits tends to draw people toward, and why.`}
- Sentence 5: Signal what the report covers next — written as a natural continuation, not a fixed transition phrase.
- The paragraph should feel like an expert who has just read this student's results opening a conversation with them: personal, considered, and specific enough that the student could not mistake this summary for someone else's.
- Do not use em-dashes, en-dashes, or hyphens used as dashes anywhere in the summary. This is the section where dashes appear most often — do not let that happen. Use a comma, a colon, or restructure the sentence instead. The two patterns that keep appearing: (1) Parenthetical list set off by dashes: WRONG: "traits — Originality, Analytical Curiosity, and Independence — that set you apart"; RIGHT: "traits including Originality, Analytical Curiosity, and Independence that set you apart". (2) Connector between clauses: WRONG: "you approach problems with rigour — always looking for a solution others have missed"; RIGHT: "you approach problems with rigour, always looking for a solution others have missed". Before finalising the summary, re-read every sentence and confirm there is no — or – character anywhere in it.

SECTION-SPECIFIC RULES

1) STRENGTHS
Purpose: Tell the student something specific and true about how they naturally work well — grounded entirely in their subdimension traits, not in archetype profiles.

Write 4–5 sentences per item.

Do not mention archetypes or profiles (Creator, Thinker, Visionary, etc.) anywhere in this section. Every sentence must be grounded in the supplied subdimension traits only.

Cover all of the following — weave them together naturally, do not assign them to fixed positions:
- What this strength looks like when this student applies it in practice: describe specific behaviours grounded in the supplied traits. Avoid "you enjoy..." or "you like working on..." as the basis of the description.
- What it enables or makes more natural for this student than it might be for others — be specific to this strength, not generic self-affirmation.
- The supplied traits, drawn on selectively: feature those that best explain how this strength operates for this student. Give fuller treatment to primarySubdims that connect most directly to this strength; weave in supportingSubdims where they add something specific. Do not list traits sequentially as "your X means... your Y means...". Vary which traits you foreground across strength items.
- Close with a concrete connection to the student's career directions. ${isUndergraduate ? "Draw only on META.items.pathways_context — the specific professional roles and settings from the student's subject domain. Do not reference career worlds or career areas outside that domain." : "Draw on META.items.career_worlds to name the types of work this strength is most relevant to."} Do not use the exact capitalized titles of career worlds or pathways. Reference one, two, or three career directions if more than one is genuinely relevant to this specific strength. Do not make a generic claim about the strength being broadly useful. Across all strength items, vary which directions you reference — do not close on the same types of work repeatedly.

2) IDEAL ENVIRONMENTS
Purpose: Make the student able to picture the kind of setting where they will do their best work — grounded entirely in their subdimension traits, not in archetype profiles.

Write 4 sentences per item.

Do not mention archetypes or profiles (Creator, Thinker, Visionary, etc.) anywhere in this section. Every sentence must be grounded in the supplied subdimension traits only.

Cover all of the following — weave them naturally:
- What this environment actually feels like to work in: its pace, culture, structure, level of autonomy, day-to-day character and expectations. Make it recognisable and real, not a dictionary definition.
- One or two real examples of where this environment appears — woven naturally into the body of the paragraph, not introduced with "Examples include..." or listed separately. ${isUndergraduate ? "Draw on META.items.pathways_context for context; examples should name the kinds of organisations, teams, or roles that exist within the student's subject domain." : "Draw on META.items.career_worlds for context; examples should feel like they belong to the worlds this student is heading towards."} Do not name specific pathway titles in the body text, but let their context shape which organisations, teams, and types of work you reference.
- The supplied traits, drawn on selectively: connect those most relevant to what this environment actually demands or provides. Give fuller treatment to primarySubdims; weave in supportingSubdims where they sharpen the picture. Vary which traits you foreground across environment items.
- Where two environments share overlapping traits, approach them from meaningfully different angles. One might focus on the cognitive demands the setting places on the student; another might focus on how autonomy and accountability are structured; another on the pace and type of output. The goal is for each environment paragraph to feel like a genuinely different place to be — not a variation on the same description with some words changed.
- Close with a sentence that grounds this environment in the student's actual career landscape. ${isUndergraduate ? "Name specific types of roles or settings from META.items.pathways_context — the student's subject domain. Do not reference career areas outside that domain." : "Name the types of work or career directions from META.items.career_worlds where this environment is most common."} Do not use the exact capitalized titles of career worlds or pathways. Do not close two environment items on the same direction. This sentence must name at least one specific role or type of setting — a sentence that describes the environment in abstract terms without anchoring it to a named role or direction does not satisfy this requirement.

3) ${isSchool ? "CAREER WORLDS" : "CAREER PATHWAYS — ALIGNED"}
${isSchool ? `Purpose: A standardized definition is shown to the student directly above your text; it already explains what this career world is, what the work involves, and why it matters. Your job is ONLY to explain why THIS specific student personally fits this world: why they would find it absorbing, why they would be effective in it, and which profile thrives here.
Remember: a career world is a broad direction, not a specific role or a university subject.

LENGTH SCALES WITH THE NUMBER OF STRONG TRAITS. Feature every trait in this item's strong_user_subdims list (already limited to standouts plus the strongest others) (those the student rates Strong or above), and give each featured trait its own sentence, except where two traits express a genuinely related idea and can share one sentence. So a world where the student has six Strong-or-above traits should run to roughly six or seven sentences (the opening FIT sentence plus about one per featured trait or overlapping pair); a world where they have only two or three Strong-or-above traits should be correspondingly shorter, about three or four sentences. Do not compress a world that genuinely has many strong traits into a few crammed sentences, and never pad a world that has few. This is the opposite of a fixed length: the paragraph should visibly grow or shrink with how many strong traits the student has for that world.

Do NOT describe or introduce the career world. Do not explain what the work involves, what it feels like day to day, or why the field matters to society. That is already covered by the definition above your text. Do not open with a description of the work or a scene. The FIRST sentence is the FIT OPEN (the archetype statement described below); after it, go straight to the student and their traits. You may refer to "this world" without re-describing it.

Do not mention archetypes or profiles anywhere in this section except in the opening FIT OPEN sentence. All other sentences must be grounded in the supplied subdimension traits only.

PLAIN LANGUAGE (this section only): these readers are school-age, so write at an accessible reading level, roughly what a 14 to 16 year old reads comfortably. Use short, clear sentences and everyday words; avoid corporate or academic jargon. Do not present a trait name as if it were a grade or score: the first time you use a loaded trait name in a paragraph, gloss it in plain words so its meaning is obvious, for example "your Analytical Curiosity, your habit of digging into how and why things work," or "your Data Curiosity, your comfort with numbers and patterns." Keep the tone warm and encouraging, never clinical.

Structure, woven naturally rather than in rigid blocks:

1. FIT OPEN (exactly TWO sentences, and they must be the FIRST two sentences of the paragraph): These two sentences are shown to the student on their own, above the trait detail, so they must stand alone and feel complete. Sentence one names the kind of person who tends to find this world satisfying, expressed in terms of the student's archetype profiles (Creator, Thinker, Visionary, etc.). Sentence two says a little more about what that specific blend of profiles responds to in this world, in plain, warm words. Both sentences are archetype-and-fit only — do NOT name any subdimension trait in them (trait sentences come afterwards and all begin "Your ..."). These are the only two sentences where you may name archetypes. Do not use "built for", "designed for", "made for", or "tailor-made for" — use softer framing such as "tends to suit", "tends to find real satisfaction in", or "is well suited to". RIGHT: "People with a mix of Thinker, Creator, and Visionary profiles tend to find real satisfaction here, where discovery depends on both careful analysis and the courage to try something new. That blend is well suited to a world where the aim is to work out how something really works and then imagine how it could be better." Make both sentences specific to this world, not interchangeable with another world's opener. Do not use "this world suits you", "this is why this could be right for you", "if you want to", or "if you enjoy".

2. WHY IT FITS (the rest of the paragraph, after the FIT OPEN): Why this specific student would find this world genuinely absorbing, and why they would be effective in it. Ground every claim in the eligible traits (those the student rates Strong or above), featuring every trait in its strong_user_subdims list. ONE IDEA PER SENTENCE: give each featured trait its own sentence, EXCEPT where two traits express a genuinely related idea (for example Independence and Autonomy, or Analytical Curiosity and Data Curiosity), which you may combine into a single sentence. Do NOT cram two or more distinct, unrelated traits into one clause (that is the error to avoid). Equally, do not fall into a flat "your X means..., your Y means..." checklist rhythm: vary how each sentence is built (see STYLE RULES on varying openings) so distinct sentences do not sound mechanical. If the student has only a few Strong-or-above traits for this world, write a correspondingly shorter paragraph rather than padding it. Vary which traits you foreground across career world items.

Do not use em-dashes, en-dashes, or hyphens used as dashes anywhere. Use a comma, a colon, or restructure the sentence instead.` : ""}
${isUndergraduate ? `Purpose: A standardized definition of this pathway is shown to the student directly above your text; it already explains what the pathway is, the kind of work it involves, where it happens, and what people in it do. Your job is ONLY to explain why THIS specific student personally fits this pathway: why they would find the work absorbing, why they would be effective in it, and which profile thrives here.

The student already studies a relevant subject and can read the definition above, so do NOT describe or introduce the pathway. Do not explain what the work involves, name the organisations or settings, list the day-to-day tasks, or say why the field matters. That is all covered by the definition above your text. Do not open with a description of the work, "Professionals in this pathway", "People in this field", or any generic category opener. The FIRST sentence is the FIT OPEN (the archetype statement described below); after it, go straight to the student. You may refer to "this pathway" without re-describing it.

LENGTH SCALES WITH THE NUMBER OF STRONG TRAITS. Feature every trait in this item's strong_user_subdims list (already limited to standouts plus the strongest others), one idea per sentence, so a pathway where the student has six Strong-or-above traits runs to about six or seven sentences (the opening FIT sentence plus one per featured trait or genuinely-overlapping pair), and a pathway where they have only two or three is correspondingly shorter, about three or four. Never pad to reach a length.

Do not mention archetypes or profiles (Creator, Thinker, Visionary, etc.) anywhere except in the opening FIT OPEN sentence.

Structure each paragraph across two elements, woven naturally rather than in rigid blocks:

1. FIT OPEN (exactly TWO sentences, and they must be the FIRST two sentences of the paragraph): These two sentences are shown to the student on their own, above the trait detail, so they must stand alone and feel complete. Sentence one names the kind of person who tends to find this pathway satisfying, expressed in terms of the student's archetype profiles (Creator, Thinker, Visionary, etc.). Sentence two says a little more about what that specific blend of profiles brings to this pathway, or what it is about this work that a person with that blend responds to. Both sentences are archetype-and-fit only — do NOT name any subdimension trait in them (trait sentences come afterwards and all begin "Your ..."). These are the only two sentences where you may name archetypes. Do not use "built for", "designed for", "made for", or "tailor-made for" — use softer framing such as "tends to suit", "tends to find real satisfaction in", or "is well suited to". RIGHT: "A blend of Thinker, Visionary and Creator profiles tends to find real satisfaction in work that rewards deep analysis alongside the ability to see what others overlook. That mix is well suited to equity research, where forming an independent, well-argued view of a company matters more than following the crowd." Make both sentences specific to this pathway, not interchangeable with another's.

2. WHY IT FITS (the rest of the paragraph, after the FIT OPEN): Why this specific student would find this pathway genuinely absorbing, and why they would be effective in it. Feature only the eligible traits (those the student rates Strong or above), using up to the six strongest. ONE IDEA PER SENTENCE: give each featured trait its own sentence, EXCEPT where two traits express a genuinely related idea (for example Independence and Autonomy, or Analytical Curiosity and Data Curiosity), which you may combine into one sentence. Do NOT cram two or more distinct, unrelated traits into a single clause. Equally, do not fall into a flat "your X means..., your Y means..." checklist rhythm: vary how each sentence is built so the sentences do not sound mechanical. If the student has only a few Strong-or-above traits for this pathway, write a correspondingly shorter paragraph rather than padding it. Vary which traits you foreground across pathway items. Do not use "this pathway suits you", "this is why this could be the right direction for you", "if you want to", or "if you enjoy".

Do not include a sentence about why this field matters to the world or is important for society. Focus entirely on fit.
Do not use em-dashes, en-dashes, or hyphens used as dashes anywhere. Use a comma, a colon, or restructure the sentence instead.
Do not end with "This direction connects with you", "This direction suits you because", "This pathway connects with you", or similar verdict phrases.` : ""}

${isUndergraduate ? `4) CAREER PATHWAYS — ADJACENT
Purpose: Introduce the student to a broader-reach pathway worth considering — one that has genuine connections to their profile, but is less directly matched than the aligned pathways. The tone is curious and open, not a confident fit-verdict.

DO NOT THIN OUT THE INSIGHT HERE. These pathways get the SAME trait depth as the aligned ones: feature every trait in this item's strong_user_subdims list, one idea per sentence, so the length scales with how many strong traits the student has (six strong traits means roughly six or seven sentences, not three). The only difference from the aligned section is TONE (exploratory, not a confident verdict), never depth. Never repeat a trait you have already named, and never drop a listed trait to keep the paragraph short — a listed trait that is missing (for example Security, Independence, or Precision when they are in the list) is an error.

A standardized definition of this pathway is shown directly above your text, so do NOT introduce or describe the pathway, its organisations, or its tasks. You may refer to "this pathway" without re-describing it.

OPEN WITH TWO ARCHETYPE SENTENCES, exactly like the aligned pathways (they are shown to the student on their own, above the trait detail, so they must stand alone). Sentence one names the kind of person, in terms of the student's archetype profiles (Creator, Thinker, Visionary, etc.), who tends to be drawn to explore this pathway. Sentence two adds what that blend of profiles finds worth exploring in this particular pathway. Keep the exploratory tone (worth a look, not a confirmed verdict), and use softer framing such as "tends to be drawn to" or "often find worth exploring", not "built for" or "designed for". Do NOT name any subdimension trait in these two sentences (trait sentences come afterwards and all begin "Your ..."). These opening two sentences are the only place archetypes may be named. After them, go to the student's traits.

Cover the following, woven naturally:
- A specific, concrete connection between EACH featured trait and something real about this work: there is a genuine reason this pathway appears here, and the student should see exactly what each of their traits would do in it.
- Why this direction may be worth exploring given the student's profile: frame it honestly as a broader reach that has real merit, not a consolation option and not a confident fit-verdict.

Do not write as though this is a confirmed strong fit. Do not use "this pathway aligns with your profile", "your profile suits this well", "this is a natural extension", or similar verdict language. The tone is: here is a direction with real connections to who you are that is worth exploring with an open mind.

The closing sentence must name at least one specific trait and connect it directly to something concrete about this work. Do not open or close with "If you are interested in..." or "If you are curious about..." — these are passive hedges that say nothing specific about the student. Vary the closing construction across adjacent items.` : ""}

SECTION COUNTS
- Summary: 1 paragraph, 5 sentences, no bullet points.
- Strengths: one paragraph per item, every item provided.
- Ideal Environments: one paragraph per item, every item provided.
${isSchool ? `- Career Worlds: one paragraph per item, every item provided. Focused only on why this student fits the world (no description of the world itself, which the definition already covers), featuring only the student's Strong-or-above traits (up to the six strongest), one idea per sentence. Paragraph length scales with how many Strong-or-above traits the student has for that world: a world with six strong traits runs to about six or seven sentences (one per featured trait or genuinely-overlapping pair, plus the FIT CLOSE); a world with only two or three gets about three or four. Do not compress a world that genuinely has many strong traits, and do not pad a world that has few.` : ""}
${isSchoolInterest ? "- Keep Career Worlds Most Aligned With Your Interest Area and Other Career Worlds to Explore as distinct subsections with their own items." : ""}
${isUndergraduate ? `- Career Pathways: aligned pathway length scales with the number of the student's Strong-or-above traits for that pathway (why-it-fits only, since the standardized definition is shown above each one), one idea per sentence, featuring every trait in its strong_user_subdims list — about six or seven sentences when six strong traits qualify, down to three or four when only two or three do. Adjacent pathways get the SAME trait depth (feature every trait in their strong_user_subdims list, length scaling the same way); only their tone is more exploratory. Do not thin out or repeat traits in the adjacent items.
- Do not add a Career Worlds section for university users.
- If an Adjacent Career Pathways to Explore section is present in the skeleton, write it. If it is absent, do not create it.
- Use only META.items.pathways_aligned for the aligned section, and only META.items.pathways_adjacent for the adjacent section. Do not merge, rename, or move items between sections.` : ""}

FINAL QUALITY CHECK
Before finishing, read each item and ask: does this paragraph tell this specific student something true and useful about themselves in relation to this specific item? If it could be the opening paragraph of a Wikipedia article about the topic, or could apply to any student with a similar profile, it needs to be more specific.
- Strength paragraphs should describe patterns in how this person works well — behaviourally real, not motivational-poster language.
- Environment paragraphs should make a specific setting feel vivid and recognisable to someone who has never worked in it.
- Career world paragraphs should feel inspiring and grounded simultaneously — real enough to picture, interesting enough to want to know more.
- Aligned pathway paragraphs should feel like an adviser who knows this professional territory explaining why it fits this particular person, not a general introduction to the field.
- Adjacent pathway paragraphs should feel honest, curious, and specific — a genuine suggestion, not a hedge.
`;
}

// ─── selection narrative instructions ────────────────────────────────────────

function getSelectionNarrativeInstructions(status = "") {
  const isSchool = status === "school";

  const common = `
You are writing hidden CareerDNA drill-down narratives for the Discover More / Selection Insight Explorer section.
Write as an expert careers adviser giving a student a clear, specific, and honest picture of what a particular role or subject involves and why it may suit them.
Return JSON only. No markdown, no commentary, no code fence.

STRICT OUTPUT SHAPE
{
  "groups": [
    {
      "parentId": "...",
      "parentTitle": "...",
      "parentType": "...",
      "items": [
        {
          "id": "...",
          "title": "...",
          "relation": "...",
          "kind": "...",
          "parentId": "...",
          "parentTitle": "...",
          "parentType": "...",
          "fullSummary": "..."
        }
      ]
    }
  ]
}

EVIDENCE RULES
- Use META.hidden_selection_groups exactly. Do not add, remove, rename, or reorder groups or items.
- For each hidden item, use only that item's own archetypes and subdims arrays. Do not borrow evidence from the parent world or pathway or from the student's wider profile.
- Refer to archetypes as profiles: "your Thinker profile".
- Refer to subdims as traits, using the exact supplied names. Every trait name must be preceded by "your" — every time. WRONG: "Originality and Autonomy allow you", "Achievement drives". RIGHT: "your Originality and Autonomy allow you", "your Achievement drives". Never paraphrase trait names.
- Do not mention scoring, metadata, internal logic, relation labels, matchTier, primarySubdims, supportingSubdims, or any system terms.
- Never use the word "energy".
- Do not use em-dashes (—), en-dashes (–), or hyphens used as dashes anywhere in the prose. If you would use a dash, use a comma, a colon, or restructure the sentence instead.
- If an item has three supplied traits, mention all three exact trait names.
- If an item has two supplied traits, mention both.
- If an item has one supplied trait, mention it.
- Make the fullSummary specific to this item. It must not sound reusable across several subjects or roles.
- Hidden summaries must describe the specific item — not repeat the parent career world or pathway summary.
- Never attribute internal motivation: do not write "drives you to", "motivates you to", "pushes you to", "you are driven to", "you are motivated to".
- Do not open any fullSummary with "This role involves...", "This subject involves...", "This degree involves...", "This pathway involves...", or any generic category phrase.
- Do not write "Professionals in this role", "Professionals in this field", "People in this field", "People working in this area".
- Never use these phrases anywhere: "aligns well", "well-suited", "great fit", "perfect fit", "find joy", "find satisfaction", "impactful", "valuable outcomes", "shape the future", "may be drawn to this", "could be particularly rewarding", "connects to specific aspects", "Together, these traits", "These traits combine", "this combination of traits", "makes this a natural fit", "makes this a strong match".
`;

  if (isSchool) {
    return `${common}

SUBJECTS / UNIVERSITY DEGREES
Purpose: Explain what studying this undergraduate subject actually involves and why it may suit this student — concrete, specific, and honest. Not a prospectus summary.

Write one fullSummary per hidden subject. Write 5 sentences.

Cover all of the following — weave them naturally:
(a) What studying this subject is actually like: what students do, how they spend their time, what kinds of thinking or practical work it involves. Be concrete — modules, methods, types of projects, types of problems. Not "this subject explores a wide range of fascinating topics".
(b) What the subject builds and where graduates typically go — grounded in what the degree trains people to do, not a sales pitch for the field.
(c) How the supplied profiles connect to why this subject might suit this student — what about the nature of the profiles fits what this subject requires and rewards.
(d) How the supplied traits show up in the specific demands of studying and succeeding in this subject — trait by trait, specific to what this subject asks of you.
(e) One specific area of work, type of problem, or kind of contribution this subject prepares people for — concrete and real. Not "you will be able to make a difference in many exciting ways".

Each sentence must follow naturally from the previous one.
`;
  }

  return `${common}

ROLES
Purpose: Give the student a clear, honest picture of what this role involves day to day and why it may suit them — specific, real, and grounded. Not a job description. Not generic encouragement.

Write one fullSummary per hidden role. Write 5 sentences.

Cover all of the following — weave them naturally:
(a) What this role involves day to day: at least one specific task, decision, or output that defines it. Not "this role involves working across a variety of challenging areas".
(b) What the role demands in terms of skills, habits, or ways of thinking — what makes someone effective in it over time.
(c) How the supplied profiles connect to why this role might suit this student: specific to what these profiles are drawn to and what this role requires.
(d) How the supplied traits help this student operate effectively and potentially find this role engaging — specific to what the role actually demands.
(e) One concrete example of the kind of problem, project, output, or situation someone in this role regularly faces — something that makes the role feel real.

Each sentence must follow naturally from the previous one.
`;
}

// ─── prompt builders ──────────────────────────────────────────────────────────

function buildReportPrompt(payload = {}) {
  const {
    status = "",
    profileMode = "",
    strengthsFixed = [],
    envsFixed = [],
    careerWorldsFixed = [],
    careerWorldsAlignedFixed = [],
    careerWorldsOtherFixed = [],
    rolesFixed = [],
    rolesAlignedFixed = [],
    rolesAdjacentFixed = [],
  } = payload;

  const instructions = getReportInstructions(profileMode, status);
  const meta = buildMeta(payload);
  // The main report never references META.hidden_selection_groups — only the
  // separate Discover More (selection-narratives) call does. Drop it here so this
  // prompt isn't bloated with the entire Discover More dataset it ignores. This is
  // what was pushing large profiles past OpenAI's per-request token limit.
  delete meta.hidden_selection_groups;

  const header = `
[META START]
${JSON.stringify(meta)}
[META END]

${instructions}

## Summary
`;

  if (status === "school") {
    const schoolInterest = profileMode === "school_interest";

    const careerWorldSection = schoolInterest
      ? `
## Career Worlds Most Aligned With Your Interest Area
${skeletonList(careerWorldsAlignedFixed)}

## Other Career Worlds to Explore
${skeletonList(careerWorldsOtherFixed)}`
      : `
## Career Worlds
${skeletonList(careerWorldsFixed)}`;

    return `
${header}

## Strengths
${skeletonList(strengthsFixed)}

## Ideal Environments
${skeletonList(envsFixed)}${careerWorldSection}
`;
  }

  return `
${header}

## Strengths
${skeletonList(strengthsFixed)}

## Ideal Environments
${skeletonList(envsFixed)}

## Career Pathways Most Aligned With Your Subject Area
${skeletonList(rolesAlignedFixed.length ? rolesAlignedFixed : rolesFixed)}
${rolesAdjacentFixed.length ? `
## Adjacent Career Pathways to Explore
${skeletonList(rolesAdjacentFixed)}
` : ''}
`;
}

function buildSelectionNarrativesPrompt(payload = {}) {
  const meta = buildMeta(payload);

  return `
[META START]
${JSON.stringify({ hidden_selection_groups: meta.hidden_selection_groups })}
[META END]

${getSelectionNarrativeInstructions(payload.status)}
`;
}

module.exports = {
  buildReportPrompt,
  buildSelectionNarrativesPrompt,
};
