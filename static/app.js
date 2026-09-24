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

  // 台灣五大山脈 + 加里山山脈走向與書法標記資料庫
  const TAIWAN_RANGES = [
    {
      id: 'central',
      name: '中央山脈',
      fullName: '中央山脈 (Central Mountain Range)',
      peak: '秀姑巒山 3,805m',
      length: '約 340 km',
      desc: '台灣「屋脊」與「護國神山」，北起蘇澳烏岩角，南抵鵝鑾鼻，縱貫全島，阻擋西北太平洋颱風與東北季風。',
      color: 'rgba(220, 38, 38, 0.9)',
      chars: [
        { char: '中', x: 1150, y: 610 },
        { char: '央', x: 1060, y: 930 },
        { char: '山', x: 1020, y: 1160 },
        { char: '脈', x: 970, y: 1370 },
        { char: '脈', x: 860, y: 1850 }
      ],
      pathD: 'M 1210 470 Q 1140 640 1080 840 Q 1040 1050 1000 1260 Q 930 1500 880 1720 Q 860 1850 850 1920'
    },
    {
      id: 'xueshan',
      name: '雪山山脈',
      fullName: '雪山山脈 (Xueshan Range)',
      peak: '雪山主峰 3,886m',
      length: '約 260 km',
      desc: '保留全台灣最完整之冰河圈谷地形，孕育國寶魚櫻花鉤吻鮭，為北台灣重要集水區。',
      color: 'rgba(234, 88, 12, 0.88)',
      chars: [
        { char: '雪', x: 1160, y: 360 },
        { char: '山', x: 1090, y: 480 },
        { char: '山', x: 1010, y: 600 },
        { char: '脈', x: 940, y: 710 }
      ],
      pathD: 'M 1190 350 Q 1110 480 1020 610 Q 950 710 880 790'
    },
    {
      id: 'jiali',
      name: '加里山山脈',
      fullName: '加里山山脈 (Jiali Mountain Range)',
      peak: '加里山 2,220m',
      length: '約 180 km',
      desc: '雪山山脈西側的前緣山脈，為西部盆地平原過渡至高山帶之重要屏障，林相茂密。',
      color: 'rgba(217, 119, 6, 0.85)',
      chars: [
        { char: '加', x: 1030, y: 370 },
        { char: '里', x: 970, y: 470 },
        { char: '山', x: 910, y: 570 },
        { char: '山', x: 860, y: 670 },
        { char: '脈', x: 810, y: 760 }
      ],
      pathD: 'M 1040 360 Q 980 470 920 570 Q 865 670 810 760'
    },
    {
      id: 'yushan',
      name: '玉山山脈',
      fullName: '玉山山脈 (Yushan Range)',
      peak: '玉山主峰 3,952m (東北亞最高峰)',
      length: '約 180 km',
      desc: '全台灣地勢最高聳的山脈，東鄰中央山脈、西鄰阿里山山脈，高聳入雲，為台灣標誌地標。',
      color: 'rgba(185, 28, 28, 0.9)',
      chars: [
        { char: '玉', x: 940, y: 1100 },
        { char: '山', x: 900, y: 1220 },
        { char: '山', x: 860, y: 1350 },
        { char: '脈', x: 810, y: 1470 }
      ],
      pathD: 'M 960 1060 Q 910 1200 870 1360 Q 820 1480 790 1560'
    },
    {
      id: 'alishan',
      name: '阿里山山脈',
      fullName: '阿里山山脈 (Alishan Range)',
      peak: '大塔山 2,663m',
      length: '約 250 km',
      desc: '位於玉山山脈西側，水氣豐沛，以神木紅檜林、日出、阿里山森林鐵路與壯麗雲海聞名。',
      color: 'rgba(194, 65, 12, 0.85)',
      chars: [
        { char: '阿', x: 840, y: 1045 },
        { char: '里', x: 805, y: 1165 },
        { char: '山', x: 770, y: 1285 },
        { char: '山', x: 735, y: 1405 },
        { char: '脈', x: 700, y: 1520 }
      ],
      pathD: 'M 850 1020 Q 810 1150 770 1280 Q 730 1410 690 1540'
    },
    {
      id: 'coastal',
      name: '海岸山脈',
      fullName: '海岸山脈 (Coastal Mountain Range)',
      peak: '新港山 1,682m',
      length: '約 150 km',
      desc: '位於花東縱谷東側、瀕臨太平洋，由菲律賓海板塊碰撞擠壓形成之火山島弧，地質年輕且斷層顯著。',
      color: 'rgba(180, 83, 9, 0.85)',
      chars: [
        { char: '海', x: 1210, y: 880 },
        { char: '岸', x: 1170, y: 1060 },
        { char: '山', x: 1130, y: 1240 },
        { char: '脈', x: 1090, y: 1420 }
      ],
      pathD: 'M 1230 840 Q 1180 1040 1140 1230 Q 1100 1420 1070 1500'
    }
  ];

  // 台灣主要地形單元 (盆地、平原、台地、丘陵、火山群)
  const TAIWAN_LANDFORMS = [
    { id: 'datun', name: '大屯火山群', type: '火山地質群', x: 1140, y: 110, desc: '台灣北部休火山群，包含七星山與大屯山，具溫泉地熱與後火山地形。' },
    { id: 'keelung_volcano', name: '基隆火山群', type: '火山地質群', x: 1290, y: 160, desc: '包含基隆山、金瓜石、九份地質區，曾為世界級金銅礦產地。' },
    { id: 'taipei_basin', name: '台北盆地', type: '構造盆地', x: 1110, y: 220, desc: '淡水河三大支流交會之斷層陷落盆地，為台灣政治經濟核心。' },
    { id: 'taoyuan_plateau', name: '桃園台地', type: '構造台地', x: 950, y: 260, desc: '古石門溪沖積扇隆起之紅土台地，遍布人工埤塘。' },
    { id: 'miaoli_hills', name: '苗栗丘陵', type: '丘陵地形', x: 810, y: 480, desc: '後龍溪侵蝕分割之起伏丘陵，林相與茶園茂密之客庄山城。' },
    { id: 'lanyang_plain', name: '蘭陽平原', type: '沖積平原', x: 1290, y: 420, desc: '蘭陽溪沖積三角形平原，迎東北季風迎雨豐沛，稻作富庶。' },
    { id: 'dadu_plateau', name: '大肚台地', type: '構造台地', x: 690, y: 680, desc: '台中盆地與海岸平原間狹長台地，俯瞰台灣海峽。' },
    { id: 'taichung_basin', name: '台中盆地', type: '構造盆地', x: 770, y: 770, desc: '大甲溪與大肚溪沖積而成，氣候溫和乾燥，中部重鎮。' },
    { id: 'bagua_range', name: '八卦山脈', type: '台地/山脈', x: 720, y: 920, desc: '彰化與南投之分界脊嶺，南北延伸三十餘公里，名產鳳梨與茶葉。' },
    { id: 'puli_basin', name: '埔里盆地群', type: '高山盆地群', x: 930, y: 860, desc: '烏溪上游高山盆地群，四面環山氣候宜人，為進入日月潭與合歡山門戶。' },
    { id: 'huatung_valley', name: '花東縱谷', type: '構造縱谷', x: 1140, y: 1180, desc: '夾於中央山脈與海岸山脈間之板塊縫合線，景致壯麗。' },
    { id: 'chianan_plain', name: '嘉南平原', type: '沖積平原', x: 530, y: 1280, desc: '台灣最大平原農業穀倉，由曾文溪、濁水溪沖積而成。' },
    { id: 'pingtung_plain', name: '屏東平原', type: '沖積平原', x: 680, y: 1700, desc: '高屏溪沖積而成之廣闊平原，熱帶果物繁盛。' }
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
    activeSatelliteProduct: 'satellite',
    imageryProducts: [],
    showReliefTexture: true,
    showMountainRanges: true,
    showLandforms: true,
    showSummits: true,
    // 地圖縮放與平移狀態
    mapZoom: 1.0,
    mapPanX: 0,
    mapPanY: 0,
    isMapDragging: false,
    mapDragStartX: 0,
    mapDragStartY: 0,
    mapHasDragged: false,
    isMapFullscreen: false,
    modalImgZoom: 1.0
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
    btnTopoModal: document.getElementById('btn-topo-modal'),
    btnImageryNav: document.getElementById('btn-imagery-nav'),
    navPeriodPills: document.getElementById('nav-period-pills'),
    // 地圖舞台與圖層切換
    taiwanStage: document.getElementById('taiwan-stage'),
    mapWrapper: document.getElementById('map-wrapper'),
    mapContainer: document.getElementById('map-container'),
    mapLoading: document.getElementById('map-loading'),
    overlayPeriodBadge: document.getElementById('overlay-period-badge'),
    overlayPeriodText: document.getElementById('overlay-period-text'),
    mapLayerSwitcher: document.getElementById('map-layer-switcher'),
    elevationLegend: document.getElementById('elevation-legend'),
    mapSatelliteOverlay: document.getElementById('map-satellite-overlay'),
    mapSatelliteImg: document.getElementById('map-satellite-img'),
    // 地圖縮放控制項
    mapZoomControls: document.getElementById('map-zoom-controls'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    btnMapFullscreen: document.getElementById('btn-map-fullscreen'),
    zoomIndicator: document.getElementById('zoom-indicator'),
    mapZoomTip: document.getElementById('map-zoom-tip'),
    // 五大山脈次切換開關與圖譜
    toggleReliefTexture: document.getElementById('toggle-relief-texture'),
    toggleMountainRanges: document.getElementById('toggle-mountain-ranges'),
    toggleLandforms: document.getElementById('toggle-landforms'),
    toggleSummits: document.getElementById('toggle-summits'),
    btnViewTopoDiagram: document.getElementById('btn-view-topo-diagram'),
    topoModalOverlay: document.getElementById('topo-modal-overlay'),
    btnCloseTopo: document.getElementById('btn-close-topo'),
    btnCloseTopoOk: document.getElementById('btn-close-topo-ok'),
    // 百岳山峰提示卡
    peakTooltip: document.getElementById('peak-tooltip'),
    peakTtName: document.getElementById('peak-tt-name'),
    peakTtRange: document.getElementById('peak-tt-range'),
    peakTtAlt: document.getElementById('peak-tt-alt'),
    peakTtDesc: document.getElementById('peak-tt-desc'),
    // 山脈與地形提示卡
    rangeTooltip: document.getElementById('range-tooltip'),
    rangeTtIcon: document.getElementById('range-tt-icon'),
    rangeTtName: document.getElementById('range-tt-name'),
    rangeTtType: document.getElementById('range-tt-type'),
    rangeTtMeta: document.getElementById('range-tt-meta'),
    rangeTtDesc: document.getElementById('range-tt-desc'),
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
    // 圖資專區 (8 大卡片)
    imageryHubSection: document.getElementById('imagery-hub-section'),
    imageryCardsGrid: document.getElementById('imagery-cards-grid'),
    btnRefreshImageryHub: document.getElementById('btn-refresh-imagery-hub'),
    // 網格檢視
    gridSection: document.getElementById('cities-grid-section'),
    regionTabs: document.getElementById('region-tabs'),
    searchInput: document.getElementById('search-input'),
    citiesGrid: document.getElementById('cities-grid'),
    // 衛星雲圖 / 圖資 Modal
    satelliteModal: document.getElementById('satellite-modal-overlay'),
    btnCloseSatellite: document.getElementById('btn-close-satellite'),
    btnCloseSatelliteOk: document.getElementById('btn-close-satellite-ok'),
    btnRefreshSatellite: document.getElementById('btn-refresh-satellite'),
    satelliteChannelsTabs: document.getElementById('satellite-channels-tabs'),
    satelliteLiveImg: document.getElementById('satellite-live-img'),
    satelliteLiveIframe: document.getElementById('satellite-live-iframe'),
    modalZoomableImgWrap: document.getElementById('modal-zoomable-img-wrap'),
    satelliteLoading: document.getElementById('satellite-loading'),
    satProductTitle: document.getElementById('sat-product-title'),
    satObsTime: document.getElementById('sat-obs-time'),
    satDatasetId: document.getElementById('sat-dataset-id'),
    satSourceLink: document.getElementById('sat-source-link'),
    satelliteLegendPanel: document.getElementById('satellite-legend-panel'),
    satLegendTitle: document.getElementById('sat-legend-title'),
    satLegendDesc: document.getElementById('sat-legend-desc'),
    satScaleContainer: document.getElementById('sat-scale-container'),
    // 彈窗圖片縮放列
    btnModalZoomIn: document.getElementById('btn-modal-zoom-in'),
    btnModalZoomOut: document.getElementById('btn-modal-zoom-out'),
    btnModalZoomReset: document.getElementById('btn-modal-zoom-reset'),
    modalZoomVal: document.getElementById('modal-zoom-val'),
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

        <!-- 1. 台灣 3D 立體地勢真實浮雕底圖 (置於縣市界線底層) -->
        <g id="topography-layer"></g>

        <!-- 2. 縣市陸地路徑圖層 (清晰界線，疊加於地勢浮雕之上) -->
        <g id="counties-layer" filter="url(#island-shadow)"></g>

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
          elem.addEventListener('click', () => {
            if (state.mapHasDragged) return;
            selectCity(cname);
          });
        });
      });

      // 渲染台灣 3D 立體地勢真實浮雕底圖 (已去除地圖文字與山脈線條，呈現純淨自然地形)
      topographyLayer.innerHTML = `
        <g id="relief-texture-group">
          <image id="relief-texture-image" href="/static/images/taiwan_relief_clean_hd.png" x="280.7" y="51.1" width="1212.6" height="2160.2" preserveAspectRatio="none" style="pointer-events: none;" />
        </g>
      `;

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
  // 五大山脈立體地勢 Modal 控制
  // ==========================================================================
  function openTopoModal(defaultTab = 'diagram') {
    if (!dom.topoModalOverlay) return;
    dom.topoModalOverlay.classList.add('active');
    switchTopoTab(defaultTab);
  }

  function closeTopoModal() {
    if (dom.topoModalOverlay) {
      dom.topoModalOverlay.classList.remove('active');
    }
  }

  function switchTopoTab(tabId) {
    if (!dom.topoModalOverlay) return;
    dom.topoModalOverlay.querySelectorAll('.topo-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    dom.topoModalOverlay.querySelectorAll('.topo-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `topo-tab-${tabId}`);
    });
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
      if (labelsLayer) labelsLayer.style.opacity = '1';
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
  // 台灣地圖平移與縮放引擎 (Map Zoom & Pan Engine)
  // ==========================================================================
  function applyMapTransform(skipTransition = false) {
    if (!dom.mapContainer) return;
    
    // 限制縮放比例介於 0.75x 至 4.0x
    state.mapZoom = Math.min(Math.max(state.mapZoom, 0.75), 4.0);

    if (skipTransition) {
      dom.mapContainer.classList.add('no-transition');
    } else {
      dom.mapContainer.classList.remove('no-transition');
    }

    dom.mapContainer.style.transform = `translate(${state.mapPanX}px, ${state.mapPanY}px) scale(${state.mapZoom})`;
    
    // 更新百分比倍率指示
    if (dom.zoomIndicator) {
      dom.zoomIndicator.textContent = Math.round(state.mapZoom * 100) + '%';
    }

    // 當處於放大狀態時更新 cursor 為抓取手勢
    if (dom.mapWrapper) {
      const isZoomed = state.mapZoom > 1.05 || Math.abs(state.mapPanX) > 10 || Math.abs(state.mapPanY) > 10;
      dom.mapWrapper.classList.toggle('is-zoomed', isZoomed);
    }
  }

  function setMapZoom(targetZoom, clientX, clientY) {
    const clampedZoom = Math.min(Math.max(targetZoom, 0.75), 4.0);
    if (!dom.mapContainer) return;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = dom.mapContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const zoomRatio = clampedZoom / state.mapZoom;

      state.mapPanX = (state.mapPanX - (clientX - centerX)) * zoomRatio + (clientX - centerX);
      state.mapPanY = (state.mapPanY - (clientY - centerY)) * zoomRatio + (clientY - centerY);
    }

    state.mapZoom = clampedZoom;

    // 若接近 100% 且平移量小，平滑復位
    if (Math.abs(state.mapZoom - 1.0) < 0.04) {
      state.mapZoom = 1.0;
      state.mapPanX = 0;
      state.mapPanY = 0;
    }

    clampPanBounds();
    applyMapTransform();
  }

  function zoomMapBy(factor, clientX, clientY) {
    setMapZoom(state.mapZoom * factor, clientX, clientY);
  }

  function resetMapZoom() {
    state.mapZoom = 1.0;
    state.mapPanX = 0;
    state.mapPanY = 0;
    applyMapTransform();
  }

  function toggleMapFullscreen() {
    if (!dom.taiwanStage) return;
    const isNowFs = dom.taiwanStage.classList.toggle('is-fullscreen');
    state.isMapFullscreen = isNowFs;
    if (dom.btnMapFullscreen) {
      dom.btnMapFullscreen.textContent = isNowFs ? '🗗' : '⛶';
      dom.btnMapFullscreen.title = isNowFs ? '退出全螢幕地圖' : '切換全螢幕地圖';
    }
    resetMapZoom();
  }

  function clampPanBounds() {
    // 依縮放倍率動態允許邊界平移量，避免島嶼完全移出畫面
    const maxPan = 500 * Math.max(state.mapZoom, 1.0);
    state.mapPanX = Math.min(Math.max(state.mapPanX, -maxPan), maxPan);
    state.mapPanY = Math.min(Math.max(state.mapPanY, -maxPan), maxPan);
  }

  function initMapZoomAndPan() {
    if (!dom.mapWrapper) return;

    // 1. 按鈕控制
    if (dom.btnZoomIn) {
      dom.btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomMapBy(1.3);
      });
    }
    if (dom.btnZoomOut) {
      dom.btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomMapBy(0.77);
      });
    }
    if (dom.btnZoomReset) {
      dom.btnZoomReset.addEventListener('click', (e) => {
        e.stopPropagation();
        resetMapZoom();
      });
    }
    if (dom.btnMapFullscreen) {
      dom.btnMapFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMapFullscreen();
      });
    }

    // 2. 滑鼠滾輪縮放 (平滑縮放於滑鼠所在位置)
    dom.mapWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      zoomMapBy(factor, e.clientX, e.clientY);
    }, { passive: false });

    // 3. 雙擊滑鼠放大
    dom.mapWrapper.addEventListener('dblclick', (e) => {
      // 避免點擊按鈕時觸發
      if (e.target.closest('button')) return;
      e.preventDefault();
      zoomMapBy(1.4, e.clientX, e.clientY);
    });

    // 4. 按住滑鼠左鍵拖曳平移地圖
    dom.mapWrapper.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('#map-zoom-controls') || e.target.closest('.map-layer-switcher') || e.target.closest('.selected-hero-pill')) {
        return;
      }

      state.isMapDragging = true;
      state.mapHasDragged = false;
      state.mapDragStartX = e.clientX - state.mapPanX;
      state.mapDragStartY = e.clientY - state.mapPanY;

      dom.mapContainer.classList.add('no-transition');
      try {
        dom.mapWrapper.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    dom.mapWrapper.addEventListener('pointermove', (e) => {
      if (!state.isMapDragging) return;
      const newX = e.clientX - state.mapDragStartX;
      const newY = e.clientY - state.mapDragStartY;

      if (Math.abs(newX - state.mapPanX) > 4 || Math.abs(newY - state.mapPanY) > 4) {
        state.mapHasDragged = true;
        dom.mapWrapper.classList.add('is-dragging');
      }

      state.mapPanX = newX;
      state.mapPanY = newY;
      applyMapTransform(true);
    });

    const endDrag = (e) => {
      if (!state.isMapDragging) return;
      state.isMapDragging = false;
      dom.mapContainer.classList.remove('no-transition');
      dom.mapWrapper.classList.remove('is-dragging');
      try {
        if (e && e.pointerId) dom.mapWrapper.releasePointerCapture(e.pointerId);
      } catch (_) {}
      clampPanBounds();
      applyMapTransform();
      // 延遲 80ms 清除 mapHasDragged，確保阻止縣市點擊
      setTimeout(() => { state.mapHasDragged = false; }, 80);
    };

    dom.mapWrapper.addEventListener('pointerup', endDrag);
    dom.mapWrapper.addEventListener('pointercancel', endDrag);

    // 5. 觸控手勢支援 (雙指縮放與單指平移)
    let touchStartDist = 0;
    let initialZoom = 1.0;

    dom.mapWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = state.mapZoom;
      }
    }, { passive: true });

    dom.mapWrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const newZoom = initialZoom * (dist / touchStartDist);
        setMapZoom(newZoom, midX, midY);
      }
    }, { passive: false });
  }

  // ==========================================================================
  // 中央氣象署「圖資專區」8 大觀測圖資與檢視器 (CWA Imagery Hub & Modal)
  // ==========================================================================
  async function fetchImageryData() {
    try {
      const headers = {};
      if (state.apiKey) {
        headers['X-CWA-API-KEY'] = state.apiKey;
      }
      const res = await fetch('/api/weather/imagery', { headers });
      if (!res.ok) throw new Error('無法取得圖資專區資料');
      const data = await res.json();
      state.imageryProducts = data.products || [];
      state.satelliteProducts = state.imageryProducts; // 同步相容
      renderImageryHubCards();
    } catch (err) {
      console.error('抓取圖資專區失敗:', err);
    }
  }

  // 供舊端點調用
  async function fetchSatelliteData() {
    await fetchImageryData();
    if (state.satelliteProducts.length > 0) {
      renderImageryProduct(state.activeSatelliteProduct);
    }
  }

  function renderImageryHubCards() {
    if (!dom.imageryCardsGrid) return;
    if (!state.imageryProducts || state.imageryProducts.length === 0) return;

    dom.imageryCardsGrid.innerHTML = state.imageryProducts.map(p => {
      const isIframe = p.type === 'iframe';
      return `
        <div class="cwa-cube-card" data-product="${p.id}" id="card-imagery-${p.id}">
          <div class="cwa-cube-head">
            <span class="cube-head-left">${p.icon} ${p.title}</span>
            <span class="cube-tag">${p.tag ? p.tag.split('·')[0].trim() : '即時'}</span>
          </div>
          <div class="cwa-cube-body">
            ${isIframe ? `
              <div class="cwa-wind-overlay-pill">TGFS · WRF</div>
              <img src="https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0028-003.jpg" class="cwa-cube-img" alt="${p.title}" style="filter: hue-rotate(180deg) brightness(0.85);" />
            ` : `
              <img src="${p.preview_url || p.image_url}" class="cwa-cube-img" alt="${p.title}" loading="lazy" onerror="this.src='${p.backup_url || p.image_url}'" />
            `}
            <!-- 中央氣象署專屬圓形水波紋標誌 (比照截圖左下角) -->
            <div class="cwa-watermark" title="交通部中央氣象署 CWA">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="#1e3a8a"/>
                <path d="M25 54 C35 44 45 64 55 54 C65 44 75 64 85 54" stroke="#ffffff" stroke-width="8" stroke-linecap="round" fill="none"/>
                <path d="M20 40 C32 30 44 50 56 40 C68 30 78 50 88 40" stroke="#60a5fa" stroke-width="5" stroke-linecap="round" fill="none"/>
              </svg>
            </div>
            <!-- 懸停資訊層 -->
            <div class="cwa-cube-hover-layer">
              <span class="hover-icon">🔍</span>
              <span class="hover-text">點擊查看高解析大圖</span>
              <span class="hover-sub">${p.full_title}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 綁定卡片點擊開啟 Modal
    dom.imageryCardsGrid.querySelectorAll('.cwa-cube-card').forEach(card => {
      card.addEventListener('click', () => {
        const pid = card.dataset.product;
        openImageryModal(pid);
      });
    });
  }

  function openImageryModal(productId) {
    if (!dom.satelliteModal) return;
    dom.satelliteModal.classList.add('active');
    const targetId = productId || state.activeSatelliteProduct || 'satellite';
    
    if (state.imageryProducts.length === 0) {
      fetchImageryData().then(() => {
        renderImageryProduct(targetId);
      });
    } else {
      renderImageryProduct(targetId);
    }
  }

  function closeSatelliteModal() {
    if (dom.satelliteModal) {
      dom.satelliteModal.classList.remove('active');
    }
    // 關閉時暫停 iframe 減輕負載
    if (dom.satelliteLiveIframe) {
      dom.satelliteLiveIframe.src = '';
    }
  }

  function applyModalImgZoom() {
    if (!dom.satelliteLiveImg) return;
    state.modalImgZoom = Math.min(Math.max(state.modalImgZoom, 1.0), 3.5);
    dom.satelliteLiveImg.style.transform = `scale(${state.modalImgZoom})`;
    if (dom.modalZoomVal) {
      dom.modalZoomVal.textContent = Math.round(state.modalImgZoom * 100) + '%';
    }
  }

  function renderImageryProduct(productId) {
    // 支援舊產品 ID 對照
    const idMap = {
      'taiwan_color': 'satellite',
      'east_asia_enhanced': 'satellite',
      'radar_composite': 'radar',
      'global_ir': 'satellite'
    };
    const resolvedId = idMap[productId] || productId;
    state.activeSatelliteProduct = resolvedId;

    const product = (state.imageryProducts || []).find(p => p.id === resolvedId) ||
                    (state.imageryProducts && state.imageryProducts[0]);
    if (!product) return;

    // 更新 tabs active 狀態
    if (dom.satelliteChannelsTabs) {
      dom.satelliteChannelsTabs.querySelectorAll('.sat-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.product === resolvedId);
      });
    }

    // 顯示載入動畫
    if (dom.satelliteLoading) {
      dom.satelliteLoading.classList.remove('hidden');
    }

    // 重置圖片縮放
    state.modalImgZoom = 1.0;
    applyModalImgZoom();

    // 判定是否為 iframe 互動型態 (風場預報)
    if (product.type === 'iframe') {
      if (dom.modalZoomableImgWrap) dom.modalZoomableImgWrap.style.display = 'none';
      if (dom.satelliteLiveIframe) {
        dom.satelliteLiveIframe.style.display = 'block';
        dom.satelliteLiveIframe.src = product.iframe_url || product.image_url;
      }
      if (dom.satelliteLoading) dom.satelliteLoading.classList.add('hidden');
    } else {
      if (dom.satelliteLiveIframe) {
        dom.satelliteLiveIframe.style.display = 'none';
        dom.satelliteLiveIframe.src = '';
      }
      if (dom.modalZoomableImgWrap) dom.modalZoomableImgWrap.style.display = 'flex';

      // 載入高解析影像
      const img = new Image();
      img.onload = () => {
        if (dom.satelliteLiveImg) dom.satelliteLiveImg.src = product.image_url;
        if (dom.satelliteLoading) dom.satelliteLoading.classList.add('hidden');
      };
      img.onerror = () => {
        if (dom.satelliteLiveImg) dom.satelliteLiveImg.src = product.backup_url || product.preview_url || product.image_url;
        if (dom.satelliteLoading) dom.satelliteLoading.classList.add('hidden');
      };
      img.src = product.image_url;
    }

    // 同步更新地圖底圖疊加層影像
    if (dom.mapSatelliteImg && (resolvedId === 'satellite' || !dom.mapSatelliteImg.src)) {
      dom.mapSatelliteImg.src = product.image_url;
    }

    // 更新文字資訊
    if (dom.satProductTitle) dom.satProductTitle.textContent = product.full_title || product.title;
    if (dom.satObsTime) dom.satObsTime.textContent = product.obs_time || '即時更新';
    if (dom.satDatasetId) dom.satDatasetId.textContent = product.dataset_id || 'CWA-OpenData';
    if (dom.satSourceLink) dom.satSourceLink.href = product.link_url || 'https://www.cwa.gov.tw';
    if (dom.satLegendTitle) dom.satLegendTitle.textContent = product.title + ' · 圖資與觀測判讀指南';
    if (dom.satLegendDesc) dom.satLegendDesc.textContent = product.description;

    // 動態渲染對應產品之色階圖例
    if (dom.satScaleContainer) {
      if (resolvedId === 'radar') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div class="radar-scale-colors"></div>
            <div class="radar-scale-ticks">
              <span>5 dBZ (毛雨)</span>
              <span>20 dBZ (小雨)</span>
              <span>35 dBZ (顯著降雨)</span>
              <span>50 dBZ (豪大雨)</span>
              <span>65+ dBZ (強對流/冰雹)</span>
            </div>
          </div>
        `;
      } else if (resolvedId === 'rainfall') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #e0f2fe 0%, #38bdf8 20%, #22c55e 40%, #eab308 60%, #ef4444 80%, #a855f7 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>0 mm</span>
              <span>10 mm (小雨)</span>
              <span>50 mm (大雨)</span>
              <span>130 mm (豪雨)</span>
              <span>200+ mm (大豪雨)</span>
            </div>
          </div>
        `;
      } else if (resolvedId === 'uvi') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #22c55e 0%, #eab308 30%, #f97316 55%, #ef4444 80%, #a855f7 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>0-2 (微量級)</span>
              <span>3-5 (中量級)</span>
              <span>6-7 (高量級)</span>
              <span>8-10 (過量級)</span>
              <span>11+ (危險級)</span>
            </div>
          </div>
        `;
      } else if (resolvedId === 'temperature') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #3b82f6 0%, #06b6d4 25%, #22c55e 50%, #f97316 75%, #dc2626 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>&lt; 10°C (寒冷)</span>
              <span>18°C (涼爽)</span>
              <span>26°C (舒適)</span>
              <span>32°C (悶熱)</span>
              <span>&gt; 36°C (高溫酷熱)</span>
            </div>
          </div>
        `;
      } else if (resolvedId === 'health') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #ffffff 0%, #fde047 33%, #fb923c 66%, #ef4444 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>預警分級：正常</span>
              <span>注意 (黃)</span>
              <span>警戒 (橘)</span>
              <span>危險至高危險 (紅)</span>
            </div>
          </div>
        `;
      } else if (resolvedId === 'wind') {
        dom.satScaleContainer.innerHTML = `
          <div class="radar-scale-bar">
            <div style="height:12px;border-radius:9999px;background:linear-gradient(90deg, #0284c7 0%, #38bdf8 25%, #4ade80 50%, #facc15 75%, #f43f5e 100%);border:1px solid rgba(255,255,255,0.3)"></div>
            <div class="radar-scale-ticks">
              <span>微風 (1-3級)</span>
              <span>和風 (4-5級)</span>
              <span>強風 (6-7級)</span>
              <span>大風/烈風 (8-9級)</span>
              <span>狂風/暴風 (10+級)</span>
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

  function renderSatelliteProduct(productId) {
    renderImageryProduct(productId);
  }

  function openSatelliteModal() {
    openImageryModal('satellite');
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

    // 開啟五大山脈 Modal
    if (dom.btnTopoModal) {
      dom.btnTopoModal.addEventListener('click', () => openTopoModal('diagram'));
    }
    if (dom.btnViewTopoDiagram) {
      dom.btnViewTopoDiagram.addEventListener('click', () => openTopoModal('diagram'));
    }

    // 關閉五大山脈 Modal
    if (dom.btnCloseTopo) {
      dom.btnCloseTopo.addEventListener('click', closeTopoModal);
    }
    if (dom.btnCloseTopoOk) {
      dom.btnCloseTopoOk.addEventListener('click', closeTopoModal);
    }
    if (dom.topoModalOverlay) {
      dom.topoModalOverlay.addEventListener('click', e => {
        if (e.target === dom.topoModalOverlay) closeTopoModal();
      });
    }

    // 五大山脈 Modal 分頁切換
    if (dom.topoModalOverlay) {
      dom.topoModalOverlay.addEventListener('click', e => {
        const tabBtn = e.target.closest('.topo-tab-btn');
        if (!tabBtn) return;
        switchTopoTab(tabBtn.dataset.tab);
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

    // 重新整理衛星雲圖 / 圖資
    if (dom.btnRefreshSatellite) {
      dom.btnRefreshSatellite.addEventListener('click', () => {
        dom.btnRefreshSatellite.textContent = '載入中...';
        fetchImageryData().then(() => {
          renderImageryProduct(state.activeSatelliteProduct);
          dom.btnRefreshSatellite.textContent = '🔄 重新整理';
        });
      });
    }

    // 重新整理圖資專區按鈕
    if (dom.btnRefreshImageryHub) {
      dom.btnRefreshImageryHub.addEventListener('click', () => {
        dom.btnRefreshImageryHub.textContent = '更新中...';
        fetchImageryData().then(() => {
          dom.btnRefreshImageryHub.textContent = '🔄 重新整理圖資';
        });
      });
    }

    // 導覽列「圖資專區」平滑滾動按鈕
    if (dom.btnImageryNav) {
      dom.btnImageryNav.addEventListener('click', () => {
        if (dom.imageryHubSection) {
          dom.imageryHubSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // 切換衛星產品 / 圖資頁籤
    if (dom.satelliteChannelsTabs) {
      dom.satelliteChannelsTabs.addEventListener('click', e => {
        const tab = e.target.closest('.sat-tab');
        if (!tab) return;
        renderImageryProduct(tab.dataset.product);
      });
    }

    // 彈窗高解析圖片縮放控制
    if (dom.btnModalZoomIn) {
      dom.btnModalZoomIn.addEventListener('click', () => {
        state.modalImgZoom = Math.min(state.modalImgZoom * 1.3, 3.5);
        applyModalImgZoom();
      });
    }
    if (dom.btnModalZoomOut) {
      dom.btnModalZoomOut.addEventListener('click', () => {
        state.modalImgZoom = Math.max(state.modalImgZoom * 0.77, 1.0);
        applyModalImgZoom();
      });
    }
    if (dom.btnModalZoomReset) {
      dom.btnModalZoomReset.addEventListener('click', () => {
        state.modalImgZoom = 1.0;
        applyModalImgZoom();
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
    initMapZoomAndPan();
    await loadAndRenderMap();
    await fetchWeatherData();
    fetchImageryData(); // 載入中央氣象署圖資專區 8 大產品
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
