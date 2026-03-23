/* ===========================
   WEATHER CODE MAPPING
   =========================== */
const WEATHER_CODES = {
  0:  { label: 'Sunny',                  icon: 'icon-sunny.webp',         bg: 'bg-sunny' },
  1:  { label: 'Mostly Clear',           icon: 'icon-sunny.webp',         bg: 'bg-sunny' },
  2:  { label: 'Partly Cloudy',          icon: 'icon-partly-cloudy.webp', bg: 'bg-partly-cloudy' },
  3:  { label: 'Overcast',               icon: 'icon-overcast.webp',      bg: 'bg-cloudy' },
  45: { label: 'Foggy',                  icon: 'icon-fog.webp',           bg: 'bg-foggy' },
  48: { label: 'Icy Fog',                icon: 'icon-fog.webp',           bg: 'bg-foggy' },
  51: { label: 'Light Drizzle',          icon: 'icon-drizzle.webp',       bg: 'bg-rainy' },
  53: { label: 'Moderate Drizzle',       icon: 'icon-drizzle.webp',       bg: 'bg-rainy' },
  55: { label: 'Dense Drizzle',          icon: 'icon-drizzle.webp',       bg: 'bg-rainy' },
  56: { label: 'Freezing Drizzle',       icon: 'icon-drizzle.webp',       bg: 'bg-rainy' },
  57: { label: 'Heavy Freezing Drizzle', icon: 'icon-drizzle.webp',       bg: 'bg-rainy' },
  61: { label: 'Slight Rain',            icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  63: { label: 'Moderate Rain',          icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  65: { label: 'Heavy Rain',             icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  66: { label: 'Freezing Rain',          icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  67: { label: 'Heavy Freezing Rain',    icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  71: { label: 'Slight Snow',            icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  73: { label: 'Moderate Snow',          icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  75: { label: 'Heavy Snow',             icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  77: { label: 'Snow Grains',            icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  80: { label: 'Rain Showers',           icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  81: { label: 'Moderate Showers',       icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  82: { label: 'Violent Showers',        icon: 'icon-rain.webp',          bg: 'bg-rainy' },
  85: { label: 'Snow Showers',           icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  86: { label: 'Heavy Snow Showers',     icon: 'icon-snow.webp',          bg: 'bg-snowy' },
  95: { label: 'Thunderstorm',           icon: 'icon-storm.webp',         bg: 'bg-stormy' },
  96: { label: 'Thunderstorm w/ Hail',   icon: 'icon-storm.webp',         bg: 'bg-stormy' },
  99: { label: 'Thunderstorm & Hail',    icon: 'icon-storm.webp',         bg: 'bg-stormy' },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? { label: 'Unknown', icon: 'icon-sunny.webp', bg: 'bg-sunny' };
}

/* ===========================
   STATE
   =========================== */
let appState = 'initial'; // initial | loading | loaded | error | no-results | compare
let weatherData = null;
let locationData = null;
let selectedDayIndex = 0;
let _lastLocation = null; // used when returning from compare view

const units = {
  temp:   'celsius',    // celsius | fahrenheit
  wind:   'kmh',        // kmh | mph
  precip: 'mm',         // mm | inches
};

// ---- COMPARE ----
let compareLocations = []; // [{ locationData, weatherData }, ...]

// ---- FAVORITES ----
function loadFavorites()     { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function saveFavoritesToLS(arr) { localStorage.setItem('favorites', JSON.stringify(arr)); }

// ---- THEME ----
function getThemePref() { return localStorage.getItem('theme') || 'auto'; }
function setThemePref(v) { localStorage.setItem('theme', v); }

/* ===========================
   DOM REFS
   =========================== */
const $ = (id) => document.getElementById(id);

const errorState     = $('errorState');
const normalContent  = $('normalContent');
const noResultsMsg   = $('noResultsMsg');
const weatherWrapper = $('weatherWrapper');

const searchInput    = $('searchInput');
const searchBtn      = $('searchBtn');
const searchDropdown = $('searchDropdown');
const geoBtn         = $('geoBtn');
const voiceBtn       = $('voiceBtn');
const favoritesRow   = $('favoritesRow');
const favoriteBtn    = $('favoriteBtn');

const unitsBtn       = $('unitsBtn');
const unitsPanel     = $('unitsPanel');
const switchUnitsBtn = $('switchUnitsBtn');
const themeToggleBtn = $('themeToggleBtn');
const compareBtn     = $('compareBtn');

const todayLoading   = $('todayLoading');
const todayData      = $('todayData');
const cityName       = $('cityName');
const currentDate    = $('currentDate');
const mainWeatherIcon = $('mainWeatherIcon');
const mainTemp       = $('mainTemp');

const statFeelsLike  = $('statFeelsLike');
const statHumidity   = $('statHumidity');
const statWind       = $('statWind');
const statPrecip     = $('statPrecip');
const statUV         = $('statUV');
const statVisibility = $('statVisibility');
const statPressure   = $('statPressure');
const statSunrise    = $('statSunrise');
const statSunset     = $('statSunset');
const sunRow         = $('sunRow');

const dailyList      = $('dailyList');
const hourlyList     = $('hourlyList');
const dayPickerBtn   = $('dayPickerBtn');
const dayPickerLabel = $('dayPickerLabel');
const dayPickerMenu  = $('dayPickerMenu');
const retryBtn       = $('retryBtn');

const compareView        = $('compareView');
const compareGrid        = $('compareGrid');
const compareCloseBtn    = $('compareCloseBtn');
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
function cvtVisibility(m) {
  if (units.wind === 'mph') return (m / 1609.34).toFixed(1) + ' mi';
  return (m / 1000).toFixed(1) + ' km';
}
function cvtPressure(hpa) {
  if (units.wind === 'mph') return (hpa * 0.02953).toFixed(2) + ' inHg';
  return Math.round(hpa) + ' hPa';
}
function uvLabel(idx) {
  if (idx == null) return '—';
  if (idx <= 2)  return `${idx} Low`;
  if (idx <= 5)  return `${idx} Mod`;
  if (idx <= 7)  return `${idx} High`;
  if (idx <= 10) return `${idx} V.High`;
  return `${idx} Extreme`;
}
function windUnit()   { return units.wind === 'mph' ? ' mph' : ' km/h'; }
function precipUnit() { return units.precip === 'inches' ? ' in' : ' mm'; }

/* ===========================
   DATE / TIME HELPERS
   =========================== */
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
  // "2025-08-05T06:07" → "6:07 AM"
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

  // Compare view vs normal/error views
  compareView.hidden   = state !== 'compare';
  errorState.hidden    = state !== 'error';
  normalContent.hidden = state === 'error' || state === 'compare';

  if (state === 'error' || state === 'compare') return;

  noResultsMsg.hidden   = state !== 'no-results';
  weatherWrapper.hidden = (state === 'initial' || state === 'no-results');
  geoBtn.hidden         = state === 'loaded';

  if (state === 'loading') {
    todayLoading.hidden = false;
    todayData.hidden    = true;
    sunRow.hidden       = true;
    renderSkeletons();
  } else if (state === 'loaded') {
    todayLoading.hidden = false; // keep hidden until renderWeather() shows todayData
    todayData.hidden    = false;
    compareBtn.hidden   = false;
  }
}

function renderSkeletons() {
  dailyList.innerHTML  = Array(7).fill('<div class="day-card-skeleton"></div>').join('');
  hourlyList.innerHTML = Array(8).fill('<div class="hourly-item-skeleton"></div>').join('');
  statFeelsLike.textContent = '—';
  statHumidity.textContent  = '—';
  statWind.textContent      = '—';
  statPrecip.textContent    = '—';
  statUV.textContent        = '—';
  statVisibility.textContent = '—';
  statPressure.textContent  = '—';
  dayPickerLabel.textContent = '—';
}

/* ===========================
   API
   =========================== */
const GEO_URL     = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_URL      = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM   = 'https://nominatim.openstreetmap.org/reverse';

async function geocode(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding API error');
  const json = await res.json();
  return json.results ?? [];
}

async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM}?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return null;
  const json = await res.json();
  const addr = json.address ?? {};
  return {
    name:      addr.city || addr.town || addr.village || addr.county || 'Unknown',
    country:   addr.country || '',
    admin1:    addr.state || '',
    latitude:  lat,
    longitude: lon,
  };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation', 'weather_code', 'wind_speed_10m', 'surface_pressure',
    ].join(','),
    hourly:       'temperature_2m,weather_code,uv_index,visibility',
    daily:        'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset,uv_index_max',
    timezone:     'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${WX_URL}?${params}`);
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
      if (e.key === 'ArrowUp')   (el.previousElementSibling ?? searchInput).focus();
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
  try {
    const results = await geocode(query);
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
  } catch {
    hideSearchDropdown();
    setState('error');
  }
}

async function selectLocation(location) {
  locationData = location;
  _lastLocation = location;
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
      // Clear any previous decline flag on success
      localStorage.removeItem('geo_declined');
      try {
        const [loc, wx] = await Promise.all([
          reverseGeocode(latitude, longitude),
          fetchWeather(latitude, longitude),
        ]);
        locationData = loc ?? { name: 'Your Location', country: '', latitude, longitude };
        weatherData  = wx;
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

  // Today card background animation class
  const todayCard = document.querySelector('.today-card');
  const bgClasses = ['bg-sunny','bg-partly-cloudy','bg-cloudy','bg-rainy','bg-snowy','bg-stormy','bg-foggy'];
  todayCard.classList.remove(...bgClasses);
  todayCard.classList.add(wx.bg);

  // City + date
  cityName.textContent    = [locationData.name, locationData.country].filter(Boolean).join(', ');
  currentDate.textContent = formatCardDate(daily.time[0]);

  // Temp / icon
  mainWeatherIcon.src     = `./assets/images/${wx.icon}`;
  mainWeatherIcon.alt     = wx.label;
  mainTemp.textContent    = `${cvtTemp(current.temperature_2m)}°`;

  // Core stats
  statFeelsLike.textContent  = `${cvtTemp(current.apparent_temperature)}°`;
  statHumidity.textContent   = `${current.relative_humidity_2m}%`;
  statWind.textContent       = `${cvtWind(current.wind_speed_10m)}${windUnit()}`;
  statPrecip.textContent     = `${cvtPrecip(current.precipitation)}${precipUnit()}`;
  statPressure.textContent   = cvtPressure(current.surface_pressure);

  // UV + Visibility — find the nearest hourly slot
  const nowIdx = (() => {
    const nowIso = new Date().toISOString().slice(0, 13); // "2025-08-05T15"
    const found  = hourly.time.findIndex(t => t.startsWith(nowIso));
    return found >= 0 ? found : 0;
  })();
  statUV.textContent         = uvLabel(hourly.uv_index?.[nowIdx]);
  statVisibility.textContent = cvtVisibility(hourly.visibility?.[nowIdx] ?? 0);

  // Sunrise / sunset
  if (daily.sunrise?.[0]) {
    statSunrise.textContent = formatTime(daily.sunrise[0]);
    statSunset.textContent  = formatTime(daily.sunset[0]);
    sunRow.hidden = false;
  }

  // Favorite star
  renderFavoriteBtn();

  renderDailyForecast(daily);
  renderDayPicker(daily);
  renderHourlyForecast(selectedDayIndex);
  renderFavoritesRow();
}

function renderDailyForecast(daily) {
  dailyList.innerHTML = daily.time.map((dateStr, i) => {
    const wx   = getWeatherInfo(daily.weather_code[i]);
    const high = cvtTemp(daily.temperature_2m_max[i]);
    const low  = cvtTemp(daily.temperature_2m_min[i]);
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
    const wx   = getWeatherInfo(h.code);
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
   ANIMATED BACKGROUND
   (handled via CSS classes added in renderWeather)
   =========================== */

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
    compareLocations = [{ locationData: { ...locationData }, weatherData }];
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

  // Wire remove buttons
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

// Compare search
async function performCompareSearch() {
  const query = compareSearchInput.value.trim();
  if (!query) return;
  compareSearchDropdown.innerHTML = `<div class="search-in-progress"><img src="./assets/images/icon-loading.svg" alt="" aria-hidden="true" width="18" height="18" class="spin"> Searching…</div>`;
  compareSearchDropdown.hidden = false;
  try {
    const results = await geocode(query);
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
  } catch {
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
function hideUnitsPanel()  { unitsPanel.hidden = true;  unitsBtn.setAttribute('aria-expanded', 'false'); }
function toggleDayPicker() {
  const open = dayPickerMenu.hidden;
  dayPickerMenu.hidden = !open;
  dayPickerBtn.setAttribute('aria-expanded', String(open));
  if (open) { hideUnitsPanel(); hideSearchDropdown(); }
}
function hideDayPicker()   { dayPickerMenu.hidden = true; dayPickerBtn.setAttribute('aria-expanded', 'false'); }

/* ===========================
   SECURITY HELPER
   =========================== */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===========================
   EVENT LISTENERS
   =========================== */
// Search
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')      performSearch();
  else if (e.key === 'Escape') hideSearchDropdown();
  else if (e.key === 'ArrowDown') searchDropdown.querySelector('[tabindex="0"]')?.focus();
});
searchInput.addEventListener('input', () => { if (!searchInput.value.trim()) hideSearchDropdown(); });

// Geolocation (manual = always try, even if previously declined)
geoBtn.addEventListener('click', () => tryGeolocation(true));

// Voice
if (_voiceSupported) {
  voiceBtn.addEventListener('click', startVoiceSearch);
}

// Favorite
favoriteBtn.addEventListener('click', toggleFavorite);

// Units
unitsBtn.addEventListener('click', e => { e.stopPropagation(); toggleUnitsPanel(); });
switchUnitsBtn.addEventListener('click', switchUnits);
document.querySelectorAll('.unit-item').forEach(el => {
  el.addEventListener('click', () => {
    units[el.dataset.group] = el.dataset.value;
    updateUnitsUI();
    if (appState === 'loaded')   renderWeather();
    if (appState === 'compare')  renderCompareView();
  });
});

// Theme
themeToggleBtn.addEventListener('click', toggleTheme);

// Day picker
dayPickerBtn.addEventListener('click', e => { e.stopPropagation(); toggleDayPicker(); });

// Retry
retryBtn.addEventListener('click', () => setState('initial'));

// Compare
compareBtn.addEventListener('click', openCompareView);
compareCloseBtn.addEventListener('click', closeCompareView);
compareSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performCompareSearch(); });
compareSearchInput.addEventListener('input', () => { if (!compareSearchInput.value.trim()) compareSearchDropdown.hidden = true; });

// Click-outside to close dropdowns
document.addEventListener('click', e => {
  if (!$('unitsContainer').contains(e.target))           hideUnitsPanel();
  if (!$('dayPickerContainer').contains(e.target))       hideDayPicker();
  if (!document.querySelector('.search-bar').contains(e.target)) hideSearchDropdown();
  if (!$('compareAddRow').contains(e.target))            compareSearchDropdown.hidden = true;
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    hideUnitsPanel(); hideDayPicker(); hideSearchDropdown();
    compareSearchDropdown.hidden = true;
  }
});

/* ===========================
   INIT
   =========================== */
updateUnitsUI();
applyTheme(getThemePref());
renderFavoritesRow();
setState('initial');

// Auto-geolocation on first meaningful visit
if (!localStorage.getItem('geo_declined') && !localStorage.getItem('geo_prompted')) {
  localStorage.setItem('geo_prompted', '1');
  tryGeolocation();
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

