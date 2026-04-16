import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = ({ archetypes }) => {
  if (!archetypes || typeof archetypes !== 'object') return null;

  const labels = Object.keys(archetypes);
  const values = Object.values(archetypes);

  const data = {
    labels,
    datasets: [
      {
        label: 'Archetype Match (%)',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 20, color: '#999' },
        pointLabels: { font: { size: 14 }, color: '#ddd' },
        grid: { color: '#444' },
      },
    },
    plugins: {
      legend: { labels: { color: '#ccc' } },
    },
  };

  return (
    <div style={{ maxWidth: 600, margin: '30px auto' }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChart;