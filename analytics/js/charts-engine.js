/**
 * KRCE Virtual Tour Analytics - Charts Visualization Engine
 * Conforms to analytics/task.md specifications
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRCEChartsEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let charts = {
    labEngagement: null,
    hourlyTraffic: null,
    departmentShare: null,
    featureUsage: null
  };

  // Executive Corporate White & Blue Palette
  const COLORS = {
    corpBlueDeep: '#0A1E3F',
    corpBluePrimary: '#1E40AF',
    corpBlueBright: '#2563EB',
    corpBlueAccent: '#3B82F6',
    corpBlueSky: '#60A5FA',
    corpBlueSoft: '#EFF6FF',
    accentLightBlue: '#96C0E6',
    accentGreen: '#16A34A',
    accentMaroon: '#DC2626',
    accentOrange: '#EA580C',
    accentPurple: '#7C3AED',
    cardInner: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    borderLight: 'rgba(226, 232, 240, 0.85)'
  };

  const FONT_FAMILY = "'Space Grotesk', 'Satoshi', sans-serif";
  const FONT_BODY = "'Satoshi', 'Space Grotesk', sans-serif";

  // Set global Chart.js default font and enforce 100% horizontal labels (no diagonal tilt)
  if (typeof Chart !== 'undefined' && Chart.defaults) {
    if (Chart.defaults.font) {
      Chart.defaults.font.family = FONT_FAMILY;
    }
  }

  // Shared Corporate Chart.js defaults with Crisp White Card Tooltips
  function getSharedOptions(extraOptions) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          labels: {
            color: COLORS.textSecondary,
            font: { family: FONT_FAMILY, size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: COLORS.corpBlueDeep,
          bodyColor: COLORS.corpBluePrimary,
          borderColor: '#BFDBFE',
          borderWidth: 1.5,
          padding: 12,
          cornerRadius: 10,
          boxPadding: 4,
          titleFont: { family: FONT_FAMILY, weight: 'bold', size: 13 },
          bodyFont: { family: FONT_BODY, size: 12 }
        }
      }
    }, extraOptions || {});
  }

  // 1. Top Explored Laboratories (Horizontal Bar Chart)
  function renderLabEngagementChart(canvasId, labsData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts.labEngagement) charts.labEngagement.destroy();

    // Universal Dynamic Ranking:
    // Sort all panoramas:
    // 1. Highest views first (any visited room immediately appears at the top!)
    // 2. Highest dwell time second
    const allLabs = Array.isArray(labsData) ? labsData.slice() : [];
    allLabs.sort((a, b) => {
      const vDiff = (b.views || 0) - (a.views || 0);
      if (vDiff !== 0) return vDiff;
      return (b.dwellTimeSec || 0) - (a.dwellTimeSec || 0);
    });

    // Dynamic Display Window:
    // Any panorama that has received views is displayed at the top immediately!
    // Plus unvisited viewpoints up to 25 so users see available rooms
    const visited = allLabs.filter(l => (l.views || 0) > 0);
    const displayCount = Math.max(12, Math.min(31, visited.length + 6));
    const topLabs = allLabs.slice(0, Math.min(displayCount, allLabs.length));

    const labels = topLabs.map(l => l.name);
    const dataValues = topLabs.map(l => l.views || 0);

    const PALETTE = [
      'rgba(37, 99, 235, 0.9)',
      'rgba(30, 64, 175, 0.9)',
      'rgba(2, 132, 199, 0.9)',
      'rgba(13, 148, 136, 0.9)',
      'rgba(16, 185, 129, 0.9)',
      'rgba(79, 70, 229, 0.9)',
      'rgba(124, 58, 237, 0.9)',
      'rgba(217, 70, 239, 0.9)',
      'rgba(234, 88, 12, 0.9)',
      'rgba(225, 29, 72, 0.9)'
    ];
    const BORDER_PALETTE = [
      '#2563EB', '#1E40AF', '#0284C7', '#0D9488', '#10B981',
      '#4F46E5', '#7C3AED', '#D946EF', '#EA580C', '#E11D48'
    ];

    const bgColors = topLabs.map((_, i) => PALETTE[i % PALETTE.length]);
    const borderColors = topLabs.map((_, i) => BORDER_PALETTE[i % BORDER_PALETTE.length]);

    charts.labEngagement = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Views',
          data: dataValues,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 8,
          minBarLength: 3
        }]
      },
      options: getSharedOptions({
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(148, 163, 184, 0.15)',
              borderDash: [4, 4],
              drawBorder: false
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
              precision: 0,
              color: COLORS.textMuted,
              font: { family: FONT_FAMILY, size: 10 },
              callback: function (val) {
                if (Math.floor(val) !== val) return '';
                return val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val;
              }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              color: COLORS.textPrimary,
              font: { family: FONT_FAMILY, size: 10, weight: '600' }
            }
          }
        }
      })
    });
  }

  // 2. Hourly Traffic / Visitor Distribution (Smooth Line Area Chart)
  function renderHourlyTrafficChart(canvasId, hourlyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts.hourlyTraffic) charts.hourlyTraffic.destroy();

    const labels = hourlyData.map(h => h.hour);
    const views = hourlyData.map(h => h.views);

    // Corporate Royal Blue Gradient
    const chartCtx = ctx.getContext('2d');
    const gradient = chartCtx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
    gradient.addColorStop(0.7, 'rgba(37, 99, 235, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    charts.hourlyTraffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hourly Visitors',
          data: views,
          fill: true,
          backgroundColor: gradient,
          borderColor: COLORS.corpBlueBright,
          borderWidth: 2.5,
          tension: 0.4,
          pointBackgroundColor: COLORS.corpBluePrimary,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        }]
      },
      options: getSharedOptions({
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              color: COLORS.textMuted,
              font: { family: FONT_FAMILY, size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(148, 163, 184, 0.15)',
              borderDash: [4, 4],
              drawBorder: false
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 5,
              precision: 0,
              color: COLORS.textMuted,
              font: { family: FONT_FAMILY, size: 10 },
              callback: function (val) {
                if (Math.floor(val) !== val) return '';
                return val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val;
              }
            }
          }
        }
      })
    });
  }

  // 3. Department Engagement Share (Donut Chart - 100% Dynamic)
  function renderDepartmentShareChart(canvasId, departments, liveShares) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts.departmentShare) charts.departmentShare.destroy();

    const labels = (departments || []).map(d => (typeof d === 'string' ? d : (d.shortName || d.name || 'Category')));
    const shares = Array.isArray(liveShares) && liveShares.length ? liveShares : labels.map(() => 0);

    const DONUT_PALETTE = [
      '#1E40AF', '#2563EB', '#0284C7', '#0D9488', '#4F46E5', '#60A5FA',
      '#7C3AED', '#D946EF', '#EA580C', '#10B981', '#E11D48', '#F59E0B'
    ];
    const bgColors = labels.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length]);

    charts.departmentShare = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: shares,
          backgroundColor: bgColors,
          borderColor: '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: getSharedOptions({
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 14,
              color: COLORS.textSecondary,
              font: { family: FONT_FAMILY, size: 11, weight: '600' }
            }
          }
        }
      })
    });
  }

  // 4. Feature & Dock Interaction Split (Horizontal Ranked Bar Chart)
  function renderFeatureUsageChart(canvasId, features) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts.featureUsage) charts.featureUsage.destroy();

    const featureItems = [
      { name: 'Street View', key: 'streetView', val: (features && features.streetView) || 0, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.9)' },
      { name: 'Campus Portal', key: 'campusPortal', val: (features && features.campusPortal) || 0, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.9)' },
      { name: 'Audio Guide', key: 'audioGuide', val: (features && features.audioGuide) || 0, color: '#0D9488', bg: 'rgba(13, 148, 136, 0.9)' },
      { name: 'Compass Nav', key: 'compassNav', val: (features && features.compassNav) || 0, color: '#10B981', bg: 'rgba(16, 185, 129, 0.9)' },
      { name: 'Hotspots', key: 'hotspotClicks', val: (features && features.hotspotClicks) || 0, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.9)' },
      { name: 'Social Share', key: 'socialShare', val: (features && features.socialShare) || 0, color: '#E11D48', bg: 'rgba(225, 29, 72, 0.9)' }
    ];

    // Dynamic auto-rank: features with higher clicks float to the top
    featureItems.sort((a, b) => b.val - a.val);

    const labels = featureItems.map(f => f.name);
    const values = featureItems.map(f => f.val);
    const bgColors = featureItems.map(f => f.bg);
    const borderColors = featureItems.map(f => f.color);

    charts.featureUsage = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Interactions',
          data: values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
          minBarLength: 3
        }]
      },
      options: getSharedOptions({
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(148, 163, 184, 0.15)',
              borderDash: [4, 4],
              drawBorder: false
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
              precision: 0,
              color: COLORS.textMuted,
              font: { family: FONT_FAMILY, size: 10 },
              callback: function (val) {
                if (Math.floor(val) !== val) return '';
                return val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val;
              }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              color: COLORS.textPrimary,
              font: { family: FONT_FAMILY, size: 11, weight: '600' }
            }
          }
        }
      })
    });
  }

  // Single chart high-res PNG export helper
  function exportChartImage(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = (filename || canvasId) + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return {
    charts: charts,
    exportChartImage: exportChartImage,
    renderLabEngagementChart: renderLabEngagementChart,
    renderHourlyTrafficChart: renderHourlyTrafficChart,
    renderDepartmentShareChart: renderDepartmentShareChart,
    renderFeatureUsageChart: renderFeatureUsageChart
  };
});
