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
      renderStatsSummary();
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

    const maxPlayCount = Math.max(...songs.map(s => s.stats.play));
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
      const y = getY(song.stats.play, yAxisMax, plotHeight, padding);
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

      ctx.fillStyle = '#8b6b4a';
      ctx.font = '12px "Noto Serif SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('播放量：' + formatPlayCount(song.stats.play), x, y + pointRadius + 10);

      const achievement = DATA.getAchievement(song.stats.play);
      if (achievement) {
        let achievementColor = '#666666';
        if (achievement === '殿堂') {
          achievementColor = '#2563eb';
        } else if (achievement === '传说') {
          achievementColor = '#d4a85c';
        } else if (achievement === '神话') {
          achievementColor = '#b85c4a';
        } else if (achievement === '申舌') {
          achievementColor = '#ff6b35';
        }
        
        ctx.fillStyle = achievementColor;
        ctx.font = 'bold 13px "Noto Serif SC"';
        ctx.fillText(achievement, x, y + pointRadius + 30);
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

    setupExportButton();
  }

  function setupExportButton() {
    const exportButton = document.getElementById('exportChart');
    if (!exportButton) return;

    exportButton.addEventListener('click', function() {
      const canvas = document.getElementById('mainChart');
      if (!canvas) return;

      // 创建一个新的Canvas，添加标题
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      
      // 计算新Canvas的尺寸（添加标题空间）
      const titleHeight = 80;
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height + titleHeight;
      
      // 填充白色背景
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // 添加标题
      exportCtx.fillStyle = '#b85c4a';
      exportCtx.font = '24px "Noto Serif SC"';
      exportCtx.textAlign = 'center';
      exportCtx.textBaseline = 'middle';
      exportCtx.fillText('📔《忘川风华录》音企原创曲概览', exportCanvas.width / 2, titleHeight / 2);
      
      // 绘制原始图表
      exportCtx.drawImage(canvas, 0, titleHeight);
      
      // 转换为PNG并下载
      const dataURL = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = '忘川风华录_音企原创曲概览.png';
      link.click();
    });
  }

  // ============ 动态统计摘要渲染 ============

  function renderStatsSummary() {
    const container = document.getElementById('statsSummary');
    if (!container || !DATA.songs) return;

    const songs = DATA.songs;

    // 辅助：计算 max/min/avg
    function calcStats(arr) {
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      return { max, min, avg };
    }

    // 找到最高/最低对应的歌曲名
    function findSongByStat(key, value) {
      const song = songs.find(s => s.stats[key] === value);
      return song ? song.name : '';
    }

    const playStats = calcStats(songs.map(s => s.stats.play));
    const danmakuStats = calcStats(songs.map(s => s.stats.danmaku));
    const likeStats = calcStats(songs.map(s => s.stats.like));
    const coinStats = calcStats(songs.map(s => s.stats.coin));
    const favoriteStats = calcStats(songs.map(s => s.stats.favorite));

    // 查找极值对应的歌曲
    const maxPlaySong = findSongByStat('play', playStats.max);
    const minPlaySong = findSongByStat('play', playStats.min);
    const maxDanmakuSong = findSongByStat('danmaku', danmakuStats.max);
    const minDanmakuSong = findSongByStat('danmaku', danmakuStats.min);
    const maxLikeSong = findSongByStat('like', likeStats.max);
    const minLikeSong = findSongByStat('like', likeStats.min);
    const maxCoinSong = findSongByStat('coin', coinStats.max);
    const minCoinSong = findSongByStat('coin', coinStats.min);
    const maxFavSong = findSongByStat('favorite', favoriteStats.max);
    const minFavSong = findSongByStat('favorite', favoriteStats.min);

    // 播放成就统计
    const achievementCount = {};
    songs.forEach(s => {
      const a = DATA.getAchievement(s.stats.play) || '未知';
      achievementCount[a] = (achievementCount[a] || 0) + 1;
    });

    // 成就排序和显示名映射
    const achievementOrder = ['神话', '申舌', '传说', '殿堂'];
    const achievementClass = {
      '神话': 'myth',
      '申舌': 'shenshe',
      '传说': 'legend',
      '殿堂': 'hall'
    };

    // 获取最新更新时间（取所有歌曲中最大的 last_updated）
    const dates = songs.map(s => s.last_updated).filter(Boolean);
    const latestDate = dates.length > 0 ? dates.sort().reverse()[0] : '未知';

    // 构建 HTML
    let html = '';

    // 统计部分
    html += '<div class="stats-section">';
    html += '<h3 class="stats-title">📊 原创曲统计</h3>';
    html += '<div class="stats-grid">';

    // 播放量
    html += '<div class="stat-item">';
    html += '<div class="stat-label">播放量</div>';
    html += '<div class="stat-value">最高：' + formatPlayCount(playStats.max) + '（' + maxPlaySong + '）</div>';
    html += '<div class="stat-value">最低：' + formatPlayCount(playStats.min) + '（' + minPlaySong + '）</div>';
    html += '<div class="stat-value">平均：' + formatPlayCount(playStats.avg) + '</div>';
    html += '</div>';

    // 弹幕数
    html += '<div class="stat-item">';
    html += '<div class="stat-label">弹幕数</div>';
    html += '<div class="stat-value">最高：' + formatPlayCount(danmakuStats.max) + '（' + maxDanmakuSong + '）</div>';
    html += '<div class="stat-value">最低：' + formatPlayCount(danmakuStats.min) + '（' + minDanmakuSong + '）</div>';
    html += '<div class="stat-value">平均：' + formatPlayCount(danmakuStats.avg) + '</div>';
    html += '</div>';

    // 点赞数
    html += '<div class="stat-item">';
    html += '<div class="stat-label">点赞数</div>';
    html += '<div class="stat-value">最高：' + formatPlayCount(likeStats.max) + '（' + maxLikeSong + '）</div>';
    html += '<div class="stat-value">最低：' + formatPlayCount(likeStats.min) + '（' + minLikeSong + '）</div>';
    html += '<div class="stat-value">平均：' + formatPlayCount(likeStats.avg) + '</div>';
    html += '</div>';

    // 投币数
    html += '<div class="stat-item">';
    html += '<div class="stat-label">投币数</div>';
    html += '<div class="stat-value">最高：' + formatPlayCount(coinStats.max) + '（' + maxCoinSong + '）</div>';
    html += '<div class="stat-value">最低：' + formatPlayCount(coinStats.min) + '（' + minCoinSong + '）</div>';
    html += '<div class="stat-value">平均：' + formatPlayCount(coinStats.avg) + '</div>';
    html += '</div>';

    // 收藏数
    html += '<div class="stat-item">';
    html += '<div class="stat-label">收藏数</div>';
    html += '<div class="stat-value">最高：' + formatPlayCount(favoriteStats.max) + '（' + maxFavSong + '）</div>';
    html += '<div class="stat-value">最低：' + formatPlayCount(favoriteStats.min) + '（' + minFavSong + '）</div>';
    html += '<div class="stat-value">平均：' + formatPlayCount(favoriteStats.avg) + '</div>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    // 播放成就
    html += '<div class="stats-section">';
    html += '<h3 class="stats-title">🏆 播放成就统计</h3>';
    html += '<div class="achievement-grid">';

    achievementOrder.forEach(key => {
      if (achievementCount[key]) {
        html += '<div class="achievement-item ' + (achievementClass[key] || '') + '">';
        html += '<span class="achievement-label">' + key + '</span>';
        html += '<span class="achievement-count">' + achievementCount[key] + '</span>';
        html += '</div>';
      }
    });

    html += '</div>';
    html += '</div>';

    // 说明部分
    html += '<div class="stats-section">';
    html += '<details class="note-text" style="margin-bottom:1rem;">';
    html += '<summary style="color:var(--c-gold);cursor:pointer;font-weight:600;font-size:1.3rem;">📝 图表说明</summary>';
    html += '<div style="margin-top:1rem;font-size:1rem;">';
    html += '<p><strong>对数刻度设计：</strong>为了让200万以下播放量的歌曲有更好的展示空间，本图表采用对数刻度（log₁₀），而非线性刻度。这样可以避免高播放量歌曲使图表过于压缩，同时更清晰地展示低播放量区间的变化趋势。</p>';
    html += '<p><strong>数据最后更新：</strong>' + latestDate + '</p>';
    html += '</div>';
    html += '</details>';
    html += '</div>';

    container.innerHTML = html;
  }

})();
