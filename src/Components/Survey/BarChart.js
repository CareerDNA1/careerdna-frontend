import React, { useEffect, useState } from "react";
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

function getProfileLevel(score = 0) {
  if (score >= 80) return "Standout";
  if (score > 70) return "Very strong";
  if (score >= 65) return "Strong";
  if (score >= 60) return "Moderate";
  return "Lower";
}

function getBandColors(score = 0) {
  if (score >= 80) {
    return {
      background: "rgba(0, 200, 150, 0.88)",
      border: "rgba(0, 150, 120, 1)",
    };
  }
  if (score > 70) {
    return {
      background: "rgba(35, 184, 167, 0.8)",
      border: "rgba(27, 144, 130, 1)",
    };
  }
  if (score >= 65) {
    return {
      background: "rgba(75, 192, 192, 0.72)",
      border: "rgba(75, 192, 192, 1)",
    };
  }
  if (score >= 60) {
    return {
      background: "rgba(120, 180, 220, 0.72)",
      border: "rgba(90, 150, 200, 1)",
    };
  }
  return {
    background: "rgba(200, 200, 200, 0.5)",
    border: "rgba(160, 160, 160, 1)",
  };
}

const archetypeDescriptions = {
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

function getOrCreateBodyTooltip() {
  let el = document.querySelector(".cdna-archetype-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "cdna-archetype-tooltip";
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
    <div style="font-weight:700;margin-bottom:6px">${label}</div>
    <div style="opacity:.9;margin-bottom:6px">Level: ${getProfileLevel(score)}</div>
    <div>${def}</div>
  `;

  el.style.left = `${rect.left + rightPx + 12}px`;
  el.style.top = `${rect.top + yPx - 14}px`;
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

  const data = {
    labels,
    datasets: [
      {
        label: "Profile level",
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 4,
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
    interaction: { mode: "index", intersect: false, axis: "y" },
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
        grid: { color: "#eee" },
      },
      y: {
        ticks: {
          color: "#444",
          font: { size: isMobile ? 14 : 16, weight: "700" },
        },
        grid: { display: false },
      },
    },
    layout: { padding: { right: 16 } },
  };

  return (
    <div
      style={{
        width: "680px",
        maxWidth: "100%",
        height: isMobile ? "320px" : "440px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseLeave={hideArchetypeTooltip}
    >
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;
