import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Legend,
  Cell,
} from "recharts";

/**
 * ResultsDimensionChart
 * Vertical bar chart grouped by the four main dimensions.
 * Shows up to N subdimensions (default 7) with scores (0–100).
 */
export default function ResultsDimensionChart({
  dimensions,
  scores,
  maxPerDimension = 7,
  title = "Dimension Profile (by Subdimension)",
}) {
  const { data, xKey, yKey, legendItems } = useMemo(() => {
    const xKey = "slug";
    const yKey = "score";

    // Ensure we have an array of dimensions
    const dims = Array.isArray(dimensions)
      ? dimensions
      : dimensions
      ? Object.values(dimensions)
      : [];

    const palette = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"];
    const normalize = (v) => (v <= 1 ? v * 100 : v);

    const rows = [];

    dims.forEach((dim, di) => {
      const subs = (dim.subdimensions || []).map((sd) => ({
        ...sd,
        // default missing scores to 0 so we still render bars/axes
        score: scores?.[sd.key] ?? 0,
      }));

      subs.sort((a, b) => normalize(b.score) - normalize(a.score));
      const picked = subs.slice(0, maxPerDimension);

      picked.forEach((sd, i) => {
        const score100 = Math.max(0, Math.min(100, normalize(sd.score)));
        rows.push({
          slug: `${dim.key}__${sd.key}`,
          score: score100,
          dimensionKey: dim.key,
          dimensionLabel: dim.label,
          subdimensionKey: sd.key,
          subdimensionLabel: sd.label,
          subdimensionShort: sd.shortLabel || sd.label,
          color: palette[di % palette.length],
          orderInDim: i,
        });
      });
    });

    const legendItems = dims.map((d, i) => ({
      id: d.key,
      type: "square",
      value: d.label,
      color: ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"][i % 4],
    }));

    return { data: rows, xKey, yKey, legendItems };
  }, [dimensions, scores, maxPerDimension]);

  return (
    <div style={{ width: "100%" }}>
      {title ? (
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
      ) : null}

      {/* Give the chart a real height so ResponsiveContainer can render */}
      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 64 }}>
            <CartesianGrid strokeDasharray="3 3" />

            <Legend
              verticalAlign="top"
              align="left"
              payload={legendItems}
              wrapperStyle={{ paddingBottom: 8 }}
            />

            <XAxis
              dataKey={xKey}
              interval={0}
              angle={-38}
              textAnchor="end"
              height={60}
              tick={({ x, y, payload }) => {
                const item = data[payload.index];
                const label = item?.subdimensionShort || payload.value;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text fontSize={12} transform="rotate(-38)" textAnchor="end" fill="#334155">
                      {label}
                    </text>
                  </g>
                );
              }}
            />

            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}`} width={32} />

            <Tooltip
              formatter={(value, _name, { payload }) => [
                `${Math.round(value)} / 100`,
                payload.subdimensionLabel,
              ]}
              labelFormatter={(slug) => {
                const item = data.find((d) => d.slug === slug);
                return item ? `${item.dimensionLabel}` : slug;
              }}
            />

            <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey={yKey}
                position="top"
                formatter={(v) => `${Math.round(v)}`}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
