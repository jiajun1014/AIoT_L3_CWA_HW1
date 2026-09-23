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

  // 全域狀態
  const state = {
    weatherData: [],
    mapData: null,
    activePeriodIndex: 0,
    selectedCity: '臺北市',
    activeRegion: 'all',
    searchQuery: '',
    apiKey: localStorage.getItem('cwa_api_key') || ''
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
    navPeriodPills: document.getElementById('nav-period-pills'),
    // 地圖舞台
    taiwanStage: document.getElementById('taiwan-stage'),
    mapContainer: document.getElementById('map-container'),
    mapLoading: document.getElementById('map-loading'),
    overlayPeriodBadge: document.getElementById('overlay-period-badge'),
    overlayPeriodText: document.getElementById('overlay-period-text'),
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
    // Modals
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
  // 載入並渲染台灣 SVG 地圖
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

      // 定義濾鏡 (陰影與高亮光暈)
      svg.innerHTML = `
        <defs>
          <filter id="island-shadow" x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#021c38" flood-opacity="0.32" />
          </filter>
          <filter id="pin-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#021c38" flood-opacity="0.25" />
          </filter>
        </defs>
        <g id="counties-layer" filter="url(#island-shadow)"></g>
        <g id="pins-layer"></g>
        <g id="active-marker" class="active-marker" transform="translate(1205, 175)">
          <circle class="marker-pulse" r="28" />
          <path class="marker-pin-body" d="M0 -36 C-18 -36 -24 -18 -24 -4 C-24 16 0 36 0 36 C0 36 24 16 24 -4 C24 -18 18 -36 0 -36 Z" />
          <circle class="marker-inner-dot" cx="0" cy="-12" r="9" />
        </g>
      `;

      const countiesLayer = svg.querySelector('#counties-layer');
      const pinsLayer = svg.querySelector('#pins-layer');

      // 建立各縣市向量路徑與氣象徽章
      data.counties.forEach(county => {
        const cname = county.name;

        // 1. 縣市陸地路徑
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `path-${county.id}`);
        path.setAttribute('class', `county-path ${cname === state.selectedCity ? 'active' : ''}`);
        path.setAttribute('data-county', cname);
        path.setAttribute('d', county.d);
        countiesLayer.appendChild(path);

        // 2. 氣象浮動徽章
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

      // 替換容器內的 Loading
      dom.mapContainer.innerHTML = '';
      dom.mapContainer.appendChild(svg);

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
  // 事件監聽註冊 (Event Listeners)
  // ==========================================================================
  function initEventListeners() {
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
      if (!dom.drawer.contains(e.target) && !e.target.closest('.county-path') && !e.target.closest('.map-pin')) {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
