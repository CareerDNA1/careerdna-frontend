// src/utils/generatePDF.js
import jsPDF from "jspdf";
import { marked } from "marked";
import SUBDIMENSION_DEFINITIONS from "./subdimensionDefinitions";

/* -------------------------------------------------------------
   1. FULL DEFINITIONS (inlined)
   ------------------------------------------------------------- */

// Archetypes
const ARCHETYPE_DEFINITIONS = {
  Achiever:
    "An Achiever is ambitious, driven, and focused on results. They set high standards, work hard to meet goals, and take pride in pushing their limits. Achievers thrive in fast-paced environments where performance is recognised and rewarded.",
  Connector:
    "A Connector is people-focused, empathetic, and great at building relationships. They feel energised by collaboration, love supporting others, and are often the glue that holds a team or community together.",
  Creator:
    "A Creator is imaginative, hands-on, and expressive. They enjoy turning ideas into reality through art, design, technology, or storytelling. Creators thrive when given freedom to innovate and explore new forms.",
  Explorer:
    "An Explorer is curious, adventurous, and driven by discovery. They love trying new things, asking big questions, and learning through real-world experiences. Explorers get bored with routine and crave variety and challenge.",
  Organizer:
    "An Organizer is structured, dependable, and detail-oriented. They bring order to chaos, love planning and systems, and thrive in environments where reliability and accuracy are essential.",
  Thinker:
    "A Thinker is analytical, logical, and reflective. They enjoy solving complex problems, diving deep into topics, and making sense of patterns. Thinkers are most comfortable in roles that reward independence and intellectual depth.",
  Visionary:
    "A Visionary is future-focused, bold, and full of ideas. They’re passionate about making a difference and inspired by big-picture thinking. Visionaries thrive in spaces where they can lead change, innovate, and inspire others.",
};

// SUBDIMENSION_DEFINITIONS imported from subdimensionDefinitions.js (v2 string keys)

/* -------------------------------------------------------------
   Layout helpers
   ------------------------------------------------------------- */
const MARGIN = 60;
const TOP = 70;
const BRAND = [47, 128, 237];
const LIGHT_BAR = [231, 238, 252];
const SAFE_BOTTOM = 690;

function addHeaderFooter(doc, page, total) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND);
  doc.text("CareerDNA – Personalized Career Insights", MARGIN, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Page ${page} of ${total}`, w / 2, h - 20, { align: "center" });
}

function heading(doc, text, y, size = 14, gap = 26) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...BRAND);
  doc.text(text, MARGIN, y);
  y += 10;
  return y + gap;
}

function paragraph(doc, text, y, maxWidth, gap = 12) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.75);
  doc.setTextColor(30);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > SAFE_BOTTOM) {
      doc.addPage();
      y = TOP;
    }
    doc.text(line, MARGIN, y);
    y += 15;
  }
  return y + gap;
}

function drawBars(doc, data, y, maxWidth) {
  const entries = Object.entries(data || {})
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => b[1] - a[1]);
  if (!entries.length) return y;

  const labelW = 165;
  const barW = maxWidth - labelW - 5;
  const barH = 15;
  const gap = 9;
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  for (const [label, val] of entries) {
    if (y > SAFE_BOTTOM - 40) {
      doc.addPage();
      y = TOP;
    }

    doc.setTextColor(25);
    doc.text(label, MARGIN, y + 11);

    doc.setFillColor(...LIGHT_BAR);
    doc.rect(MARGIN + labelW, y, barW, barH, "F");

    const len = (val / maxVal) * barW;
    doc.setFillColor(...BRAND);
    doc.rect(MARGIN + labelW, y, len, barH, "F");

    doc.text(`${Math.round(val)}%`, MARGIN + labelW + len + 4, y + 11);

    y += barH + gap;
  }

  return y + 10;
}

function renderDefs(doc, items, y, maxWidth) {
  for (const item of items) {
    if (!item.definition) continue;

    if (y > SAFE_BOTTOM - 90) {
      doc.addPage();
      y = TOP;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.75);
    doc.setTextColor(20);
    doc.text(item.label, MARGIN, y);
    y += 13;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.35);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(item.definition, maxWidth - 15);
    for (const line of lines) {
      if (y > SAFE_BOTTOM) {
        doc.addPage();
        y = TOP;
      }
      doc.text(line, MARGIN + 12, y);
      y += 12.5;
    }

    y += 9;
  }
  return y;
}

function mdToBlocks(markdown = "") {
  const html = marked.parse(markdown);
  const div = document.createElement("div");
  div.innerHTML = html;
  const blocks = [];
  div.childNodes.forEach((node) => {
    if (["H1", "H2", "H3"].includes(node.nodeName)) {
      blocks.push({ type: "heading", text: node.textContent.trim() });
    } else if (node.nodeName === "UL") {
      node.querySelectorAll("li").forEach((li) =>
        blocks.push({ type: "bullet", text: li.textContent.trim() })
      );
    } else if (node.textContent.trim()) {
      blocks.push({ type: "paragraph", text: node.textContent.trim() });
    }
  });
  return blocks;
}

/* -------------------------------------------------------------
   MAIN EXPORT
   ------------------------------------------------------------- */
export function generateCareerDNAPdf({
  archetypes = {},
  dimensionBlocks = [],
  clarity = {},
  aiSummary = "",
}) {
  const doc = new jsPDF("p", "pt", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const maxWidth = pageW - MARGIN * 2;
  let y = TOP;

  // INTRO
  y = heading(doc, "Your Unique CareerDNA", y, 19, 20);
  y = paragraph(
    doc,
    "CareerDNA combines insights from behavioural science and AI to help you understand what drives you and how you work, so you can make informed choices about your direction and development. There is no right or wrong profile. The results don’t measure ability or success. They simply describe your patterns of motivation and behaviour that make you who you are.",
    y,
    maxWidth,
    18
  );

  // 1. Archetypes
  y = heading(doc, "1. Your CareerDNA Type (Archetypes)", y, 14, 14);
  y = paragraph(
    doc,
    "Your type is based on seven archetypes that represent different ways people think, act and find motivation. Your results show how closely you relate to each one.",
    y,
    maxWidth,
    10
  );
  y = drawBars(doc, archetypes, y, maxWidth);

  const archeDefs = Object.keys(archetypes)
    .sort((a, b) => archetypes[b] - archetypes[a])
    .map((name) => ({
      label: name,
      definition: ARCHETYPE_DEFINITIONS[name] || "",
    }));
  y = renderDefs(doc, archeDefs, y, maxWidth);

  // 2. Dimensions
  doc.addPage();
  y = TOP;
  y = heading(doc, "2. Your CareerDNA Dimensions", y, 14, 14);
  y = paragraph(
    doc,
    "Your CareerDNA is built around four lenses: Who You Are, What You Love, What Matters, and How You Work Best. Below you can see your scores for each lens and the meaning of the subdimensions.",
    y,
    maxWidth,
    14
  );

  (dimensionBlocks || []).forEach((dim, idx) => {
    if (y > SAFE_BOTTOM - 120) {
      doc.addPage();
      y = TOP;
    }

    y = heading(doc, `2.${idx + 1} ${dim.name}`, y, 12.5, 12);

    // sort by score
    const sorted = (dim.items || [])
      .map((it) => ({
        ...it,
        score: typeof it.score === "number" ? it.score : 0,
      }))
      .sort((a, b) => b.score - a.score);

    // chart data with pretty labels
    const chartData = {};
    sorted.forEach((it) => {
      const label = it.label || it.key || "Subdimension";
      chartData[label] = it.score;
    });
    y = drawBars(doc, chartData, y, maxWidth);

    // definitions
    const defsForDim = sorted.map((it) => {
      const key = it.key || it.label || null;
      const label = it.label || it.key || "Subdimension";
      const definition =
        (key && SUBDIMENSION_DEFINITIONS[key]) ||
        it.definition ||
        "";
      return { label, definition };
    });
    y = renderDefs(doc, defsForDim, y, maxWidth);
    y += 6;
  });

  // 3. Clarity
  doc.addPage();
  y = TOP;
  y = heading(doc, "3. How Well You Know Yourself", y, 14, 12);
  y = paragraph(
    doc,
    "This estimates how clearly and consistently your answers describe you across the four CareerDNA dimensions. Higher % means a clearer self-view.",
    y,
    maxWidth,
    10
  );
  if (Object.keys(clarity || {}).length) {
    y = drawBars(doc, clarity, y, maxWidth);
  } else {
    y = paragraph(doc, "No clarity data provided.", y, maxWidth);
  }

  // 4. Summary
  doc.addPage();
  y = TOP;
  y = heading(doc, "4. Personalized CareerDNA Summary", y, 14, 14);

  const blocks = mdToBlocks(aiSummary);
  blocks.forEach((b) => {
    if (y > SAFE_BOTTOM - 60) {
      doc.addPage();
      y = TOP;
    }

    if (b.type === "heading") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...BRAND);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      lines.forEach((line) => {
        if (y > SAFE_BOTTOM - 40) {
          doc.addPage();
          y = TOP;
        }
        doc.text(line, MARGIN, y);
        y += 16;
      });
      y += 6;
    } else if (b.type === "bullet") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(30);
      const lines = doc.splitTextToSize(b.text, maxWidth - 12);
      if (y > SAFE_BOTTOM - 40) {
        doc.addPage();
        y = TOP;
      }
      doc.text("•", MARGIN, y);
      lines.forEach((line, i) => {
        doc.text(line, MARGIN + 12, y + i * 14);
      });
      y += lines.length * 14 + 6;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(30);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      lines.forEach((line) => {
        if (y > SAFE_BOTTOM - 30) {
          doc.addPage();
          y = TOP;
        }
        doc.text(line, MARGIN, y);
        y += 14.5;
      });
      y += 6;
    }
  });

  // footer on all pages
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addHeaderFooter(doc, i, total);
  }

  doc.save("CareerDNA_Report.pdf");
}
