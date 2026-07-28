# 忘川风华录 - 音企解析

## 项目简介

《忘川风华录》是国内深耕近八年，极具标杆意义的顶级唯美国风虚拟歌手音乐企划。本项目是对《忘川风华录》音企的深度解析网页，包含音企定调、作品赏析、数据可视化和特色亮点等内容。

**在线访问：** [https://alanbook.github.io/Dream-and-Lethe-Record/](https://alanbook.github.io/Dream-and-Lethe-Record/)

---

## 项目结构

```
├── index.html              # 主页面
├── css/                    # 样式文件
├── js/
│   ├── app.js              # 主逻辑（图表绘制、统计摘要渲染）
│   ├── data.js             # 原创曲视频数据（自动维护）
│   ├── stats_data.js       # 作词/作曲/编曲/调校/演唱统计
│   └── stats_chart.js      # 音乐数据柱状图
├── scripts/
│   ├── extract_excel.js    # 从 Excel 提取歌曲数据，初始化 data.js
│   └── fetch_bilibili.js   # B站 API 实时采集脚本（月度更新核心）
├── data/
│   └── snapshot_YYYY-MM-DD.js  # 月度数据快照存档
├── .github/
│   └── workflows/
│       └── update-data.yml     # GitHub Actions 月度自动更新
├── 收集的公开数据/
│   └── 忘川风华录_视频数据完全版.xlsx  # 原始数据源
├── 文本分析/
│   ├── 词云图/
│   ├── 词向量/
│   ├── word_pmi/
│   ├── LDA/
│   └── BERTopic/
├── 示例音乐分析/
├── 第四部分/
├── 展示图表/
├── package.json            # Node 依赖与脚本
├── streamlit_app.py        # BERTopic 交互式数据表
└── 忘川头像.jpg            # 项目 Logo
```

---

## 数据结构说明

### `js/data.js` — 原创曲视频数据

每首歌曲的数据结构如下：

```javascript
{
  "name": "万象霜天",              // 歌曲名称
  "bvid": "BV1EK4y1C7Fk",         // B站视频 BV 号
  "date": "2021-02-11",            // 发布日期
  "stats": {                       // B站实时统计数据
    "play": 12117000,              // 播放量
    "danmaku": 65000,              // 弹幕数
    "like": 363000,                // 点赞数
    "coin": 335000,                // 投币数
    "favorite": 296000             // 收藏数
  },
  "achievement": "神话",           // 播放成就（殿堂/传说/申舌/神话）
  "producer": "炸三宝、禹歌",      // 企划运营/制作人
  "last_updated": "2026-07-28"     // 数据最后更新时间
}
```

统计数据（最高/最低/平均、播放成就分布）由 `js/app.js` 中的 `renderStatsSummary()` 函数从上述数据**实时动态计算**并渲染到页面，无需手动维护。

---

## 自动化数据更新机制

### 概述

所有原创曲目的 B站 统计数据（播放量、弹幕数、点赞数、投币数、收藏数）通过脚本自动获取，每月更新一次，数据快照持久化留存。

### 数据源

- **B站公开 API**：`https://api.bilibili.com/x/web-interface/view?bvid={bvid}`
- 无需鉴权，返回固定格式的 JSON，含完整统计字段

### 脚本说明

| 脚本                          | 用途                                                                                                                        | 执行命令            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `scripts/extract_excel.js`  | 从`收集的公开数据/忘川风华录_视频数据完全版.xlsx` 提取歌曲名、BVID、统计数据，初始化/重建 `js/data.js`                  | `npm run extract` |
| `scripts/fetch_bilibili.js` | 读取`js/data.js` 中每首歌的 BVID，逐首调用 B站 API 获取最新实时数据，更新 `stats` 和 `last_updated`，同时保存月度快照 | `npm run fetch`   |

### 月度快照机制

每次运行 `npm run fetch` 后，会在 `data/` 目录下生成一份带日期的快照文件：

```
data/
├── snapshot_2026-07-28.js
├── snapshot_2026-08-01.js
├── snapshot_2026-09-01.js
└── ...
```

旧版本不会被覆盖，可随时回溯查看任意历史时刻的数据状态。

### GitHub Actions 自动化

项目配置了 GitHub Actions 工作流（`.github/workflows/update-data.yml`），实现全自动月度更新：

- **触发时间**：每月 1 日凌晨 2:00 UTC（北京时间约 10:00）
- **手动触发**：支持在 GitHub Actions 页面点击 "Run workflow" 按钮随时执行
- **执行流程**：

  ```
  检出仓库 → 安装依赖 → 逐首采集B站数据 → 保存快照 → 自动提交并推送
  ```
- **请求间隔**：每首歌曲之间间隔 1.2 秒（B站限制约为 5次/秒），54 首歌曲约 2 分钟完成
- **错误处理**：单首歌曲失败自动重试 3 次，不会中断整体流程

### 请求限制与合规说明

- B站 API 无需鉴权，访问的是公开视频统计信息
- 请求频率严格控制（1.2 秒/次），远低于 5 次/秒 的常见限制
- 每月仅运行一次，总请求量约 54 次
- 所有数据仅用于本项目展示，不涉及商业用途

---

## 主要功能

1. **音企深度解析定调** — 介绍《忘川风华录》的历史背景、音乐特色和文化价值
2. **原创曲概览图表** — 对数刻度播放量折线图，按时间排列全部原创曲
3. **动态统计摘要** — JavaScript 实时计算 54 首歌的播放/弹幕/点赞/投币/收藏最高最低平均
4. **具体作品赏析** — 详细分析《千秋梦》和《临川浮梦》两首代表作品
5. **音乐数据可视化** — 作词/作曲/编曲/调校/演唱频次柱状图（可切换标签页）
6. **文本分析可视化** — 词云图、词向量、语义共现网络、LDA/BERTopic 主题建模

---

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **服务器端脚本**：Node.js（数据采集与图表导出）
- **数据采集**：Bilibili 公开 API
- **数据处理**：SheetJS (xlsx), marked.js
- **自动化**：GitHub Actions (cron 定时触发)
- **字体**：Noto Serif SC, STXingkai

---

## 使用方法

### 本地预览

```bash
# 启动本地 HTTP 服务器
python -m http.server 3000
# 浏览器访问 http://localhost:3000
```

### 更新 B站数据

```bash
# 安装依赖（首次）
npm install

# 从 Excel 重新提取数据
npm run extract

# 从 B站 API 实时采集最新数据
npm run fetch
```

### 在线访问

直接访问 **[https://alanbook.github.io/Dream-and-Lethe-Record/](https://alanbook.github.io/Dream-and-Lethe-Record/)**（GitHub Pages 自动部署）

---

## 项目特色

1. **深度解析**：从音乐、文化、历史等多个维度对《忘川风华录》进行全面解析
2. **自动数据更新**：月度自动采集 B站 实时数据并持久化留存，无需人工维护
3. **数据可视化**：通过折线图、柱状图、词云、语义网络等多种方式展示数据
4. **互动体验**：包含标签页切换、图表导出 PNG、折叠面板等交互元素
5. **响应式设计**：适配不同屏幕尺寸

---

## 相关链接

- **Bilibili 忘川风华录主页**：[https://space.bilibili.com/326258472](https://space.bilibili.com/326258472)
- **GitHub 仓库**：[https://github.com/AlanBook/Dream-and-Lethe-Record](https://github.com/AlanBook/Dream-and-Lethe-Record)

---

## 免责声明

本页面文字内容含 AI 生成，可能存在不准确之处，需要二次确证；但数据收集部分均为真实收集，经过核实。

## 许可证

本项目采用 MIT 许可证。

---

©️ 2026 忘川风华录（Dream and Lethe Record）安利介绍网页 | Alanbook
