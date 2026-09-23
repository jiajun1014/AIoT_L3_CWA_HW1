# Change Specs: cwa-weather-fastapi

## 規格要求
1. **API 層**：
   - 採用 FastAPI 構建非同步服務。
   - 提供 `/api/weather/forecast`，接收選填之 `city` 與 `X-CWA-API-KEY`。
   - 提供 `/api/health` 供系統監控。
2. **服務層**：
   - 使用 `httpx.AsyncClient` 發送至 `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001`。
   - 解析並重組為乾淨的 JSON 陣列。
   - 當遠端伺服器回應 401/403/逾時或缺少金鑰時，無縫切換到全台預置氣象資料。
3. **前端展現**：
   - 單頁應用（SPA）架構，響應式排版（Mobile & Desktop 友善）。
   - 提供台灣分區快速篩選標籤（全部、北部、中部、南部、東部、外島）。
   - 具有 36 小時預報 3 階段時段切換（今早/今晚/明早）。
   - 包含個人簡歷/專案介紹展示卡片與即時氣候動畫背景。
