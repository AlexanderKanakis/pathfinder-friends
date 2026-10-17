const fs = require("fs");

const html = fs.readFileSync("map.html", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const css = fs.readFileSync("css/map.css", "utf8");
const rain = fs.readFileSync("assets/weather drops/rain.png");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="mapWeather"'),
  "Map Settings must expose the weather selector.",
);
assert(
  map.includes('imageUrl: "assets/weather%20drops/rain.png"'),
  "Rain must resolve through the shared weather catalog.",
);
assert(
  map.includes('weather: "clear"') &&
    map.includes('state.settings.weather = el("mapWeather").value'),
  "Weather must have a clear default and persist through map settings.",
);
assert(
  html.includes('id="mapWeatherViewport"') &&
    map.includes('weatherViewport?.classList.toggle("has-map-weather", weatherVisible)'),
  "The selected weather must render through the persistent flat viewport layer.",
);
assert(
  map.includes('stageWrap.closest(".map-stage-viewport") || stageWrap'),
  "Desktop toolbar restoration must preserve the map viewport wrapper.",
);
assert(
  map.includes("new URL(weather.imageUrl, window.location.href).href"),
  "Weather paths must resolve from the page before CSS consumes them.",
);
assert(
  map.includes("horizontalLoops: 5") &&
    map.includes("verticalLoops: 12") &&
    css.includes("map-weather-drift-x") &&
    css.includes("map-weather-drift-y"),
  "Rain must preserve the requested horizontal and vertical speeds.",
);
assert(
  map.includes("renderScale: 0.7") &&
    map.includes("localGridSize / 96") &&
    css.includes("opacity: 0.49"),
  "Rain size and opacity must shrink by 30% and follow map zoom.",
);
assert(
  css.includes("pointer-events: none") &&
    css.includes(".map-weather-viewport.has-map-weather") &&
    css.includes("translate3d") &&
    map.includes("syncMapWeatherViewport()"),
  "Weather must remain click-through and animate continuously.",
);
assert(
  html.includes('id="mapWeatherHoverLayer"') &&
    html.includes('id="tokenHoverLayer"') &&
    css.includes(".map-stage-viewport {") &&
    css.includes("isolation: isolate") &&
    css.includes(".map-weather-hover-layer") &&
    css.includes("z-index: 102"),
  "Weather must remain below token names and hover UI in an isolated map layer.",
);
assert(
  map.includes("wrap.offsetWidth - wrap.clientWidth") &&
    map.includes("wrap.offsetHeight - wrap.clientHeight") &&
    map.includes("for (const layer of [weather, labels, hover])"),
  "Weather and map overlays must stop before the native scrollbars.",
);
assert(
  map.includes("viewport.appendChild(layer)") &&
    map.includes("rect.left - viewportRect.left") &&
    map.includes("rect.top - viewportRect.top"),
  "3D token labels must render in the flat layer above weather.",
);
assert(
  rain.readUInt32BE(16) === 1920 && rain.readUInt32BE(20) === 1080,
  "Rain tile dimensions changed; update its catalog entry.",
);

console.log("Map weather guards passed.");
