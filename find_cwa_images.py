import urllib.request
import re

url = 'https://www.cwa.gov.tw/V8/C/'
req = urllib.request.Request(
    url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.cwa.gov.tw/'
    }
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    # 找出所有包含 /Data/ 或 .jpg 或 .png 的 img src
    img_matches = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"][^>]*>', html)
    print("Found total images:", len(img_matches))
    for src in img_matches:
        if any(k in src.lower() for k in ['data', 'radar', 'sat', 'uvi', 'wind', 'light', 'temp', 'obs', 'rain']):
            print('Match:', src)

    idx = html.find('圖資專區')
    if idx != -1:
        sub = html[idx:idx+10000]
        # 找出每個 card: cube-head, img src, a href
        cards = re.findall(r'<a href="([^"]+)"[^>]*>.*?<div class="cube-head">([^<]+)</div>.*?<img src="([^"]+)"', sub, re.S)
        for href, title, img in cards:
            print(f"Title: {title.strip()} | Link: {href.strip()} | Img: {img.strip()}")
        # Check wind or 8th card
        cards2 = re.findall(r'<div class="cube-head">([^<]+)</div>', sub)
        print("All titles:", [c.strip() for c in cards2])
    scripts = re.findall(r'<script[^>]+src=[\'"]([^\'"]+)[\'"]', html)
    for s in scripts:
        if any(k in s.lower() for k in ['index', 'home', 'wind', 'map']):
            print('Script:', s)
    
    # Check if there is wind img or iframe or leaflet
    for line in html.split('\n'):
        if 'wifi' in line or 'OBS_Wind' in line or 'wind' in line.lower():
            if len(line.strip()) < 300:
                print('Wind line:', line.strip())
except Exception as e:
    print('Error:', e)



