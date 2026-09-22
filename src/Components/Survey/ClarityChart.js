import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import QUESTIONS from "../../utils/questions";
import { computeClarityPercents } from "../../utils/selfAwarenessSummary";
import { readProgress } from "../../Hooks/useProgress";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CDNA_BAR_THICKNESS_DESKTOP = 38;
const CDNA_BAR_THICKNESS_MOBILE = 28;
const CDNA_BAR_RADIUS = 8;
const CDNA_BAR_BORDER_WIDTH = 1.5;

// Must use the SAME thresholds as getClarityBandValue below, so the tooltip label
// always agrees with the bar's band (High 72+, Developing 66+, else Low).
function getClarityLevel(score = 0) {
  if (score >= 72) return "High clarity";
  if (score >= 66) return "Developing clarity";
  return "Low clarity";
}

function getClarityBandValue(score = 0) {
  if (score >= 72) return 100;
  if (score >= 66) return 66;
  return 33;
}

// Tier palette — matches the tier PILLS: pale fill + soft same-hue border; on
// hover the bar fills with the solid tier colour. high = Standout green,
// medium = Strong amber, low = Lower grey.
function getClarityBandColors(score = 0) {
  if (score >= 72) return { background: "#9fe1cb", border: "#8ad9c1", hover: "#78d2b6" };
  if (score >= 66) return { background: "#fac775", border: "#f4bd60", hover: "#f2b74f" };
  return { background: "#d3d1c7", border: "#c6c3b7", hover: "#bfbcae" };
}

function getOrCreateBodyTooltip() {
  let el = document.querySelector(".cdna-clarity-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-clarity-tooltip";
    el.addEventListener("click", (e) => {
      if (e.target.closest(".cdna-tooltip-close")) el.style.opacity = "0";
    });
    Object.assign(el.style, {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
      background: "#ffffff",
      color: "#1f2a37",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "11px 13px",
      boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
      maxWidth: "360px",
      font: "13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial",
      opacity: 0,
      transition: "opacity 120ms ease",
    });
    document.body.appendChild(el);
  }
  return el;
}
function hideTooltip() {
  const el = document.querySelector(".cdna-clarity-tooltip");
  if (el) el.style.opacity = 0;
}
function positionExternalTooltip({ el, chartRect, anchorX, anchorY, gap = 12, padding = 12 }) {
  if (!el || !chartRect) return;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

  el.style.maxWidth = `min(360px, calc(100vw - ${padding * 2}px))`;
  el.style.width = "max-content";
  el.style.left = "0px";
  el.style.top = "0px";

  const tooltipWidth = el.offsetWidth || 220;
  const tooltipHeight = el.offsetHeight || 80;

  const rightLeft = anchorX + gap;
  const leftLeft = anchorX - tooltipWidth - gap;
  let left = rightLeft;
  let top = anchorY - tooltipHeight / 2;

  if (rightLeft + tooltipWidth > viewportWidth - padding && leftLeft >= padding) {
    left = leftLeft;
  } else if (rightLeft + tooltipWidth > viewportWidth - padding) {
    left = chartRect.left + chartRect.width / 2 - tooltipWidth / 2;
    top = anchorY + gap;
  }

  left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
  top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function externalTooltipRightOfBar(ctx) {
  const { chart, tooltip } = ctx;
  const el = getOrCreateBodyTooltip();
  if (!tooltip || tooltip.opacity === 0) { el.style.opacity = 0; return; }

  const dp = tooltip.dataPoints?.[0];
  if (!dp) return;

  const label = dp.label ?? "";
  const ds = chart.data?.datasets?.[dp.datasetIndex] || {};
  const rawScore = Number(ds.rawValues?.[dp.dataIndex] ?? dp.raw ?? 0);
  const bandValue = Number(dp.raw || getClarityBandValue(rawScore));
  const levelLabel = getClarityLevel(rawScore);
  let levelDesc = "";
  if (rawScore >= 72) {
    levelDesc = "Your answers show a clear and consistent pattern across this dimension, suggesting your preferences and tendencies came through strongly throughout the questionnaire.";
  } else if (rawScore >= 66) {
    levelDesc = "Your answers show some clear patterns while also reflecting flexibility across different areas. This is common when interests and preferences are still developing or span multiple areas. If you feel your answers did not fully reflect you, you may wish to revisit the questionnaire in the future.";
  } else {
    levelDesc = "Your answers suggest a broader or more mixed pattern in this area. This may indicate that your preferences vary across different situations, or that this is an area where your interests and tendencies are still developing. If you feel your answers did not fully reflect you, you may wish to revisit the questionnaire in the future.";
  }

  const xScale = chart.scales.x;
  const rightPx = xScale.getPixelForValue(bandValue);
  const yPx = tooltip.caretY != null ? tooltip.caretY : chart.height / 2;
  const rect = chart.canvas.getBoundingClientRect();
  el.innerHTML = `
    <button type="button" class="cdna-tooltip-close" aria-label="Close">&times;</button>
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="margin-bottom:4px">Level: ${levelLabel}</div>
    <div style="font-size:12px;opacity:.9">${levelDesc}</div>
  `;
  positionExternalTooltip({
    el,
    chartRect: rect,
    anchorX: rect.left + rightPx,
    anchorY: rect.top + yPx,
  });
  // only one chart tooltip open at a time — hide the others
  document.querySelectorAll(".cdna-clarity-tooltip, .cdna-archetype-tooltip, .cdna-subdim-tooltip").forEach((t) => { if (t !== el) t.style.opacity = "0"; });
  el.style.opacity = 1;
}

export default function ClarityChart({ answers: answersProp, minItems = 4, dpr, claritySummary }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const devicePR = dpr ?? Math.max(window.devicePixelRatio || 1, 2);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 820);
      setIsPhone(window.innerWidth < 600);
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", hideTooltip, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", hideTooltip);
    };
  }, []);

  const answers = useMemo(() => {
    if (answersProp && Object.keys(answersProp).length) return answersProp;
    try {
      const p = readProgress();
      if (p && p.answers && Object.keys(p.answers).length) return p.answers;
    } catch {}
    return {};
  }, [answersProp]);

  const clarity = useMemo(() => {
    if (claritySummary && Array.isArray(claritySummary.dimensions)) {
      return claritySummary;
    }
    return computeClarityPercents(QUESTIONS, answers, {
      wCertainty: 0.4,
      wCoherence: 0.6,
      minItemsPerDim: minItems,
      dimensionOrder: ["Who You Are", "What You Love", "What Matters", "How You Work Best"],
    });
  }, [answers, minItems, claritySummary]);

  const labels = (clarity?.dimensions || []).map((d) => d.dimension);
  const rawValues = (clarity?.dimensions || []).map((d) => Number(d.clarityPct ?? 0));
  const values = rawValues.map(getClarityBandValue);

  const backgroundColors = rawValues.map((v) => getClarityBandColors(v).background);
  const borderColors = rawValues.map((v) => getClarityBandColors(v).border);
  const hoverColors = rawValues.map((v) => getClarityBandColors(v).hover);

  const data = {
    labels,
    datasets: [{
      label: "Clarity level",
      data: values,
      rawValues,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      hoverBackgroundColor: hoverColors,
      hoverBorderColor: hoverColors,
      borderWidth: CDNA_BAR_BORDER_WIDTH,
      borderRadius: CDNA_BAR_RADIUS,
      barThickness: isMobile ? CDNA_BAR_THICKNESS_MOBILE : CDNA_BAR_THICKNESS_DESKTOP,
      maxBarThickness: isMobile ? CDNA_BAR_THICKNESS_MOBILE : CDNA_BAR_THICKNESS_DESKTOP,
      borderSkipped: false,
      inflateAmount: 1,
      clip: false,
    }],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: devicePR,
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false, external: externalTooltipRightOfBar },
    },
    interaction: { mode: "nearest", intersect: true, axis: "xy" },
    scales: {
      x: {
        min: 0,
        max: 112,
        afterBuildTicks: (scale) => {
          scale.ticks = [{ value: 33 }, { value: 66 }, { value: 100 }];
        },
        ticks: {
          color: "#5b6f87",
          font: { size: isPhone ? 10 : isMobile ? 11 : 13, weight: "600" },
          // Phone: force horizontal and drop the repeated "clarity" word so the
          // three labels fit without the diagonal rotation.
          maxRotation: isPhone ? 0 : undefined,
          minRotation: isPhone ? 0 : undefined,
          autoSkip: false,
          callback: (value) => {
            if (isPhone) {
              if (value === 33) return "Low";
              if (value === 66) return "Developing";
              if (value === 100) return "High";
              return "";
            }
            if (value === 33) return "Low clarity";
            if (value === 66) return "Developing clarity";
            if (value === 100) return "High clarity";
            return "";
          }
        },
        grid: {
          drawBorder: false,
          color: "rgba(91, 111, 135, 0.18)",
          lineWidth: 1,
        },
        border: { display: false },
      },
      y: {
        ticks: { color: "#444", font: { size: isMobile ? 14 : 16, weight: "700" } },
        grid: { display: false },
        border: { display: false },
      },
    },
    layout: { padding: { right: 16 } },
  };

  return (
    <div style={{ width: "100%" }} onMouseLeave={hideTooltip}>
      <div style={{ width: "680px", maxWidth: "100%", height: isMobile ? "280px" : "340px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bar data={data} options={options} />
      </div>
      <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: "0.72rem", fontWeight: 500, color: "#8a97a8" }}>
        {isMobile ? "Tap" : "Hover over"} a bar to see what it means
      </p>
    </div>
  );
}
