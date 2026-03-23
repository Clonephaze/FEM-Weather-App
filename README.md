# Frontend Mentor - Weather App Solution

This is a solution to the [Weather app challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/weather-app-K1FhddVm49). Frontend Mentor challenges help you improve your coding skills by building realistic projects.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Bonus features](#bonus-features)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Author](#author)

## Overview

### The challenge

Users should be able to:

- Search for weather information by entering a location in the search bar
- View current weather conditions including temperature, weather icon, and location details
- See additional weather metrics like "feels like" temperature, humidity percentage, wind speed, and precipitation amounts
- Browse a 7-day weather forecast with daily high/low temperatures and weather icons
- View an hourly forecast showing temperature changes throughout the day
- Switch between different days of the week using the day selector in the hourly forecast section
- Toggle between Imperial and Metric measurement units via the units dropdown
- Switch between specific temperature units (Celsius and Fahrenheit) and measurement units for wind speed (km/h and mph) and precipitation (millimeters and inches) via the units dropdown
- View the optimal layout for the interface depending on their device's screen size
- See hover and focus states for all interactive elements on the page

### Bonus features

All nine suggested extras were implemented:

- **Geolocation detection** — Automatically shows weather for the user's current location on first visit
- **Favorites system** — Bookmark up to 8 frequently checked locations, shown as quick-select chips
- **Compare Locations** — Side-by-side weather comparison for up to 3 locations
- **Extended data** — UV index, visibility, air pressure, sunrise/sunset times
- **Animated weather backgrounds** — Condition-specific canvas particle effects (rain, snow, lightning, hail, fog, stars, sun/moon glow) with day/night variants
- **Voice search** — Speech recognition input for hands-free location search
- **Dark/light themes** — Adapts to time of day automatically, with manual toggle
- **PWA support** — Installable as a mobile/desktop app with offline caching via service worker

### Links

- Solution URL: [Frontend Mentor](https://www.frontendmentor.io/solutions/animated-forecasts-pwa-geo-loc-favs-voice-search-and-more-xvPsJWKPLs)
- Live Site URL: [https://clonephaze.github.io/FEM-Weather-App/](https://clonephaze.github.io/FEM-Weather-App/)

## My process

### Built with

- Semantic HTML5 markup
- CSS custom properties and CSS Grid / Flexbox layout
- Vanilla JavaScript (no frameworks)
- Canvas 2D API for weather particle effects
- [Open-Meteo API](https://open-meteo.com/) for weather and geocoding data
- [Nominatim](https://nominatim.openstreetmap.org/) for reverse geocoding
- Web Speech API for voice search
- Service Worker with cache-first static / network-first API strategy
- Web App Manifest for PWA install support

### What I learned

The most valuable lesson from this project was managing async complexity in a vanilla JS app. Once geolocation, multiple API calls, search-as-you-type, compare mode, and the service worker were all in play, race conditions and stale state became real problems. Using `AbortController` to cancel in-flight searches on new input was the cleanest fix:

```js
_searchAbort?.abort();
_searchAbort = new AbortController();
const { signal } = _searchAbort;
const results = await geocode(query, signal);
```

Another takeaway was timezone handling. The day/night presentation initially used the browser's local timezone, which broke for locations in other regions. Switching to the API's `utc_offset_seconds` field and comparing against sunrise/sunset in the location's own timezone fixed it properly:

```js
function isDayTime() {
    const offset = weatherData.utc_offset_seconds ?? 0;
    const now = Date.now() + offset * 1000;
    const parseAsUTC = (str) => {
        const [d, t] = str.split('T');
        const [Y, M, D] = d.split('-').map(Number);
        const [h, m] = t.split(':').map(Number);
        return Date.UTC(Y, M - 1, D, h, m) + offset * 1000;
    };
    const rise = parseAsUTC(weatherData.daily.sunrise[0]);
    const set = parseAsUTC(weatherData.daily.sunset[0]);
    return now >= rise && now < set;
}
```

The canvas particle system was the most fun part. Getting each weather type to feel distinct — sparse thin drizzle vs. dense angled downpour, gentle snowfall vs. heavy blizzard, lightning bolt branching with screen flash — required a lot of per-type tuning but the result was worth it.

### Continued development

- **Module structure** — The app grew to ~1,700 lines of JS in a single file. Splitting into ES modules (API, state, render, particles, UI) would improve maintainability.
- **Accessibility** — While semantic HTML, ARIA attributes, and keyboard navigation are in place, more screen reader testing and automated a11y audits would be beneficial.
- **Testing** — No automated tests exist. Adding integration tests for the async flows (search cancellation, geolocation fallback, service worker caching) would catch regressions.
- **Performance** — The particle system runs well on modern devices but could use frame budgeting or `OffscreenCanvas` for lower-end hardware.

### Useful resources

- [Open-Meteo API docs](https://open-meteo.com/en/docs) — Free weather API with no key required. Excellent documentation for all available parameters.
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Essential reference for cancelling fetch requests and managing async race conditions.
- [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Used extensively for the weather particle effects system.
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — Reference for implementing the offline-capable PWA caching strategy.

## Author

- Website - [Clonecore](https://www.clonecore.net)
- Frontend Mentor - [@Clonephaze](https://www.frontendmentor.io/profile/Clonephaze)
- GitHub - [@Clonephaze](https://github.com/Clonephaze)
