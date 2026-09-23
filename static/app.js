// ==========================================================================
// AIoT L3 CWA Taiwan Weather App - Map-Centric Interactive Logic
// ==========================================================================

(function () {
  'use strict';

  // 天氣類型與圖示對照
  const WEATHER_ICONS = {
    sunny: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    thunderstorm: '⛈️'
  };

  const PERIOD_LABELS = ['☀️ 今日白天', '🌙 今晚至明晨', '🌤️ 明日白天'];

  // 台灣五大山脈著名百岳地標資料庫 (用於立體高低差地勢圖層)
  const TAIWAN_SUMMITS = [
    {
      id: 'yushan',
      name: '玉山主峰',
      alt: 3952,
      range: '玉山山脈',
      desc: '東亞第一高峰，百岳之首，台灣地標與最高氣象分水嶺。',
      x: 895,
      y: 1220
    },
    {
      id: 'xueshan',
      name: '雪山主峰',
      alt: 3886,
      range: '雪山山脈',
      desc: '台灣第二高峰，擁有壯麗冰河圈谷地形，北台灣名山之冠。',
      x: 1015,
      y: 620
    },
    {
      id: 'xiuguluan',
      name: '秀姑巒山',
      alt: 3805,
      range: '中央山脈',
      desc: '中央山脈最高峰，氣勢雄渾，傲立於花蓮與南投交界。',
      x: 1010,
      y: 1240
    },
    {
      id: 'nanhu',
      name: '南湖大山',
      alt: 3742,
      range: '中央山脈',
      desc: '中央山脈北段霸主，冰河遺跡與高山圈谷景致名揚全台。',
      x: 1115,
      y: 600
    },
    {
      id: 'hehuan',
      name: '合歡山主峰',
      alt: 3422,
      range: '中央山脈',
      desc: '台灣高山觀星與冬季賞雪第一勝地，公路可直達高海拔。',
      x: 1030,
      y: 840
    },
    {
      id: 'dabajian',
      name: '大霸尖山',
      alt: 3492,
      range: '雪山山脈',
      desc: '有「世紀奇峰」美譽，四面絕壁、孤峰突起之巨石聖山。',
      x: 1030,
      y: 520
    },
    {
      id: 'alishan',
      name: '阿里山 (祝山)',
      alt: 2488,
      range: '阿里山山脈',
      desc: '台灣最富盛名日出雲海景點，森林鐵路與巨木群聞名世界。',
      x: 800,
      y: 1160
    },
    {
      id: 'beidawu',
      name: '北大武山',
      alt: 3092,
      range: '中央山脈',
      desc: '南台灣屏障，五嶽之一，排灣族與魯凱族心目中的聖山。',
      x: 820,
      y: 1690
    }
  ];

  // 台灣各縣市分區對照表
  const COUNTY_REGIONS = {
    '基隆市': 'north', '臺北市': 'north', '台北市': 'north', '新北市': 'north', '桃園市': 'north', '新竹市': 'north', '新竹縣': 'north', '苗栗縣': 'north',
    '臺中市': 'central', '台中市': 'central', '彰化縣': 'central', '南投縣': 'central', '雲林縣': 'central', '嘉義市': 'central', '嘉義縣': 'central',
    '臺南市': 'south', '台南市': 'south', '高雄市': 'south', '屏東縣': 'south',
    '宜蘭縣': 'east', '花蓮縣': 'east', '臺東縣': 'east', '台東縣': 'east',
    '澎湖縣': 'islands', '金門縣': 'islands', '連江縣': 'islands'
  };

  // 全域狀態
  const state = {
    weatherData: [],
    mapData: null,
    activePeriodIndex: 0,
    selectedCity: '臺北市',
    activeRegion: 'all',
    searchQuery: '',
    apiKey: localStorage.getItem('cwa_api_key') || '',
    activeLayer: 'elevation', // 'elevation' | 'admin' | 'weather' | 'satellite'
    satelliteProducts: [],
    activeSatelliteProduct: 'taiwan_color'
  };

  // DOM 元素快取
  const dom = {
    // 狀態與導覽
    connectionStatus: document.getElementById('connection-status'),
    statusText: document.getElementById('status-text'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnToggleGrid: document.getElementById('btn-toggle-grid'),
    btnHideGrid: document.getElementById('btn-hide-grid'),
    btnApiModal: document.getElementById('btn-api-modal'),
    btnAboutModal: document.getElementById('btn-about-modal'),
    btnSatelliteModal: document.getElementById('btn-satellite-modal'),
    navPeriodPills: document.getElementById('nav-period-pills'),
    // 地圖舞台與圖層切換
    taiwanStage: document.getElementById('taiwan-stage'),
    mapContainer: document.getElementById('map-container'),
    mapLoading: document.getElementById('map-loading'),
    overlayPeriodBadge: document.getElementById('overlay-period-badge'),
    overlayPeriodText: document.getElementById('overlay-period-text'),
    mapLayerSwitcher: document.getElementById('map-layer-switcher'),
    elevationLegend: document.getElementById('elevation-legend'),
    mapSatelliteOverlay: document.getElementById('map-satellite-overlay'),
    mapSatelliteImg: document.getElementById('map-satellite-img'),
    // 百岳山峰提示卡
    peakTooltip: document.getElementById('peak-tooltip'),
    peakTtName: document.getElementById('peak-tt-name'),
    peakTtRange: document.getElementById('peak-tt-range'),
    peakTtAlt: document.getElementById('peak-tt-alt'),
    peakTtDesc: document.getElementById('peak-tt-desc'),
    // 懸停 Tooltip
    tooltip: document.getElementById('map-tooltip'),
    ttCity: document.getElementById('tt-city'),
    ttRegion: document.getElementById('tt-region'),
    ttIcon: document.getElementById('tt-icon'),
    ttTemp: document.getElementById('tt-temp'),
    ttWx: document.getElementById('tt-wx'),
    ttPop: document.getElementById('tt-pop'),
    ttRange: document.getElementById('tt-range'),
    ttCi: document.getElementById('tt-ci'),
    // 焦點城市 Hero Pill
    heroRegion: document.getElementById('hero-region'),
    heroCity: document.getElementById('hero-city'),
    heroIcon: document.getElementById('hero-icon'),
    heroTemp: document.getElementById('hero-temp'),
    heroWx: document.getElementById('hero-wx'),
    heroPop: document.getElementById('hero-pop'),
    heroRange: document.getElementById('hero-range'),
    heroCi: document.getElementById('hero-ci'),
    // 詳細抽屜
    drawer: document.getElementById('city-detail-drawer'),
    drawerRegion: document.getElementById('drawer-region'),
    drawerCity: document.getElementById('drawer-city'),
    drawerUpdateTime: document.getElementById('drawer-update-time'),
    drawerPeriodsContainer: document.getElementById('drawer-periods-container'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    // 網格檢視
    gridSection: document.getElementById('cities-grid-section'),
    regionTabs: document.getElementById('region-tabs'),
    searchInput: document.getElementById('search-input'),
    citiesGrid: document.getElementById('cities-grid'),
    // 衛星雲圖 Modal
    satelliteModal: document.getElementById('satellite-modal-overlay'),
    btnCloseSatellite: document.getElementById('btn-close-satellite'),
    btnCloseSatelliteOk: document.getElementById('btn-close-satellite-ok'),
    btnRefreshSatellite: document.getElementById('btn-refresh-satellite'),
    satelliteChannelsTabs: document.getElementById('satellite-channels-tabs'),
    satelliteLiveImg: document.getElementById('satellite-live-img'),
    satelliteLoading: document.getElementById('satellite-loading'),
    satProductTitle: document.getElementById('sat-product-title'),
    satObsTime: document.getElementById('sat-obs-time'),
    satDatasetId: document.getElementById('sat-dataset-id'),
    satelliteLegendPanel: document.getElementById('satellite-legend-panel'),
    satLegendTitle: document.getElementById('sat-legend-title'),
    satLegendDesc: document.getElementById('sat-legend-desc'),
    satScaleContainer: document.getElementById('sat-scale-container'),
    // API & 關於 Modals
    apiModal: document.getElementById('api-modal-overlay'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnSaveKey: document.getElementById('btn-save-key'),
    btnClearKey: document.getElementById('btn-clear-key'),
    cwaKeyInput: document.getElementById('cwa-key-input'),
    aboutModal: document.getElementById('about-modal-overlay'),
    btnCloseAbout: document.getElementById('btn-close-about'),
    btnCloseAboutOk: document.getElementById('btn-close-about-ok')
  };

  // 初始化 API Key 欄位
  if (dom.cwaKeyInput && state.apiKey) {
    dom.cwaKeyInput.value = state.apiKey;
  }

  function getWeatherIcon(weatherType) {
    return WEATHER_ICONS[weatherType] || '🌤️';
  }

  // 取得縣市在目前時段的氣象資訊
  function getCityWeather(cityName) {
    if (!state.weatherData || state.weatherData.length === 0) return null;
    const cityData = state.weatherData.find(item => item.city === cityName || cityName.includes(item.city));
    if (!cityData) return null;

    const period = cityData.periods[state.activePeriodIndex] || cityData.periods[0];
    const minT = parseInt(period.min_t) || 24;
    const maxT = parseInt(period.max_t) || 30;
    const avgT = Math.round((minT + maxT) / 2);

    return {
      city: cityData.city,
      regionName: cityData.region_name || '台灣',
      wx: period.wx,
      icon: getWeatherIcon(period.weather_type),
      avgT: avgT,
      range: `${minT}° ~ ${maxT}°`,
      pop: period.pop || '0%',
      ci: period.ci || '舒適',
      allPeriods: cityData.periods
    };
  }

  // ==========================================================================
  // 載入並渲染台灣 SVG 地圖 (含 3D 地勢高低差浮雕、清晰界線與名山百岳)
  // ==========================================================================
  async function loadAndRenderMap() {
    try {
      const response = await fetch('/static/taiwan_counties.json');
      if (!response.ok) throw new Error('無法載入地圖幾何資料');
      const data = await response.json();
      state.mapData = data;

      // 建立 SVG 節點
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'taiwan-map-svg');
      svg.setAttribute('viewBox', data.viewBox || '0 0 1440 2055');

      // 定義濾鏡 (陰影、高亮光暈與地勢高低差漸層)
      svg.innerHTML = `
        <defs>
          <filter id="island-shadow" x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#021c38" flood-opacity="0.35" />
          </filter>
          <filter id="pin-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#021c38" flood-opacity="0.25" />
          </filter>
          <filter id="mountain-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          
          <!-- 台灣地勢高低差分層設色漸層 (Hypsometric Elevation Tint) -->
          <linearGradient id="island-elevation-gradient" x1="15%" y1="20%" x2="80%" y2="85%">
            <stop offset="0%" stop-color="#86efac" />
            <stop offset="25%" stop-color="#fde047" />
            <stop offset="50%" stop-color="#fb923c" />
            <stop offset="68%" stop-color="#dc2626" />
            <stop offset="80%" stop-color="#ffffff" />
            <stop offset="92%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#6ee7b7" />
          </linearGradient>
        </defs>

        <!-- 1. 縣市陸地路徑圖層 (清晰界線) -->
        <g id="counties-layer" filter="url(#island-shadow)"></g>

        <!-- 2. 台灣五大山脈 3D 立體地勢浮雕圖層 (Elevation Relief) -->
        <g id="topography-layer"></g>

        <!-- 3. 縣市名稱文字標籤圖層 -->
        <g id="county-labels-layer"></g>

        <!-- 4. 氣象徽章標記圖層 -->
        <g id="pins-layer"></g>

        <!-- 5. 當前選中之焦點定位標記 -->
        <g id="active-marker" class="active-marker" transform="translate(1205, 175)">
          <circle class="marker-pulse" r="28" />
          <path class="marker-pin-body" d="M0 -36 C-18 -36 -24 -18 -24 -4 C-24 16 0 36 0 36 C0 36 24 16 24 -4 C24 -18 18 -36 0 -36 Z" />
          <circle class="marker-inner-dot" cx="0" cy="-12" r="9" />
        </g>
      `;

      const countiesLayer = svg.querySelector('#counties-layer');
      const topographyLayer = svg.querySelector('#topography-layer');
      const labelsLayer = svg.querySelector('#county-labels-layer');
      const pinsLayer = svg.querySelector('#pins-layer');

      // 建立各縣市向量路徑與氣象徽章
      data.counties.forEach(county => {
        const cname = county.name;
        const region = COUNTY_REGIONS[cname] || 'north';

        // 1. 縣市陸地路徑 (設定 data-region 供行政模式色彩套用)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `path-${county.id}`);
        path.setAttribute('class', `county-path ${cname === state.selectedCity ? 'active' : ''}`);
        path.setAttribute('data-county', cname);
        path.setAttribute('data-region', region);
        path.setAttribute('d', county.d);
        countiesLayer.appendChild(path);

        // 2. 縣市名稱標籤 (清晰呈現各縣市界線所屬)
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('class', 'county-label-text');
        labelText.setAttribute('x', county.pin_x);
        labelText.setAttribute('y', county.pin_y + 44);
        labelText.textContent = cname;
        labelsLayer.appendChild(labelText);

        // 3. 氣象浮動徽章
        const pinG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pinG.setAttribute('id', `pin-${county.id}`);
        pinG.setAttribute('class', 'map-pin');
        pinG.setAttribute('data-county', cname);
        pinG.setAttribute('transform', `translate(${county.pin_x}, ${county.pin_y})`);
        pinG.innerHTML = `
          <circle class="pin-bg" r="38" />
          <text class="pin-icon" y="13" text-anchor="middle">☀️</text>
          <text class="pin-temp-text" y="32" text-anchor="middle">28°</text>
        `;
        pinsLayer.appendChild(pinG);

        // 綁定事件：陸地路徑與浮動徽章共用
        [path, pinG].forEach(elem => {
          elem.addEventListener('mouseenter', e => handleMapEnter(e, cname));
          elem.addEventListener('mousemove', handleMapMove);
          elem.addEventListener('mouseleave', handleMapLeave);
          elem.addEventListener('click', () => selectCity(cname));
        });
      });

      // 渲染台灣五大山脈立體地勢浮雕 (中央山脈、雪山、玉山、阿里山、海岸山脈)
      topographyLayer.innerHTML = `
        <!-- 山脈基底地形陰影 (Shaded Relief Base) -->
        <g class="topography-shadows" filter="url(#mountain-blur)">
          <path class="mountain-shadow" d="M 1190 470 Q 1120 600 1060 840 Q 995 1100 970 1360 Q 865 1630 780 1860" stroke-width="56" />
          <path class="mountain-shadow" d="M 1130 370 Q 1050 530 990 660 Q 930 750 880 790" stroke-width="40" />
          <path class="mountain-shadow" d="M 940 1090 Q 895 1220 845 1380" stroke-width="45" />
          <path class="mountain-shadow" d="M 830 1050 Q 800 1160 760 1340" stroke-width="34" />
          <path class="mountain-shadow" d="M 1220 830 Q 1160 1100 1085 1450" stroke-width="30" />
        </g>

        <!-- 立體山脈脊線 (Mountain Ridge Backbone & Crest) -->
        <g class="topography-ridges">
          <!-- 中央山脈主脊 -->
          <path class="mountain-ridge ridge-backbone" d="M 1190 470 Q 1120 600 1060 840 Q 995 1100 970 1360 Q 865 1630 780 1860" />
          <path class="mountain-ridge ridge-crest" d="M 1190 470 Q 1120 600 1060 840 Q 995 1100 970 1360 Q 865 1630 780 1860" />

          <!-- 雪山山脈 -->
          <path class="mountain-ridge ridge-backbone" d="M 1130 370 Q 1050 530 990 660 Q 930 750 880 790" stroke-width="12" />
          <path class="mountain-ridge ridge-crest" d="M 1130 370 Q 1050 530 990 660 Q 930 750 880 790" stroke-width="4.0" />

          <!-- 玉山山脈群 -->
          <path class="mountain-ridge ridge-backbone" d="M 940 1090 Q 895 1220 845 1380" stroke-width="14" />
          <path class="mountain-ridge ridge-crest" d="M 940 1090 Q 895 1220 845 1380" stroke-width="4.5" />

          <!-- 阿里山山脈 -->
          <path class="mountain-ridge ridge-backbone" d="M 830 1050 Q 800 1160 760 1340" stroke-width="9" stroke="rgba(194, 65, 12, 0.8)" />
          <path class="mountain-ridge ridge-crest" d="M 830 1050 Q 800 1160 760 1340" stroke-width="2.8" />

          <!-- 海岸山脈 -->
          <path class="mountain-ridge ridge-backbone" d="M 1220 830 Q 1160 1100 1085 1450" stroke-width="8" stroke="rgba(180, 83, 9, 0.75)" />
          <path class="mountain-ridge ridge-crest" d="M 1220 830 Q 1160 1100 1085 1450" stroke-width="2.8" />
        </g>

        <!-- 山脈地理標示文字 -->
        <g class="topography-range-labels">
          <text class="range-label" x="970" y="520">雪山山脈</text>
          <text class="range-label" x="1090" y="990">中央山脈</text>
          <text class="range-label" x="840" y="1280">玉山山脈</text>
          <text class="range-label" x="720" y="1170">阿里山脈</text>
          <text class="range-label" x="1155" y="1190">海岸山脈</text>
        </g>

        <!-- 名山百岳地標群 (Summit Pins) -->
        <g class="topography-summits" id="summits-group"></g>
      `;

      // 注入名山百岳 Summit Pins
      const summitsGroup = topographyLayer.querySelector('#summits-group');
      TAIWAN_SUMMITS.forEach(summit => {
        const summitG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        summitG.setAttribute('class', 'summit-pin');
        summitG.setAttribute('data-summit-id', summit.id);
        summitG.setAttribute('transform', `translate(${summit.x}, ${summit.y})`);
        summitG.innerHTML = `
          <circle class="summit-pin-bg" r="26" />
          <text class="summit-icon" y="8" text-anchor="middle">⛰️</text>
          <text class="summit-label" y="-34">${summit.name}</text>
          <text class="summit-alt" y="-18">${summit.alt}m</text>
        `;

        summitG.addEventListener('mouseenter', e => handleSummitEnter(e, summit));
        summitG.addEventListener('mousemove', handleSummitMove);
        summitG.addEventListener('mouseleave', handleSummitLeave);
        summitG.addEventListener('click', () => handleSummitClick(summit));

        summitsGroup.appendChild(summitG);
      });

      // 替換容器內的 Loading
      dom.mapContainer.innerHTML = '';
      dom.mapContainer.appendChild(svg);

      // 套用預設圖層模式 (立體地勢圖)
      switchMapLayer(state.activeLayer);

      // 若氣象資料已先到達，立即刷新地圖圖標
      updateMapPins();
      updateActiveMarker();

    } catch (err) {
      console.error('地圖初始化失敗:', err);
      dom.mapContainer.innerHTML = `
        <div style="text-align: center; color: #ffffff; padding: 40px;">
          <p>⚠️ 地圖向量檔載入失敗，已切換至備用清單檢視</p>
        </div>
      `;
      dom.gridSection.classList.add('active');
    }
  }

  // ==========================================================================
  // 山峰百岳提示事件處理 (Summit Peaks Handlers)
  // ==========================================================================
  function handleSummitEnter(e, summit) {
    if (!dom.peakTooltip) return;
    dom.peakTtName.textContent = summit.name;
    dom.peakTtRange.textContent = summit.range;
    dom.peakTtAlt.textContent = `${summit.alt.toLocaleString()} 公尺`;
    dom.peakTtDesc.textContent = summit.desc;
    dom.peakTooltip.classList.add('visible');
    positionPeakTooltip(e.clientX, e.clientY);
  }

  function handleSummitMove(e) {
    positionPeakTooltip(e.clientX, e.clientY);
  }

  function handleSummitLeave() {
    if (dom.peakTooltip) dom.peakTooltip.classList.remove('visible');
  }

  function handleSummitClick(summit) {
    handleSummitEnter({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, summit);
  }

  function positionPeakTooltip(clientX, clientY) {
    if (!dom.peakTooltip) return;
    dom.peakTooltip.style.left = `${clientX}px`;
    dom.peakTooltip.style.top = `${clientY - 20}px`;
  }

  // ==========================================================================
  // 地圖圖層切換器 (Map Layer Switcher)
  // ==========================================================================
  function switchMapLayer(layerName) {
    state.activeLayer = layerName;

    // 更新圖層按鈕狀態
    if (dom.mapLayerSwitcher) {
      dom.mapLayerSwitcher.querySelectorAll('.layer-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layerName);
      });
    }

    // 更新地圖容器 class
    if (dom.mapContainer) {
      dom.mapContainer.classList.remove('map-mode-elevation', 'map-mode-admin', 'map-mode-weather', 'map-mode-satellite');
      dom.mapContainer.classList.add(`map-mode-${layerName}`);
    }

    const topoLayer = document.getElementById('topography-layer');
    const labelsLayer = document.getElementById('county-labels-layer');
    const pinsLayer = document.getElementById('pins-layer');

    if (layerName === 'elevation') {
      if (topoLayer) topoLayer.style.display = 'block';
      if (dom.elevationLegend) dom.elevationLegend.classList.remove('hidden');
      if (labelsLayer) labelsLayer.style.opacity = '0.4';
      if (pinsLayer) pinsLayer.style.display = 'block';
    } else if (layerName === 'admin') {
      if (topoLayer) topoLayer.style.display = 'none';
      if (dom.elevationLegend) dom.elevationLegend.classList.add('hidden');
      if (labelsLayer) labelsLayer.style.opacity = '1';
      if (pinsLayer) pinsLayer.style.display = 'block';
    } else if (layerName === 'weather') {
      if (topoLayer) topoLayer.style.display = 'none';
      if (dom.elevationLegend) dom.elevationLegend.classList.add('hidden');
      if (labelsLayer) labelsLayer.style.opacity = '0.5';
      if (pinsLayer) pinsLayer.style.display = 'block';
    } else if (layerName === 'satellite') {
      if (topoLayer) topoLayer.style.display = 'none';
      if (dom.elevationLegend) dom.elevationLegend.classList.add('hidden');
      if (labelsLayer) labelsLayer.style.opacity = '0.7';
      if (pinsLayer) pinsLayer.style.display = 'block';
      if (dom.mapSatelliteImg && !dom.mapSatelliteImg.src) {
        dom.mapSatelliteImg.src = 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-003.jpg';
      }
    }
  }

  // ==========================================================================
  // 滑鼠懸停與跟隨 Tooltip 事件處理
  // ==========================================================================
  function handleMapEnter(e, cityName) {
    const info = getCityWeather(cityName);
    if (!info) return;

    // 高亮該縣市路徑
    document.querySelectorAll('.county-path').forEach(p => {
      if (p.getAttribute('data-county') === cityName) {
        p.style.fill = 'var(--island-land-hover)';
        p.style.stroke = 'var(--island-stroke-hover)';
        p.style.strokeWidth = '3.8';
      }
    });

    // 填充 Tooltip 內容
    dom.ttCity.textContent = info.city;
    dom.ttRegion.textContent = info.regionName;
    dom.ttIcon.textContent = info.icon;
    dom.ttTemp.textContent = `${info.avgT}°C`;
    dom.ttWx.textContent = info.wx;
    dom.ttPop.textContent = info.pop;
    dom.ttRange.textContent = info.range;
    dom.ttCi.textContent = info.ci;

    // 顯示 Tooltip
    dom.tooltip.classList.add('visible');
    positionTooltip(e.clientX, e.clientY);
  }

  function handleMapMove(e) {
    positionTooltip(e.clientX, e.clientY);
  }

  function handleMapLeave() {
    // 復原非 active 縣市樣式
    document.querySelectorAll('.county-path').forEach(p => {
      const cname = p.getAttribute('data-county');
      if (cname !== state.selectedCity) {
        p.style.fill = '';
        p.style.stroke = '';
        p.style.strokeWidth = '';
      }
    });
    dom.tooltip.classList.remove('visible');
  }

  function positionTooltip(clientX, clientY) {
    const tooltipRect = dom.tooltip.getBoundingClientRect();
    const padding = 15;
    let x = clientX + padding;
    let y = clientY + padding;

    // 防止超出螢幕右方與下方
    if (x + tooltipRect.width > window.innerWidth - 10) {
      x = clientX - tooltipRect.width - padding;
    }
    if (y + tooltipRect.height > window.innerHeight - 10) {
      y = clientY - tooltipRect.height - padding;
    }

    dom.tooltip.style.left = `${Math.max(10, x)}px`;
    dom.tooltip.style.top = `${Math.max(10, y)}px`;
  }

  // ==========================================================================
  // 選取縣市與聯動更新 (Select City)
  // ==========================================================================
  function selectCity(cityName) {
    state.selectedCity = cityName;

    // 更新路徑 active 樣式
    document.querySelectorAll('.county-path').forEach(p => {
      const isCurrent = p.getAttribute('data-county') === cityName;
      p.classList.toggle('active', isCurrent);
      if (!isCurrent) {
        p.style.fill = '';
        p.style.stroke = '';
        p.style.strokeWidth = '';
      }
    });

    updateActiveMarker();
    renderHero();
    renderDrawer();
    renderGrid();

    // 點擊後開啟 36 小時抽屜卡片
    dom.drawer.classList.add('open');
  }

  // 更新定位 Marker 📍 座標
  function updateActiveMarker() {
    const marker = document.getElementById('active-marker');
    if (!marker || !state.mapData) return;

    const county = state.mapData.counties.find(c => c.name === state.selectedCity);
    if (county) {
      // 標記在 pin 上方稍微偏移，以露出徽章
      marker.setAttribute('transform', `translate(${county.pin_x}, ${county.pin_y - 28})`);
    }
  }

  // 更新地圖上 22 縣市浮動徽章的氣象圖示與溫度
  function updateMapPins() {
    if (!state.weatherData || state.weatherData.length === 0) return;

    state.weatherData.forEach(cityData => {
      const cname = cityData.city;
      const period = cityData.periods[state.activePeriodIndex] || cityData.periods[0];
      const icon = getWeatherIcon(period.weather_type);
      const minT = parseInt(period.min_t) || 24;
      const maxT = parseInt(period.max_t) || 30;
      const avgT = Math.round((minT + maxT) / 2);

      const pinElem = document.querySelector(`.map-pin[data-county="${cname}"]`);
      if (pinElem) {
        const iconElem = pinElem.querySelector('.pin-icon');
        const tempElem = pinElem.querySelector('.pin-temp-text');
        if (iconElem) iconElem.textContent = icon;
        if (tempElem) tempElem.textContent = `${avgT}°`;
      }
    });
  }

  // ==========================================================================
  // 渲染焦點摘要 Hero Pill & 36H 詳細抽屜
  // ==========================================================================
  function renderHero() {
    const info = getCityWeather(state.selectedCity);
    if (!info) return;

    dom.heroRegion.textContent = info.regionName;
    dom.heroCity.textContent = info.city;
    dom.heroIcon.textContent = info.icon;
    dom.heroTemp.textContent = `${info.avgT}°C`;
    dom.heroWx.textContent = info.wx;
    dom.heroPop.textContent = info.pop;
    dom.heroRange.textContent = info.range;
    dom.heroCi.textContent = info.ci;
  }

  function renderDrawer() {
    const info = getCityWeather(state.selectedCity);
    if (!info) return;

    dom.drawerRegion.textContent = info.regionName;
    dom.drawerCity.textContent = info.city;

    dom.drawerPeriodsContainer.innerHTML = '';
    info.allPeriods.forEach((p, idx) => {
      const minT = parseInt(p.min_t) || 24;
      const maxT = parseInt(p.max_t) || 30;
      const isCurrent = idx === state.activePeriodIndex;

      const card = document.createElement('div');
      card.className = `drawer-period-card ${isCurrent ? 'current' : ''}`;
      card.innerHTML = `
        <span class="d-period-time">${p.label || `時段 ${idx + 1}`}</span>
        <div class="d-period-row">
          <div class="d-period-wx">
            <span class="d-period-icon">${getWeatherIcon(p.weather_type)}</span>
            <span>${p.wx}</span>
          </div>
          <span class="d-period-temp">${minT}° ~ ${maxT}°</span>
        </div>
        <div class="d-period-details">
          <span>💧 降雨 ${p.pop}</span>
          <span>🧣 ${p.ci}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        setPeriod(idx);
      });
      dom.drawerPeriodsContainer.appendChild(card);
    });
  }

  // ==========================================================================
  // 渲染縣市網格卡片列表
  // ==========================================================================
  function renderGrid() {
    if (!dom.citiesGrid) return;
    dom.citiesGrid.innerHTML = '';

    const filtered = state.weatherData.filter(item => {
      const matchRegion = state.activeRegion === 'all' || item.region === state.activeRegion;
      const matchSearch = !state.searchQuery || item.city.includes(state.searchQuery);
      return matchRegion && matchSearch;
    });

    if (filtered.length === 0) {
      dom.citiesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
          無符合「${state.searchQuery}」的縣市氣象資料
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const p = item.periods[state.activePeriodIndex] || item.periods[0];
      const minT = parseInt(p.min_t) || 24;
      const maxT = parseInt(p.max_t) || 30;
      const avgT = Math.round((minT + maxT) / 2);
      const isSelected = item.city === state.selectedCity;

      const card = document.createElement('div');
      card.className = `city-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-top">
          <span class="card-city-name">${item.city}</span>
          <span class="card-region-tag">${item.region_name}</span>
        </div>
        <div class="card-center">
          <div class="card-wx-wrap">
            <span class="card-icon">${getWeatherIcon(p.weather_type)}</span>
            <span class="card-wx-name">${p.wx}</span>
          </div>
          <div class="card-temp">${avgT}°</div>
        </div>
        <div class="card-bottom">
          <span>💧 降雨 ${p.pop}</span>
          <span>${p.ci}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectCity(item.city);
        // 平滑滾動回地圖
        dom.taiwanStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      dom.citiesGrid.appendChild(card);
    });
  }

  // ==========================================================================
  // 時段切換邏輯 (Period Switcher)
  // ==========================================================================
  function setPeriod(idx) {
    state.activePeriodIndex = idx;

    // 更新導覽列時段膠囊按鈕
    dom.navPeriodPills.querySelectorAll('.period-pill').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });

    // 更新地圖左上方按鈕文字
    if (dom.overlayPeriodText) {
      dom.overlayPeriodText.textContent = ['今日白天', '今晚至明晨', '明日白天'][idx];
    }

    updateMapPins();
    renderHero();
    renderDrawer();
    renderGrid();
  }

  // ==========================================================================
  // API 資料抓取 (Fetch Forecast)
  // ==========================================================================
  async function fetchWeatherData() {
    dom.statusText.textContent = '載入中...';
    const headers = {};
    if (state.apiKey) {
      headers['X-CWA-API-KEY'] = state.apiKey;
    }

    try {
      const response = await fetch('/api/weather/forecast', { headers });
      if (!response.ok) throw new Error(`HTTP 錯誤: ${response.status}`);

      const res = await response.json();
      state.weatherData = res.data || [];

      // 更新連線狀態指示燈
      const dot = dom.connectionStatus.querySelector('.status-dot');
      if (res.source === 'cwa_live') {
        dot.className = 'status-dot';
        dom.statusText.textContent = '氣象署即時連線';
        dom.connectionStatus.title = res.message || 'CWA Live Connected';
      } else {
        dot.className = 'status-dot offline';
        dom.statusText.textContent = '展示備援模式';
        dom.connectionStatus.title = res.message || 'Offline Fallback Active';
      }

      if (dom.drawerUpdateTime) {
        dom.drawerUpdateTime.textContent = `最後資料更新：${res.updated_at || new Date().toLocaleTimeString()}`;
      }

      updateMapPins();
      renderHero();
      renderDrawer();
      renderGrid();

    } catch (err) {
      console.error('抓取氣象資料失敗:', err);
      dom.statusText.textContent = '連線異常';
      const dot = dom.connectionStatus.querySelector('.status-dot');
      dot.className = 'status-dot offline';
    }
  }

  // ==========================================================================
  // 中央氣象署即時衛星雲圖與雷達回波檢視邏輯 (Satellite Cloud & Radar Logic)
  // ==========================================================================
  async function fetchSatelliteData() {
    try {
      const headers = {};
      if (state.apiKey) {
        headers['X-CWA-API-KEY'] = state.apiKey;
      }
      const res = await fetch('/api/weather/satellite', { headers });
      if (!res.ok) throw new Error('無法取得即時衛星雲圖資料');
      const data = await res.json();
      state.satelliteProducts = data.products || [];
      if (state.satelliteProducts.length > 0) {
        renderSatelliteProduct(state.activeSatelliteProduct);
      }
    } catch (err) {
      console.error('抓取衛星雲圖失敗:', err);
    }
  }

  function renderSatelliteProduct(productId) {
    state.activeSatelliteProduct = productId;
    const product = state.satelliteProducts.find(p => p.id === productId);
    if (!product) return;

    // 更新 tabs active 狀態
    if (dom.satelliteChannelsTabs) {
      dom.satelliteChannelsTabs.querySelectorAll('.sat-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.product === productId);
      });
    }

    // 顯示載入動畫
    if (dom.satelliteLoading) {
      dom.satelliteLoading.classList.remove('hidden');
    }

    // 載入高解析影像
    const img = new Image();
    img.onload = () => {
      if (dom.satelliteLiveImg) dom.satelliteLiveImg.src = product.image_url;
      if (dom.satelliteLoading) dom.satelliteLoading.classList.add('hidden');
    };
    img.onerror = () => {
      if (dom.satelliteLiveImg) dom.satelliteLiveImg.src = product.backup_url || product.image_url;
      if (dom.satelliteLoading) dom.satelliteLoading.classList.add('hidden');
    };
    img.src = product.image_url;

    // 同步更新地圖底圖疊加層影像
    if (dom.mapSatelliteImg && (productId === 'taiwan_color' || !dom.mapSatelliteImg.src)) {
      dom.mapSatelliteImg.src = product.image_url;
    }

    // 更新產品文字資訊
    if (dom.satProductTitle) dom.satProductTitle.textContent = product.title;
    if (dom.satObsTime) dom.satObsTime.textContent = product.obs_time || '即時更新';
    if (dom.satDatasetId) dom.satDatasetId.textContent = product.dataset_id || 'CWA-OpenData';
    if (dom.satLegendTitle) dom.satLegendTitle.textContent = product.title + ' · 雲層與水氣判讀';
    if (dom.satLegendDesc) dom.satLegendDesc.textContent = product.description;

    // 動態渲染色階圖例 (雷達回波 dBZ 或紅外線色調強化)
    if (dom.satScaleContainer) {
      if (product.type === 'radar') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div class="radar-scale-colors"></div>
            <div class="radar-scale-ticks">
              <span>5 dBZ (毛毛細雨)</span>
              <span>20 dBZ (小雨)</span>
              <span>35 dBZ (顯著降雨)</span>
              <span>50 dBZ (豪大雨)</span>
              <span>65 dBZ+ (強劇烈對流/冰雹)</span>
            </div>
          </div>
        `;
      } else {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #1e3a8a 0%, #0284c7 25%, #fef08a 50%, #ea580c 75%, #dc2626 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>暖層低雲 (>10°C)</span>
              <span>中層大氣 (0°C)</span>
              <span>高層冷雲 (-20°C)</span>
              <span>劇烈對流/冷雲頂 (&lt;-50°C)</span>
            </div>
          </div>
        `;
      }
    }
  }

  function openSatelliteModal() {
    if (!dom.satelliteModal) return;
    dom.satelliteModal.classList.add('active');
    if (state.satelliteProducts.length === 0) {
      fetchSatelliteData();
    } else {
      renderSatelliteProduct(state.activeSatelliteProduct);
    }
  }

  function closeSatelliteModal() {
    if (dom.satelliteModal) {
      dom.satelliteModal.classList.remove('active');
    }
  }

  // ==========================================================================
  // 事件監聽註冊 (Event Listeners)
  // ==========================================================================
  function initEventListeners() {
    // 地圖圖層切換 (立體地勢 / 清晰界線 / 氣象圖示 / 衛星雲圖)
    if (dom.mapLayerSwitcher) {
      dom.mapLayerSwitcher.addEventListener('click', e => {
        const pill = e.target.closest('.layer-pill');
        if (!pill) return;
        switchMapLayer(pill.dataset.layer);
      });
    }

    // 開啟衛星雲圖 Modal
    if (dom.btnSatelliteModal) {
      dom.btnSatelliteModal.addEventListener('click', () => {
        openSatelliteModal();
      });
    }

    // 關閉衛星雲圖 Modal
    if (dom.btnCloseSatellite) {
      dom.btnCloseSatellite.addEventListener('click', closeSatelliteModal);
    }
    if (dom.btnCloseSatelliteOk) {
      dom.btnCloseSatelliteOk.addEventListener('click', closeSatelliteModal);
    }
    if (dom.satelliteModal) {
      dom.satelliteModal.addEventListener('click', e => {
        if (e.target === dom.satelliteModal) closeSatelliteModal();
      });
    }

    // 重新整理衛星雲圖
    if (dom.btnRefreshSatellite) {
      dom.btnRefreshSatellite.addEventListener('click', () => {
        dom.btnRefreshSatellite.textContent = '載入中...';
        fetchSatelliteData().then(() => {
          dom.btnRefreshSatellite.textContent = '🔄 重新整理';
        });
      });
    }

    // 切換衛星產品頁籤
    if (dom.satelliteChannelsTabs) {
      dom.satelliteChannelsTabs.addEventListener('click', e => {
        const tab = e.target.closest('.sat-tab');
        if (!tab) return;
        renderSatelliteProduct(tab.dataset.product);
      });
    }

    // 重新整理按鈕
    dom.btnRefresh.addEventListener('click', () => {
      dom.btnRefresh.style.transition = 'transform 0.5s ease';
      dom.btnRefresh.style.transform = 'rotate(360deg)';
      setTimeout(() => { dom.btnRefresh.style.transform = 'none'; }, 500);
      fetchWeatherData();
    });

    // 導覽列時段切換
    dom.navPeriodPills.addEventListener('click', e => {
      const pill = e.target.closest('.period-pill');
      if (!pill) return;
      const idx = parseInt(pill.dataset.period);
      setPeriod(idx);
    });

    // 地圖左上角徽章點擊 (循環切換時段)
    dom.overlayPeriodBadge.addEventListener('click', () => {
      const nextIdx = (state.activePeriodIndex + 1) % 3;
      setPeriod(nextIdx);
    });

    // 關閉 36H 詳細抽屜
    dom.btnCloseDrawer.addEventListener('click', () => {
      dom.drawer.classList.remove('open');
    });

    // 點擊地圖外部關閉抽屜
    document.addEventListener('click', e => {
      if (!dom.drawer.contains(e.target) && !e.target.closest('.county-path') && !e.target.closest('.map-pin') && !e.target.closest('.summit-pin')) {
        dom.drawer.classList.remove('open');
      }
    });

    // 切換縣市列表展開 / 收合
    dom.btnToggleGrid.addEventListener('click', () => {
      dom.gridSection.classList.toggle('active');
      if (dom.gridSection.classList.contains('active')) {
        dom.gridSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    dom.btnHideGrid.addEventListener('click', () => {
      dom.gridSection.classList.remove('active');
      dom.taiwanStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 地區分頁過濾
    dom.regionTabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      dom.regionTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeRegion = btn.dataset.region || 'all';
      renderGrid();
    });

    // 縣市關鍵字搜尋
    dom.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.trim();
      renderGrid();
    });

    // API Modal 開啟與關閉
    dom.btnApiModal.addEventListener('click', () => {
      dom.apiModal.classList.add('active');
    });

    dom.btnCloseModal.addEventListener('click', () => {
      dom.apiModal.classList.remove('active');
    });

    dom.apiModal.addEventListener('click', e => {
      if (e.target === dom.apiModal) dom.apiModal.classList.remove('active');
    });

    dom.btnSaveKey.addEventListener('click', () => {
      const key = dom.cwaKeyInput.value.trim();
      state.apiKey = key;
      localStorage.setItem('cwa_api_key', key);
      dom.apiModal.classList.remove('active');
      fetchWeatherData();
    });

    dom.btnClearKey.addEventListener('click', () => {
      state.apiKey = '';
      dom.cwaKeyInput.value = '';
      localStorage.removeItem('cwa_api_key');
      dom.apiModal.classList.remove('active');
      fetchWeatherData();
    });

    // 關於專案 Modal
    dom.btnAboutModal.addEventListener('click', () => {
      dom.aboutModal.classList.add('active');
    });

    dom.btnCloseAbout.addEventListener('click', () => {
      dom.aboutModal.classList.remove('active');
    });

    dom.btnCloseAboutOk.addEventListener('click', () => {
      dom.aboutModal.classList.remove('active');
    });

    dom.aboutModal.addEventListener('click', e => {
      if (e.target === dom.aboutModal) dom.aboutModal.classList.remove('active');
    });
  }

  // ==========================================================================
  // 初始化應用
  // ==========================================================================
  async function init() {
    initEventListeners();
    await loadAndRenderMap();
    await fetchWeatherData();
    fetchSatelliteData(); // 預載中央氣象署衛星雲圖資料
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
