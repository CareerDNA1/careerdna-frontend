import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import SUBDIMENSION_DEFINITIONS from "../../utils/subdimensionDefinitions";
import whoImage from "../../Assets/images/who_you_are.jpg";
import loveImage from "../../Assets/images/what_you_love.jpg";
import mattersImage from "../../Assets/images/what_matters.jpg";
import workImage from "../../Assets/images/how_you_work.jpg";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_H_DESKTOP = 400;
const CHART_H_MOBILE = 300;
const AXIS_MAX = 4.35;
const CDNA_BAR_THICKNESS_DESKTOP = 38;
const CDNA_BAR_THICKNESS_MOBILE = 28;
const CDNA_BAR_RADIUS = 8;
const CDNA_BAR_BORDER_WIDTH = 1.5;

const DIMENSION_META = {
  "Who You Are": {
    lead: "Personality",
    image: whoImage,
    description: "How you naturally think, respond and approach the world.",
  },
  "What You Love": {
    lead: "Interests",
    image: loveImage,
    description: "The topics and activities that pull your attention and energy.",
  },
  "What Matters": {
    lead: "Values",
    image: mattersImage,
    description: "The priorities and motivations that make options feel meaningful.",
  },
  "How You Work Best": {
    lead: "Style",
    image: workImage,
    description: "The conditions and habits that help you do your best work.",
  },
};

const truncate = (s, n = 30) =>
  String(s).length > n ? String(s).slice(0, n - 1) + "…" : s;

const normalizePct = (v) => (v <= 1 ? v * 100 : v);

function getDimensionSignal(score = 0) {
  if (score >= 80) return { label: "Standout", value: 4 };
  if (score >= 70) return { label: "Strong", value: 3 };
  if (score >= 60) return { label: "Good", value: 2 };
  return { label: "Lower", value: 1 };
}

// Tier palette — matches the tier PILLS: pale tinted fill with a soft same-hue
// border (almost as faded as the fill). On hover the bar fills with the solid
// tier colour. Standout green, Strong amber, Good blue, Lower grey.
// Unified thresholds: 80 / 70 / 60.
function getBandColors(score = 0) {
  if (score >= 80) return { bg: "#9fe1cb", border: "#8ad9c1", hover: "#78d2b6" };
  if (score >= 70) return { bg: "#fac775", border: "#f4bd60", hover: "#f2b74f" };
  if (score >= 60) return { bg: "#b5d4f4", border: "#a1c8f1", hover: "#90bdec" };
  return { bg: "#d3d1c7", border: "#c6c3b7", hover: "#bfbcae" };
}

function getOrCreateSubdimTooltip() {
  let el = document.querySelector(".cdna-subdim-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-subdim-tooltip";
    el.addEventListener("click", (e) => {
      if (e.target.closest(".cdna-tooltip-close")) el.style.opacity = "0";
    });
    Object.assign(el.style, {
      position: "fixed",
      zIndex: 10000,
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

function hideSubdimTooltip() {
  const el = document.querySelector(".cdna-subdim-tooltip");
  if (el) el.style.opacity = 0;
  const topEl = document.querySelector(".cdna-archetype-tooltip");
  if (topEl) topEl.style.opacity = 0;
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
  const el = getOrCreateSubdimTooltip();

  if (!tooltip || tooltip.opacity === 0) {
    el.style.opacity = 0;
    return;
  }

  const dp = tooltip.dataPoints?.[0];
  if (!dp) return;

  const ds = chart.data?.datasets?.[dp.datasetIndex];
  const key = ds?.metaKeys?.[dp.dataIndex];
  const rawScore = Number(ds?.rawScores?.[dp.dataIndex] || 0);
  const signalLabel = ds?.signalLabels?.[dp.dataIndex] || getDimensionSignal(rawScore).label;

  const label = dp.label ?? "";
  const def =
    SUBDIMENSION_DEFINITIONS[label] ||
    (key && SUBDIMENSION_DEFINITIONS[key]) ||
    `Definition not found for "${label}"${key ? ` (expected key: ${key})` : ""}.`;

  const xScale = chart.scales.x;
  const rightPx = xScale.getPixelForValue(Number(dp.raw || 0));
  const yPx = tooltip.caretY != null ? tooltip.caretY : chart.height / 2;

  const rect = chart.canvas.getBoundingClientRect();
  el.innerHTML = `
    <button type="button" class="cdna-tooltip-close" aria-label="Close">&times;</button>
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="opacity:.9;margin-bottom:6px">Level: ${signalLabel}</div>
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

const axisTickLabels = {
  1: "Lower",
  2: "Good",
  3: "Strong",
  4: "Standout",
};

const tierGridPlugin = {
  id: "cdnaTierGrid",
  beforeDatasetsDraw(chart) {
    const xScale = chart.scales?.x;
    const area = chart.chartArea;
    if (!xScale || !area) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(203, 213, 225, 0.62)";
    ctx.lineWidth = 1;

    // Always draw all four tier gridlines (Lower/Good/Strong/Standout).
    [1, 2, 3, 4].forEach((value) => {
      const x = Math.round(xScale.getPixelForValue(value)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, area.top);
      ctx.lineTo(x, area.bottom);
      ctx.stroke();
    });

    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    // On narrow/phone charts, draw the four axis labels STAGGERED — Lower &
    // Strong higher, Good & Standout lower, each with a short connector line
    // down to its gridline — so all four fit without colliding.
    if (chart.width >= 480) return;
    const xScale = chart.scales?.x;
    const area = chart.chartArea;
    if (!xScale || !area) return;

    const ctx = chart.ctx;
    const labels = { 1: "Lower", 2: "Good", 3: "Strong", 4: "Standout" };
    ctx.save();
    ctx.font = '700 9px Geist, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = "#617089";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    [1, 2, 3, 4].forEach((value) => {
      const x = xScale.getPixelForValue(value);
      const low = value % 2 === 0; // Good(2) & Standout(4) sit lower
      const lineLen = low ? 15 : 4;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, area.bottom + 2);
      ctx.lineTo(x, area.bottom + lineLen);
      ctx.stroke();
      ctx.fillText(labels[value], x, area.bottom + lineLen + 3);
    });
    ctx.restore();
  },
};

export default function DimensionsCarousel({ dimensions, scores, maxPerDimension = 7 }) {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const trackRef = useRef(null);
  const touch = useRef({ x: 0, dragging: false });

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 900);
      setIsPhone(window.innerWidth < 600);
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", hideSubdimTooltip, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", hideSubdimTooltip);
    };
  }, []);

  const dims = useMemo(() => {
    const arr = Array.isArray(dimensions) ? dimensions : dimensions ? Object.values(dimensions) : [];
    const by = Object.fromEntries(arr.map((d) => [d.label, d]));
    return [
      by["Who You Are"] || arr[0],
      by["What You Love"] || arr[1],
      by["What Matters"] || arr[2],
      by["How You Work Best"] || arr[3],
    ].filter(Boolean);
  }, [dimensions]);

  const slides = useMemo(() => {
    return dims.map((dim) => {
      const rows = (dim?.subdimensions || []).map((sd) => {
        const raw = scores?.[sd.key] ?? scores?.[sd.label] ?? scores?.[sd.label?.toLowerCase?.()] ?? 0;
        const pct = Math.round(Math.max(0, Math.min(100, normalizePct(raw))));
        const signal = getDimensionSignal(pct);
        return { label: sd.label, value: signal.value, rawScore: pct, signalLabel: signal.label, key: sd.key };
      });
      rows.sort((a, b) => b.rawScore - a.rawScore);
      const picked = rows.slice(0, maxPerDimension);
      const metaKeys = picked.map((r) => r.key);
      const rawScores = picked.map((r) => r.rawScore);
      const signalLabels = picked.map((r) => r.signalLabel);
      const meta = DIMENSION_META[dim.label] || {};

      return {
        dimLabel: dim.label,
        lead: meta.lead || "Dimension",
        description: meta.description || "A core part of your CareerDNA profile.",
        image: meta.image,
        data: {
          labels: picked.map((r) => r.label),
          datasets: [
            {
              label: "Profile signal",
              data: picked.map((r) => r.value),
              backgroundColor: picked.map((r) => getBandColors(r.rawScore).bg),
              borderColor: picked.map((r) => getBandColors(r.rawScore).border),
              hoverBackgroundColor: picked.map((r) => getBandColors(r.rawScore).hover),
              hoverBorderColor: picked.map((r) => getBandColors(r.rawScore).hover),
              borderWidth: CDNA_BAR_BORDER_WIDTH,
              borderRadius: CDNA_BAR_RADIUS,
              barThickness: isMobile ? CDNA_BAR_THICKNESS_MOBILE : CDNA_BAR_THICKNESS_DESKTOP,
              maxBarThickness: isMobile ? CDNA_BAR_THICKNESS_MOBILE : CDNA_BAR_THICKNESS_DESKTOP,
              borderSkipped: false,
              inflateAmount: 1,
              clip: false,
              metaKeys,
              rawScores,
              signalLabels,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 650, easing: "easeOutQuart" },
          layout: { padding: { right: 24, left: 0, top: 8, bottom: isMobile ? 30 : 0 } },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false, external: externalTooltipRightOfBar },
          },
          interaction: { mode: "nearest", intersect: true, axis: "xy" },
          scales: {
            x: {
              beginAtZero: true,
              min: 0,
              max: AXIS_MAX,
              afterBuildTicks: (axis) => {
                axis.ticks = [0, 1, 2, 3, 4].map((value) => ({ value }));
              },
              grid: {
                display: false, /* the four tier lines are drawn by tierGridPlugin */
                drawTicks: false,
                color: (ctx) => {
                  const value = Number(ctx?.tick?.value || 0);
                  return value >= 1 && value <= 4 ? "rgba(203, 213, 225, 0.45)" : "transparent";
                },
                lineWidth: (ctx) => {
                  const value = Number(ctx?.tick?.value || 0);
                  return value >= 1 && value <= 4 ? 1 : 0;
                },
              },
              border: { display: false },
              ticks: {
                stepSize: 1,
                color: "#617089",
                padding: 6,
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
                font: { size: isMobile ? 9 : 12, weight: "700" },
                align: "center",
                // On mobile the labels are drawn STAGGERED by tierGridPlugin, so
                // suppress the default (single-row) ones here.
                callback: (value) => (isMobile ? "" : (axisTickLabels[value] || "")),
              },
            },
            y: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: "#334155",
                padding: 10,
                font: { size: isMobile ? 12 : 14, weight: "700" },
                callback: function (v) {
                  const label = this.getLabelForValue ? this.getLabelForValue(v) : String(v);
                  return truncate(label, isMobile ? 24 : 30);
                },
              },
            },
          },
        },
      };
    });
  }, [dims, scores, isMobile, maxPerDimension]);

  const slideWidthPct = 100 / (slides.length || 1);
  const go = useCallback(
    (to) => {
      hideSubdimTooltip();
      setIndex(Math.max(0, Math.min(slides.length - 1, to)));
    },
    [slides.length]
  );

  const onTouchStart = (e) => (touch.current = { x: e.touches[0].clientX, dragging: true });
  const onTouchMove = (e) => {
    if (!touch.current.dragging) return;
    const dx = e.touches[0].clientX - touch.current.x;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateX(calc(${-index * slideWidthPct}% + ${dx}px))`;
    }
  };
  const onTouchEnd = (e) => {
    if (!touch.current.dragging) return;
    touch.current.dragging = false;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const th = 50;
    if (dx < -th) go(index + 1);
    else if (dx > th) go(index - 1);
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 360ms ease";
      trackRef.current.style.transform = `translateX(${-index * slideWidthPct}%)`;
    }
  };

  return (
    <div
      style={{ width: "100%", margin: "0 auto", position: "relative", overflow: "hidden", borderRadius: 12, touchAction: "pan-y", overscrollBehaviorX: "contain" }}
      onMouseLeave={hideSubdimTooltip}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        role="tablist"
        aria-label="Dimensions"
        className="cdna-dim-tabs--scroll"
        style={{
          display: "flex",
          gap: isMobile ? 2 : 6,
          justifyContent: isMobile ? "flex-start" : "center",
          flexWrap: "nowrap",
          overflowX: "auto",
          borderBottom: "1px solid #e6eaf0",
          marginBottom: 12,
        }}
      >
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => go(i)}
            style={{
              flex: "0 0 auto",
              background: "transparent",
              border: "none",
              borderBottom: i === index ? "2px solid #2f6fed" : "2px solid transparent",
              color: i === index ? "#2f6fed" : "#5f6b7a",
              fontWeight: i === index ? 650 : 550,
              fontSize: isMobile ? "0.85rem" : "0.92rem",
              padding: isMobile ? "7px 10px" : "8px 14px",
              marginBottom: "-1px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
          >
            {s.dimLabel}
          </button>
        ))}
      </div>
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: `${slides.length * 100}%`,
          transform: `translateX(${-index * slideWidthPct}%)`,
          transition: "transform 360ms ease",
        }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            style={{ flex: `0 0 ${slideWidthPct}%`, minWidth: 0, padding: "6px 0 10px", boxSizing: "border-box" }}
          >
            <div style={dimensionHeaderStyle(isMobile)}>
              {s.image ? <img src={s.image} alt="" loading="lazy" style={dimensionImageStyle(isMobile)} /> : null}
              <div style={{ minWidth: 0 }}>
                <p style={dimensionDescriptionStyle(isMobile)}>{s.description}</p>
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 760, height: isMobile ? CHART_H_MOBILE : CHART_H_DESKTOP, margin: "16px auto 0" }}>
              <Bar data={s.data} options={s.options} plugins={[tierGridPlugin]} />
              <button aria-label="Previous" onClick={() => go(index - 1)} disabled={index === 0} style={chartArrowStyle("left", index === 0, isMobile)}>
                ‹
              </button>
              <button aria-label="Next" onClick={() => go(index + 1)} disabled={index === slides.length - 1} style={chartArrowStyle("right", index === slides.length - 1, isMobile)}>
                ›
              </button>
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: "0.72rem", fontWeight: 500, color: "#8a97a8" }}>
        {isMobile ? "Tap" : "Hover over"} a bar to see what it means
      </p>
    </div>
  );
}

function dimensionHeaderStyle(isMobile) {
  return {
    display: "flex",
    alignItems: "center",
    gap: isMobile ? 12 : 16,
    maxWidth: isMobile ? "100%" : 760,
    margin: "4px auto 16px auto",
    padding: isMobile ? "0 4px" : "0",
  };
}

function dimensionImageStyle(isMobile) {
  return {
    width: isMobile ? 58 : 70,
    height: isMobile ? 58 : 70,
    borderRadius: 16,
    objectFit: "cover",
    boxShadow: "none",
    flex: "0 0 auto",
  };
}

function dimensionDescriptionStyle(isMobile) {
  return {
    margin: "6px 0 0",
    fontSize: isMobile ? 13 : 15,
    lineHeight: 1.35,
    color: "#4b5c6b",
    fontWeight: 400,
  };
}

function arrowStyle(side, disabled, isMobile) {
  const base = {
    position: "absolute",
    width: isMobile ? 32 : 36,
    height: isMobile ? 32 : 36,
    borderRadius: 999,
    border: "1px solid #dbe4f0",
    background: disabled ? "rgba(248,250,252,0.82)" : "#fff",
    color: disabled ? "#a7b4c5" : "#10233f",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    cursor: disabled ? "default" : "pointer",
    fontSize: isMobile ? 22 : 26,
    lineHeight: isMobile ? "26px" : "30px",
    textAlign: "center",
    paddingBottom: 3,
    zIndex: 3,
    transition: "background 0.2s ease, color 0.2s ease",
  };
  // Mobile: both arrows sit together in the top-right corner, above the chart,
  // clear of the left-side category labels. Desktop: centred on the sides.
  if (isMobile) {
    return { ...base, top: 48, right: side === "right" ? 4 : 42 };
  }
  return { ...base, top: "58%", [side]: 10, transform: "translateY(-50%)" };
}

// Arrows anchored to the top corners of the graph itself (above the first bar),
// one on the left and one on the right — the same placement on every device, and
// robust to how the description wraps.
function chartArrowStyle(side, disabled, isMobile) {
  return {
    position: "absolute",
    top: -16,
    [side]: isMobile ? 2 : 6,
    width: isMobile ? 32 : 36,
    height: isMobile ? 32 : 36,
    borderRadius: 999,
    border: "1px solid #dbe4f0",
    background: disabled ? "rgba(248,250,252,0.82)" : "#fff",
    color: disabled ? "#a7b4c5" : "#10233f",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    cursor: disabled ? "default" : "pointer",
    fontSize: isMobile ? 22 : 26,
    lineHeight: isMobile ? "26px" : "30px",
    textAlign: "center",
    paddingBottom: 3,
    zIndex: 3,
    transition: "background 0.2s ease, color 0.2s ease",
  };
}
