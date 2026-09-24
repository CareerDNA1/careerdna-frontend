// src/Components/Survey/ResultsDimensionGrid.js
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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

/** <<< adjust once and forget >>> */
const CAROUSEL_MAX_WIDTH_DESKTOP = 820; // px (try 780–860)
const CAROUSEL_MAX_WIDTH_WIDE = 860;    // px (>=1280px screens)
const CAROUSEL_HEIGHT_MOBILE = 220;
const CAROUSEL_HEIGHT_DESKTOP = 240;

/* ---------- body-level floating tooltip (never clipped) ---------- */
function getOrCreateBodyTooltip() {
  let el = document.querySelector(".cdna-subdim-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-subdim-tooltip";
    Object.assign(el.style, {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "11px 13px",
      boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
      maxWidth: "320px",
      lineHeight: "1.45",
      fontSize: "13px",
      color: "#1f2a37",
      display: "none",
    });
    document.body.appendChild(el);
  }
  return el;
}

// Shorten long y-axis labels so they don't clip off-canvas
const truncateLabel = (str, max = 26) => {
  if (!str) return "";
  const s = String(str);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

/** External tooltip (uses subdimension KEY for definition lookup) */
function externalTooltipBound(ctx, defs, { isRightColumn }) {
  const { chart, tooltip } = ctx;
  const el = getOrCreateBodyTooltip();

  if (!tooltip || tooltip.opacity === 0) {
    el.style.display = "none";
    return;
  }
  const dp = tooltip.dataPoints?.[0];
  if (!dp) return;

  const dataset = chart.data.datasets[0];
  const key = dataset.keys?.[dp.dataIndex];
  const label = chart.data.labels[dp.dataIndex];
  const value = Math.round(dp.raw ?? 0);

  const def =
    (key && defs[key]) ||
    defs[label] ||
    defs[label?.toLowerCase?.()] ||
    "Hover to learn what this sub-dimension means.";

  el.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${label} — ${value}%</div><div>${def}</div>`;
  el.style.display = "block";

  const canvasRect = chart.canvas.getBoundingClientRect();
  const area = chart.chartArea;
  const caretX = tooltip.caretX ?? (area.left + area.right) / 2;
  const caretY = tooltip.caretY ?? (area.top + area.bottom) / 2;

  const pad = 12;
  const yLabelSafe = 120;

  let left;
  if (isRightColumn) {
    left = canvasRect.right + pad;
  } else {
    const caretViewportX = canvasRect.left + caretX;
    const minLeft = canvasRect.left + yLabelSafe + pad;
    left = Math.max(minLeft, caretViewportX + pad);
  }

  let top = canvasRect.top + caretY - el.offsetHeight / 2;

  const maxLeft = window.innerWidth - el.offsetWidth - 8;
  const maxTop = window.innerHeight - el.offsetHeight - 8;
  if (left > maxLeft) left = maxLeft;
  if (left < 8) left = 8;
  if (top > maxTop) top = maxTop;
  if (top < 8) top = 8;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

/**
 * ResultsDimensionGrid
 *
 * Props:
 *  - dimensions: array of 4 dimensions (with .label, .key, .subdimensions[])
 *  - scores: map of subdim key/label -> % (0-100 or 0-1)
 *  - definitions: map of subdim key/label -> string
 *  - maxPerDimension: number of bars to show per dimension (default 7)
 *  - title, intro: optional header text
 *  - layout: "grid" | "carousel"  (default "grid")
 */
export default function ResultsDimensionGrid({
  dimensions,
  scores,
  definitions = {},
  maxPerDimension = 7,
  title = "Your Profile by Dimension",
  intro = "Scores for all seven sub-dimensions in each core dimension. Hover a bar to learn what each one means.",
  layout = "grid",
}) {
  const [isMobile, setIsMobile] = useState(false);
  // Re-layout once web fonts are ready so label columns are measured with the
  // real font (see DimensionsCarousel for the phone clipping this prevents).
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!cancelled) setFontsReady(true); });
    else setFontsReady(true);
    return () => { cancelled = true; };
  }, []);
  const [isPhone, setIsPhone] = useState(false);
  const [index, setIndex] = useState(0); // for carousel
  const trackRef = useRef(null);
  const touch = useRef({ x: 0, dragging: false });

  // compute a max-width value in JS so it's bullet-proof and doesn't rely on external CSS loading order
  const [maxW, setMaxW] = useState(CAROUSEL_MAX_WIDTH_DESKTOP);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setMaxW(CAROUSEL_MAX_WIDTH_WIDE);
      else if (w <= 768) setMaxW(undefined); // full width on phones
      else setMaxW(CAROUSEL_MAX_WIDTH_DESKTOP);
      setIsMobile(w < 900);
      setIsPhone(w < 600);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const normalize = (v) => (v <= 1 ? v * 100 : v);
  const bgColor = (val) =>
    val >= 70
      ? "rgba(0, 200, 150, 0.85)"
      : val >= 60
      ? "rgba(75, 192, 192, 0.7)"
      : "rgba(200, 200, 200, 0.5)";
  const borderColor = (val) =>
    val >= 70 ? "rgba(0, 150, 120, 1)" : val >= 60 ? "rgba(75, 192, 192, 1)" : "rgba(160, 160, 160, 1)";

  // Canonical order
  const dims = useMemo(() => {
    const arr = Array.isArray(dimensions) ? dimensions : dimensions ? Object.values(dimensions) : [];
    const byLabel = Object.fromEntries(arr.map((d) => [d.label, d]));
    return [
      byLabel["Who You Are"] || arr[0],
      byLabel["What You Love"] || arr[1],
      byLabel["What Matters"] || arr[2],
      byLabel["How You Work Best"] || arr[3],
    ].filter(Boolean);
  }, [dimensions]);

  /** Build chart configs (reused by both grid and carousel) */
  const charts = useMemo(() => {
    return dims.map((dim, i) => {
      const list = (dim?.subdimensions || []).map((sd) => {
        const raw =
          scores?.[sd.key] ??
          scores?.[sd.label] ??
          scores?.[sd.label?.toLowerCase?.()] ??
          0;
        const pct = Math.round(Math.max(0, Math.min(100, normalize(raw))));
        return { key: sd.key, label: sd.label, value: pct };
      });

      list.sort((a, b) => b.value - a.value);
      const picked = list.slice(0, maxPerDimension);

      const labels = picked.map((r) => r.label);
      const values = picked.map((r) => r.value);
      const keys = picked.map((r) => r.key);

      const data = {
        labels,
        datasets: [
          {
            label: "Score (%)",
            data: values,
            keys,
            backgroundColor: values.map(bgColor),
            borderColor: values.map(borderColor),
            borderWidth: 1.4,
            borderRadius: 5,
            categoryPercentage: 0.66,
            barPercentage: 0.92,
          },
        ],
      };

      const isRightColumn = layout === "grid" ? i % 2 === 1 : false;

      const options = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 8, left: 2 } },
        animation: { duration: 650, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            enabled: false,
            external: (ctx) => externalTooltipBound(ctx, definitions, { isRightColumn }),
            intersect: false,
            mode: "nearest",
          },
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            grid: { color: "#eee" },
            ticks: {
              stepSize: 20,
              color: "#444",
              font: { size: isMobile ? 10 : 11 },
              callback: (val) => (val === 0 ? "" : `${val}%`),
            },
          },
          y: {
            grid: { display: false },
            afterFit: (scale) => {
              if (!isMobile) return;
              const w = scale.chart && scale.chart.width ? scale.chart.width : 0;
              if (w) scale.width = Math.max(scale.width, Math.round(w * 0.44));
            },
            ticks: {
              color: "#353535",
              font: { size: isMobile ? 10 : 11, weight: "600" },
              callback: function (value) {
                const label = this.getLabelForValue
                  ? this.getLabelForValue(value)
                  : String(value);
                return truncateLabel(label, isMobile ? 22 : 26);
              },
            },
          },
        },
      };

      return { dimKey: dim.key, dimLabel: dim.label, data, options };
    });
  }, [dims, scores, isMobile, definitions, maxPerDimension, layout, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------ Carousel handlers ------------------ */
  const go = useCallback(
    (to) => {
      const next = Math.max(0, Math.min(charts.length - 1, to));
      setIndex(next);
    },
    [charts.length]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (layout !== "carousel") return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    },
    [index, go, layout]
  );

  useEffect(() => {
    if (layout !== "carousel") return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown, layout]);

  // Basic touch swipe
  const onTouchStart = (e) => {
    if (layout !== "carousel") return;
    touch.current = { x: e.touches[0].clientX, dragging: true };
  };
  const onTouchMove = (e) => {
    if (!touch.current.dragging || layout !== "carousel") return;
    const dx = e.touches[0].clientX - touch.current.x;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
    }
  };
  const onTouchEnd = (e) => {
    if (!touch.current.dragging || layout !== "carousel") return;
    touch.current.dragging = false;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const threshold = 50;
    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    // snap back
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 380ms ease";
      trackRef.current.style.transform = `translateX(${-index * 100}%)`;
    }
  };

  /* ------------------ Rendering ------------------ */
  const header = (
    <header style={{ marginBottom: 10 }}>
      {title && <h2 style={{ margin: "0 0 6px 0", fontSize: "28px" }}>{title}</h2>}
      {intro && (
        <p style={{ margin: 0, color: "#555", fontSize: 14, lineHeight: 1.5 }}>
          {intro}
        </p>
      )}
    </header>
  );

  if (layout === "carousel") {
    // viewport that ENFORCES width (no dependency on external CSS)
    const viewportStyle = {
      width: "100%",
      maxWidth: maxW ? `${maxW}px` : "100%",
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
      borderRadius: 12,
    };

    return (
      <section style={{ width: "100%", marginTop: 24 }}>
        {header}

        <div
          style={viewportStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Track */}
          <div
            ref={trackRef}
            style={{
              display: "flex",
              width: `${charts.length * 100}%`,
              transform: `translateX(${-index * 100}%)`,
              transition: "transform 380ms ease",
            }}
          >
            {charts.map((c) => (
              <div
                key={c.dimKey}
                style={{
                  flex: "0 0 100%",
                  padding: "6px 8px 10px",
                  boxSizing: "border-box",
                }}
              >
                <h4 style={{ margin: "4px 0 8px 0", fontSize: 16, fontWeight: 700, textAlign: "left" }}>
                  {c.dimLabel}
                </h4>
                <div style={{ width: "100%", height: isMobile ? CAROUSEL_HEIGHT_MOBILE : CAROUSEL_HEIGHT_DESKTOP }}>
                  <Bar data={c.data} options={c.options} />
                </div>
              </div>
            ))}
          </div>

          {/* Arrows — hidden on phone (swipe + the dots below handle navigation
              there) so they don't sit on top of the bars. */}
          {!isPhone && (
            <>
              <button
                aria-label="Previous"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                style={arrowStyle("left", index === 0)}
              >
                ‹
              </button>
              <button
                aria-label="Next"
                onClick={() => go(index + 1)}
                disabled={index === charts.length - 1}
                style={arrowStyle("right", index === charts.length - 1)}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10, gap: 8 }}>
          {charts.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
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
      </section>
    );
  }

  // Default GRID (original 2x2)
  const topRow = charts.slice(0, 2);
  const botRow = charts.slice(2, 4);

  return (
    <section style={{ width: "100%", marginTop: 24 }}>
      {header}

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(340px,560px) minmax(340px,560px)",
          gap: 22,
          alignItems: "start",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        {[topRow, botRow].map((row, idx) =>
          row.map((c) => (
            <div key={`${idx}-${c.dimKey}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 700 }}>{c.dimLabel}</h4>
              <div style={{ width: "100%", height: isMobile ? 160 : 180 }}>
                <Bar data={c.data} options={c.options} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ---------- small helper for arrow buttons ---------- */
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
    background: disabled ? "rgba(255,255,255,0.7)" : "#fff",
    color: "#333",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: disabled ? "default" : "pointer",
    fontSize: 24,
    lineHeight: "32px",
    textAlign: "center",
    paddingBottom: 2,
  };
}
