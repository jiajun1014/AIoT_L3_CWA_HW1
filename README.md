# 🌤️ AIoT L3 CWA 台灣即時氣象網站 (FastAPI + OpenData)

> **AIoT 課程作業 1** | **AI 開發工具 × Vibe Coding 實戰**  
> 核心理念：**Prompt → Spec → Code → GitHub**（以 AI Agent 協作與 OpenSpec / SDD 規範驅動開發）

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.14](https://img.shields.io/badge/Python-3.14+-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![OpenSpec](https://img.shields.io/badge/Spec--Driven-OpenSpec%201.2-purple.svg)](https://github.com/Fission-AI/OpenSpec)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

---

## 📖 專案簡介

本專案為 **AIoT 課程 Lesson 3 作業 (HW1)** 成果，以現代化 Web 應用程式架構打造全台 22 縣市即時氣象觀測與 36 小時預報平台，並融合個人作品簡介。

本專案完全遵循課堂強調的 **SDD (Spec-Driven Development)** 開發思維，在專案啟動時即透過 OpenSpec 建立了完整的規格定義、變更計畫與任務拆解，並以 FastAPI 搭建高效能非同步後端，搭配前端毛玻璃（Glassmorphism）動態互動介面。

---

## ✨ 核心特色與功能

1. **中央氣象署 (CWA) OpenData 深度整合**：
   - 串接中央氣象署氣象資料開放平臺代碼 `F-C0032-001`（一般天氣預報-今明36小時天氣預報）。
   - 精確解析 5 大關鍵氣象要素：**Wx (天氣現象)**、**PoP (降雨機率)**、**MinT (最低溫)**、**MaxT (最高溫)**、**CI (舒適度指數)**。

2. **智慧型高可用容錯設計 (Dual-Engine Fallback)**：
   - 支援線上輸入個人 CWA Authorization Key 進行即時連線。
   - 若未設定金鑰或遇網路連線異常，系統將自動啟動內建全台 22 縣市真實格式備援資料，動態計算時間戳記，確保展示隨時可用、永不破圖或報錯。

3. **沉浸式台灣島嶼互動氣象地圖 (Interactive Taiwan Weather Map)**：
   - **全台 22 縣市 SVG 向量圖**：完整包含台灣本島與澎湖、金門、連江等離島輪廓。
   - **浮動氣象徽章標記 (Weather Pins)**：在各縣市上方標記微立體白底氣象圖示（☀️/⛅/🌧️/⛈️）與即時溫度。
   - **滑鼠懸停即時氣象卡 (Hover Tooltip)**：滑鼠移入任一縣市時，縣市輪廓即時高亮發光，並浮現跟隨資訊卡展示當前天氣、氣溫範圍、降雨機率與舒適度評語。
   - **點擊聯動 36 小時預報抽屜**：點擊任一縣市即可將定位標記（📍 Active Pin）平滑移動至該縣市，並自底部展開 36 小時三時段趨勢預報。
   - **時段即時切換**：支援切換「今日白天」、「今晚至明晨」、「明日白天」，全台地圖天氣即時動態更新。

4. **高可用容錯與多檢視整合**：
   - 提供「互動地圖」與「22 縣市卡片清單」雙檢視切換，支援北/中/南/東/離島分區過濾與即時搜尋。
   - 支援線上與環境變數動態配置 CWA 金鑰，遇斷網自動降級備援快取。

5. **OpenSpec 規格驅動開發 (SDD)**：
   - 規範文件存放於 `openspec/specs/cwa-weather-webapp.md`。
   - 變更提案與任務分解存放於 `openspec/changes/cwa-weather-fastapi/`。

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
| `GET` | `/api/regions` | 取得台灣分區對照表 | - |
| `GET` | `/api/health` | 系統健康狀態與診斷 | - |

---

## 👨‍💻 開發者資訊

- **作者**：[jiajun1014](https://github.com/jiajun1014)
- **Repository**：[jiajun1014/AIoT_L3_CWA_HW1](https://github.com/jiajun1014/AIoT_L3_CWA_HW1)
- **課程**：AI 開發工具 × Vibe Coding 實戰 (L2/L3)
- **IDE**：Google Antigravity IDE (Gemini Agentic Coding)