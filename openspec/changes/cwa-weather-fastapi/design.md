# Design: cwa-weather-fastapi

## 系統架構
```
+--------------------------------------------------------+
|                     Browser (Client)                   |
|  - static/index.html (Semantic HTML & Glassmorphism)   |
|  - static/style.css (HSL Design Tokens, Animations)    |
|  - static/app.js (Async Fetch, Region Filtering)       |
+---------------------------+----------------------------+
                            | HTTP GET /api/...
                            v
+--------------------------------------------------------+
|                   FastAPI Application                  |
|  - main.py (Routers, CORS, Static Files Mounting)      |
|  - services/cwa_service.py (CWA Client & Fallback)     |
+---------------------------+----------------------------+
                            | HTTPS
                            v
+--------------------------------------------------------+
|       Central Weather Administration OpenData          |
|       (https://opendata.cwa.gov.tw F-C0032-001)        |
+--------------------------------------------------------+
```

## 元件劃分
1. **`CWAService`**：
   - 負責與中央氣象署通訊。
   - 解析元素：`Wx` (天氣現象), `PoP` (降雨機率), `MinT` (最低溫), `MaxT` (最高溫), `CI` (舒適度)。
   - 整合台灣 22 縣市分區對照表（北部、中部、南部、東部、外島）。
2. **`MainApp`**：
   - 掛載靜態資源目錄 `/static`。
   - 提供健康度檢查與氣象預報端點。
3. **前端視覺與互動**：
   - 焦點即時主卡片（Highlight Card）：當前選定城市之顯著預報。
   - 全區網格卡片（City Cards Grid）：即時呈現各地氣溫、天氣圖示與降雨機率。
   - API 設定與個人檔案互動 Modal。
