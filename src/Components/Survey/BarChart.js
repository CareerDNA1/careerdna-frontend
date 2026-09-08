import React, { useEffect, useState } from "react";
import { ARCHETYPE_DEFINITIONS as archetypeDescriptions } from "../../utils/archetypeDefinitions";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CDNA_BAR_THICKNESS_DESKTOP = 35;
const CDNA_BAR_THICKNESS_MOBILE = 26;
const CDNA_BAR_RADIUS = 8;
const CDNA_BAR_BORDER_WIDTH = 1.5;

function getProfileLevel(score = 0) {
  if (score >= 80) return "Standout";
  if (score >= 70) return "Strong";
  if (score >= 60) return "Good";
  return "Lower";
}

// Tier palette — matches the tier PILLS: pale tinted fill with a soft same-hue
// border (almost as faded as the fill). On hover the bar fills with the solid
// tier colour. Standout green, Strong amber, Good blue, Lower grey.
// Unified thresholds: 80 / 70 / 60.
function getBandColors(score = 0) {
  if (score >= 80) return { background: "#9fe1cb", border: "#8ad9c1", hover: "#78d2b6" };
  if (score >= 70) return { background: "#fac775", border: "#f4bd60", hover: "#f2b74f" };
  if (score >= 60) return { background: "#b5d4f4", border: "#a1c8f1", hover: "#90bdec" };
  return { background: "#d3d1c7", border: "#c6c3b7", hover: "#bfbcae" };
}

function getOrCreateBodyTooltip() {
  let el = document.querySelector(".cdna-archetype-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-archetype-tooltip";
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
      font: "13px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Arial",
      opacity: 0,
      transition: "opacity 120ms ease",
    });
    document.body.appendChild(el);
  }
  return el;
}

function hideArchetypeTooltip() {
  const el = document.querySelector(".cdna-archetype-tooltip");
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

  if (!tooltip || tooltip.opacity === 0) {
    el.style.opacity = 0;
    return;
  }

  const dp = tooltip.dataPoints?.[0];
  if (!dp) return;

  const label = dp.label ?? "";
  const score = Number(dp.raw ?? dp.formattedValue ?? 0);
  const def = archetypeDescriptions[label] || "";

  const xScale = chart.scales.x;
  const rightPx = xScale.getPixelForValue(score);
  const yPx = tooltip.caretY != null ? tooltip.caretY : chart.height / 2;

  const rect = chart.canvas.getBoundingClientRect();
  el.innerHTML = `
    <button type="button" class="cdna-tooltip-close" aria-label="Close">&times;</button>
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="opacity:.9;margin-bottom:6px">Level: ${getProfileLevel(score)}</div>
    <div>${def}</div>
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

const BarChart = ({ archetypes }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", hideArchetypeTooltip, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", hideArchetypeTooltip);
    };
  }, []);

  if (!archetypes || typeof archetypes !== "object") return null;

  const sorted = Object.entries(archetypes).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([name]) => name);
  const dataValues = sorted.map(([, v]) => v);

  const backgroundColors = dataValues.map((v) => getBandColors(v).background);
  const borderColors = dataValues.map((v) => getBandColors(v).border);
  const hoverColors = dataValues.map((v) => getBandColors(v).hover);

  const data = {
    labels,
    datasets: [
      {
        label: "Profile level",
        data: dataValues,
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
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipRightOfBar,
      },
    },
    interaction: { mode: "nearest", intersect: true, axis: "xy" },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: "#444",
          font: { size: isMobile ? 11 : 13 },
          callback: (value) => `${value}%`,
        },
        grid: {
          color: (ctx) => Number(ctx?.tick?.value || 0) === 0 ? "transparent" : "#eee",
          lineWidth: (ctx) => Number(ctx?.tick?.value || 0) === 0 ? 0 : 1,
        },
        border: { display: false },
      },
      y: {
        ticks: {
          color: "#444",
          font: { size: isMobile ? 14 : 16, weight: "700" },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
    layout: { padding: { right: 16 } },
  };

  return (
    <>
      <div
        style={{
          width: "680px",
          maxWidth: "100%",
          height: isMobile ? "320px" : "400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseLeave={hideArchetypeTooltip}
      >
        <Bar data={data} options={options} />
      </div>
      <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: "0.72rem", fontWeight: 500, color: "#8a97a8" }}>
        {isMobile ? "Tap" : "Hover over"} a bar to see what it means
      </p>
    </>
  );
};

export default BarChart;
