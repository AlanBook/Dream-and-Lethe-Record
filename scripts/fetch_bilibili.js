/**
 * B站数据采集脚本
 * 
 * 用法: node scripts/fetch_bilibili.js
 * 
 * 功能:
 * 1. 读取 js/data.js 中的歌曲列表
 * 2. 通过 B站 API 获取每首歌的最新统计数据
 * 3. 更新 stats 字段 (play, danmaku, like, coin, favorite)
 * 4. 保存月度快照 data/snapshot_YYYY-MM-DD.js
 * 5. 更新 js/data.js
 * 
 * B站 API: https://api.bilibili.com/x/web-interface/view?bvid={bvid}
 * 返回 stat: { view, danmaku, like, coin, favorite, reply, share }
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const DATA_DIR = path.join(__dirname, '..', 'data');

const today = new Date().toISOString().slice(0, 10);

// ============ 配置 ============
const REQUEST_DELAY = 1200;        // 请求间隔（毫秒），B站限制约 5次/秒，保守设 1.2 秒
const MAX_RETRIES = 3;            // 最大重试次数
const RETRY_DELAY_BASE = 3000;    // 重试基础延迟（毫秒）

// ============ 工具函数 ============

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

// 从 data.js 提取 DATA 对象
function loadData() {
  const content = fs.readFileSync(DATA_JS_PATH, 'utf8');
  try {
    const script = new vm.Script(`${content}\n;DATA;`);
    const data = script.runInNewContext({}, { timeout: 1000 });

    if (!data || !Array.isArray(data.songs) || !Array.isArray(data.producers)) {
      throw new Error('DATA 结构不完整');
    }

    // 与原逻辑保持一致：返回可变引用，后续直接更新 songs 后写回
    return { songs: data.songs, producers: data.producers };
  } catch (err) {
    throw new Error(`无法解析 data.js: ${err.message}`);
  }
}

// 生成 data.js 内容（与 extract_excel.js 相同格式）
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

// 保存快照和更新主文件
function saveData(songs, producers) {
  const content = generateDataJs(songs, producers);

  // 保存带日期的快照
  const snapshotPath = path.join(DATA_DIR, `snapshot_${today}.js`);
  fs.writeFileSync(snapshotPath, content, 'utf8');
  console.log(`💾 快照已保存: data/snapshot_${today}.js`);

  // 更新主文件
  fs.writeFileSync(DATA_JS_PATH, content, 'utf8');
  console.log(`🔄 已更新: js/data.js`);
}

// ============ 核心：调用 B站 API ============

async function fetchBilibiliStats(bvid, songName, retryCount = 0) {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    
    if (json.code !== 0) {
      throw new Error(`API code=${json.code}: ${json.message || '未知错误'}`);
    }
    
    if (!json.data || !json.data.stat) {
      throw new Error('响应中缺少 stat 字段');
    }
    
    const stat = json.data.stat;
    return {
      play: stat.view || 0,
      danmaku: stat.danmaku || 0,
      like: stat.like || 0,
      coin: stat.coin || 0,
      favorite: stat.favorite || 0,
    };
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      console.warn(`  ⚠️ 重试 ${retryCount + 1}/${MAX_RETRIES}: ${songName} (${bvid}) - ${error.message}`);
      await sleep(delay);
      return fetchBilibiliStats(bvid, songName, retryCount + 1);
    }
    throw error;
  }
}

// ============ 主流程 ============

async function main() {
  console.log('🚀 B站数据采集脚本启动');
  console.log(`📅 日期: ${today}`);
  console.log(`⏱️  请求间隔: ${REQUEST_DELAY}ms\n`);
  
  // 加载现有数据
  const { songs, producers } = loadData();
  console.log(`📊 共 ${songs.length} 首歌曲待更新\n`);
  
  let successCount = 0;
  let failCount = 0;
  const failedSongs = [];
  
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    
    if (!song.bvid) {
      console.log(`⏭️  跳过 (无BVID): ${song.name}`);
      continue;
    }
    
    const progress = `[${String(i + 1).padStart(2, '0')}/${songs.length}]`;
    
    try {
      // Before fetch
      const oldStats = { ...song.stats };
      
      // Fetch new stats
      const newStats = await fetchBilibiliStats(song.bvid, song.name);
      
      // Update song data
      song.stats = newStats;
      song.last_updated = today;
      
      // Log change
      const playChange = newStats.play - oldStats.play;
      const changeStr = playChange > 0 ? `+${formatNum(playChange)}` : 
                        playChange < 0 ? `${formatNum(playChange)}` : '不变';
      
      console.log(`${progress} ✅ ${song.name} | 播放 ${formatNum(newStats.play)} (${changeStr}) | 点赞 ${formatNum(newStats.like)}`);
      successCount++;
      
    } catch (error) {
      console.error(`${progress} ❌ ${song.name} (${song.bvid}): ${error.message}`);
      failCount++;
      failedSongs.push(song.name);
    }
    
    // Rate limiting: don't wait after the last request
    if (i < songs.length - 1) {
      await sleep(REQUEST_DELAY);
    }
  }
  
  // 保存更新后的数据
  console.log('\n' + '='.repeat(60));
  saveData(songs, producers);
  
  // 最终统计
  console.log('\n📈 采集结果:');
  console.log(`   ✅ 成功: ${successCount}/${songs.length}`);
  console.log(`   ❌ 失败: ${failCount}/${songs.length}`);
  
  if (failedSongs.length > 0) {
    console.log(`   失败歌曲: ${failedSongs.join(', ')}`);
  }
  
  // 统计摘要
  const allPlays = songs.map(s => s.stats.play);
  const maxPlay = Math.max(...allPlays);
  const minPlay = Math.min(...allPlays);
  const avgPlay = Math.round(allPlays.reduce((a, b) => a + b, 0) / allPlays.length);
  
  console.log(`\n📊 数据摘要:`);
  console.log(`   播放量: 最高=${formatNum(maxPlay)} 最低=${formatNum(minPlay)} 平均=${formatNum(avgPlay)}`);
  console.log(`   弹幕数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.danmaku)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.danmaku)))}`);
  console.log(`   点赞数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.like)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.like)))}`);
  console.log(`   投币数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.coin)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.coin)))}`);
  console.log(`   收藏数: 最高=${formatNum(Math.max(...songs.map(s => s.stats.favorite)))} 最低=${formatNum(Math.min(...songs.map(s => s.stats.favorite)))}`);
  
  console.log('\n✨ 数据采集完成！');
}

main().catch(err => {
  console.error('\n💥 脚本异常终止:', err);
  process.exit(1);
});
