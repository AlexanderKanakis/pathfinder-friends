const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");

function functionBody(source, name) {
  let start = source.indexOf(`function ${name}`);
  if (start < 0) start = source.indexOf(`async function ${name}`);
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

const sheet = read("scripts/pages/character-sheet.js");
const map = read("scripts/pages/map.js");
const pending = read("modals/pending-effect-choices.js");

const spellCastStart = sheet.indexOf("async function castSpellFromDetails");
const spellCast = sheet.slice(
  spellCastStart,
  sheet.indexOf("function spellExtraSlots", spellCastStart),
);
assert(spellCastStart >= 0, "Missing castSpellFromDetails().");
assert(
  spellCast.indexOf("hasBranches?.(payload)") <
    spellCast.indexOf("resolveSpellCastEffectChoices(payload"),
  "Branched payloads must remain unresolved before target selection.",
);
assert(
  spellCast.indexOf("openSpellCastTargetModal(spell)") <
    spellCast.indexOf("resolveSpellCastEffectForTarget"),
  "Spell targets must be selected before branch choices are resolved.",
);

const targetResolver = functionBody(sheet, "resolveSpellCastEffectForTarget");
assert(targetResolver.includes('target.ownerId !== currentUserId'));
assert(targetResolver.includes("PFApp.createEffectChoiceRequest"));
assert(
  targetResolver.indexOf("PFApp.createEffectChoiceRequest") <
    targetResolver.indexOf("resolveSpellCastEffectChoices"),
  "Remote targets must receive a request instead of resolving locally.",
);

const targetModal = functionBody(sheet, "ensureSpellCastTargetModal");
assert(targetModal.includes('"hidden.bs.modal"'));
assert(targetModal.includes("() => next?.(selected)"));

const mapApply = functionBody(map, "confirmQuickEffectTargets");
assert(
  mapApply.indexOf("hideQuickEffectTargetsBeforeChoices") <
    mapApply.indexOf("resolveEffectChoicesForToken"),
  "The map target modal must close before a branch modal can open.",
);

const mapSpellDetails = functionBody(map, "openMapOwnedSpellDetails");
assert(
  mapSpellDetails.includes("effectHasTargetMechanics(effect)"),
  "Branch-only spells must count as configured effects on the map.",
);
assert(
  /function effectHasTargetMechanics[\s\S]{0,240}PFEffectMechanics\?\.hasBranches\?\.\(effect\)/.test(map),
  "The shared map target-mechanics check must recognize effect branches.",
);

const recipientResolver = functionBody(pending, "resolveRequest");
assert(recipientResolver.includes("PFEffectMechanics.chooseBranch"));
assert(
  recipientResolver.indexOf("PFEffectMechanics.chooseBranch") <
    recipientResolver.indexOf("saveBuffState"),
  "The recipient must choose a branch before the effect is saved.",
);

console.log("Effect choice ordering checks passed.");
