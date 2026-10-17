const fs = require("fs");

const html = fs.readFileSync("map.html", "utf8");
const css = fs.readFileSync("css/map.css", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const loader = fs.readFileSync("assets/loaders/map.png");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('<body class="map-booting">') &&
    html.includes('id="mapStartupLoader"') &&
    html.includes('id="mapStartupProgressBar"'),
  "The map must remain behind the startup loader until initialization completes.",
);
assert(
  html.includes('href="assets/loaders/map.png"') &&
    html.includes('src="assets/loaders/map.png"'),
  "The map loader image must be preloaded and displayed.",
);
assert(
  css.includes("@keyframes map-startup-spin") &&
    css.includes("rotateY(360deg)") &&
    css.includes("body.map-booting .map-shell"),
  "The loader icon must spin in 3D while the map stays hidden.",
);
assert(
  map.includes("async function runMapStartup(contextKey)") &&
    map.includes("window.PFEffectCatalog?.load?.()") &&
    map.includes("characterSheetBridge()") &&
    map.includes("window.PFClassData?.loadAllPoolCatalogs?.()"),
  "Startup must warm the effect catalog, character engine, and class pools.",
);
assert(
  map.includes("preloadCurrentMapVisuals()") &&
    map.includes("eagerPassiveAuras: true") &&
    map.includes('setMapStartupProgress(100, "Ready")'),
  "Startup must wait for visible images, passive auras, and final rendering.",
);
assert(
  map.includes('if (!requiredContext) {') &&
    map.includes('document.body.classList.remove("map-booting")'),
  "Campaign-required guidance must remain visible when no map context exists.",
);
assert(
  !map.match(/runMapStartup[\s\S]{0,2500}PFSummonCreatures\?\.loadCatalog/),
  "The 31 MB monster catalog must remain demand-loaded.",
);
assert(
  loader.readUInt32BE(16) === 96 && loader.readUInt32BE(20) === 96,
  "The supplied map loader image dimensions changed unexpectedly.",
);

console.log("Map startup loader guards passed.");
