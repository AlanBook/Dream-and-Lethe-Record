# 忘川风华录 - 音企解析

## 项目简介

《忘川风华录》是国内深耕近八年，极具标杆意义的顶级唯美国风虚拟歌手音乐企划。本项目是对《忘川风华录》音企的深度解析网页，包含音企定调、作品赏析、数据可视化和特色亮点等内容。

**项目地址：** [https://alanbook.github.io/Dream-and-Lethe-Record/](https://alanbook.github.io/Dream-and-Lethe-Record/)

## 项目结构

```
├── index.html          # 主页面
├── css/                # 样式文件
├── js/                 # JavaScript文件
├── 文本分析/           # 文本分析相关文件
│   ├── 词云图/         # 词云图生成结果
│   ├── 词向量/         # 词向量可视化结果
│   ├── word_pmi/       # 语义共现网络
│   ├── LDA/            # LDA主题建模
│   └── BERTopic/       # BERTopic主题建模
├── 示例音乐分析/       # 音乐分析示例
│   ├── 千秋梦/         # 《千秋梦》相关分析
│   └── 临川浮梦/       # 《临川浮梦》相关分析
├── 第四部分/           # 特色与亮点再讲解
├── 忘川头像.jpg        # 项目Logo
└── chart.png           # 数据图表
```

## 主要功能

1. **音企深度解析定调**：介绍《忘川风华录》的历史背景、音乐特色和文化价值
2. **具体作品赏析**：详细分析《千秋梦》和《临川浮梦》两首代表作品
3. **音企作品数据可视化**：包含词云图、词向量可视化、语义共现网络和主题建模
4. **特色与亮点再讲解**：深入分析《忘川风华录》的创新点和文化价值

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **图表库**：Chart.js
- **数据处理**：SheetJS (xlsx)
- **Markdown解析**：marked.js
- **字体**：Noto Serif SC, STXingkai

## 数据说明

- **数据收集截止时间**：2026年4月6日
- **原创曲统计**：包含播放量、弹幕数、点赞数、投币数、收藏数等数据
- **文本分析**：使用jieba分词、Word2Vec、LDA、BERTopic等算法进行文本分析
- **可视化**：使用Chart.js、Gephi等工具进行数据可视化

## 如何使用

1. **本地预览**：
   ```bash
   # 启动本地服务器
   python -m http.server 3000
   # 然后在浏览器中访问 http://localhost:3000
   ```

2. **在线访问**：
   直接访问 [https://alanbook.github.io/Dream-and-Lethe-Record/](https://alanbook.github.io/Dream-and-Lethe-Record/)

## 项目特色

1. **深度解析**：从音乐、文化、历史等多个维度对《忘川风华录》进行全面解析
2. **数据可视化**：通过多种可视化方式展示音企数据和文本分析结果
3. **互动体验**：包含tabs切换、视频播放、数据表格等互动元素
4. **响应式设计**：适配不同屏幕尺寸

## 相关链接

- **Bilibili频道**：[忘川风华录官方频道](https://space.bilibili.com/16620133)
- **GitHub仓库**：[https://github.com/AlanBook/Dream-and-Lethe-Record](https://github.com/AlanBook/Dream-and-Lethe-Record)

## 免责声明

本页面文字内容含AI生成，可能存在错误，需要二次确证；但数据收集部分都为真实收集，经过核实。

## 许可证

本项目采用 MIT 许可证。

---

©️ 2026 忘川风华录（Dream and Lethe Record）安利介绍网页 | Alanbook