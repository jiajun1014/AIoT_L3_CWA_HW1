import os
import sys
import datetime
from typing import Optional
from fastapi import FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from services.cwa_service import CWAService, REGION_NAMES

load_dotenv()

app = FastAPI(
    title="AIoT L3 CWA 台灣天氣即時資訊平台",
    description="結合中央氣象署 OpenData 與 FastAPI 之氣象預報及個人首頁展示 Web 應用程式",
    version="1.0.0"
)

# 允許跨域請求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 確保 static 目錄存在
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
async def serve_index():
    return FileResponse("static/index.html")

@app.get("/api/weather/forecast")
async def get_forecast(
    city: Optional[str] = Query(None, description="指定台灣縣市名稱 (例：臺北市、高雄市)"),
    x_cwa_api_key: Optional[str] = Header(None, alias="X-CWA-API-KEY", description="中央氣象署授權碼")
):
    """取得台灣各縣市今明三十六小時氣象預報"""
    result = await CWAService.fetch_forecast(api_key=x_cwa_api_key, city=city)
    return JSONResponse(content=result)

@app.get("/api/weather/satellite")
async def get_satellite_imagery(
    x_cwa_api_key: Optional[str] = Header(None, alias="X-CWA-API-KEY", description="中央氣象署授權碼")
):
    """取得中央氣象署即時衛星雲圖與雷達回波圖 (台灣彩色雲圖、東亞色調強化、雷達整合回波、全球紅外線)"""
    result = await CWAService.fetch_satellite_imagery(api_key=x_cwa_api_key)
    return JSONResponse(content=result)

@app.get("/api/regions")
async def get_regions():
    """取得台灣行政分區清單"""
    return JSONResponse(content={"regions": REGION_NAMES})

@app.get("/api/health")
async def health_check():
    """服務健康度與運作診斷端點"""
    has_env_key = bool(os.getenv("CWA_API_KEY") and len(os.getenv("CWA_API_KEY", "")) > 10)
    return JSONResponse(content={
        "status": "online",
        "app_name": "AIoT_L3_CWA_HW1",
        "python_version": sys.version.split()[0],
        "server_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cwa_env_configured": has_env_key,
        "framework": "FastAPI + Uvicorn"
    })

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    print(f"AIoT L3 CWA Weather Service running at: http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
