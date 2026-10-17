const assert = require("assert");
const fs = require("fs");

const tracker = fs.readFileSync("scripts/buff-tracker-widget.js", "utf8");
const catalog = fs.readFileSync("scripts/effect-catalog.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const sheetHtml = fs.readFileSync("character-sheet.html", "utf8");
const sheetCss = fs.readFileSync("css/character-sheet.css", "utf8");
const modalCss = fs.readFileSync("css/modal-rules.css", "utf8");
const mapHtml = fs.readFileSync("map.html", "utf8");

assert(tracker.includes("async hidePickerParent()"));
assert(tracker.includes("restorePickerParent()"));
assert(
  tracker.indexOf("await this.hidePickerParent()") <
    tracker.indexOf("bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show()"),
  "The caller modal must finish hiding before the effect picker opens.",
);
assert(tracker.includes("loadingResultsHtml()"));
assert(tracker.includes("const PICKER_RESULT_BATCH_SIZE = 80;"));
assert(tracker.includes("rows.slice(0, this.pickerVisibleLimit)"));
assert(tracker.includes("data-effect-browser-more"));
assert(tracker.includes('this.pickerGroup === "spells"'));
assert(tracker.includes("effect-browser-loading-pulse"));
assert(!tracker.includes("PickerGroupTitle"));
assert(!tracker.includes("pickerGroupLabel"));
assert(!tracker.includes(".effect-browser-spell-class { border:"));
assert(tracker.includes('data-effect-browser-spell-tab="known"'));
assert(tracker.includes('data-effect-browser-spell-tab="prepared"'));
assert(tracker.includes('data-effect-browser-spell-panel="prepared"'));
assert(tracker.includes("this.pickerSpellPanels[group] = target;"));
assert(tracker.includes('condition ? " is-condition" : ""'));
assert(tracker.includes('condition ? "" : `<div class="effect-browser-row-meta">'));
assert(tracker.includes("effect-browser-number-control"));
assert(tracker.includes("prepareLoading(container)"));
assert(tracker.includes("setActiveEffects(effects = [])"));
assert(tracker.includes('const ACTIVE_EFFECT_TABS = ['));
assert(tracker.includes('{ key: "spell", label: "Spells" }'));
assert(tracker.includes('{ key: "condition", label: "Conditions" }'));
assert(tracker.includes('{ key: "class", label: "Class" }'));
assert(tracker.includes('{ key: "racial", label: "Racials" }'));
assert(tracker.includes('{ key: "feat", label: "Feats" }'));
assert(tracker.includes('{ key: "item", label: "Items" }'));
assert(
  tracker.indexOf('{ key: "spell", label: "Spells" }') <
    tracker.indexOf('{ key: "condition", label: "Conditions" }') &&
    tracker.indexOf('{ key: "condition", label: "Conditions" }') <
      tracker.indexOf('{ key: "class", label: "Class" }') &&
    tracker.indexOf('{ key: "class", label: "Class" }') <
      tracker.indexOf('{ key: "racial", label: "Racials" }'),
);
assert(tracker.includes('if (isCondition(effect)) return "condition";'));
for (const group of [
  "spells",
  "conditions",
  "class",
  "racial",
  "feats",
  "items",
  "other",
]) {
  assert(tracker.includes(`["${group}",`));
}
assert(!tracker.includes('data-effect-browser-group="personal"'));
assert(!tracker.includes('data-effect-browser-group="passives"'));
assert(tracker.includes("sourceGroup: effectSourceGroup"));
assert(tracker.includes("function categorizedSourceGroup(effect = {})"));
assert(tracker.includes("effect.catalogEffect &&"));
assert(
  tracker.includes(
    '["class", "racial", "feats", "items"].includes(categoryGroup)',
  ),
);
assert(tracker.includes('if (/\\bclass(?: ability| feature)?\\b/.test(sourceText)) return "class";'));
assert(tracker.includes('if (/\\b(?:race|racial)\\b/.test(sourceText)) return "racial";'));
assert(tracker.includes('if (/\\bfeat\\b/.test(sourceText)) return "feats";'));
assert(tracker.includes('return "items";'));
assert(!tracker.includes("data-active-turns"));
assert(!tracker.includes("data-active-cl"));
assert(!tracker.includes("updateActiveDuration"));
assert(tracker.includes('data-active-effect-tab="${tab.key}"'));
assert(tracker.includes("bindActiveTabs()"));
assert(!tracker.includes("ActiveTypeFilter"));
assert(!tracker.includes("<h6>Active Effects</h6>"));
assert(!tracker.includes('for="${this.prefix}OpenSearch">Activate'));
assert(tracker.includes(">Use Powers</button>"));
assert(
  sheetHtml.includes('class="modal fade modal-workspace"\n      id="effectTrackerModal"'),
);
assert(
  tracker.includes(
    '<div class="modal fade modal-workspace" id="${this.prefix}PickerModal"',
  ),
);
assert(
  mapHtml.includes('class="modal fade modal-workspace"\n      id="quickEffectModal"'),
);
assert(modalCss.includes("max-height: calc(100dvh - 1rem)"));
assert(modalCss.includes(".modal.modal-workspace .modal-dialog {"));
assert(modalCss.includes(".modal .modal-header,"));
assert(modalCss.includes(".modal .modal-body {\n    padding: 0.5rem;"));
assert(!sheetCss.includes("#effectTrackerModal .modal-footer"));
assert(!sheetCss.includes("#effectTrackerModal .modal-header"));
assert(tracker.includes(".effect-tracker-add-shell { margin-bottom: 6px; }"));
assert(
  tracker.includes(
    ".effect-tracker-add-row { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr) max-content; }",
  ) && tracker.includes(".effect-tracker-add-row .btn { white-space: nowrap; }"),
);
assert(tracker.includes(".effect-active-nav .nav-link { min-height: 31px;"));
assert(tracker.includes(".effect-tracker-active { border-radius: 6px;"));
assert(tracker.includes("grid-auto-rows: max-content;"));
assert(tracker.includes(".effect-browser-controls { align-items: center; display: flex; flex-wrap: wrap;"));
assert(tracker.includes("const rounds = effect.remaining ?? effect.computedDuration;"));
assert(tracker.includes("function preferOwnedPickerEffects(effects = [])"));
assert(tracker.includes("this.pickerEffects = preferOwnedPickerEffects("));
assert(tracker.includes("this.options.loadPassiveEffects"));
assert(tracker.includes("requestAnimationFrame(() => window.setTimeout(() => void loadPassives(), 0))"));
assert(tracker.includes("if (generation !== this.refreshGeneration) return;"));
assert(tracker.includes("this.passiveEffects = Array.isArray(passives) ? passives : [];"));
assert(tracker.includes("...visiblePassives.map((effect, index) => ({ effect, index, passive: true }))"));
assert(tracker.includes('if (effect.passiveSource) return "Permanent";'));
assert(tracker.includes('return `${turns} turn${turns === 1 ? "" : "s"}`;'));
assert(
  tracker.includes(
    '<div class="small-text">${escapeHtml(activeDuration(effect))}</div>',
  ),
);
assert(
  !tracker.includes(
    '${escapeHtml(effect.category || "Effect")} | ${escapeHtml(activeDuration(effect))}',
  ),
);

assert(sheet.includes("effectPickerEffects: loadCurrentEffectPickerDefinitions"));
assert(sheet.includes("loadEffectPickerGroup: loadCurrentEffectPickerGroup"));
assert(sheet.includes("hydratePickerEffect: hydrateCurrentPickerEffect"));
assert(sheet.includes('if (group === "conditions") {'));
assert(sheet.includes("window.PFEffectCatalog?.loadConditions?.() || []"));
assert(catalog.includes("function loadConditions()"));
assert(catalog.includes("conditionsPromise"));
assert(sheetHtml.includes('id="openPowersButton"'));
assert(
  sheet.includes(
    'openEffectWorkspace(event.currentTarget, { powersOnly: true })',
  ),
);
assert(sheet.includes("await effectTrackerInstance?.openPicker()"));
assert(sheet.includes("scheduleEffectPickerPrefetch();"));
assert(sheet.includes("invalidateEffectPickerDefinitions();"));
assert(sheet.includes("function effectPickerSourceSignature()"));
assert(sheet.includes("effectPickerSourceSignature(),"));
const enqueueSheetSave = sheet.slice(
  sheet.indexOf("function enqueueSheetSave"),
  sheet.indexOf("async function saveSheetSnapshot"),
);
assert(enqueueSheetSave.includes("scheduleEffectPickerPrefetch();"));
assert(!enqueueSheetSave.includes("invalidateEffectPickerDefinitions();"));
assert(sheet.includes("cancelIdleCallback?.(effectPickerPrefetchIdleCallback)"));
assert(sheet.includes("currentSpellPickerSources();"));
assert(!sheet.includes('void loadCurrentEffectPickerDefinitions().catch((error) =>'));
const saveRequest = sheet.slice(
  sheet.indexOf("function createSheetSaveRequest"),
  sheet.indexOf("\nfunction saveSheetNow", sheet.indexOf("function createSheetSaveRequest")),
);
assert(saveRequest.includes("refreshCurrentSpellPowerIndex();"));
assert(!saveRequest.includes("ensureCurrentPowerIndex"));
assert(sheet.includes("loadActiveEffects: async () => activeBuffs"));
assert(sheet.includes("loadPassiveEffects: async () => collectBridgePassiveEffectSources()"));
assert(!sheet.includes("...collectBridgePassiveEffectSources(),\n    ])"));
assert(sheet.includes("subscribeCharacterBuffRealtime();"));
assert(
  sheet.indexOf("effectTrackerModal.show();") <
    sheet.indexOf("await openEffectTrackerModal();"),
  "The Effects modal must open before tracker hydration starts.",
);

assert(map.includes("scheduleAccessibleEffectSourcePrefetch();"));
assert(map.includes("data-open-token-powers"));
assert(map.includes("function openMapPowers(tokenId)"));
assert(map.includes("return openMapEffects(tokenId, { powersOnly: true })"));
assert(map.includes("isGm || character.userId === currentUserId"));
assert(map.includes("indexedCharacterSpellSources(character);"));
assert(map.includes("const QUICK_EFFECT_BATCH_SIZE = 80;"));
assert(map.includes("rows.slice(0, quickEffectVisibleLimit)"));
assert(map.includes("data-effect-browser-more"));
assert(map.includes("mapEffectPrefetchGeneration += 1;"));
assert(map.includes("browser.loadingHtml(quickEffectGroup)"));
assert(map.includes("quickEffectLoading = true;"));
assert(map.includes("quickEffectLoading = false;"));
assert(map.includes("quickEffectLoadedGroups"));
assert(map.includes('await loadQuickEffectGroup("spells")'));
assert(map.includes("loadEffectPickerGroup: (group) => sourceEffectDefinitions(token, group)"));
assert(map.includes("hydratePickerEffect: (effect) => hydrateMapPickerEffect(token, effect)"));
const mapSourceDefinitions = map.slice(
  map.indexOf("async function sourceEffectDefinitions"),
  map.indexOf("async function hydrateMapPickerEffect"),
);
assert(mapSourceDefinitions.includes('if (group === "conditions")'));
assert(
  mapSourceDefinitions.indexOf('if (group === "conditions")') <
    mapSourceDefinitions.indexOf("authoredCatalogEffects()"),
);
assert(map.includes("window.PFEffectTracker?.preferOwnedPickerEffects?.(effects) || effects"));
assert(map.includes("loadPassiveEffects:"));
assert(
  map.indexOf("mapEffectsModal.show();") <
    map.indexOf("const activatableAbilities = [];"),
  "The map Effects modal must open before tracker setup.",
);
assert(map.includes("const activatableAbilities = [];"));
assert(map.includes("(await characterMapEffectSources(sourceCharacter)).passives || []"));
assert(map.includes("let mapSpellDetailCache = new Map();"));
assert(map.includes("function mapSpellDetailRevision(character = {})"));
assert(map.includes("async function mapSpellDetailsForEffect("));
assert(map.includes("if (mapSpellDetailCache.has(key)) return mapSpellDetailCache.get(key);"));
assert(map.includes("mapSpellDetailCache.set(key, pending);"));
assert(map.includes("await mapSpellDetailsForEffect(sourceToken, effect)"));
assert(sheet.includes('let sheetBridgePreparedKey = "";'));
assert(sheet.includes("preparedKey === sheetBridgePreparedKey"));
assert(sheet.includes("sheetBridgePreparedKey = preparedKey;"));
assert(sheet.includes("revision = \"\","));

console.log("Effect picker lifecycle and prefetch checks passed.");
