import os
import datetime
from typing import Dict, List, Optional, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

# 台灣縣市與行政分區對照表
REGION_MAP = {
    # 北部
    "基隆市": "north", "臺北市": "north", "台北市": "north", "新北市": "north",
    "桃園市": "north", "新竹市": "north", "新竹縣": "north", "苗栗縣": "north",
    # 中部
    "臺中市": "central", "台中市": "central", "彰化縣": "central", "南投縣": "central",
    "雲林縣": "central", "嘉義市": "central", "嘉義縣": "central",
    # 南部
    "臺南市": "south", "台南市": "south", "高雄市": "south", "屏東縣": "south",
    # 東部
    "宜蘭縣": "east", "花蓮縣": "east", "臺東縣": "east", "台東縣": "east",
    # 離島
    "澎湖縣": "islands", "金門縣": "islands", "連江縣": "islands"
}

REGION_NAMES = {
    "all": "全台灣",
    "north": "北部地區",
    "central": "中部地區",
    "south": "南部地區",
    "east": "東部地區",
    "islands": "外島離島"
}

def get_region(city_name: str) -> str:
    return REGION_MAP.get(city_name, "north")

def get_weather_type(wx_name: str) -> str:
    """根據天氣現象名稱判定天氣類別 (用於前端動態圖標與特效)"""
    if "雷" in wx_name:
        return "thunderstorm"
    elif "雨" in wx_name:
        return "rain"
    elif "陰" in wx_name:
        return "cloudy"
    elif "多雲" in wx_name:
        return "partly_cloudy"
    elif "晴" in wx_name:
        return "sunny"
    return "cloudy"

def generate_fallback_periods(base_wx: str, min_t: int, max_t: int, pop: int) -> List[Dict[str, Any]]:
    """動態生成符合中央氣象署 F-C0032-001 格式的 36 小時三時段預報"""
    now = datetime.datetime.now()
    
    # 時段 1: 當天/今晚
    t1_start = now.strftime("%Y-%m-%d 12:00:00")
    t1_end = now.strftime("%Y-%m-%d 18:00:00")
    
    # 時段 2: 今晚至明晨
    tomorrow = now + datetime.timedelta(days=1)
    t2_start = now.strftime("%Y-%m-%d 18:00:00")
    t2_end = tomorrow.strftime("%Y-%m-%d 06:00:00")
    
    # 時段 3: 明天白天
    t3_start = tomorrow.strftime("%Y-%m-%d 06:00:00")
    t3_end = tomorrow.strftime("%Y-%m-%d 18:00:00")

    return [
        {
            "start_time": t1_start,
            "end_time": t1_end,
            "label": "今日下半天",
            "wx": base_wx,
            "wx_code": "01" if "晴" in base_wx else ("08" if "雨" in base_wx else "04"),
            "weather_type": get_weather_type(base_wx),
            "pop": f"{pop}%",
            "min_t": f"{min_t}",
            "max_t": f"{max_t}",
            "ci": "舒適至悶熱" if max_t >= 28 else "舒適",
            "wind": "微風"
        },
        {
            "start_time": t2_start,
            "end_time": t2_end,
            "label": "今晚至明晨",
            "wx": "多雲短暫雨" if pop > 30 else "多雲時晴",
            "wx_code": "08" if pop > 30 else "02",
            "weather_type": get_weather_type("多雲短暫雨" if pop > 30 else "多雲時晴"),
            "pop": f"{max(10, pop - 10)}%",
            "min_t": f"{min_t - 2}",
            "max_t": f"{min_t + 2}",
            "ci": "早晚微涼",
            "wind": "偏東風"
        },
        {
            "start_time": t3_start,
            "end_time": t3_end,
            "label": "明日白天",
            "wx": "午後雷陣雨" if pop >= 40 else "晴時多雲",
            "wx_code": "11" if pop >= 40 else "02",
            "weather_type": get_weather_type("午後雷陣雨" if pop >= 40 else "晴時多雲"),
            "pop": f"{min(90, pop + 10)}%",
            "min_t": f"{min_t}",
            "max_t": f"{max_t + 1}",
            "ci": "炎熱且紫外線強" if max_t >= 30 else "溫暖舒適",
            "wind": "偏南風"
        }
    ]

# 台灣 22 縣市結構化展示資料庫（備援快取）
FALLBACK_CITIES = [
    {"city": "臺北市", "base_wx": "多雲短暫陣雨", "min_t": 24, "max_t": 31, "pop": 30},
    {"city": "新北市", "base_wx": "多雲短暫陣雨", "min_t": 24, "max_t": 31, "pop": 30},
    {"city": "基隆市", "base_wx": "陰短暫雨", "min_t": 23, "max_t": 29, "pop": 50},
    {"city": "桃園市", "base_wx": "多雲時晴", "min_t": 24, "max_t": 32, "pop": 20},
    {"city": "新竹市", "base_wx": "晴時多雲", "min_t": 24, "max_t": 31, "pop": 10},
    {"city": "新竹縣", "base_wx": "晴時多雲", "min_t": 23, "max_t": 31, "pop": 15},
    {"city": "苗栗縣", "base_wx": "晴時多雲", "min_t": 23, "max_t": 31, "pop": 10},
    {"city": "臺中市", "base_wx": "晴午後短暫雷陣雨", "min_t": 25, "max_t": 33, "pop": 35},
    {"city": "彰化縣", "base_wx": "晴時多雲", "min_t": 25, "max_t": 32, "pop": 20},
    {"city": "南投縣", "base_wx": "多雲午後雷陣雨", "min_t": 22, "max_t": 31, "pop": 45},
    {"city": "雲林縣", "base_wx": "晴時多雲", "min_t": 24, "max_t": 32, "pop": 20},
    {"city": "嘉義市", "base_wx": "晴午後短暫雷陣雨", "min_t": 24, "max_t": 33, "pop": 30},
    {"city": "嘉義縣", "base_wx": "晴午後短暫雷陣雨", "min_t": 24, "max_t": 32, "pop": 30},
    {"city": "臺南市", "base_wx": "晴時多雲", "min_t": 25, "max_t": 33, "pop": 20},
    {"city": "高雄市", "base_wx": "晴時多雲", "min_t": 26, "max_t": 33, "pop": 20},
    {"city": "屏東縣", "base_wx": "多雲午後短暫陣雨", "min_t": 25, "max_t": 33, "pop": 35},
    {"city": "宜蘭縣", "base_wx": "多雲短暫陣雨", "min_t": 23, "max_t": 30, "pop": 40},
    {"city": "花蓮縣", "base_wx": "多雲短暫陣雨", "min_t": 24, "max_t": 30, "pop": 30},
    {"city": "臺東縣", "base_wx": "晴短暫陣雨", "min_t": 24, "max_t": 31, "pop": 25},
    {"city": "澎湖縣", "base_wx": "晴天", "min_t": 26, "max_t": 31, "pop": 10},
    {"city": "金門縣", "base_wx": "晴天", "min_t": 24, "max_t": 30, "pop": 10},
    {"city": "連江縣", "base_wx": "多雲時陰", "min_t": 22, "max_t": 27, "pop": 25},
]

class CWAService:
    CWA_API_ENDPOINT = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001"

    @classmethod
    def get_fallback_data(cls, target_city: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for item in FALLBACK_CITIES:
            city_name = item["city"]
            if target_city and target_city not in city_name and city_name not in target_city:
                continue
            
            periods = generate_fallback_periods(
                base_wx=item["base_wx"],
                min_t=item["min_t"],
                max_t=item["max_t"],
                pop=item["pop"]
            )
            
            results.append({
                "city": city_name,
                "region": get_region(city_name),
                "region_name": REGION_NAMES.get(get_region(city_name), "其他"),
                "periods": periods
            })
        return results

    @classmethod
    async def fetch_forecast(cls, api_key: Optional[str] = None, city: Optional[str] = None) -> Dict[str, Any]:
        """
        向中央氣象署抓取三十六小時天氣預報。
        若金鑰無效或連線逾時，無縫切換到全台預置氣象資料庫。
        """
        # 決定使用的 API Key
        effective_key = api_key or os.getenv("CWA_API_KEY", "").strip()
        
        # 若未填寫或長度過短，直接使用展示備援資料
        if not effective_key or len(effective_key) < 10 or "your_" in effective_key:
            return {
                "status": "success",
                "source": "fallback_cache",
                "message": "目前使用內建全台結構化氣象資料（可於右上角輸入個人 CWA 授權碼切換即時連線）",
                "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "data": cls.get_fallback_data(city)
            }

        params = {
            "Authorization": effective_key,
            "format": "JSON"
        }
        if city:
            params["locationName"] = city

        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                resp = await client.get(cls.CWA_API_ENDPOINT, params=params)
                
                if resp.status_code == 200:
                    raw_json = resp.json()
                    if raw_json.get("success") == "true":
                        records = raw_json.get("records", {})
                        locations = records.get("location", [])
                        
                        parsed_list = []
                        for loc in locations:
                            loc_name = loc.get("locationName", "")
                            elements = {elem["elementName"]: elem["time"] for elem in loc.get("weatherElement", [])}
                            
                            # 取得時段數量 (一般為 3 個)
                            wx_times = elements.get("Wx", [])
                            pop_times = elements.get("PoP", [])
                            min_t_times = elements.get("MinT", [])
                            max_t_times = elements.get("MaxT", [])
                            ci_times = elements.get("CI", [])
                            
                            periods = []
                            for idx in range(len(wx_times)):
                                wx_elem = wx_times[idx]
                                wx_name = wx_elem.get("parameter", {}).get("parameterName", "多雲")
                                wx_code = wx_elem.get("parameter", {}).get("parameterValue", "01")
                                
                                pop_val = pop_times[idx].get("parameter", {}).get("parameterName", "0") if idx < len(pop_times) else "0"
                                min_t_val = min_t_times[idx].get("parameter", {}).get("parameterName", "20") if idx < len(min_t_times) else "20"
                                max_t_val = max_t_times[idx].get("parameter", {}).get("parameterName", "28") if idx < len(max_t_times) else "28"
                                ci_val = ci_times[idx].get("parameter", {}).get("parameterName", "舒適") if idx < len(ci_times) else "舒適"
                                
                                label = "時段一"
                                if idx == 0:
                                    label = "今日下半天"
                                elif idx == 1:
                                    label = "今晚至明晨"
                                elif idx == 2:
                                    label = "明日白天"

                                periods.append({
                                    "start_time": wx_elem.get("startTime", ""),
                                    "end_time": wx_elem.get("endTime", ""),
                                    "label": label,
                                    "wx": wx_name,
                                    "wx_code": wx_code,
                                    "weather_type": get_weather_type(wx_name),
                                    "pop": f"{pop_val}%",
                                    "min_t": min_t_val,
                                    "max_t": max_t_val,
                                    "ci": ci_val,
                                    "wind": "舒適風"
                                })
                                
                            parsed_list.append({
                                "city": loc_name,
                                "region": get_region(loc_name),
                                "region_name": REGION_NAMES.get(get_region(loc_name), "其他"),
                                "periods": periods
                            })

                        return {
                            "status": "success",
                            "source": "cwa_live",
                            "message": "成功連線中央氣象署即時資料庫",
                            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "data": parsed_list
                        }

        except Exception as e:
            # 連線失敗或逾時，平滑降級為備援資料
            pass

        return {
            "status": "success",
            "source": "fallback_cache",
            "message": "氣象署 API 即時連線暫時不可用或金鑰有誤，已自動切換展示備援模式",
            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": cls.get_fallback_data(city)
        }

    @classmethod
    async def fetch_satellite_imagery(cls, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        相容舊端點：取得中央氣象署即時衛星雲圖與雷達回波
        """
        zone_data = await cls.fetch_imagery_zone(api_key=api_key)
        return zone_data

    @classmethod
    async def fetch_imagery_zone(cls, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        取得中央氣象署「圖資專區」8 大核心觀測圖資：
        1. 衛星 (Satellite)
        2. 雷達 (Radar)
        3. 雨量 (Rainfall)
        4. 紫外線 (UVI)
        5. 即時閃電 (Lightning)
        6. 溫度 (Temperature)
        7. 健康氣象 (Health Weather)
        8. 風場預報 (Wind Forecast)
        """
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        products = [
            {
                "id": "satellite",
                "title": "衛星",
                "full_title": "🛰️ 台灣區域彩色衛星雲圖",
                "tag": "衛星雲圖 · 雲系分佈",
                "icon": "🛰️",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/satellite/LCC_TRGB_1000/LCC_TRGB_1000_forPreview.jpg",
                "image_url": "https://www.cwa.gov.tw/Data/satellite/LCC_TRGB_1000/LCC_TRGB_1000.jpg",
                "backup_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-003.jpg",
                "description": "中央氣象署高解析台灣周邊彩色衛星雲圖，清晰呈現台灣陸地、島嶼與對流積雨雲層分佈。",
                "obs_time": now_str,
                "dataset_id": "O-B0028-003",
                "link_url": "https://www.cwa.gov.tw/V8/C/W/OBS_Sat.html"
            },
            {
                "id": "radar",
                "title": "雷達",
                "full_title": "🌧️ 全台雷達整合回波圖",
                "tag": "即時降雨 · 回波強度",
                "icon": "🌧️",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/radar/CV1_TW_1000_forPreview.png",
                "image_url": "https://www.cwa.gov.tw/Data/radar/CV1_TW_1000.png",
                "backup_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-001.png",
                "description": "全台整合氣象雷達反射率回波 (dBZ)，數值越高代表降雨與水氣越劇烈。",
                "obs_time": now_str,
                "dataset_id": "O-A0058-001",
                "link_url": "https://www.cwa.gov.tw/V8/C/W/OBS_Radar.html"
            },
            {
                "id": "rainfall",
                "title": "雨量",
                "full_title": "💧 今日累積雨量分佈圖",
                "tag": "降雨熱區 · 累積量",
                "icon": "💧",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/rainfall/QZJ_forPreview.jpg",
                "image_url": "https://www.cwa.gov.tw/Data/rainfall/QZJ.jpg",
                "backup_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0040-001.jpg",
                "description": "中央氣象署自今日 00:00 起各觀測測站日累積降雨量分佈 (毫米 mm)，即時掌握全島迎風面雨量。",
                "obs_time": now_str,
                "dataset_id": "O-A0040-001",
                "link_url": "https://www.cwa.gov.tw/V8/C/P/Rainfall/Rainfall_QZJ.html"
            },
            {
                "id": "uvi",
                "title": "紫外線",
                "full_title": "☀️ 全台紫外線觀測分級圖",
                "tag": "防曬指數 · 戶外防護",
                "icon": "☀️",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/UVI/UVI_forPreview.png",
                "image_url": "https://www.cwa.gov.tw/Data/UVI/UVI.png",
                "backup_url": "https://www.cwa.gov.tw/Data/UVI/UVI_forPreview.png",
                "description": "即時紫外線 UVI 指數設色分級 (低量、中量、高量、過量至危險級)，提供健康生活與出遊指引。",
                "obs_time": now_str,
                "dataset_id": "O-A0005-001",
                "link_url": "https://www.cwa.gov.tw/V8/C/W/OBS_UVI.html"
            },
            {
                "id": "lightning",
                "title": "即時閃電",
                "full_title": "⚡ 全台閃電即時偵測圖",
                "tag": "雷電落點 · 劇烈天氣",
                "icon": "⚡",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/lightning/lightning_s_forPreview.jpg",
                "image_url": "https://www.cwa.gov.tw/Data/lightning/lightning_s.jpg",
                "backup_url": "https://www.cwa.gov.tw/Data/lightning/lightning_s_forPreview.jpg",
                "description": "最近 60 分鐘內台灣本島及周圍海域對地落雷與雲中放電閃電訊號即時觀測。",
                "obs_time": now_str,
                "dataset_id": "O-A0059-001",
                "link_url": "https://www.cwa.gov.tw/V8/C/W/OBS_Lightning.html"
            },
            {
                "id": "temperature",
                "title": "溫度",
                "full_title": "🌡️ 全台即時溫度分佈圖",
                "tag": "氣溫分佈 · 溫差設色",
                "icon": "🌡️",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/temperature/temp_forPreview.jpg",
                "image_url": "https://www.cwa.gov.tw/Data/temperature/temp.jpg",
                "backup_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0038-001.jpg",
                "description": "中央氣象署全台測站溫度即時內插等溫設色分佈圖 (攝氏 °C)，精準呈現高山與平原氣溫反差。",
                "obs_time": now_str,
                "dataset_id": "O-A0038-001",
                "link_url": "https://www.cwa.gov.tw/V8/C/W/OBS_Temp.html"
            },
            {
                "id": "health",
                "title": "健康氣象",
                "full_title": "🏥 今日熱傷害預警分級",
                "tag": "健康預警 · 防範中暑",
                "icon": "🏥",
                "type": "image",
                "preview_url": "https://www.cwa.gov.tw/Data/health/health_forPreview.png",
                "image_url": "https://www.cwa.gov.tw/Data/health/health.png",
                "backup_url": "https://www.cwa.gov.tw/Data/health/health_forPreview.png",
                "description": "氣象署與衛福部合作熱傷害預警：依各縣市溫度與濕度評定注意、警戒、危險與高危險預警分級。",
                "obs_time": now_str,
                "dataset_id": "HEALTH-WEATHER",
                "link_url": "https://crowa.cwa.gov.tw/HealthWeather/"
            },
            {
                "id": "wind",
                "title": "風場預報",
                "full_title": "💨 數值風場預報 (WIFI 模擬圖)",
                "tag": "動態風向 · 陣風流線",
                "icon": "💨",
                "type": "iframe",
                "preview_url": "https://wifi.cwa.gov.tw/v2/redirect.html?lang=zh-tw",
                "image_url": "https://wifi.cwa.gov.tw/v2/redirect.html?lang=zh-tw",
                "iframe_url": "https://wifi.cwa.gov.tw/v2/redirect.html?lang=zh-tw",
                "description": "中央氣象署數值風場預報 (TGFS / WRF15km / WRF3km)，動態顯示台灣陸地與周邊海面風速與風向流線。",
                "obs_time": now_str,
                "dataset_id": "WIFI-WIND-001",
                "link_url": "https://wifi.cwa.gov.tw/v2/redirect.html?lang=zh-tw"
            }
        ]

        # 嘗試從 CWA OpenData 抓取最新精確觀測時間
        try:
            async with httpx.AsyncClient(timeout=4.0, verify=False) as client:
                res = await client.get('https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-003.json')
                if res.status_code == 200:
                    meta = res.json()
                    dt = meta.get('cwaopendata', {}).get('dataset', {}).get('ObsTime', {}).get('Datetime', '')
                    if dt:
                        formatted_time = dt.replace("T", " ")[:16]
                        for p in products:
                            if p["id"] in ["satellite", "radar"]:
                                p["obs_time"] = formatted_time
        except Exception:
            pass

        return {
            "status": "success",
            "source": "cwa_imagery_live",
            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "products": products
        }

