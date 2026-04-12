// 导出人物统计分析图表为PNG的脚本
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const XLSX = require('xlsx');

function drawBarChart(data, title, outputPath) {
  const labels = data.map(item => item.name);
  const values = data.map(item => item.value);
  
  // 设置canvas尺寸
  const width = Math.max(labels.length * 60 + 200, 800);
  const height = 500;
  
  // 创建canvas对象
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 设置边距
  const padding = { top: 60, right: 40, bottom: 120, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 清空画布
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // 绘制标题
  ctx.fillStyle = '#333';
  ctx.font = '20px "Noto Serif SC"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`📊 ${title}`, width / 2, 20);
  
  // 计算最大值
  const maxValue = Math.max(...values);
  
  // 绘制网格线
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
  
  // 绘制坐标轴
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();
  
  // 绘制柱状图
  const barCount = labels.length;
  const barWidth = Math.max(30, (chartWidth / barCount) - 8);
  const gap = (chartWidth - barWidth * barCount) / (barCount + 1);
  
  labels.forEach((label, index) => {
    const x = padding.left + gap + (barWidth + gap) * index;
    const barHeight = (values[index] / maxValue) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    
    // 绘制柱子
    ctx.fillStyle = '#3d2a4a';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 绘制柱子边框
    ctx.strokeStyle = '#2a1a33';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // 绘制数值
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(values[index].toString(), x + barWidth / 2, y - 5);
    
    // 绘制标签
    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + chartHeight + 15);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#333';
    ctx.font = '12px "Noto Serif SC"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
  
  // 转换为PNG并保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`已导出: ${outputPath}`);
}

function loadExcelData(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const data = [];
  // 第一行是表头，从第二行开始读取数据
  for (let i = 1; i < json.length; i++) {
    if (json[i] && json[i].length >= 2) {
      data.push({
        name: json[i][0],
        value: parseInt(json[i][1]) || 0
      });
    }
  }
  
  return data;
}

// 加载数据并导出图表
const occupationData = loadExcelData(path.join(__dirname, '第四部分', '主要印象职业身份统计结果.xlsx'));
const dynastyData = loadExcelData(path.join(__dirname, '第四部分', '朝代分布统计结果.xlsx'));

// 导出职业身份分布图表
drawBarChart(
  occupationData,
  '人物统计分析 - 职业身份分布',
  path.join(__dirname, '展示图表', '人物统计分析_职业身份分布.png')
);

// 导出朝代分布图表
drawBarChart(
  dynastyData,
  '人物统计分析 - 朝代分布',
  path.join(__dirname, '展示图表', '人物统计分析_朝代分布.png')
);

console.log('所有人物统计分析图表导出完成！');
