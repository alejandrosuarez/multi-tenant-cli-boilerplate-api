import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import './Charts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Common chart options with neumorphic styling
const getCommonOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'system-ui, -apple-system, sans-serif'
        }
      }
    },
    title: {
      display: !!title,
      text: title,
      font: {
        size: 16,
        weight: 'bold',
        family: 'system-ui, -apple-system, sans-serif'
      },
      padding: {
        top: 10,
        bottom: 30
      }
    },
    tooltip: {
      backgroundColor: 'rgba(240, 240, 243, 0.95)',
      titleColor: '#333',
      bodyColor: '#333',
      borderColor: '#bebebe',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(190, 190, 190, 0.3)',
        drawBorder: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(190, 190, 190, 0.3)',
        drawBorder: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    }
  }
});

// Line Chart Component
export const LineChart = ({ data, title, height = 300, gradient = false }) => {
  const options = {
    ...getCommonOptions(title),
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  // Add gradient fill if requested
  const processedData = gradient ? {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, dataset.borderColor + '40');
        gradient.addColorStop(1, dataset.borderColor + '00');
        return gradient;
      }
    }))
  } : data;

  return (
    <div className="chart-container" style={{ height }}>
      <Line data={processedData} options={options} />
    </div>
  );
};

// Bar Chart Component
export const BarChart = ({ data, title, height = 300, horizontal = false }) => {
  const options = {
    ...getCommonOptions(title),
    indexAxis: horizontal ? 'y' : 'x',
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false
      }
    }
  };

  return (
    <div className="chart-container" style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Doughnut Chart Component
export const DoughnutChart = ({ data, title, height = 300, cutout = '60%' }) => {
  const options = {
    ...getCommonOptions(title),
    cutout,
    plugins: {
      ...getCommonOptions(title).plugins,
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  // Remove scales for doughnut chart
  delete options.scales;

  return (
    <div className="chart-container" style={{ height }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({ data, title, height = 300 }) => {
  const options = {
    ...getCommonOptions(title),
    plugins: {
      ...getCommonOptions(title).plugins,
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  // Remove scales for pie chart
  delete options.scales;

  return (
    <div className="chart-container" style={{ height }}>
      <Pie data={data} options={options} />
    </div>
  );
};

// Metric Card Component for displaying single metrics
export const MetricCard = ({ title, value, change, changeType, icon, color = '#007bff' }) => {
  const changeColor = changeType === 'positive' ? '#28a745' : changeType === 'negative' ? '#dc3545' : '#6c757d';
  
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon" style={{ color }}>
          {icon}
        </div>
        <div className="metric-title">{title}</div>
      </div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className="metric-change" style={{ color: changeColor }}>
          <span className="change-indicator">
            {changeType === 'positive' ? '↗' : changeType === 'negative' ? '↘' : '→'}
          </span>
          {change}
        </div>
      )}
    </div>
  );
};

// Chart Grid Component for organizing multiple charts
export const ChartGrid = ({ children, columns = 2 }) => {
  return (
    <div className="chart-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children}
    </div>
  );
};

// Chart utilities for data processing
export const chartUtils = {
  // Generate color palette
  generateColors: (count, opacity = 1) => {
    const colors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
      '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const color = colors[i % colors.length];
      return opacity < 1 ? color + Math.floor(opacity * 255).toString(16).padStart(2, '0') : color;
    });
  },

  // Format data for time series
  formatTimeSeriesData: (data, labelKey = 'date', valueKey = 'value') => {
    return {
      labels: data.map(item => item[labelKey]),
      datasets: [{
        data: data.map(item => item[valueKey]),
        borderColor: '#007bff',
        backgroundColor: '#007bff20',
        fill: true
      }]
    };
  },

  // Format data for category comparison
  formatCategoryData: (data, labelKey = 'category', valueKey = 'value', colors = null) => {
    const generatedColors = colors || chartUtils.generateColors(data.length);
    
    return {
      labels: data.map(item => item[labelKey]),
      datasets: [{
        data: data.map(item => item[valueKey]),
        backgroundColor: generatedColors,
        borderColor: generatedColors.map(color => color.replace(/20$/, '')),
        borderWidth: 2
      }]
    };
  },

  // Calculate percentage change
  calculateChange: (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1) + '%',
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    };
  }
};

export default {
  LineChart,
  BarChart,
  DoughnutChart,
  PieChart,
  MetricCard,
  ChartGrid,
  chartUtils
};