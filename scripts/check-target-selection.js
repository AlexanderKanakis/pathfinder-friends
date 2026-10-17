const assert = require("assert");
const fs = require("fs");

function functionBody(source, name) {
  let start = source.indexOf(`function ${name}(`);
  if (start < 0) start = source.indexOf(`async function ${name}(`);
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

const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const sheetCss = fs.readFileSync("css/character-sheet.css", "utf8");
const mapCss = fs.readFileSync("css/map.css", "utf8");

const sheetTargets = functionBody(sheet, "spellCastTargetsFromCurrentMap");
assert(sheetTargets.includes("isCaster:"));
assert(sheetTargets.includes('? "ally"'));
assert(sheetTargets.includes("Number(b.isCaster) - Number(a.isCaster)"));
const sheetRenderer = functionBody(sheet, "renderSpellCastTargetGroup");
assert(sheetRenderer.includes('target.isCaster ? " is-caster" : ""'));
assert(sheetRenderer.includes("Caster |"));
assert(!sheetRenderer.includes('data-spell-cast-target-group="${escapeHtml(group)}" checked'));
assert(!sheet.includes("Choose one or more tokens on the current map."));

const mapTargets = functionBody(map, "quickEffectTargets");
assert(mapTargets.includes("isCaster: token.id === quickEffectSourceTokenId"));
assert(mapTargets.includes('? "ally"'));
assert(mapTargets.includes("Number(b.isCaster) - Number(a.isCaster)"));
const mapRenderer = functionBody(map, "renderQuickEffectTargetGroup");
assert(mapRenderer.includes("previousTargetIds.has(token.id)"));
assert(!mapRenderer.includes("token.id === quickEffectSourceTokenId ||"));
assert(mapRenderer.includes('isCaster ? " is-caster" : ""'));
assert(mapRenderer.includes('isCaster ? "Caster | " : ""'));
assert(!map.includes("Choose one or more tokens on the current map."));
assert(map.includes('targetHint.classList.toggle("d-none", !targetHint.textContent)'));

assert(sheetCss.includes(".spell-cast-target-card.is-caster"));
assert(mapCss.includes(".quick-target-card.is-caster"));

console.log("Target caster ordering and selection checks passed.");
