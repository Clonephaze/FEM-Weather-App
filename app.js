/* ===========================
   WEATHER CODE MAPPING
   =========================== */
const WEATHER_CODES = {
    0: { label: 'Sunny', icon: 'icon-sunny.webp', bg: 'bg-sunny' },
    1: { label: 'Mostly Clear', icon: 'icon-sunny.webp', bg: 'bg-sunny' },
    2: { label: 'Partly Cloudy', icon: 'icon-partly-cloudy.webp', bg: 'bg-partly-cloudy' },
    3: { label: 'Overcast', icon: 'icon-overcast.webp', bg: 'bg-cloudy' },
    45: { label: 'Foggy', icon: 'icon-fog.webp', bg: 'bg-foggy' },
    48: { label: 'Icy Fog', icon: 'icon-fog.webp', bg: 'bg-foggy' },
    51: { label: 'Light Drizzle', icon: 'icon-drizzle.webp', bg: 'bg-rainy' },
    53: { label: 'Moderate Drizzle', icon: 'icon-drizzle.webp', bg: 'bg-rainy' },
    55: { label: 'Dense Drizzle', icon: 'icon-drizzle.webp', bg: 'bg-rainy' },
    56: { label: 'Freezing Drizzle', icon: 'icon-drizzle.webp', bg: 'bg-rainy' },
    57: { label: 'Heavy Freezing Drizzle', icon: 'icon-drizzle.webp', bg: 'bg-rainy' },
    61: { label: 'Slight Rain', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    63: { label: 'Moderate Rain', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    65: { label: 'Heavy Rain', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    66: { label: 'Freezing Rain', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    67: { label: 'Heavy Freezing Rain', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    71: { label: 'Slight Snow', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    73: { label: 'Moderate Snow', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    75: { label: 'Heavy Snow', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    77: { label: 'Snow Grains', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    80: { label: 'Rain Showers', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    81: { label: 'Moderate Showers', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    82: { label: 'Violent Showers', icon: 'icon-rain.webp', bg: 'bg-rainy' },
    85: { label: 'Snow Showers', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    86: { label: 'Heavy Snow Showers', icon: 'icon-snow.webp', bg: 'bg-snowy' },
    95: { label: 'Thunderstorm', icon: 'icon-storm.webp', bg: 'bg-stormy' },
    96: { label: 'Thunderstorm w/ Hail', icon: 'icon-storm.webp', bg: 'bg-stormy' },
    99: { label: 'Thunderstorm & Hail', icon: 'icon-storm.webp', bg: 'bg-stormy' },
};

function getWeatherInfo(code) {
    return WEATHER_CODES[code] ?? { label: 'Unknown', icon: 'icon-sunny.webp', bg: 'bg-sunny' };
}

/* ===========================
   STATE
   =========================== */
let appState = 'initial';
let weatherData = null;
let locationData = null;
let selectedDayIndex = 0;
let _searchAbort = null;
let _compareSearchAbort = null;

const units = { temp: 'fahrenheit', wind: 'mph', precip: 'inches' };

let compareLocations = [];

let _favoritesCache = null;
function loadFavorites() {
    if (_favoritesCache) return _favoritesCache;
    try { _favoritesCache = JSON.parse(localStorage.getItem('favorites') || '[]'); }
    catch { _favoritesCache = []; }
    return _favoritesCache;
}
function saveFavoritesToLS(arr) {
    _favoritesCache = arr;
    localStorage.setItem('favorites', JSON.stringify(arr));
}

function getThemePref() { return localStorage.getItem('theme') || 'auto'; }
function setThemePref(v) { localStorage.setItem('theme', v); }

/* ===========================
   DOM REFS
   =========================== */
const $ = (id) => document.getElementById(id);

const errorState = $('errorState');
const normalContent = $('normalContent');
const noResultsMsg = $('noResultsMsg');
const weatherWrapper = $('weatherWrapper');

const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const searchDropdown = $('searchDropdown');
const geoBtn = $('geoBtn');
const voiceBtn = $('voiceBtn');
const favoritesRow = $('favoritesRow');
const favoriteBtn = $('favoriteBtn');

const unitsBtn = $('unitsBtn');
const unitsPanel = $('unitsPanel');
const switchUnitsBtn = $('switchUnitsBtn');
const themeToggleBtn = $('themeToggleBtn');
const compareBtn = $('compareBtn');

const todayLoading = $('todayLoading');
const todayData = $('todayData');
const cityName = $('cityName');
const currentDate = $('currentDate');
const mainWeatherIcon = $('mainWeatherIcon');
const mainTemp = $('mainTemp');

const statFeelsLike = $('statFeelsLike');
const statHumidity = $('statHumidity');
const statWind = $('statWind');
const statPrecip = $('statPrecip');
const statUV = $('statUV');
const statVisibility = $('statVisibility');
const statPressure = $('statPressure');
const statSunrise = $('statSunrise');
const statSunset = $('statSunset');
const sunRow = $('sunRow');

const dailyList = $('dailyList');
const hourlyList = $('hourlyList');
const dayPickerBtn = $('dayPickerBtn');
const dayPickerLabel = $('dayPickerLabel');
const dayPickerMenu = $('dayPickerMenu');
const retryBtn = $('retryBtn');

const compareView = $('compareView');
const compareGrid = $('compareGrid');
const compareCloseBtn = $('compareCloseBtn');
const compareSearchInput = $('compareSearchInput');
const compareSearchDropdown = $('compareSearchDropdown');

/* ===========================
   UNIT CONVERSION
   =========================== */
function cvtTemp(c) {
    return units.temp === 'fahrenheit' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}
function cvtWind(kmh) {
    return units.wind === 'mph' ? Math.round(kmh * 0.621371) : Math.round(kmh);
}
function cvtPrecip(mm) {
    return units.precip === 'inches' ? (mm * 0.0393701).toFixed(2) : mm.toFixed(1);
}
function isImperial() { return units.temp === 'fahrenheit'; }
function cvtVisibility(m) {
    return isImperial() ? (m / 1609.34).toFixed(1) + ' mi' : (m / 1000).toFixed(1) + ' km';
}
function cvtPressure(hpa) {
    return isImperial() ? (hpa * 0.02953).toFixed(2) + ' inHg' : Math.round(hpa) + ' hPa';
}
function uvLabel(idx) {
    if (idx == null) return '—';
    if (idx <= 2) return `${idx} Low`;
    if (idx <= 5) return `${idx} Mod`;
    if (idx <= 7) return `${idx} High`;
    if (idx <= 10) return `${idx} V.High`;
    return `${idx} Extreme`;
}
function windUnit() { return units.wind === 'mph' ? ' mph' : ' km/h'; }
function precipUnit() { return units.precip === 'inches' ? ' in' : ' mm'; }

/* ===========================
   DATE / TIME HELPERS
   =========================== */
let _devNightOverride = null; // null=auto, true=force night, false=force day

function isDayTime() {
    if (_devNightOverride !== null) return !_devNightOverride;
    if (!weatherData?.daily?.sunrise?.[0]) return true;
    // Compare in the location's timezone using the API's UTC offset
    const offsetSec = weatherData.utc_offset_seconds ?? 0;
    const toUtcMs = (isoNoTz) => {
        const [date, time] = isoNoTz.split('T');
        const [y, mo, d] = date.split('-').map(Number);
        const [h, mi] = time.split(':').map(Number);
        return Date.UTC(y, mo - 1, d, h, mi) - offsetSec * 1000;
    };
    const nowUtc = Date.now();
    return nowUtc >= toUtcMs(weatherData.daily.sunrise[0]) &&
        nowUtc <= toUtcMs(weatherData.daily.sunset[0]);
}

function formatCardDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
    });
}
function formatDayName(dateStr, fmt = 'short') {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: fmt });
}
function formatHour(isoStr) {
    const hour = parseInt(isoStr.split('T')[1].split(':')[0], 10);
    return new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}
function formatTime(isoStr) {
    if (!isoStr) return '—';
    const [, time] = isoStr.split('T');
    const [h, min] = time.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, min);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ===========================
   STATE MANAGEMENT
   =========================== */
function setState(state) {
    appState = state;

    compareView.hidden = state !== 'compare';
    errorState.hidden = state !== 'error';
    normalContent.hidden = state === 'error' || state === 'compare';

    if (state === 'error' || state === 'compare') return;

    noResultsMsg.hidden = state !== 'no-results';
    weatherWrapper.hidden = (state === 'initial' || state === 'no-results');
    geoBtn.hidden = state === 'loaded';

    if (state === 'loading') {
        todayLoading.hidden = false;
        todayData.hidden = true;
        sunRow.hidden = true;
        renderSkeletons();
    } else if (state === 'loaded') {
        todayLoading.hidden = true;
        todayData.hidden = false;
        compareBtn.hidden = false;
    }
}

function renderSkeletons() {
    dailyList.innerHTML = Array(7).fill('<div class="day-card-skeleton"></div>').join('');
    hourlyList.innerHTML = Array(8).fill('<div class="hourly-item-skeleton"></div>').join('');
    statFeelsLike.textContent = '—';
    statHumidity.textContent = '—';
    statWind.textContent = '—';
    statPrecip.textContent = '—';
    statUV.textContent = '—';
    statVisibility.textContent = '—';
    statPressure.textContent = '—';
    dayPickerLabel.textContent = '—';
}

/* ===========================
   API
   =========================== */
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

async function geocode(query, signal) {
    const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('Geocoding API error');
    const json = await res.json();
    return json.results ?? [];
}

async function reverseGeocode(lat, lon) {
    const url = `${NOMINATIM}?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept-Language': 'en', 'User-Agent': 'WeatherNowApp/1.0' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const addr = json.address ?? {};
    return {
        name: addr.city || addr.town || addr.village || addr.county || 'Unknown',
        country: addr.country || '',
        admin1: addr.state || '',
        latitude: lat,
        longitude: lon,
    };
}

async function fetchWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
            'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
            'precipitation', 'weather_code', 'wind_speed_10m', 'surface_pressure',
        ].join(','),
        hourly: 'temperature_2m,weather_code,uv_index,visibility',
        daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset,uv_index_max',
        timezone: 'auto',
        forecast_days: '7',
    });
    const res = await fetch(`${WX_URL}?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('Weather API error');
    return res.json();
}

/* ===========================
   SEARCH
   =========================== */
let _searchResults = [];
let _compareSearchResults = [];

function showSearchLoading() {
    searchDropdown.innerHTML = `
    <div class="search-in-progress">
      <img src="./assets/images/icon-loading.svg" alt="" aria-hidden="true" width="18" height="18" class="spin">
      Search in progress
    </div>`;
    searchDropdown.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
}

function showSearchResults(results) {
    _searchResults = results;
    if (!results.length) { hideSearchDropdown(); return; }
    searchDropdown.innerHTML = results.map((r, i) => {
        const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
        return `<div class="search-suggestion" role="option" tabindex="0" data-idx="${i}">${escapeHtml(label)}</div>`;
    }).join('');
    searchDropdown.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');

    searchDropdown.querySelectorAll('.search-suggestion').forEach(el => {
        el.addEventListener('click', () => selectLocation(_searchResults[+el.dataset.idx]));
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectLocation(_searchResults[+el.dataset.idx]); }
            if (e.key === 'ArrowDown') el.nextElementSibling?.focus();
            if (e.key === 'ArrowUp') (el.previousElementSibling ?? searchInput).focus();
        });
    });
}

function hideSearchDropdown() {
    searchDropdown.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    noResultsMsg.hidden = true;
    showSearchLoading();
    _searchAbort?.abort();
    _searchAbort = new AbortController();
    const { signal } = _searchAbort;
    try {
        const results = await geocode(query, signal);
        if (signal.aborted) return;
        if (!results.length) {
            hideSearchDropdown();
            if (appState === 'loaded') {
                noResultsMsg.hidden = false;
                setTimeout(() => { noResultsMsg.hidden = true; }, 3000);
            } else {
                setState('no-results');
            }
        } else {
            showSearchResults(results);
        }
    } catch (e) {
        if (e.name === 'AbortError') return;
        hideSearchDropdown();
        setState('error');
    }
}

async function selectLocation(location) {
    locationData = location;
    hideSearchDropdown();
    searchInput.value = '';
    setState('loading');
    try {
        weatherData = await fetchWeather(location.latitude, location.longitude);
        selectedDayIndex = 0;
        renderWeather();
        setState('loaded');
    } catch {
        setState('error');
    }
}

/* ===========================
   GEOLOCATION
   =========================== */
function tryGeolocation(isManual = false) {
    if (!navigator.geolocation) return;
    // Only block auto-prompt if user explicitly denied before; manual button always tries
    if (!isManual && localStorage.getItem('geo_declined') === '1') return;

    setState('loading');
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            localStorage.removeItem('geo_declined');
            try {
                const [loc, wx] = await Promise.all([
                    reverseGeocode(latitude, longitude),
                    fetchWeather(latitude, longitude),
                ]);
                locationData = loc ?? { name: 'Your Location', country: '', latitude, longitude };
                weatherData = wx;
                selectedDayIndex = 0;
                renderWeather();
                setState('loaded');
            } catch {
                setState('error');
            }
        },
        (err) => {
            // Only persist if user explicitly denied permission
            if (err.code === err.PERMISSION_DENIED) {
                localStorage.setItem('geo_declined', '1');
            }
            setState('initial');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
}

/* ===========================
   RENDER WEATHER
   =========================== */
function renderWeather() {
    if (!weatherData || !locationData) return;

    const { current, daily, hourly } = weatherData;
    const wx = getWeatherInfo(current.weather_code);

    const todayCard = document.querySelector('.today-card');
    const bgClasses = ['bg-sunny', 'bg-partly-cloudy', 'bg-cloudy', 'bg-rainy', 'bg-snowy', 'bg-stormy', 'bg-foggy'];
    todayCard.classList.remove(...bgClasses);
    todayCard.classList.add(wx.bg);
    const isNight = !isDayTime();
    todayCard.classList.toggle('is-night', isNight);

    startParticles(wx.bg, current.weather_code, isNight);
    _particleRO.disconnect();
    _particleRO.observe(todayCard);

    cityName.textContent = [locationData.name, locationData.country].filter(Boolean).join(', ');
    currentDate.textContent = formatCardDate(daily.time[0]);

    mainWeatherIcon.src = `./assets/images/${wx.icon}`;
    mainWeatherIcon.alt = wx.label;

    const tempTarget = `${cvtTemp(current.temperature_2m)}°`;
    animateValue(mainTemp, tempTarget, 800);
    mainWeatherIcon.classList.add('anim-float');

    const statEntries = [
        [statFeelsLike, `${cvtTemp(current.apparent_temperature)}°`],
        [statHumidity, `${current.relative_humidity_2m}%`],
        [statWind, `${cvtWind(current.wind_speed_10m)}${windUnit()}`],
        [statPrecip, `${cvtPrecip(current.precipitation)}${precipUnit()}`],
        [statPressure, cvtPressure(current.surface_pressure)],
    ];

    const nowIdx = (() => {
        const nowIso = new Date().toISOString().slice(0, 13);
        const found = hourly.time.findIndex(t => t.startsWith(nowIso));
        return found >= 0 ? found : 0;
    })();
    statEntries.push([statUV, uvLabel(hourly.uv_index?.[nowIdx])]);
    statEntries.push([statVisibility, cvtVisibility(hourly.visibility?.[nowIdx] ?? 0)]);

    statEntries.forEach(([el, text], i) => {
        el.style.setProperty('--stagger', `${200 + i * 80}ms`);
        animateValue(el, text, 600);
    });

    if (daily.sunrise?.[0]) {
        statSunrise.textContent = formatTime(daily.sunrise[0]);
        statSunset.textContent = formatTime(daily.sunset[0]);
        sunRow.hidden = false;
        animateIn([sunRow], 600);
    }

    renderFavoriteBtn();
    renderDailyForecast(daily);
    renderDayPicker(daily);
    renderHourlyForecast(selectedDayIndex);
    renderFavoritesRow();

    requestAnimationFrame(() => {
        animateIn([todayCard], 0);
        animateIn(document.querySelectorAll('.stat-card'), 100, 60);
        animateIn(document.querySelectorAll('.day-card'), 250, 50);
        animateIn(document.querySelectorAll('.hourly-item'), 350, 30);
        const hourlyPanel = document.querySelector('.hourly-panel');
        if (hourlyPanel) animateIn([hourlyPanel], 200);
    });
}

function renderDailyForecast(daily) {
    dailyList.innerHTML = daily.time.map((dateStr, i) => {
        const wx = getWeatherInfo(daily.weather_code[i]);
        const high = cvtTemp(daily.temperature_2m_max[i]);
        const low = cvtTemp(daily.temperature_2m_min[i]);
        return `
      <div class="day-card">
        <span class="day-name">${formatDayName(dateStr)}</span>
        <img class="day-icon" src="./assets/images/${wx.icon}" alt="${escapeHtml(wx.label)}" width="40" height="40">
        <div class="day-temps">
          <span class="day-temp-high">${high}°</span>
          <span class="day-temp-low">${low}°</span>
        </div>
      </div>`;
    }).join('');
}

function renderDayPicker(daily) {
    dayPickerMenu.innerHTML = daily.time.map((dateStr, i) => {
        const name = formatDayName(dateStr, 'long');
        return `<button class="day-option${i === selectedDayIndex ? ' active' : ''}" role="option" data-idx="${i}">${name}</button>`;
    }).join('');
    dayPickerLabel.textContent = formatDayName(daily.time[selectedDayIndex], 'long');

    dayPickerMenu.querySelectorAll('.day-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDayIndex = +btn.dataset.idx;
            renderDayPicker(daily);
            renderHourlyForecast(selectedDayIndex);
            hideDayPicker();
        });
    });
}

function renderHourlyForecast(dayIndex) {
    if (!weatherData) return;
    const { hourly, daily } = weatherData;
    const targetDate = daily.time[dayIndex];

    let hours = hourly.time
        .map((t, i) => ({ time: t, temp: hourly.temperature_2m[i], code: hourly.weather_code[i] }))
        .filter(h => h.time.startsWith(targetDate));

    if (dayIndex === 0) {
        const nowH = new Date().getHours();
        const future = hours.filter(h => parseInt(h.time.split('T')[1], 10) >= nowH);
        if (future.length) hours = future;
    }

    hourlyList.innerHTML = hours.map(h => {
        const wx = getWeatherInfo(h.code);
        const temp = cvtTemp(h.temp);
        return `
      <div class="hourly-item">
        <img class="hourly-icon" src="./assets/images/${wx.icon}" alt="${escapeHtml(wx.label)}" width="30" height="30">
        <span class="hourly-time">${formatHour(h.time)}</span>
        <span class="hourly-temp">${temp}°</span>
      </div>`;
    }).join('');
}

/* ===========================
   ANIMATION ORCHESTRATOR
   =========================== */

/**
 * Stagger-animate a list of elements with the `.anim-in` class.
 * @param {NodeList|Element[]} els  - elements to animate
 * @param {number} baseDelay       - ms before first element animates
 * @param {number} stagger         - ms between each element
 */
function animateIn(els, baseDelay = 0, stagger = 60) {
    const list = els instanceof NodeList ? [...els] : els;
    list.forEach((el, i) => {
        el.classList.remove('anim-in');
        el.classList.add('anim-ready');
        // Force reflow so re-triggering works
        void el.offsetWidth;
        el.style.setProperty('--stagger', `${baseDelay + i * stagger}ms`);
        el.classList.remove('anim-ready');
        el.classList.add('anim-in');
    });
}

/** Animate a number from its current displayed value to a target. */
function animateValue(el, targetText, durationMs = 600) {
    const match = targetText.match(/^(-?\d+\.?\d*)/);
    if (!match) {
        el.textContent = targetText;
        el.classList.add('anim-count');
        return;
    }
    const targetNum = parseFloat(match[1]);
    const suffix = targetText.slice(match[0].length);
    const isFloat = targetText.includes('.');
    const currentMatch = el.textContent.match(/^(-?\d+\.?\d*)/);
    const startNum = currentMatch ? parseFloat(currentMatch[1]) : 0;
    const startTime = performance.now();

    el.classList.add('anim-count');

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 5);
        const current = startNum + (targetNum - startNum) * eased;
        el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

/* ===========================
   PARTICLE SYSTEM
   =========================== */
let _particleCanvas = null;
let _particleCtx = null;
let _particleAnimId = null;
let _particles = [];
let _particleType = '';
let _particleCode = 0;
let _particleTime = 0;

function initParticleCanvas() {
    const todayCard = document.querySelector('.today-card');
    const old = todayCard.querySelector('canvas.weather-particles');
    if (old) old.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'weather-particles';
    canvas.setAttribute('aria-hidden', 'true');
    todayCard.prepend(canvas);

    _particleCanvas = canvas;
    _particleCtx = canvas.getContext('2d');
    resizeParticleCanvas();
}

function resizeParticleCanvas() {
    if (!_particleCanvas) return;
    const rect = _particleCanvas.parentElement.getBoundingClientRect();
    _particleCanvas.width = rect.width * devicePixelRatio;
    _particleCanvas.height = rect.height * devicePixelRatio;
    _particleCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function spawnStars(count, w, h) {
    for (let i = 0; i < count; i++) {
        _particles.push({
            type: 'star',
            x: Math.random() * w,
            y: Math.random() * h * 0.85,
            r: 0.4 + Math.random() * 1.8,
            maxOpacity: 0.4 + Math.random() * 0.6,
            twinkleSpeed: 0.015 + Math.random() * 0.035,
            twinklePhase: Math.random() * Math.PI * 2,
        });
    }
}

function startParticles(weatherBg, weatherCode, isNight) {
    stopParticles();
    initParticleCanvas();
    _particleType = weatherBg;
    _particleCode = weatherCode || 0;
    _particleTime = 0;
    _particles = [];

    const w = _particleCanvas.width / devicePixelRatio;
    const h = _particleCanvas.height / devicePixelRatio;

    const isHeavyRain = [55, 57, 65, 67, 82].includes(_particleCode);
    const isHeavySnow = [75, 86].includes(_particleCode);
    const hasHail = _particleCode === 96 || _particleCode === 99;

    if (weatherBg === 'bg-rainy') {
        const isDrizzle = _particleCode >= 51 && _particleCode <= 57;
        const count = isDrizzle ? 30 : isHeavyRain ? 160 : 80;
        const angle = isDrizzle ? 0 : isHeavyRain ? 0.35 : 0.15;
        for (let i = 0; i < count; i++) {
            _particles.push({
                type: 'drop',
                x: Math.random() * (w + 60) - 30,
                y: Math.random() * h - h,
                len: isDrizzle ? (4 + Math.random() * 8) : isHeavyRain ? (14 + Math.random() * 22) : (8 + Math.random() * 16),
                speed: isDrizzle ? (2 + Math.random() * 2) : isHeavyRain ? (8 + Math.random() * 10) : (4 + Math.random() * 6),
                width: isDrizzle ? 0.6 : isHeavyRain ? 1.8 : 1.2,
                angle: angle + (Math.random() - 0.5) * 0.05,
                opacity: isDrizzle ? (0.08 + Math.random() * 0.15) : isHeavyRain ? (0.2 + Math.random() * 0.35) : (0.12 + Math.random() * 0.25),
            });
        }
        if (!isDrizzle) {
            for (let i = 0; i < (isHeavyRain ? 12 : 5); i++) {
                _particles.push({
                    type: 'splash',
                    x: Math.random() * w,
                    y: h - 5 + Math.random() * 5,
                    timer: Math.random() * 40,
                    interval: isHeavyRain ? (10 + Math.random() * 20) : (20 + Math.random() * 40),
                    opacity: 0,
                    radius: 0,
                });
            }
        }
    } else if (weatherBg === 'bg-snowy') {
        if (isNight) spawnStars(isHeavySnow ? 15 : 30, w, h);
        const count = isHeavySnow ? 100 : 40;
        for (let i = 0; i < count; i++) {
            _particles.push({
                type: 'flake',
                x: Math.random() * w,
                y: Math.random() * h,
                r: isHeavySnow ? (2 + Math.random() * 5) : (1 + Math.random() * 3),
                speed: isHeavySnow ? (0.8 + Math.random() * 2) : (0.3 + Math.random() * 0.8),
                drift: (Math.random() - 0.5) * (isHeavySnow ? 1.2 : 0.5),
                wobbleAmp: 0.5 + Math.random() * 1.5,
                wobbleSpeed: 0.02 + Math.random() * 0.03,
                phase: Math.random() * Math.PI * 2,
                opacity: isHeavySnow ? (0.5 + Math.random() * 0.5) : (0.2 + Math.random() * 0.4),
            });
        }
    } else if (weatherBg === 'bg-sunny') {
        if (isNight) {
            spawnStars(60, w, h);
            _particles.push({ type: 'moon' });
        } else {
            _particles.push({ type: 'sun-glow' });
            for (let i = 0; i < 10; i++) {
                _particles.push({
                    type: 'ray',
                    angle: (Math.PI * 2 / 10) * i + (Math.random() - 0.5) * 0.15,
                    speed: 0.002 + Math.random() * 0.001,
                    len: 60 + Math.random() * 80,
                    width: 12 + Math.random() * 20,
                    opacity: 0.05 + Math.random() * 0.08,
                });
            }
            for (let i = 0; i < 15; i++) {
                _particles.push({
                    type: 'speck',
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: 1 + Math.random() * 2,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: -0.1 - Math.random() * 0.3,
                    opacity: 0,
                    maxOpacity: 0.15 + Math.random() * 0.25,
                    life: 0,
                    maxLife: 120 + Math.random() * 200,
                });
            }
        }
    } else if (weatherBg === 'bg-partly-cloudy') {
        if (isNight) {
            spawnStars(30, w, h);
            _particles.push({ type: 'moon' });
        } else {
            _particles.push({ type: 'sun-peek' });
        }
        for (let i = 0; i < 5; i++) {
            _particles.push({
                type: 'cloud',
                x: -100 + Math.random() * (w + 200),
                y: 10 + Math.random() * (h * 0.5),
                w: 80 + Math.random() * 120,
                h: 30 + Math.random() * 40,
                speed: 0.15 + Math.random() * 0.25,
                opacity: isNight ? (0.08 + Math.random() * 0.1) : (0.06 + Math.random() * 0.08),
            });
        }
    } else if (weatherBg === 'bg-cloudy') {
        for (let i = 0; i < 8; i++) {
            _particles.push({
                type: 'cloud',
                x: -150 + Math.random() * (w + 300),
                y: Math.random() * h,
                w: 100 + Math.random() * 160,
                h: 40 + Math.random() * 50,
                speed: 0.08 + Math.random() * 0.2,
                opacity: 0.05 + Math.random() * 0.07,
            });
        }
    } else if (weatherBg === 'bg-stormy') {
        for (let i = 0; i < 140; i++) {
            _particles.push({
                type: 'drop',
                x: Math.random() * (w + 80) - 40,
                y: Math.random() * h - h,
                len: 12 + Math.random() * 20,
                speed: 7 + Math.random() * 9,
                width: 1.4,
                angle: 0.2 + (Math.random() - 0.5) * 0.1,
                opacity: 0.15 + Math.random() * 0.25,
            });
        }
        const boltCount = hasHail ? 3 : 2;
        for (let i = 0; i < boltCount; i++) {
            _particles.push({
                type: 'lightning',
                nextFlash: 800 + Math.random() * 2000,
                flashing: 0,
                flashFrames: 0,
                boltX: 0,
                boltSegments: [],
                brightness: 0,
            });
        }
        _particles.push({ type: 'flash-overlay', alpha: 0 });
        if (hasHail) {
            for (let i = 0; i < 25; i++) {
                _particles.push({
                    type: 'hail',
                    x: Math.random() * w,
                    y: Math.random() * -h,
                    r: 3 + Math.random() * 4,
                    speed: 5 + Math.random() * 7,
                    angle: 0.15 + (Math.random() - 0.5) * 0.1,
                    opacity: 0.4 + Math.random() * 0.4,
                    spin: Math.random() * Math.PI * 2,
                    spinSpeed: 0.05 + Math.random() * 0.1,
                    bouncing: false,
                    bounceY: 0,
                    bounceVel: 0,
                });
            }
        }
    } else if (weatherBg === 'bg-foggy') {
        for (let i = 0; i < 6; i++) {
            _particles.push({
                type: 'mist',
                x: Math.random() * w,
                y: h * 0.15 + Math.random() * h * 0.7,
                w: 120 + Math.random() * 140,
                h: 50 + Math.random() * 60,
                speed: 0.1 + Math.random() * 0.25,
                opacity: 0.04 + Math.random() * 0.06,
            });
        }
        for (let i = 0; i < 4; i++) {
            _particles.push({
                type: 'fog-line',
                y: h * 0.2 + Math.random() * h * 0.6,
                opacity: 0.03 + Math.random() * 0.04,
                speed: 0.3 + Math.random() * 0.4,
                offset: Math.random() * w,
            });
        }
    }

    tickParticles();
}

function stopParticles() {
    if (_particleAnimId) {
        cancelAnimationFrame(_particleAnimId);
        _particleAnimId = null;
    }
    _particles = [];
}

function tickParticles() {
    if (!_particleCanvas || !_particleCtx) return;

    const ctx = _particleCtx;
    const w = _particleCanvas.width / devicePixelRatio;
    const h = _particleCanvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    _particleTime++;

    _particles.forEach(p => {
        switch (p.type) {

            // ---- RAIN DROP ----
            case 'drop': {
                const dx = Math.sin(p.angle) * p.len;
                const dy = Math.cos(p.angle) * p.len;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + dx, p.y + dy);
                ctx.strokeStyle = `rgba(180, 210, 255, ${p.opacity})`;
                ctx.lineWidth = p.width;
                ctx.lineCap = 'round';
                ctx.stroke();
                p.y += p.speed;
                p.x += Math.sin(p.angle) * p.speed * 0.4;
                if (p.y > h + 10) { p.y = -p.len - Math.random() * 40; p.x = Math.random() * (w + 60) - 30; }
                break;
            }

            // ---- RAIN SPLASH ----
            case 'splash': {
                p.timer--;
                if (p.timer <= 0) {
                    p.timer = p.interval;
                    p.opacity = 0.4;
                    p.radius = 0;
                    p.x = Math.random() * w;
                }
                if (p.opacity > 0) {
                    p.radius += 0.8;
                    p.opacity -= 0.02;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(180, 210, 255, ${Math.max(0, p.opacity)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
                break;
            }

            // ---- SNOWFLAKE ----
            case 'flake': {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
                if (p.r > 2.5) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                    ctx.fill();
                }
                p.y += p.speed;
                p.x += p.drift + Math.sin(p.phase + _particleTime * p.wobbleSpeed) * p.wobbleAmp * 0.3;
                if (p.y > h + p.r) { p.y = -p.r; p.x = Math.random() * w; }
                if (p.x < -20) p.x = w + 20;
                if (p.x > w + 20) p.x = -20;
                break;
            }

            // ---- SUN GLOW ----
            case 'sun-glow': {
                const cx = w * 0.82;
                const cy = h * 0.18;
                const pulse = 1 + Math.sin(_particleTime * 0.02) * 0.08;
                const g4 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140 * pulse);
                g4.addColorStop(0, 'rgba(255, 240, 150, 0.15)');
                g4.addColorStop(0.4, 'rgba(255, 220, 80, 0.06)');
                g4.addColorStop(1, 'rgba(255, 200, 50, 0)');
                ctx.fillStyle = g4;
                ctx.beginPath();
                ctx.arc(cx, cy, 140 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const g3 = ctx.createRadialGradient(cx, cy, 15, cx, cy, 80 * pulse);
                g3.addColorStop(0, 'rgba(255, 230, 100, 0.35)');
                g3.addColorStop(0.5, 'rgba(255, 210, 60, 0.12)');
                g3.addColorStop(1, 'rgba(255, 190, 40, 0)');
                ctx.fillStyle = g3;
                ctx.beginPath();
                ctx.arc(cx, cy, 80 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 * pulse);
                g1.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
                g1.addColorStop(0.5, 'rgba(255, 240, 120, 0.8)');
                g1.addColorStop(0.85, 'rgba(255, 210, 60, 0.5)');
                g1.addColorStop(1, 'rgba(255, 190, 40, 0)');
                ctx.fillStyle = g1;
                ctx.beginPath();
                ctx.arc(cx, cy, 28 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12 * pulse);
                g2.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                g2.addColorStop(1, 'rgba(255, 250, 200, 0)');
                ctx.fillStyle = g2;
                ctx.beginPath();
                ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            // ---- SUN RAY ----
            case 'ray': {
                const cx = w * 0.82;
                const cy = h * 0.15;
                p.angle += p.speed;
                const pulse = 1 + Math.sin(_particleTime * 0.015 + p.angle * 3) * 0.3;
                const rayLen = p.len * pulse;
                const x2 = cx + Math.cos(p.angle) * rayLen;
                const y2 = cy + Math.sin(p.angle) * rayLen;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `rgba(255, 230, 140, ${p.opacity * pulse})`;
                ctx.lineWidth = p.width * pulse;
                ctx.lineCap = 'round';
                ctx.stroke();
                break;
            }

            // ---- FLOATING LIGHT SPECK ----
            case 'speck': {
                p.life++;
                const lifeRatio = p.life / p.maxLife;
                p.opacity = lifeRatio < 0.2 ? (lifeRatio / 0.2) * p.maxOpacity
                    : lifeRatio > 0.8 ? ((1 - lifeRatio) / 0.2) * p.maxOpacity
                        : p.maxOpacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 240, 180, ${p.opacity})`;
                ctx.fill();
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.life >= p.maxLife) {
                    p.x = Math.random() * w;
                    p.y = Math.random() * h;
                    p.life = 0;
                    p.maxLife = 120 + Math.random() * 200;
                }
                break;
            }

            // ---- SUN PEEK ----
            case 'sun-peek': {
                const cx = w * 0.8;
                const cy = h * 0.2;
                const pulse = 1 + Math.sin(_particleTime * 0.025) * 0.08;
                const g3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70 * pulse);
                g3.addColorStop(0, 'rgba(255, 230, 130, 0.12)');
                g3.addColorStop(0.5, 'rgba(255, 210, 80, 0.04)');
                g3.addColorStop(1, 'rgba(255, 200, 60, 0)');
                ctx.fillStyle = g3;
                ctx.beginPath();
                ctx.arc(cx, cy, 70 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22 * pulse);
                g1.addColorStop(0, 'rgba(255, 250, 220, 0.7)');
                g1.addColorStop(0.5, 'rgba(255, 230, 100, 0.4)');
                g1.addColorStop(1, 'rgba(255, 200, 60, 0)');
                ctx.fillStyle = g1;
                ctx.beginPath();
                ctx.arc(cx, cy, 22 * pulse, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            // ---- CLOUD ----
            case 'cloud': {
                ctx.save();
                const cx = p.x;
                const cy = p.y;
                const puffs = [
                    { dx: 0, dy: 0, rx: p.w * 0.38, ry: p.w * 0.28 },
                    { dx: -p.w * 0.28, dy: p.w * 0.04, rx: p.w * 0.26, ry: p.w * 0.22 },
                    { dx: p.w * 0.26, dy: p.w * 0.02, rx: p.w * 0.3, ry: p.w * 0.24 },
                    { dx: -p.w * 0.12, dy: -p.w * 0.16, rx: p.w * 0.22, ry: p.w * 0.2 },
                    { dx: p.w * 0.14, dy: -p.w * 0.12, rx: p.w * 0.2, ry: p.w * 0.18 },
                    { dx: -p.w * 0.38, dy: p.w * 0.08, rx: p.w * 0.18, ry: p.w * 0.15 },
                    { dx: p.w * 0.36, dy: p.w * 0.06, rx: p.w * 0.2, ry: p.w * 0.16 },
                ];
                puffs.forEach(pf => {
                    const px = cx + pf.dx;
                    const py = cy + pf.dy;
                    const r = Math.max(pf.rx, pf.ry);
                    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
                    g.addColorStop(0, `rgba(230, 235, 245, ${p.opacity * 2.5})`);
                    g.addColorStop(0.4, `rgba(220, 228, 240, ${p.opacity * 1.8})`);
                    g.addColorStop(0.7, `rgba(210, 220, 235, ${p.opacity * 0.8})`);
                    g.addColorStop(1, 'rgba(200, 215, 235, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.ellipse(px, py, pf.rx, pf.ry, 0, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
                p.x += p.speed;
                if (p.x > w + p.w) p.x = -p.w;
                break;
            }

            // ---- LIGHTNING ----
            case 'lightning': {
                p.nextFlash -= 16;
                if (p.nextFlash <= 0) {
                    p.flashFrames = 6 + Math.floor(Math.random() * 4);
                    p.flashing = p.flashFrames;
                    p.nextFlash = 600 + Math.random() * 2500;
                    p.boltX = w * (0.15 + Math.random() * 0.7);
                    p.boltSegments = [];
                    let bY = 0;
                    let bX = p.boltX;
                    while (bY < h * 0.75) {
                        bY += 6 + Math.random() * 12;
                        bX += (Math.random() - 0.5) * 35;
                        p.boltSegments.push({ x: bX, y: bY });
                        // Branch with 20% chance
                        if (Math.random() < 0.2 && p.boltSegments.length > 2) {
                            const branchLen = 2 + Math.floor(Math.random() * 3);
                            let brX = bX, brY = bY;
                            const brDir = Math.random() < 0.5 ? -1 : 1;
                            for (let b = 0; b < branchLen; b++) {
                                brX += brDir * (5 + Math.random() * 15);
                                brY += 5 + Math.random() * 10;
                                p.boltSegments.push({ x: brX, y: brY, branch: true });
                            }
                            p.boltSegments.push({ x: bX, y: bY, jump: true });
                        }
                    }
                    p.brightness = 1;
                }
                if (p.flashing > 0) {
                    const fade = p.flashing / p.flashFrames;
                    ctx.beginPath();
                    ctx.moveTo(p.boltX, 0);
                    let prevJump = false;
                    p.boltSegments.forEach(seg => {
                        if (seg.jump || prevJump) {
                            ctx.moveTo(seg.x, seg.y);
                            prevJump = false;
                        } else {
                            ctx.lineTo(seg.x, seg.y);
                        }
                        if (seg.jump) prevJump = true;
                    });
                    ctx.strokeStyle = `rgba(220, 225, 255, ${0.8 * fade})`;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    ctx.strokeStyle = `rgba(180, 190, 255, ${0.3 * fade})`;
                    ctx.lineWidth = 6;
                    ctx.stroke();
                    p.flashing--;
                }
                break;
            }

            // ---- SCREEN FLASH OVERLAY ----
            case 'flash-overlay': {
                const lightnings = _particles.filter(lp => lp.type === 'lightning');
                const anyFlashing = lightnings.some(lp => lp.flashing > lp.flashFrames - 2);
                if (anyFlashing) p.alpha = 0.15;
                if (p.alpha > 0) {
                    ctx.fillStyle = `rgba(200, 210, 255, ${p.alpha})`;
                    ctx.fillRect(0, 0, w, h);
                    p.alpha *= 0.8;
                    if (p.alpha < 0.005) p.alpha = 0;
                }
                break;
            }

            // ---- HAIL ----
            case 'hail': {
                if (!p.bouncing) {
                    p.y += p.speed;
                    p.x += Math.sin(p.angle) * p.speed * 0.3;
                    p.spin += p.spinSpeed;
                    if (p.y >= h - 8) {
                        p.bouncing = true;
                        p.bounceVel = -(2 + Math.random() * 3);
                        p.bounceY = h - 8;
                    }
                } else {
                    p.bounceVel += 0.3;
                    p.bounceY += p.bounceVel;
                    p.y = p.bounceY;
                    p.x += 0.5;
                    if (p.bounceY >= h + 10) {
                        p.y = -p.r - Math.random() * 50;
                        p.x = Math.random() * w;
                        p.bouncing = false;
                    }
                }
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.spin);
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 2; a += 0.5) {
                    const rr = p.r * (0.85 + Math.sin(a * 3) * 0.15);
                    const hx = Math.cos(a) * rr;
                    const hy = Math.sin(a) * rr;
                    a === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fillStyle = `rgba(220, 230, 245, ${p.opacity})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(180, 200, 230, ${p.opacity * 0.5})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-p.r * 0.2, -p.r * 0.2, p.r * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
                ctx.fill();
                ctx.restore();
                break;
            }

            // ---- FOG MIST BLOB ----
            case 'mist': {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w * 0.6);
                g.addColorStop(0, `rgba(200, 210, 225, ${p.opacity})`);
                g.addColorStop(1, 'rgba(200, 210, 225, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.w * 0.6, p.h * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.speed;
                if (p.x > w + p.w) p.x = -p.w;
                break;
            }

            // ---- FOG HORIZONTAL LINE ----
            case 'fog-line': {
                const waveX = Math.sin(_particleTime * 0.005 + p.offset) * 20;
                ctx.beginPath();
                ctx.moveTo(-20, p.y);
                ctx.bezierCurveTo(w * 0.25, p.y - 8 + waveX, w * 0.75, p.y + 8 - waveX, w + 20, p.y);
                ctx.strokeStyle = `rgba(200, 210, 225, ${p.opacity})`;
                ctx.lineWidth = 25;
                ctx.lineCap = 'round';
                ctx.stroke();
                p.y += Math.sin(_particleTime * 0.008 + p.offset) * 0.1;
                break;
            }

            // ---- STAR ----
            case 'star': {
                const twinkle = 0.5 + 0.5 * Math.sin(_particleTime * p.twinkleSpeed + p.twinklePhase);
                const alpha = 0.15 + twinkle * p.maxOpacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
                ctx.fill();
                if (p.r > 1.1 && twinkle > 0.6) {
                    const glint = p.r * 3;
                    const ga = alpha * 0.5;
                    ctx.strokeStyle = `rgba(255, 250, 240, ${ga})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(p.x - glint, p.y); ctx.lineTo(p.x + glint, p.y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(p.x, p.y - glint); ctx.lineTo(p.x, p.y + glint); ctx.stroke();
                }
                break;
            }

            // ---- MOON ----
            case 'moon': {
                const cx = w * 0.82;
                const cy = h * 0.17;
                const moonR = 20;
                const pulse = 1 + Math.sin(_particleTime * 0.012) * 0.03;
                const gHaze = ctx.createRadialGradient(cx, cy, moonR, cx, cy, moonR * 3.8);
                gHaze.addColorStop(0, 'rgba(200, 215, 255, 0.1)');
                gHaze.addColorStop(0.4, 'rgba(190, 205, 255, 0.04)');
                gHaze.addColorStop(1, 'rgba(180, 200, 255, 0)');
                ctx.fillStyle = gHaze;
                ctx.beginPath();
                ctx.arc(cx, cy, moonR * 3.8 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const gGlow = ctx.createRadialGradient(cx, cy, moonR * 0.8, cx, cy, moonR * 2);
                gGlow.addColorStop(0, 'rgba(215, 225, 255, 0.18)');
                gGlow.addColorStop(1, 'rgba(200, 215, 255, 0)');
                ctx.fillStyle = gGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, moonR * 2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                // Crescent using even-odd fill: outer circle - inner offset circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, moonR * pulse, 0, Math.PI * 2);           // full disc (CW)
                ctx.arc(cx + moonR * 0.62, cy - moonR * 0.08,             // shadow disc (CW, same winding)
                    moonR * 0.86 * pulse, 0, Math.PI * 2);
                const moonGrad = ctx.createRadialGradient(
                    cx - moonR * 0.2, cy - moonR * 0.25, 0, cx, cy, moonR * pulse
                );
                moonGrad.addColorStop(0, 'rgba(248, 252, 255, 0.96)');
                moonGrad.addColorStop(0.6, 'rgba(225, 235, 255, 0.8)');
                moonGrad.addColorStop(1, 'rgba(200, 218, 255, 0.5)');
                ctx.fillStyle = moonGrad;
                ctx.fill('evenodd');  // creates the crescent cutout
                ctx.restore();
                break;
            }

        } // switch
    });

    _particleAnimId = requestAnimationFrame(tickParticles);
}

const _particleRO = new ResizeObserver(() => resizeParticleCanvas());

/* ===========================
   UNITS
   =========================== */
function updateUnitsUI() {
    const allMetric = units.temp === 'celsius' && units.wind === 'kmh' && units.precip === 'mm';
    switchUnitsBtn.textContent = allMetric ? 'Switch to Imperial' : 'Switch to Metric';
    document.querySelectorAll('.unit-item').forEach(el => {
        el.classList.toggle('selected', units[el.dataset.group] === el.dataset.value);
    });
}

function switchUnits() {
    const allMetric = units.temp === 'celsius' && units.wind === 'kmh' && units.precip === 'mm';
    if (allMetric) {
        units.temp = 'fahrenheit'; units.wind = 'mph'; units.precip = 'inches';
    } else {
        units.temp = 'celsius'; units.wind = 'kmh'; units.precip = 'mm';
    }
    updateUnitsUI();
    if (appState === 'loaded') renderWeather();
    if (appState === 'compare') renderCompareView();
}

/* ===========================
   THEME
   =========================== */
function applyTheme(pref) {
    const hour = new Date().getHours();
    const isDark = pref === 'dark' || (pref === 'auto' && (hour < 6 || hour >= 20));
    document.body.classList.toggle('light-theme', !isDark);
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function toggleTheme() {
    const cur = getThemePref();
    const hour = new Date().getHours();
    const autoIsDark = hour < 6 || hour >= 20;
    let next;
    if (cur === 'auto') next = autoIsDark ? 'light' : 'dark';
    else if (cur === 'light') next = 'dark';
    else next = 'light';
    setThemePref(next);
    applyTheme(next);
}

/* ===========================
   FAVORITES
   =========================== */
function isFavorite(loc) {
    if (!loc) return false;
    return loadFavorites().some(f => Math.abs(f.latitude - loc.latitude) < 0.01 && Math.abs(f.longitude - loc.longitude) < 0.01);
}

function saveFavorite(loc) {
    const favs = loadFavorites();
    if (favs.length >= 8) favs.shift(); // cap at 8
    favs.push({ name: loc.name, country: loc.country, admin1: loc.admin1, latitude: loc.latitude, longitude: loc.longitude });
    saveFavoritesToLS(favs);
}

function removeFavorite(lat, lon) {
    const favs = loadFavorites().filter(f => !(Math.abs(f.latitude - lat) < 0.01 && Math.abs(f.longitude - lon) < 0.01));
    saveFavoritesToLS(favs);
}

function toggleFavorite() {
    if (!locationData) return;
    if (isFavorite(locationData)) {
        removeFavorite(locationData.latitude, locationData.longitude);
    } else {
        saveFavorite(locationData);
    }
    renderFavoriteBtn();
    renderFavoritesRow();
}

function renderFavoriteBtn() {
    if (!favoriteBtn) return;
    const fav = isFavorite(locationData);
    favoriteBtn.classList.toggle('is-favorite', fav);
    favoriteBtn.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Save to favorites');
}

function renderFavoritesRow() {
    const favs = loadFavorites();
    if (!favs.length) { favoritesRow.hidden = true; return; }
    favoritesRow.hidden = false;
    favoritesRow.innerHTML = favs.map((f, i) => {
        const label = [f.name, f.country].filter(Boolean).join(', ');
        return `
      <div class="fav-chip">
        <button class="fav-chip-name" data-idx="${i}">${escapeHtml(label)}</button>
        <button class="fav-chip-remove" data-lat="${f.latitude}" data-lon="${f.longitude}" aria-label="Remove ${escapeHtml(f.name)} from favorites">×</button>
      </div>`;
    }).join('');

    favoritesRow.querySelectorAll('.fav-chip-name').forEach(btn => {
        btn.addEventListener('click', () => {
            const f = loadFavorites()[+btn.dataset.idx];
            if (f) selectLocation(f);
        });
    });
    favoritesRow.querySelectorAll('.fav-chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(+btn.dataset.lat, +btn.dataset.lon);
            renderFavoritesRow();
            renderFavoriteBtn();
        });
    });
}

/* ===========================
   VOICE SEARCH
   =========================== */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let _voiceSupported = !!SpeechRecognition;

if (_voiceSupported) {
    voiceBtn.hidden = false;
}

function startVoiceSearch() {
    if (!_voiceSupported) return;
    // Create a fresh instance every time — Chrome Android requires this
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    voiceBtn.classList.add('voice-active');

    rec.addEventListener('result', e => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.classList.remove('voice-active');
        performSearch();
    });

    rec.addEventListener('end', () => {
        voiceBtn.classList.remove('voice-active');
    });

    rec.addEventListener('error', (e) => {
        voiceBtn.classList.remove('voice-active');
        // "not-allowed" means microphone permission denied (common on HTTP)
        if (e.error === 'not-allowed') {
            console.warn('Microphone access denied. Voice search requires HTTPS.');
        }
    });

    try {
        rec.start();
    } catch (e) {
        voiceBtn.classList.remove('voice-active');
        console.warn('Voice recognition failed to start:', e);
    }
}

/* ===========================
   COMPARE
   =========================== */
function openCompareView() {
    if (appState !== 'loaded' && appState !== 'compare') return;
    if (compareLocations.length === 0 && locationData && weatherData) {
        compareLocations = [{ locationData: { ...locationData }, weatherData: structuredClone(weatherData) }];
    }
    setState('compare');
    renderCompareView();
}

function closeCompareView() {
    setState('loaded');
}

function renderCompareView() {
    if (!compareLocations.length) {
        compareGrid.innerHTML = '<p class="compare-empty">Search for a location below to start comparing.</p>';
        return;
    }

    compareGrid.innerHTML = compareLocations.map((entry, idx) => {
        const { locationData: loc, weatherData: wx } = entry;
        const { current, daily } = wx;
        const info = getWeatherInfo(current.weather_code);
        return `
      <div class="compare-card ${info.bg}">
        <div class="compare-card-header">
          <div>
            <strong class="compare-city">${escapeHtml([loc.name, loc.country].filter(Boolean).join(', '))}</strong>
            <span class="compare-date">${formatCardDate(daily.time[0])}</span>
          </div>
          <button class="compare-remove-btn" data-idx="${idx}" aria-label="Remove ${escapeHtml(loc.name)} from comparison">×</button>
        </div>
        <div class="compare-weather-row">
          <img src="./assets/images/${info.icon}" alt="${escapeHtml(info.label)}" width="56" height="56">
          <span class="compare-temp">${cvtTemp(current.temperature_2m)}°</span>
        </div>
        <div class="compare-stats">
          <div class="compare-stat"><span>Feels Like</span><strong>${cvtTemp(current.apparent_temperature)}°</strong></div>
          <div class="compare-stat"><span>Humidity</span><strong>${current.relative_humidity_2m}%</strong></div>
          <div class="compare-stat"><span>Wind</span><strong>${cvtWind(current.wind_speed_10m)}${windUnit()}</strong></div>
          <div class="compare-stat"><span>Precip.</span><strong>${cvtPrecip(current.precipitation)}${precipUnit()}</strong></div>
        </div>
      </div>`;
    }).join('');

    compareGrid.querySelectorAll('.compare-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            compareLocations.splice(+btn.dataset.idx, 1);
            renderCompareView();
            updateCompareAddRowVisibility();
        });
    });

    updateCompareAddRowVisibility();
}

function updateCompareAddRowVisibility() {
    $('compareAddRow').hidden = compareLocations.length >= 3;
}

async function addToCompare(location) {
    if (compareLocations.length >= 3) return;
    if (compareLocations.some(e => Math.abs(e.locationData.latitude - location.latitude) < 0.01)) return;
    try {
        const wx = await fetchWeather(location.latitude, location.longitude);
        compareLocations.push({ locationData: location, weatherData: wx });
        renderCompareView();
    } catch {
        // silently skip
    }
}

async function performCompareSearch() {
    const query = compareSearchInput.value.trim();
    if (!query) return;
    compareSearchDropdown.innerHTML = `<div class="search-in-progress"><img src="./assets/images/icon-loading.svg" alt="" aria-hidden="true" width="18" height="18" class="spin"> Searching…</div>`;
    compareSearchDropdown.hidden = false;
    _compareSearchAbort?.abort();
    _compareSearchAbort = new AbortController();
    const { signal } = _compareSearchAbort;
    try {
        const results = await geocode(query, signal);
        if (signal.aborted) return;
        _compareSearchResults = results;
        if (!results.length) { compareSearchDropdown.hidden = true; return; }
        compareSearchDropdown.innerHTML = results.map((r, i) => {
            const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
            return `<div class="search-suggestion" role="option" tabindex="0" data-idx="${i}">${escapeHtml(label)}</div>`;
        }).join('');
        compareSearchDropdown.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => {
                addToCompare(_compareSearchResults[+el.dataset.idx]);
                compareSearchDropdown.hidden = true;
                compareSearchInput.value = '';
            });
        });
    } catch (e) {
        if (e.name === 'AbortError') return;
        compareSearchDropdown.hidden = true;
    }
}

/* ===========================
   DROPDOWNS
   =========================== */
function toggleUnitsPanel() {
    const open = unitsPanel.hidden;
    unitsPanel.hidden = !open;
    unitsBtn.setAttribute('aria-expanded', String(open));
    if (open) { hideDayPicker(); hideSearchDropdown(); }
}
function hideUnitsPanel() { unitsPanel.hidden = true; unitsBtn.setAttribute('aria-expanded', 'false'); }
function toggleDayPicker() {
    const open = dayPickerMenu.hidden;
    dayPickerMenu.hidden = !open;
    dayPickerBtn.setAttribute('aria-expanded', String(open));
    if (open) { hideUnitsPanel(); hideSearchDropdown(); }
}
function hideDayPicker() { dayPickerMenu.hidden = true; dayPickerBtn.setAttribute('aria-expanded', 'false'); }

/* ===========================
   SECURITY HELPER
   =========================== */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ===========================
   EVENT LISTENERS
   =========================== */
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
    else if (e.key === 'Escape') hideSearchDropdown();
    else if (e.key === 'ArrowDown') searchDropdown.querySelector('[tabindex="0"]')?.focus();
});
searchInput.addEventListener('input', () => { if (!searchInput.value.trim()) hideSearchDropdown(); });

geoBtn.addEventListener('click', () => tryGeolocation(true));

if (_voiceSupported) {
    voiceBtn.addEventListener('click', startVoiceSearch);
}

favoriteBtn.addEventListener('click', toggleFavorite);

unitsBtn.addEventListener('click', e => { e.stopPropagation(); toggleUnitsPanel(); });
switchUnitsBtn.addEventListener('click', switchUnits);
document.querySelectorAll('.unit-item').forEach(el => {
    el.addEventListener('click', () => {
        units[el.dataset.group] = el.dataset.value;
        updateUnitsUI();
        if (appState === 'loaded') renderWeather();
        if (appState === 'compare') renderCompareView();
    });
});

themeToggleBtn.addEventListener('click', toggleTheme);

dayPickerBtn.addEventListener('click', e => { e.stopPropagation(); toggleDayPicker(); });

retryBtn.addEventListener('click', () => setState('initial'));

compareBtn.addEventListener('click', openCompareView);
compareCloseBtn.addEventListener('click', closeCompareView);
compareSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performCompareSearch(); });
compareSearchInput.addEventListener('input', () => { if (!compareSearchInput.value.trim()) compareSearchDropdown.hidden = true; });

document.addEventListener('click', e => {
    if (!$('unitsContainer').contains(e.target)) hideUnitsPanel();
    if (!$('dayPickerContainer').contains(e.target)) hideDayPicker();
    if (!document.querySelector('.search-bar').contains(e.target)) hideSearchDropdown();
    if (!$('compareAddRow').contains(e.target)) compareSearchDropdown.hidden = true;
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        hideUnitsPanel(); hideDayPicker(); hideSearchDropdown();
        compareSearchDropdown.hidden = true;
    }
});

/* ===========================
   DEV PANEL
   =========================== */
(() => {
    const toggle = document.getElementById('devToggle');
    const panel = document.getElementById('devPanel');
    const close = document.getElementById('devClose');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
    });
    close.addEventListener('click', () => { panel.hidden = true; });

    function buildMockData(code, tempC) {
        const today = new Date();
        const toISO = (d) => d.toISOString().slice(0, 10);
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today); d.setDate(today.getDate() + i);
            return toISO(d);
        });
        const hours = Array.from({ length: 168 }, (_, i) => {
            const d = new Date(today); d.setHours(0, 0, 0, 0); d.setHours(i);
            return d.toISOString().slice(0, 13) + ':00';
        });

        const dailyCodes = [code, code, 2, 0, code, 3, code];
        const hourlyTemps = hours.map((_, i) => tempC + Math.sin(i / 6) * 4 + (Math.random() - 0.5) * 2);

        return {
            weather: {
                current: {
                    temperature_2m: tempC,
                    apparent_temperature: tempC - 2,
                    relative_humidity_2m: 55 + Math.round(Math.random() * 30),
                    wind_speed_10m: 8 + Math.round(Math.random() * 20),
                    precipitation: code >= 51 && code <= 82 ? +(1 + Math.random() * 8).toFixed(1) : 0,
                    weather_code: code,
                    surface_pressure: 1005 + Math.round(Math.random() * 20),
                },
                daily: {
                    time: days,
                    temperature_2m_max: days.map((_, i) => tempC + 3 - i * 0.5 + Math.random() * 2),
                    temperature_2m_min: days.map((_, i) => tempC - 5 + Math.random() * 2),
                    weather_code: dailyCodes,
                    precipitation_sum: dailyCodes.map(c => c >= 51 && c <= 82 ? +(Math.random() * 10).toFixed(1) : 0),
                    sunrise: days.map(d => d + 'T06:' + String(15 + Math.floor(Math.random() * 30)).padStart(2, '0')),
                    sunset: days.map(d => d + 'T18:' + String(30 + Math.floor(Math.random() * 30)).padStart(2, '0')),
                    uv_index_max: days.map(() => +(1 + Math.random() * 10).toFixed(1)),
                },
                hourly: {
                    time: hours,
                    temperature_2m: hourlyTemps,
                    weather_code: hours.map(() => dailyCodes[Math.floor(Math.random() * dailyCodes.length)]),
                    uv_index: hours.map(() => +(Math.random() * 11).toFixed(1)),
                    visibility: hours.map(() => Math.round(5000 + Math.random() * 30000)),
                },
            },
            location: {
                name: 'Dev Preview',
                country: 'Test Mode',
                admin1: '',
                latitude: 51.5,
                longitude: -0.12,
            }
        };
    }

    const weatherGrid = document.getElementById('devWeatherGrid');
    let currentDevCode = null;
    let currentDevTemp = 22;

    function applyMock(code, temp) {
        const mock = buildMockData(code, temp);
        weatherData = mock.weather;
        locationData = mock.location;
        selectedDayIndex = 0;
        setState('loaded');
        renderWeather();

        stateGrid.querySelectorAll('button').forEach(b => {
            b.classList.toggle('dev-active', b.dataset.state === 'loaded');
        });

        weatherGrid.querySelectorAll('button').forEach(b => {
            b.classList.toggle('dev-active', +b.dataset.code === code);
        });
    }

    weatherGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-code]');
        if (!btn) return;
        currentDevCode = +btn.dataset.code;
        applyMock(currentDevCode, currentDevTemp);
    });

    const stateGrid = document.getElementById('devStateGrid');
    stateGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-state]');
        if (!btn) return;
        const state = btn.dataset.state;

        stateGrid.querySelectorAll('button').forEach(b => {
            b.classList.toggle('dev-active', b.dataset.state === state);
        });

        if (state === 'loaded' && currentDevCode != null) {
            applyMock(currentDevCode, currentDevTemp);
        } else {
            setState(state);
        }
    });

    const tempSlider = document.getElementById('devTemp');
    const tempLabel = document.getElementById('devTempLabel');

    const nightBtn = document.getElementById('devNightToggle');
    if (nightBtn) {
        nightBtn.addEventListener('click', () => {
            _devNightOverride = _devNightOverride === true ? false : true;
            const forcing = _devNightOverride === true;
            nightBtn.classList.toggle('dev-active', forcing);
            nightBtn.textContent = forcing ? '🌙 Night' : '☀️ Day';
            if (currentDevCode != null) applyMock(currentDevCode, currentDevTemp);
        });
    }

    function cToF(c) { return Math.round(c * 9 / 5 + 32); }
    tempLabel.textContent = `${cToF(currentDevTemp)}°F`;
    tempSlider.addEventListener('input', () => {
        currentDevTemp = +tempSlider.value;
        tempLabel.textContent = `${cToF(currentDevTemp)}°F`;
        if (currentDevCode != null) {
            applyMock(currentDevCode, currentDevTemp);
        }
    });
})();

/* ===========================
   INIT
   =========================== */
updateUnitsUI();
applyTheme(getThemePref());
renderFavoritesRow();
setState('initial');

if (!localStorage.getItem('geo_declined') && !localStorage.getItem('geo_prompted')) {
    localStorage.setItem('geo_prompted', '1');
    tryGeolocation();
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
}

