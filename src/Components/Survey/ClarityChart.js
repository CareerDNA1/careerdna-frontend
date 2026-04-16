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

function getClarityLevel(score = 0) {
  if (score >= 70) return "Very clear";
  if (score >= 60) return "Taking shape";
  return "Still exploring";
}

function getOrCreateBodyTooltip() {
  let el = document.querySelector(".cdna-clarity-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-clarity-tooltip";
    Object.assign(el.style, {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
      background: "rgba(17,17,17,0.92)",
      color: "#fff",
      borderRadius: "10px",
      padding: "10px 12px",
      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
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
function externalTooltipRightOfBar(ctx) {
  const { chart, tooltip } = ctx;
  const el = getOrCreateBodyTooltip();
  if (!tooltip || tooltip.opacity === 0) { el.style.opacity = 0; return; }

  const dp = tooltip.dataPoints?.[0];
  if (!dp) return;

  const label = dp.label ?? "";
  const numericVal = Number(dp.raw || 0);
  const levelLabel = getClarityLevel(numericVal);
  let levelDesc = "";
  if (numericVal >= 70) {
    levelDesc = "Your answers are very consistent across the four CareerDNA dimensions, suggesting a well settled picture of how you see yourself right now.";
  } else if (numericVal >= 60) {
    levelDesc = "Your answers are starting to form a pattern. You have some self-awareness already, but parts of your picture are still settling into place.";
  } else {
    levelDesc = "Your answers suggest you are still working things out. That is completely normal and simply means there is more to discover about yourself.";
  }

  const xScale = chart.scales.x;
  const rightPx = xScale.getPixelForValue(numericVal);
  const yPx = tooltip.caretY != null ? tooltip.caretY : chart.height / 2;
  const rect = chart.canvas.getBoundingClientRect();
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="margin-bottom:4px">Level: ${levelLabel}</div>
    <div style="font-size:12px;opacity:.9">${levelDesc}</div>
  `;
  el.style.left = `${rect.left + rightPx + 12}px`;
  el.style.top  = `${rect.top + yPx - 14}px`;
  el.style.opacity = 1;
}

export default function ClarityChart({ answers: answersProp, minItems = 4, dpr, claritySummary }) {
  const [isMobile, setIsMobile] = useState(false);
  const devicePR = dpr ?? Math.max(window.devicePixelRatio || 1, 2);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
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
  const values = (clarity?.dimensions || []).map((d) => d.clarityPct ?? 0);

  const backgroundColors = values.map((v) => {
    if (v >= 70) return "rgba(0, 200, 150, 0.85)";
    if (v >= 60) return "rgba(120, 180, 220, 0.72)";
    return "rgba(200,200,200,0.5)";
  });
  const borderColors = values.map((v) => {
    if (v >= 70) return "rgba(0,150,120,1)";
    if (v >= 60) return "rgba(90,150,200,1)";
    return "rgba(160,160,160,1)";
  });

  const data = {
    labels,
    datasets: [{
      label: "Clarity level",
      data: values,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1.5,
      borderRadius: 4,
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
    interaction: { mode: "index", intersect: false, axis: "y" },
    scales: {
      x: {
        min: 0, max: 100,
        ticks: {
          stepSize: 20,
          color: "#444",
          font: { size: isMobile ? 11 : 13 },
          callback: (value) => `${value}%`
        },
        grid: { color: "#eee" },
      },
      y: {
        ticks: { color: "#444", font: { size: isMobile ? 14 : 16, weight: "700" } },
        grid: { display: false },
      },
    },
    layout: { padding: { right: 16 } },
  };

  return (
    <div style={{ width: "100%" }} onMouseLeave={hideTooltip}>
      <div style={{ width: "680px", maxWidth: "100%", height: isMobile ? "260px" : "320px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
