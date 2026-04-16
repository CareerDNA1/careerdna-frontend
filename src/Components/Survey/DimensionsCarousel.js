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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_H_DESKTOP = 420;
const CHART_H_MOBILE = 260;

const truncate = (s, n = 30) =>
  String(s).length > n ? String(s).slice(0, n - 1) + "…" : s;

const normalizePct = (v) => (v <= 1 ? v * 100 : v);

function getDimensionLevel(v = 0) {
  if (v >= 70) return "Standout";
  if (v >= 60) return "Strong";
  if (v >= 50) return "Moderate";
  return "Lower";
}

function getBandColors(v = 0) {
  if (v >= 70) {
    return {
      bg: "rgba(48, 196, 176, 0.9)",
      border: "rgba(22, 153, 134, 1)",
    };
  }
  if (v >= 60) {
    return {
      bg: "rgba(72, 200, 184, 0.8)",
      border: "rgba(46, 164, 149, 1)",
    };
  }
  if (v >= 50) {
    return {
      bg: "rgba(120, 180, 220, 0.78)",
      border: "rgba(90, 150, 200, 1)",
    };
  }
  return {
    bg: "rgba(200, 200, 200, 0.52)",
    border: "rgba(160, 160, 160, 1)",
  };
}

function getOrCreateSubdimTooltip() {
  let el = document.querySelector(".cdna-subdim-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-subdim-tooltip";
    Object.assign(el.style, {
      position: "fixed",
      zIndex: 10000,
      pointerEvents: "none",
      background: "rgba(17,17,17,0.92)",
      color: "#fff",
      borderRadius: "10px",
      padding: "10px 12px",
      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
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

  const label = dp.label ?? "";
  const val =
    typeof dp.raw === "number"
      ? dp.raw
      : typeof dp.parsed?.x === "number"
      ? dp.parsed.x
      : 0;
  const def =
    (key && SUBDIMENSION_DEFINITIONS[key]) ||
    `Definition not found for "${label}"${key ? ` (expected key: ${key})` : ""}.`;

  const xScale = chart.scales.x;
  const rightPx = xScale.getPixelForValue(Number(val || 0));
  const yPx = tooltip.caretY != null ? tooltip.caretY : chart.height / 2;

  const rect = chart.canvas.getBoundingClientRect();
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="opacity:.9;margin-bottom:6px">Level: ${getDimensionLevel(Number(val) || 0)}</div>
    <div>${def}</div>
  `;
  el.style.left = `${rect.left + rightPx + 12}px`;
  el.style.top = `${rect.top + yPx - 14}px`;
  el.style.opacity = 1;
}

export default function DimensionsCarousel({ dimensions, scores, maxPerDimension = 7 }) {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const trackRef = useRef(null);
  const touch = useRef({ x: 0, dragging: false });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
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
        return { label: sd.label, value: pct, key: sd.key };
      });
      rows.sort((a, b) => b.value - a.value);
      const picked = rows.slice(0, maxPerDimension);
      const metaKeys = picked.map((r) => r.key);

      return {
        dimLabel: dim.label,
        data: {
          labels: picked.map((r) => r.label),
          datasets: [
            {
              label: "Profile level",
              data: picked.map((r) => r.value),
              backgroundColor: picked.map((r) => getBandColors(r.value).bg),
              borderColor: picked.map((r) => getBandColors(r.value).border),
              borderWidth: 1.4,
              borderRadius: 5,
              metaKeys,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 16, left: 2 } },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false, external: externalTooltipRightOfBar },
          },
          interaction: { mode: "index", intersect: false, axis: "y" },
          scales: {
            x: {
              beginAtZero: true,
              min: 0,
              max: 100,
              grid: { color: "#eee" },
              ticks: {
                stepSize: 20,
                color: "#444",
                font: { size: isMobile ? 10 : 12 },
                callback: (value) => `${value}%`,
              },
            },
            y: {
              grid: { display: false },
              ticks: {
                color: "#353535",
                font: { size: isMobile ? 12 : 14, weight: "600" },
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
      style={{ width: "100%", margin: "0 auto", position: "relative", overflow: "hidden", borderRadius: 12 }}
      onMouseLeave={hideSubdimTooltip}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
            style={{ flex: `0 0 ${slideWidthPct}%`, minWidth: 0, padding: "6px 8px 10px", boxSizing: "border-box" }}
          >
            <h4 style={{ margin: "4px 0 8px 0", fontSize: 16, fontWeight: 700, textAlign: "left" }}>{s.dimLabel}</h4>
            <div style={{ width: "100%", height: isMobile ? CHART_H_MOBILE : CHART_H_DESKTOP }}>
              <Bar data={s.data} options={s.options} />
            </div>
          </div>
        ))}
      </div>
      <button aria-label="Previous" onClick={() => go(index - 1)} disabled={index === 0} style={arrowStyle("left", index === 0)}>
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={() => go(index + 1)}
        disabled={index === slides.length - 1}
        style={arrowStyle("right", index === slides.length - 1)}
      >
        ›
      </button>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10, gap: 8 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              border: "none",
              background: i === index ? "#2f80ed" : "#cfd8e3",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function arrowStyle(side, disabled) {
  return {
    position: "absolute",
    top: "50%",
    [side]: 6,
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid #e1e1e1",
    background: disabled ? "rgba(240,240,240,0.8)" : "#fff",
    color: disabled ? "#999" : "#333",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: disabled ? "default" : "pointer",
    fontSize: 24,
    lineHeight: "32px",
    textAlign: "center",
    paddingBottom: 2,
    zIndex: 2,
    transition: "background 0.2s ease, color 0.2s ease",
  };
}
