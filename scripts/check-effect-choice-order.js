const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");

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

const sheet = read("scripts/pages/character-sheet.js");
const map = read("scripts/pages/map.js");
const pending = read("modals/pending-effect-choices.js");
const effectMechanics = read("scripts/effect-mechanics.js");
const effectChoicePicker = read("modals/effect-choice-picker.js");

const chooseContributions = effectMechanics.slice(
  effectMechanics.indexOf("async function chooseContributions"),
  effectMechanics.indexOf("function branches"),
);
assert(
  chooseContributions.includes("searchable: false"),
  "The rage-power choice modal must not show the shared picker search field.",
);

assert(
  effectMechanics.includes('title: `${title}: Choose Option`') &&
    effectMechanics.includes("searchable: false"),
  "Short effect branch choices must not show the shared picker search field.",
);
assert(
  effectChoicePicker.includes("searchable: allowSearch = true") &&
    effectChoicePicker.includes('search.classList.toggle("d-none", !searchable)'),
  "The shared picker must support hiding search without removing it from large catalogs.",
);
assert(
  effectChoicePicker.includes(
    "resolve(hasPendingResult ? pendingResult : null)",
  ) &&
    effectChoicePicker.indexOf(
      "resolve(hasPendingResult ? pendingResult : null)",
    ) > effectChoicePicker.indexOf("const onHidden"),
  "Effect choices must resolve after their modal is fully hidden so the orchestrator can advance safely.",
);

const spellCastStart = sheet.indexOf("async function performCastSpellFromDetails");
const spellCast = sheet.slice(
  spellCastStart,
  sheet.indexOf("function spellExtraSlots", spellCastStart),
);
assert(spellCastStart >= 0, "Missing performCastSpellFromDetails().");
assert(
  spellCast.indexOf('"caster-decisions"') <
    spellCast.indexOf("resolveSpellCastEffectChoices(payload"),
  "Spell decisions must be routed by the shared orchestrator before resolution.",
);
assert(
  spellCast.indexOf("openSpellCastTargetModal(spell)") <
    spellCast.indexOf("resolveSpellCastEffectForTarget"),
  "Spell targets must be selected before branch choices are resolved.",
);
assert(
  spellCast.indexOf("openSpellCastTargetModal(spell)") <
    spellCast.indexOf("rollSpellAttacksFromDetails"),
  "The caster must select spell attack targets before attack confirmation.",
);
assert(
  spellCast.indexOf('"target-decisions"') <
    spellCast.lastIndexOf('"attack-confirmation"'),
  "Attacks supplied by a spell branch must roll after that branch is resolved.",
);
assert(
  spellCast.includes("payloadForSuccessfulAttacks?.(") &&
    spellCast.indexOf('"attack-confirmation"') <
      spellCast.lastIndexOf('"effect-rolls"'),
  "Successful branch attacks must expose their damage before branch damage is rolled.",
);
assert(
  spellCast.indexOf("PFAuraDeliveryChoice.choose") <
    spellCast.indexOf("openSpellCastTargetModal(spell)"),
  "Aura placement must be chosen before spell targets are selected.",
);
assert(
  spellCast.indexOf("await closeDetails?.()") <
    spellCast.indexOf("PFAuraDeliveryChoice.choose"),
  "Aura placement must wait for the spell details modal to close.",
);
assert(
  !spellCast.includes("has no configured effects or damage"),
  "Spells without configured mechanics must remain castable from the character sheet.",
);
assert(
  spellCast.indexOf("recordSpellCastTimeline(spell)") <
    spellCast.lastIndexOf("openSpellCastTargetModal(spell)"),
  "Mechanic-free casts must finish before opening the target picker.",
);

const mapStateSave = functionBody(sheet, "saveSpellCastMapState");
assert(mapStateSave.includes("clientId: spellCastMapClientId"));
assert(mapStateSave.includes("savedAt: Math.max(Date.now()"));
assert(
  functionBody(sheet, "createSpellAurasOnCurrentMap").includes(
    "saveSpellCastMapState()",
  ),
  "Character-sheet aura casts must publish fresh map synchronization metadata.",
);
assert(
  functionBody(sheet, "createSpellAurasOnCurrentMap").includes(
    "installAuraInSpellCastMap",
  ) && functionBody(sheet, "installAuraInSpellCastMap").includes("createAuraLink"),
  "Character-sheet aura casts must create a linked active-effect entry.",
);
assert(
  spellCast.includes("saveAuraControllerEffects(controllers)"),
  "Character-sheet aura casts must persist their linked active-effect entry.",
);
assert(
  sheet
    .slice(
      sheet.indexOf("function spellEffectPayloads"),
      sheet.indexOf("function spellDamageRolls"),
    )
    .includes("Boolean(mechanics.auraConfig?.enabled)"),
  "Aura-only spells must produce a castable effect payload.",
);

const targetResolverStart = sheet.indexOf(
  "async function resolveSpellCastEffectForTarget",
);
const targetResolver = sheet.slice(
  targetResolverStart,
  sheet.indexOf("async function applyHealingAfterSpellTarget", targetResolverStart),
);
assert(targetResolver.includes('target.ownerId !== currentUserId'));
assert(targetResolver.includes("PFApp.createEffectChoiceRequest"));
assert(
  targetResolver.indexOf("PFApp.createEffectChoiceRequest") <
    targetResolver.indexOf("resolveSpellCastEffectChoices"),
  "Remote targets must receive a request instead of resolving locally.",
);

const localSpellChoiceStart = sheet.indexOf(
  "async function resolveSpellCastEffectChoices",
);
const localSpellChoices = sheet.slice(
  localSpellChoiceStart,
  sheet.indexOf("function appliedSpellEffect", localSpellChoiceStart),
);
assert(
  localSpellChoices.includes("stopBeforeTargetOwned") &&
    localSpellChoices.includes("{ resolveBranch: false }"),
  "Caster spell decisions must stop after a branch reveals a target-owned choice.",
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
const mapChoiceResolverStart = map.indexOf(
  "async function resolveEffectChoicesForToken",
);
const mapChoiceResolver = map.slice(
  mapChoiceResolverStart,
  map.indexOf("async function resolveEffectSaveForToken", mapChoiceResolverStart),
);
assert(
  (mapChoiceResolver.match(/stopBeforeTargetOwned\s*&&/g) || []).length >= 2 &&
    mapChoiceResolver.includes("targetMustAnswer?.(effect)"),
  "Map caster decisions must hand nested target-owned choices to the target node.",
);

const tracker = read("scripts/buff-tracker-widget.js");
assert(
  tracker.includes("function activeEffectVisibleInTab") &&
    tracker.includes("effect.applyConditions") &&
    tracker.includes("sourceEffectTab: activeEffectTab(effect)"),
  "Applied conditions must be indexed into Conditions and their source tab without duplicating activation.",
);
assert(
  mapApply.indexOf('"target-decisions"') <
    mapApply.indexOf('"attack-confirmation"') &&
    mapApply.indexOf('"attack-confirmation"') <
      mapApply.indexOf('"effect-rolls"'),
  "Map branch attacks must roll after the target-specific branch choice.",
);
assert(
  mapApply.includes("PFEffectActivationOrchestrator") &&
    mapApply.includes("orchestrator.resume"),
  "Map target application must resume the paused shared activation.",
);

const mapQuickEffectStart = map.indexOf("async function chooseQuickEffect(");
const mapQuickEffect = map.slice(
  mapQuickEffectStart,
  map.indexOf("async function openMapOwnedSpellDetails", mapQuickEffectStart),
);
assert(mapQuickEffectStart >= 0, "Missing chooseQuickEffect().");
assert(
  mapQuickEffect.indexOf('"caster-decisions"') <
    mapQuickEffect.indexOf('"aura-delivery"'),
  "Aura placement must follow earlier caster-owned map decisions.",
);
assert(
  mapQuickEffect.indexOf('"aura-delivery"') <
    mapQuickEffect.indexOf("openQuickEffectTargets"),
  "Aura placement must be chosen before the map target picker opens.",
);

const mapSpellDetails = functionBody(map, "openMapOwnedSpellDetails");
assert(
  mapSpellDetails.includes("await chooseQuickEffect"),
  "Map spell casting must remain in flight until the quick-effect handoff completes.",
);
assert(
  mapSpellDetails.includes("effectHasTargetMechanics(effect)"),
  "Branch-only spells must count as configured effects on the map.",
);
assert(
  !mapSpellDetails.includes("has no configured effects or damage"),
  "Spells without configured mechanics must remain castable from the map.",
);
assert(
  /recordQuickSpellCast\((?:resolved)?CastEffect\)/.test(mapSpellDetails),
  "Mechanic-free map casts must be recorded without opening the target picker.",
);
assert(
  /function effectHasTargetMechanics[\s\S]{0,240}PFEffectMechanics\?\.hasBranches\?\.\(effect\)/.test(map),
  "The shared map target-mechanics check must recognize effect branches.",
);

const recipientResolver = functionBody(pending, "resolveRequest");
assert(recipientResolver.includes("PFEffectMechanics.chooseBranch"));
assert(
  recipientResolver.indexOf("if (decisionOnly)") <
    recipientResolver.indexOf("resolvePendingAttackRolls"),
  "Decision-only handoffs must return to the caster before attack confirmation.",
);
assert(
  recipientResolver.indexOf("resolvePendingDamageRolls") <
    recipientResolver.indexOf("saveBuffState"),
  "Cross-device branch damage must resolve before any persistent effect is saved.",
);
assert(
  recipientResolver.indexOf("PFEffectMechanics.chooseBranch") <
    recipientResolver.indexOf("saveBuffState"),
  "The recipient must choose a branch before the effect is saved.",
);

console.log("Effect choice ordering checks passed.");
