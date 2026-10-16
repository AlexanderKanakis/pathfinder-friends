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
  map.includes("renderMapWeatherLayer()"),
  "The selected weather must render on the shared map stage.",
);
assert(
  map.includes("new URL(weather.imageUrl, window.location.href).href"),
  "Weather paths must resolve from the page before CSS consumes them.",
);
assert(css.includes("opacity: 0.7"), "Weather artwork must render at 70% opacity.");
assert(
  css.includes("pointer-events: none") && css.includes("map-weather-drift"),
  "Weather must remain click-through and animate continuously.",
);
assert(
  rain.readUInt32BE(16) === 1920 && rain.readUInt32BE(20) === 1080,
  "Rain tile dimensions changed; update its catalog entry.",
);

console.log("Map weather guards passed.");
