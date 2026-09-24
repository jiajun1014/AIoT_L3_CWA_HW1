# 🌤️ AIoT L3 CWA 台灣即時氣象網站 (FastAPI + OpenData)

> **AIoT 課程作業 1** | **AI 開發工具 × Vibe Coding 實戰**  
> 核心理念：**Prompt → Spec → Code → GitHub**（以 AI Agent 協作與 OpenSpec / SDD 規範驅動開發）

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.14](https://img.shields.io/badge/Python-3.14+-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![OpenSpec](https://img.shields.io/badge/Spec--Driven-OpenSpec%201.2-purple.svg)](https://github.com/Fission-AI/OpenSpec)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

---

## 🌐 專案站點與連結 (Web Site Links)

- 🔗 **GitHub 儲存庫**：[https://github.com/jiajun1014/AIoT_L3_CWA_HW1](https://github.com/jiajun1014/AIoT_L3_CWA_HW1)
- 🚀 **Web Site 線上成果位址 (GitHub Pages)**：[https://jiajun1014.github.io/AIoT_L3_CWA_HW1/](https://jiajun1014.github.io/AIoT_L3_CWA_HW1/)
- 💻 **本機伺服器服務位址**：`http://127.0.0.1:8000`
- 📚 **Swagger 互動式 API 文件**：`http://127.0.0.1:8000/docs`

---

## 📖 專案簡介

本專案為 **AIoT 課程 Lesson 3 作業 (HW1)** 成果，以現代化 Web 應用程式架構打造全台 22 縣市即時氣象觀測與 36 小時預報平台，並融合個人作品簡介。

本專案完全遵循課堂強調的 **SDD (Spec-Driven Development)** 開發思維，在專案啟動時即透過 OpenSpec 建立了完整的規格定義、變更計畫與任務拆解，並以 FastAPI 搭建高效能非同步後端，搭配前端毛玻璃（Glassmorphism）動態互動介面。

---

## ✨ 核心特色與功能

1. **中央氣象署 (CWA) OpenData 深度整合**：
   - 串接中央氣象署氣象資料開放平臺代碼 `F-C0032-001`（一般天氣預報-今明36小時天氣預報）。
   - 精確解析 5 大關鍵氣象要素：**Wx (天氣現象)**、**PoP (降雨機率)**、**MinT (最低溫)**、**MaxT (最高溫)**、**CI (舒適度指數)**。

2. **高清晰度台灣行政界線與分區色彩 (Clear County Boundaries)**：
   - **高對比深邃界線輪廓**：解決傳統淺色界線在藍色海洋背景下對比度不足的問題，採用高清晰向量線條與立體陰影。
   - **分區色彩與標籤辨識**：在清晰界線模式下以溫和和諧的區域色系（北部、中部、南部、東部、外島）區隔各縣市，並標註清晰可讀之縣市名稱文字。
   - **動態懸停霓虹光暈**：滑鼠懸停於任一縣市時，該縣市輪廓即時亮起電光藍或亮橙色外框，精準突出邊界。

3. **台灣地圖平移與放大縮小系統 (Map Zoom & Pan Engine)**：
   - **浮動縮放控制列**：提供 `➕` 放大、`➖` 縮小、`⟲` 還原 100%、`⛶` 全螢幕展開，即時顯示縮放倍率（75% ~ 400%）。
   - **滑鼠滾輪平滑縮放 (Smooth Wheel Zoom)**：支援在島嶼地圖任意位置以滑鼠滾輪自由放大縮小，中心跟隨游標。
   - **滑鼠按住拖曳平移 (Drag to Pan)**：放大地圖後，可按住滑鼠左鍵隨意拖曳平移，探索台灣各區細節並自動防誤觸點擊。
   - **多點觸控手勢**：支援行動端雙指雙向縮放與單指平移。
   - **圖層完美等比同步**：向量界線、3D 地勢浮雕、文字標籤、氣象浮動圖示與百岳名山在任意縮放比例下完美對齊。

4. **中央氣象署「圖資專區」8 大觀測產品整合 (CWA Imagery Hub)**：
   - 完全比照中央氣象署官方圖資專區排版與樣式：
     1. 🛰️ **衛星**：台灣區域彩色衛星雲圖 (`O-B0028-003`)
     2. 🌧️ **雷達**：全台雷達整合回波圖 (`O-A0058-001`)
     3. 💧 **雨量**：今日日累積雨量分佈圖 (`QZJ` / `O-A0040-001`)
     4. ☀️ **紫外線**：全台即時紫外線指數分級 (`O-A0005-001`)
     5. ⚡ **即時閃電**：最近 60 分鐘落雷偵測網 (`O-A0059-001`)
     6. 🌡️ **溫度**：全島即時等溫設色分佈圖 (`O-A0038-001`)
     7. 🏥 **健康氣象**：今日熱傷害預警分級圖
     8. 💨 **風場預報**：數值風場預報動態模擬 (WIFI 模擬圖，TGFS · WRF)
   - 每張卡片均具備氣象署官方圓形水波紋浮水印與動態光暈。
   - 點擊卡片開啟高解析燈箱檢視器，支援**彈窗內圖片縮放**與**風場動態模擬互動嵌入**。

5. **台灣五大山脈 3D 立體地勢浮雕與百岳名山 (Topographic Elevation & Shaded Relief)**：
   - **等高設色階層 (Hypsometric Tinting)**：呈現西部平原 (0~200m 翡翠綠) → 台地丘陵 (200~800m 暖金) → 中海拔 (800~2000m 陶土橙) → 百岳峰脊 (2000~3952m 朱紅至巍峨峰雪白) 的真實地勢起伏。
   - **五大山脈立體脊線**：精確繪製中央山脈、雪山山脈、玉山山脈、阿里山山脈與海岸山脈之 3D 陰陽坡立體浮雕。
   - **著名百岳名山地標群 (Summit Peak Pins)**：標定東亞第一高峰「玉山主峰 3,952m」、次高峰「雪山主峰 3,886m」、中央山脈最高「秀姑巒山 3,805m」、「南湖大山 3,742m」、「合歡山 3,422m」、「大霸尖山 3,492m」等百岳名山，支援滑鼠懸停與點擊互動探索。
   - **海拔等高圖例 (Elevation Scale)**：浮動標記 0m 至 3,952m 設色圖例。

6. **多模式地圖圖層切換 (Map Layer Switcher)**：
   - 快速切換 🏔️ **立體地勢**、🏛️ **清晰界線**、🌤️ **氣象標記** 與 🛰️ **衛星雲圖**。

7. **智慧型高可用容錯設計 (Dual-Engine Fallback)**：
   - 支援線上與環境變數動態配置 CWA 金鑰，遇斷網或無金鑰自動平滑切換內建 22 縣市真實格式快取資料庫。

7. **OpenSpec 規格驅動開發 (SDD)**：
   - 遵循課堂規範，完整留存變更提案、技術設計與任務驗證。

---

## 🛠️ 系統架構

```
AIoT_L3_CWA_HW1/
├── .agent/                   # OpenSpec AI 工具整合目錄
├── openspec/                 # SDD 規格書與變更提議
│   ├── specs/cwa-weather-webapp.md
│   └── changes/cwa-weather-fastapi/
│       ├── proposal.md
│       ├── specs.md
│       ├── design.md
│       └── tasks.md
├── services/
│   └── cwa_service.py        # 中央氣象署 API 串接與備援資料模組
├── static/
│   ├── index.html            # 語意化 HTML5 頁面結構
│   ├── style.css             # 毛玻璃設計系統、動態光暈與響應式排版
│   └── app.js                # 前端非同步資料抓取與動態渲染
├── main.py                   # FastAPI 應用伺服器與 RESTful API 端點
├── requirements.txt          # Python 套件相依性
├── .env.example              # 環境變數設定範例
└── README.md                 # 專案完整說明文件
```

---

## 🚀 快速開始

### 1. 安裝環境依賴

建議使用 Python 3.10+ 環境：

```powershell
pip install -r requirements.txt
```

### 2. (選用) 設定中央氣象署 API Key

若您有氣象署開放平臺授權碼，可複製 `.env.example` 為 `.env`：

```powershell
cp .env.example .env
```

在 `.env` 內填入您的授權碼：
```env
CWA_API_KEY=CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

*(亦可直接跳過此步，在開啟網頁後於右上角點選「⚙️ API 設定」隨時填入！)*

### 3. 啟動 FastAPI 服務

```powershell
python main.py
```
或使用 uvicorn 指令：
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 4. 檢視成果

打開瀏覽器造訪：
👉 **http://127.0.0.1:8000**

---

## 📡 RESTful API 文件

FastAPI 內建 Swagger UI，啟動後可存取：
- **互動式 API 文件**：`http://127.0.0.1:8000/docs`
- **ReDoc 文件**：`http://127.0.0.1:8000/redoc`

### 主要 API 端點

| 方法 | 路徑 | 說明 | 參數範例 |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | 回傳前台 Web 應用首頁 | - |
| `GET` | `/api/weather/forecast` | 取得 36 小時預報資料 | `?city=臺北市` (選填) |
| `GET` | `/api/weather/imagery` | 取得圖資專區 8 大觀測圖資資料 (衛星/雷達/雨量/紫外線/閃電/溫度/健康/風場) | - |
| `GET` | `/api/weather/satellite` | 取得即時衛星雲圖與雷達回波 | - |
| `GET` | `/api/regions` | 取得台灣分區對照表 | - |
| `GET` | `/api/health` | 系統健康狀態與診斷 | - |

---

## 👨‍💻 開發者資訊

- **作者**：[jiajun1014](https://github.com/jiajun1014)
- **Repository**：[jiajun1014/AIoT_L3_CWA_HW1](https://github.com/jiajun1014/AIoT_L3_CWA_HW1)
- **課程**：AI 開發工具 × Vibe Coding 實戰 (L2/L3)
- **IDE**：Google Antigravity IDE (Gemini Agentic Coding)