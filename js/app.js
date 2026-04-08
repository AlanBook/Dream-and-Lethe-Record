(function() {
  "use strict";

  const COLORS = [
    "#b85c4a", "#d4a85c", "#8b6b4a", "#d48a9e", "#3d2a4a",
    "#c9a87a", "#8b5a3a", "#e8c88a", "#5a3a3a", "#64748b",
    "#10b981", "#8b5cf6", "#2563eb"
  ];

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof DATA !== 'undefined' && DATA.songs) {
      drawChart();
    }
    initTabs();
    setupReveal();
  });
  
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button[data-tab]');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        const parent = button.closest('.tabs-container').parentElement;
        
        parent.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        parent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  function setupReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    els.forEach(el => observer.observe(el));
  }

  function formatPlayCount(count) {
    if (count >= 10000) {
      return (count / 10000).toFixed(count % 10000 === 0 ? 0 : 1) + '万';
    }
    return count.toString();
  }

  function drawCurveLine(ctx, points) {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    
    ctx.stroke();
  }

  function getY(playCount, yAxisMax, plotHeight, padding) {
    const logMin = Math.log10(50000);
    const logMax = Math.log10(yAxisMax);
    const logValue = Math.log10(Math.max(playCount, 50000));
    const ratio = (logValue - logMin) / (logMax - logMin);
    return padding.top + plotHeight - ratio * plotHeight;
  }

  function drawChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    const songs = DATA.songs;
    const producers = DATA.producers;

    const padding = { top: 60, right: 40, bottom: 280, left: 80 };
    const songWidth = 120;
    const chartWidth = padding.left + padding.right + songs.length * songWidth;
    const chartHeight = 950;

    canvas.width = chartWidth;
    canvas.height = chartHeight;

    const container = document.getElementById('chartContainer');
    if (container) {
      canvas.style.width = chartWidth + 'px';
      canvas.style.height = chartHeight + 'px';
    }

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chartWidth, chartHeight);

    const maxPlayCount = Math.max(...songs.map(s => s.play_count));
    const yAxisMax = Math.max(Math.ceil(maxPlayCount / 1000000) * 1000000, 12000000);
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const plotWidth = songs.length * songWidth;

    const yTicks = [0, 500000, 1000000, 2000000, 4000000, 6000000, 8000000, 10000000, 12000000];
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < yTicks.length; i++) {
      const y = getY(yTicks[i], yAxisMax, plotHeight, padding);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      ctx.fillStyle = '#666666';
      ctx.font = '12px "Noto Serif SC"';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatPlayCount(yTicks[i]), padding.left - 10, y);
    }

    const points = [];
    const pointRadius = 8;
    songs.forEach((song, i) => {
      const x = padding.left + i * songWidth + songWidth / 2;
      const y = getY(song.play_count, yAxisMax, plotHeight, padding);
      points.push({ x, y });

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointRadius * 2);
      gradient.addColorStop(0, 'rgba(212, 168, 92, 0.8)');
      gradient.addColorStop(1, 'rgba(212, 168, 92, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d4a85c';
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(x, y - pointRadius - 35);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#333333';
      ctx.font = '14px "Noto Serif SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(song.name, 0, 0);
      ctx.restore();

      const playCountDisplay = song.play_count_display;
      let displayText = '播放量：';
      if (playCountDisplay.includes('万')) {
        displayText += playCountDisplay;
      } else {
        displayText += formatPlayCount(parseFloat(playCountDisplay) || song.play_count);
      }

      ctx.fillStyle = '#8b6b4a';
      ctx.font = '12px "Noto Serif SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(displayText, x, y + pointRadius + 10);

      if (song.achievement) {
        let achievementColor = '#666666';
        if (song.achievement === '殿堂') {
          achievementColor = '#2563eb';
        } else if (song.achievement === '传说') {
          achievementColor = '#d4a85c';
        } else if (song.achievement === '神话') {
          achievementColor = '#b85c4a';
        } else if (song.achievement === '申舌') {
          achievementColor = '#ff6b35';
        }
        
        ctx.fillStyle = achievementColor;
        ctx.font = 'bold 13px "Noto Serif SC"';
        ctx.fillText(song.achievement, x, y + pointRadius + 30);
      }
    });

    if (points.length > 1) {
      ctx.strokeStyle = 'rgba(212, 168, 92, 0.6)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawCurveLine(ctx, points);
    }

    songs.forEach((song, i) => {
      const x = padding.left + i * songWidth + songWidth / 2;
      ctx.fillStyle = '#666666';
      ctx.font = '11px "Noto Serif SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.save();
      ctx.translate(x, padding.top + plotHeight + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(song.date, 0, 0);
      ctx.restore();
    });

    const producerBarY = padding.top + plotHeight + 110;
    const producerBarHeight = 50;

    producers.forEach((prod, i) => {
      const startX = padding.left + prod.start_idx * songWidth;
      const endX = padding.left + (prod.end_idx + 1) * songWidth;
      const width = endX - startX;
      const color = COLORS[i % COLORS.length];

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(startX, producerBarY, width, producerBarHeight);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, producerBarY, width, producerBarHeight);

      const label = prod.producer || '未知';
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Noto Serif SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxWidth = width - 10;
      let displayLabel = label;
      if (ctx.measureText(displayLabel).width > maxWidth) {
        while (displayLabel.length > 0 && ctx.measureText(displayLabel + '…').width > maxWidth) {
          displayLabel = displayLabel.slice(0, -1);
        }
        displayLabel += '…';
      }

      ctx.fillText(displayLabel, startX + width / 2, producerBarY + producerBarHeight / 2);
    });

    ctx.fillStyle = '#333333';
    ctx.font = '16px "Noto Serif SC"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('企划运营/制作人', padding.left, producerBarY - 8);

    ctx.fillStyle = '#333333';
    ctx.font = '14px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.save();
    ctx.translate(25, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('播放量', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#333333';
    ctx.font = '16px "Noto Serif SC"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('发布时间', padding.left, padding.top + plotHeight + 55);
  }
})();
