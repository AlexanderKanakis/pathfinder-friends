const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const mapHtml = fs.readFileSync(path.join(rootDir, "map.html"), "utf8");
const mapJs = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "map.js"),
  "utf8",
);
const trackerJs = fs.readFileSync(
  path.join(rootDir, "scripts", "buff-tracker-widget.js"),
  "utf8",
);

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `Missing ${name}().`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not read ${name}().`);
}

assert(mapHtml.includes('id="quickEffectModal"'));
assert(mapHtml.includes('class="nav nav-pills effect-browser-nav"'));
assert(mapHtml.includes('class="effect-search-results effect-browser-list"'));
assert(!mapHtml.includes('id="quickConditionModal"'));
assert(!mapHtml.includes('id="quickEffectInfoModal"'));
assert(!mapHtml.includes('id="quickEffectMostUsedWrap"'));

const controlsBody = functionBody(trackerJs, "effectBrowserControlsHtml");
assert(controlsBody.includes("data-picker-condition-ability"));
assert(controlsBody.includes("data-picker-condition-amount"));
assert(controlsBody.includes("data-picker-turns"));
assert(controlsBody.includes("conditionUsesTurns(effect)"));

const bindingBody = functionBody(mapJs, "bindQuickEffectBrowser");
assert(bindingBody.includes("PFConditionConfig.configure"));
assert(bindingBody.includes("data-picker-condition-ability"));
assert(bindingBody.includes("data-picker-condition-amount"));
assert(bindingBody.includes("data-picker-turns"));
assert(bindingBody.includes("permanent: false"));
assert(bindingBody.includes("chooseQuickEffect"));

const renderBody = functionBody(mapJs, "renderQuickEffects");
assert(renderBody.includes("browser.rowHtml"));
assert(renderBody.includes("browser.spellsHtml"));
assert(renderBody.includes("browser.loadingHtml"));

for (const entryPoint of ["openQuickApplyEffect", "openAuraEffectPicker"]) {
  const body = functionBody(mapJs, entryPoint);
  assert(body.includes("sourceEffectDefinitions"));
  assert(body.includes("renderQuickEffects"));
}
const effectsBody = functionBody(mapJs, "openMapEffects");
assert(effectsBody.includes("PFEffectTracker.mount"));
assert(effectsBody.includes("choicePoolEquipment"));

console.log("Map condition picker checks passed.");
