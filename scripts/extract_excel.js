/**
 * 从 Excel 文件提取歌曲数据，生成新版 data.js
 * 
 * 用法: node scripts/extract_excel.js
 * 
 * 从 收集的公开数据/忘川风华录_视频数据完全版.xlsx 的 Sheet1 提取：
 *   - 歌曲名称 → name
 *   - 链接 → 提取 BVID
 *   - 发布时间 → date
 *   - 播放量2 → stats.play (数值)
 *   - 弹幕数2 → stats.danmaku
 *   - 点赞数2 → stats.like
 *   - 投币数2 → stats.coin
 *   - 收藏数2 → stats.favorite
 *   - 播放成就 → achievement
 *   - 企划运营/制作人 → producer
 * 
 * 输出: data/snapshot_2026-07-28.js（带日期快照），同时更新 js/data.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '..', '收集的公开数据', '忘川风华录_视频数据完全版.xlsx');
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const DATA_DIR = path.join(__dirname, '..', 'data');

// 今天的日期
const today = new Date().toISOString().slice(0, 10);

// 从 URL 提取 BVID
function extractBvid(url) {
  if (!url) return '';
  const match = url.match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : '';
}

// 安全转为字符串
function safeStr(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') {
    // Excel 日期可能是数字（如 45678），需要转回日期字符串
    // 简单处理：如果是整数且看起来像日期序号，不做转换，直接用 toString
    return String(val).trim();
  }
  return String(val).trim();
}

// 安全转为整数
function safeInt(val) {
  if (typeof val === 'number') return Math.round(val);
  if (typeof val === 'string') {
    const num = parseInt(val.replace(/[^\d.-]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// 读 Excel（cellDates: true 将日期列解析为 Date 对象）
console.log('📖 读取 Excel 文件...');
const workbook = XLSX.readFile(EXCEL_PATH, { cellDates: true });
const ws = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// 表头行：第0行
const headers = rows[0];
// 数据行：第1行开始
const dataRows = rows.slice(1);

console.log(`📊 找到 ${dataRows.length} 首歌曲数据`);

// 解析每首歌
const songs = dataRows.map((row, idx) => {
  const name = safeStr(row[2]);
  const url = safeStr(row[3]);
  const bvid = extractBvid(url);
  // 日期：cellDates:true 时 row[4] 是 Date 对象，否则可能是数字/字符串
  let date;
  const dateVal = row[4];
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    date = `${y}-${m}-${d}`;
  } else {
    date = safeStr(dateVal);
  }
  const playCount = safeInt(row[6]);    // 播放量2（数值列）
  const danmaku = safeInt(row[9]);       // 弹幕数2
  const like = safeInt(row[11]);         // 点赞数2
  const coin = safeInt(row[13]);         // 投币数2
  const favorite = safeInt(row[15]);      // 收藏数2
  const achievement = safeStr(row[7]);  // 播放成就
  const producer = safeStr(row[26]);     // 企划运营/制作人（第27列，索引26）

  return {
    name,
    bvid,
    date,
    stats: {
      play: playCount,
      danmaku: danmaku,
      like: like,
      coin: coin,
      favorite: favorite,
    },
    achievement,
    producer,
    last_updated: today,
  };
});

// 验证 BVID
const missingBvid = songs.filter(s => !s.bvid);
if (missingBvid.length > 0) {
  console.warn(`⚠️  以下 ${missingBvid.length} 首歌缺少 BVID：`);
  missingBvid.forEach(s => console.warn(`   - ${s.name}`));
}

console.log(`✅ BVID 提取完成，${songs.length - missingBvid.length}/${songs.length} 首歌有 BVID`);

// 构建 producers 数组（保持原有结构，用于图表中"企划运营/制作人"色块）
const producers = buildProducers(songs);

// 生成 data.js 内容
const dataJsContent = generateDataJs(songs, producers);

// ===== 保存快照（带日期） =====
const snapshotFilename = `snapshot_${today}.js`;
const snapshotPath = path.join(DATA_DIR, snapshotFilename);
fs.writeFileSync(snapshotPath, dataJsContent, 'utf8');
console.log(`💾 快照已保存: data/${snapshotFilename}`);

// ===== 更新 js/data.js =====
fs.writeFileSync(DATA_JS_PATH, dataJsContent, 'utf8');
console.log(`🔄 已更新: js/data.js`);

// ===== 打印统计 =====
console.log('\n📈 数据统计摘要：');
const allPlays = songs.map(s => s.stats.play);
const maxPlay = Math.max(...allPlays);
const minPlay = Math.min(...allPlays);
const avgPlay = Math.round(allPlays.reduce((a, b) => a + b, 0) / allPlays.length);
console.log(`   播放量: 最高=${formatNum(maxPlay)} 最低=${formatNum(minPlay)} 平均=${formatNum(avgPlay)}`);
console.log(`   弹幕数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.danmaku)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.danmaku)))}`);
console.log(`   点赞数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.like)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.like)))}`);
console.log(`   投币数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.coin)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.coin)))}`);
console.log(`   收藏数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.favorite)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.favorite)))}`);

const achievements = {};
songs.forEach(s => { achievements[s.achievement] = (achievements[s.achievement] || 0) + 1; });
console.log('   播放成就:', JSON.stringify(achievements));

// ========== 辅助函数 ==========

function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

function buildProducers(songs) {
  const result = [];
  let currentProducer = null;
  let startIdx = 0;

  for (let i = 0; i < songs.length; i++) {
    const prod = songs[i].producer || '未知';
    if (currentProducer === null) {
      currentProducer = prod;
      startIdx = i;
    } else if (prod !== currentProducer) {
      result.push({
        producer: currentProducer,
        start_idx: startIdx,
        end_idx: i - 1,
        start_date: songs[i - 1].date,
        end_date: songs[startIdx].date,
      });
      currentProducer = prod;
      startIdx = i;
    }
  }
  // 最后一组
  if (currentProducer !== null) {
    result.push({
      producer: currentProducer,
      start_idx: startIdx,
      end_idx: songs.length - 1,
      start_date: songs[songs.length - 1].date,
      end_date: songs[startIdx].date,
    });
  }

  return result;
}

function generateDataJs(songs, producers) {
  const songsJson = JSON.stringify(songs, null, 2);
  const producersJson = JSON.stringify(producers, null, 2);

  return `// 忘川风华录 - 原创曲视频数据
// 自动生成于: ${today}
// Schema: { name, bvid, date, stats: { play, danmaku, like, coin, favorite }, achievement, producer, last_updated }
const DATA = {
  "songs": ${songsJson},
  "producers": ${producersJson}
};
`;
}
