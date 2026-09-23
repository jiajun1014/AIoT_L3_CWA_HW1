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
        取得中央氣象署最新即時衛星雲圖與雷達回波圖
        涵蓋台灣彩色雲圖、東亞色調強化雲圖、雷達整合回波圖與全球紅外線雲圖
        """
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        # 預設即時雲圖清單 (具備高可用 CDN 與備援端點)
        products = [
            {
                "id": "taiwan_color",
                "title": "🇹🇼 台灣區域彩色衛星雲圖",
                "type": "satellite",
                "tag": "推薦 · 台灣特寫",
                "description": "中央氣象署高解析台灣周邊紅外線彩色衛星雲圖 (O-B0028-003)，能清楚辨識台灣本島與周邊積雨雲層分佈。",
                "image_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-003.jpg",
                "backup_url": "https://www.cwa.gov.tw/Data/satellite/TWI_IR1_CR_800/TWI_IR1_CR_800.jpg",
                "obs_time": now_str,
                "dataset_id": "O-B0028-003"
            },
            {
                "id": "east_asia_enhanced",
                "title": "🌏 東亞色調強化衛星雲圖",
                "type": "satellite",
                "tag": "大氣對流 · 颱風鋒面",
                "description": "中央氣象署東亞紅外線色調強化雲圖 (LCC_IR1_CR_2750)，以顯目顏色標定冷雲頂與劇烈對流發展區，特別適合觀察鋒面與低壓系統。",
                "image_url": "https://www.cwa.gov.tw/Data/satellite/LCC_IR1_CR_2750/LCC_IR1_CR_2750.jpg",
                "backup_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-002.jpg",
                "obs_time": now_str,
                "dataset_id": "LCC_IR1_CR_2750"
            },
            {
                "id": "radar_composite",
                "title": "🌧️ 全台雷達整合回波圖",
                "type": "radar",
                "tag": "即時降雨 · 回波強度",
                "description": "中央氣象署氣象雷達即時回波圖 (O-A0058-001)，反映大氣中雨滴、雪或冰雹之反射強度 (dBZ)，數值越高代表降雨越劇烈。",
                "image_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-001.png",
                "backup_url": "https://www.cwa.gov.tw/Data/radar/CV1_3600.png",
                "obs_time": now_str,
                "dataset_id": "O-A0058-001"
            },
            {
                "id": "global_ir",
                "title": "🌐 全球彩色紅外線雲圖",
                "type": "satellite",
                "tag": "全視角 · 行星尺度",
                "description": "向日葵衛星視角全球紅外線彩色雲圖 (O-B0028-001)，俯瞰整個西太平洋與亞洲大陸上空之雲系流動。",
                "image_url": "https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-001.jpg",
                "backup_url": "https://www.cwa.gov.tw/Data/satellite/FDK_IR1_CR_1000/FDK_IR1_CR_1000.jpg",
                "obs_time": now_str,
                "dataset_id": "O-B0028-001"
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
                        products[0]["obs_time"] = formatted_time
                        products[1]["obs_time"] = formatted_time
        except Exception:
            pass

        return {
            "status": "success",
            "source": "cwa_satellite_live",
            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "products": products
        }
