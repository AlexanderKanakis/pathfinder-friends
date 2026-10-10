const assert = require("assert");
const fs = require("fs");

const tracker = fs.readFileSync("scripts/buff-tracker-widget.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");

assert(tracker.includes("async hidePickerParent()"));
assert(tracker.includes("restorePickerParent()"));
assert(
  tracker.indexOf("await this.hidePickerParent()") <
    tracker.indexOf("bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show()"),
  "The caller modal must finish hiding before the effect picker opens.",
);
assert(tracker.includes("loadingResultsHtml()"));
assert(tracker.includes('this.pickerGroup === "spells"'));
assert(tracker.includes("effect-browser-loading-pulse"));
assert(tracker.includes('condition ? " is-condition" : ""'));
assert(tracker.includes('condition ? "" : `<div class="effect-browser-row-meta">'));
assert(tracker.includes("effect-browser-number-control"));
assert(tracker.includes("prepareLoading(container)"));
assert(tracker.includes("setActiveEffects(effects = [])"));

assert(sheet.includes("effectPickerEffects: loadCurrentEffectPickerDefinitions"));
assert(sheet.includes("scheduleEffectPickerPrefetch();"));
assert(sheet.includes("invalidateEffectPickerDefinitions();"));
assert(sheet.includes("loadActiveEffects: async () => activeBuffs"));
assert(sheet.includes("subscribeCharacterBuffRealtime();"));
assert(
  sheet.indexOf("effectTrackerModal.show();") <
    sheet.indexOf("await openEffectTrackerModal();"),
  "The Effects modal must open before tracker hydration starts.",
);

assert(map.includes("scheduleAccessibleEffectSourcePrefetch();"));
assert(map.includes("isGm || character.userId === currentUserId"));
assert(map.includes("await characterMapEffectSources(character);"));
assert(map.includes("mapEffectPrefetchGeneration += 1;"));
assert(map.includes("function quickEffectLoadingHtml"));
assert(map.includes("quickEffectLoading = true;"));
assert(map.includes("quickEffectLoading = false;"));
assert(
  map.indexOf("mapEffectsModal.show();") <
    map.indexOf("await characterActivatableAbilities"),
  "The map Effects modal must open before its character sources load.",
);

console.log("Effect picker lifecycle and prefetch checks passed.");
