// 导出音乐数据统计图表为PNG的脚本
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 读取统计数据
const statsDataContent = fs.readFileSync(path.join(__dirname, 'js', 'stats_data.js'), 'utf8');

// 提取STATS_DATA对象
const statsDataMatch = statsDataContent.match(/const STATS_DATA = (\{[\s\S]*\});/);
if (!statsDataMatch) {
  console.error('无法提取STATS_DATA');
  process.exit(1);
}

// 直接使用Function构造函数来解析，更安全
const STATS_DATA = new Function('return ' + statsDataMatch[1])();

const STATS_COLORS = {
  "作词": "#EE0000",
  "作曲": "#66ccff",
  "编曲": "#00FFCC",
  "调校": "#006666",
  "演唱": "#0080FF"
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getGradientColors(baseColor, count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const alpha = 1 - (i / count) * 0.6;
    colors.push(hexToRgba(baseColor, Math.max(alpha, 0.4)));
  }
  return colors;
}

function drawStatsChart(data, primaryColor, tabName) {
  // 设置canvas尺寸
  let totalWidth = data.length * 60 + 200;
  const width = Math.max(totalWidth, 1000);
  const height = 500;
  
  // 创建canvas对象
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const padding = { top: 40, right: 40, bottom: 120, left: 60 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxValue = Math.max(...data.map(d => d.count));
  const barCount = data.length;
  const barWidth = Math.max(30, (chartWidth / barCount) - 8);
  const gap = (chartWidth - barWidth * barCount) / (barCount + 1);
  const colors = getGradientColors(primaryColor, barCount);
  
  let highlightCount = 3;
  if (tabName === '作词') {
    highlightCount = 5;
  } else if (tabName === '调校') {
    highlightCount = 2;
  }

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const y = padding.top + (chartHeight / yTicks) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '12px "Noto Serif SC"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const value = Math.round(maxValue - (maxValue / yTicks) * i);
    ctx.fillText(value.toString(), padding.left - 10, y);
  }

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  data.forEach((item, index) => {
    const x = padding.left + gap + (barWidth + gap) * index;
    const barHeight = (item.count / maxValue) * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    ctx.fillStyle = colors[index];
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.strokeStyle = hexToRgba(primaryColor, 0.8);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(item.count.toString(), x + barWidth / 2, y - 5);

    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + chartHeight + 15);
    ctx.rotate(-Math.PI / 4);
    
    if (index < highlightCount) {
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 16px "Noto Serif SC"';
    } else {
      ctx.fillStyle = '#333';
      ctx.font = '14px "Noto Serif SC"';
    }
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, 0, 0);
    ctx.restore();
  });

  // 添加标题
  ctx.fillStyle = '#333';
  ctx.font = '20px "Noto Serif SC"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`🎵 音乐数据统计 - ${tabName}`, width / 2, 10);

  // 转换为PNG并保存
  const dataURL = canvas.toDataURL('image/png');
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  const outputPath = path.join(__dirname, '展示图表', `音乐数据统计_${tabName}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`已导出: ${outputPath}`);
}

// 导出所有图表
const tabs = ['作词', '作曲', '编曲', '调校', '演唱'];
tabs.forEach(tab => {
  drawStatsChart(STATS_DATA[tab], STATS_COLORS[tab], tab);
});

console.log('所有图表导出完成！');
