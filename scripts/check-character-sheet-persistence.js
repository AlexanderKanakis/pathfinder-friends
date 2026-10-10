const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sheetHtml = read("character-sheet.html");
const charactersPage = read("scripts", "pages", "characters.js");
const sheetPage = read("scripts", "pages", "character-sheet.js");
const sheetCss = read("css", "character-sheet.css");
const app = read("scripts", "app-supabase.js");

assert(
  (sheetHtml.match(/id="sheetStatus"/g) || []).length === 1,
  "The character sheet must expose exactly one visible save-status region.",
);
assert(
  charactersPage.includes("context: characterContextKey"),
  "Character-sheet links must carry their campaign context.",
);
assert(
  app.includes("async function loadCharacterSheetContext(sheetId)") &&
    app.includes("loadCharacterSheetContext,"),
  "Old character links must be able to recover their campaign from Supabase.",
);
assert(
  sheetPage.includes("let sheetSaveQueue = Promise.resolve()") &&
    sheetPage.includes("sheetSaveQueue = sheetSaveQueue.then(run, run)"),
  "Character-sheet saves must be serialized to prevent stale writes.",
);
assert(
  sheetPage.includes("void saveSheetNow(true)") &&
    sheetPage.includes("Refreshing now would discard them."),
  "Completed edits must save immediately and failed saves must be visible.",
);
assert(
  sheetPage.includes("const sharedDefinitionsPromise = Promise.all([") &&
    sheetPage.includes("const [savedBuffState, loot] = await Promise.all(["),
  "Rules data and sheet-side Supabase reads must load in parallel.",
);
assert(
  sheetPage.includes("PFClassData.loadClassesByNames(requestedNames)") &&
    !sheetPage.includes("PFClassData.loadAllClasses()"),
  "Character sheets must load only the selected class definitions.",
);
assert(
  sheetPage.includes("await restoreSheetWithClassDefinitions(saved.sheet)") &&
    sheetPage.includes("await loadClassDefinitions([select.value])"),
  "Saved sheets and newly selected classes must load their full class mechanics on demand.",
);
assert(
  sheetPage.includes("function buildSheet(deferDynamicSections = false)") &&
    sheetPage.includes(
      "buildSheet(Boolean(initialCharacter?.sheet) || isEnemySheetMode)",
    ),
  "Saved sheets must not render dynamic sections once before immediately restoring them.",
);
const recalculateSheetBody = sheetPage.slice(
  sheetPage.indexOf("function recalculateSheet()"),
  sheetPage.indexOf("function buffRefreshKey"),
);
assert(
  recalculateSheetBody.includes("applyClassProgressionStats();") &&
    !recalculateSheetBody.includes("updateClassDerivedViews();"),
  "Ordinary stat recalculation must not rebuild class, feat, and spell panels.",
);
assert(
  sheetPage.indexOf("void startPendingEffectChoicePolling();") >
    sheetPage.indexOf("await loadCurrentSheet(requestedCharacterId);"),
  "Noncritical effect-choice polling must start after the visible sheet load.",
);
assert(
  sheetPage.indexOf("if (contextFromUrl) PFApp.setSelectedContextKey(contextFromUrl)") <
    sheetPage.indexOf("const user = await PFApp.requireAuth()"),
  "URL campaign context must be restored before the navbar is initialized.",
);
const inventoryRenderer = sheetPage.slice(
  sheetPage.indexOf("function renderCharacterInventory"),
  sheetPage.indexOf("async function wearLootItem"),
);
assert(
  inventoryRenderer.includes('class="inventory-card-name-text"') &&
    !inventoryRenderer.includes("Equipped</div>"),
  "Inventory cards must keep the equipped state visual without a duplicate label.",
);
const inventoryActionCss = sheetCss.slice(
  sheetCss.indexOf(".inventory-count-actions"),
  sheetCss.indexOf(".inventory-count {"),
);
assert(
  sheetCss.includes(".inventory-card-name-text") &&
    sheetCss.includes("text-overflow: ellipsis") &&
    inventoryActionCss.includes("align-items: center") &&
    !inventoryActionCss.includes("flex-direction: column"),
  "Inventory names and controls must remain on one truncating row.",
);

[
  "hitPointsTotal",
  "initTotal",
  "acTotal",
  "bab",
  "cmbTotal",
  "cmdTotal",
].forEach((id) => {
  assert(
    new RegExp(`<output[^>]+id="${id}"`).test(sheetHtml),
    `${id} must be rendered as a calculated output, not a read-only input.`,
  );
});
assert(
  !/<(?:input|textarea)\b[^>]*\breadonly\b/i.test(sheetHtml) &&
    sheetPage.includes('<output id="${key}Total"') &&
    sheetPage.includes('<output id="${id}Total"') &&
    sheetPage.includes("function equipmentTextFieldMarkup("),
  "Non-editable sheet values must use the shared output presentation.",
);
assert(
  sheetCss.includes(".sheet-output-sm") &&
    sheetCss.includes("min-height: 31px") &&
    sheetCss.includes("height: 31px") &&
    sheetCss.includes("background-color: #202020") &&
    sheetCss.includes("border: 1px solid #555") &&
    sheetCss.includes("font-size: 0.875rem") &&
    sheetCss.includes("font-weight: 400"),
  "Calculated outputs must use the standard boxed control presentation without broad emphasis.",
);
assert(
  sheetCss.includes(".ability-total-input {") &&
    sheetCss.includes(".save-table .total-first-input {") &&
    sheetCss.includes("#hitPointsTotal") &&
    sheetCss.includes("#initTotal") &&
    !sheetCss.slice(
      sheetCss.indexOf(".buff-field {"),
      sheetCss.indexOf("}", sheetCss.indexOf(".buff-field {")) + 1,
    ).includes("font-weight"),
  "Only attribute totals, save totals, Total HP, and Initiative may retain enlarged bold output values.",
);
assert(
  sheetCss.includes("--sheet-stepper-width: 96px") &&
    sheetCss.includes("--sheet-stepper-button-width: 26px") &&
    sheetCss.includes(".item-number-stepper {") &&
    sheetCss.includes("width: min(100%, var(--sheet-stepper-width))"),
  "Every character-sheet stepper must use the shared BAB Misc dimensions.",
);
assert(
  sheetHtml.includes("character-level-field") &&
    sheetHtml.includes("character-level-stepper") &&
    sheetCss.includes(".character-level-stepper {") &&
    sheetCss.includes("max-width: none"),
  "Character Level must retain its original full-column stepper width.",
);
const sheetOutputCss = sheetCss.slice(
  sheetCss.indexOf(".sheet-output {"),
  sheetCss.indexOf(".sheet-output-sm {"),
);
assert(
  sheetOutputCss.includes("width: min(100%, 96px)") &&
    sheetOutputCss.includes("max-width: 96px"),
  "Calculated non-input boxes must match the 96px BAB Misc stepper width.",
);
assert(
  sheetCss.includes(".full-order-ac > .sheet-grid") &&
    sheetCss.includes("grid-template-columns: repeat(4, minmax(0, 1fr))"),
  "The AC summary and detail values must share the same column grid.",
);
const acPrimaryGrid = sheetHtml.slice(
  sheetHtml.indexOf('<div class="ac-primary-grid">'),
  sheetHtml.indexOf('<div class="sheet-grid">', sheetHtml.indexOf('<div class="ac-primary-grid">')),
);
assert(
    (sheetHtml.match(/id="acMisc"/g) || []).length === 1 &&
    acPrimaryGrid.includes('for="acBuff"') &&
    acPrimaryGrid.indexOf('for="acMisc"') > acPrimaryGrid.indexOf('for="acBuff"') &&
    sheetCss.includes(".sheet-number-field > .number-stepper-label") &&
    sheetCss.includes("text-align: left"),
  "AC Misc must sit beside AC Buff with its stepper aligned to the AC value grid.",
);

assert(
  (sheetHtml.match(/id="skillSearch"/g) || []).length === 1 &&
    (sheetHtml.match(/id="skillRows"/g) || []).length === 1 &&
    !sheetHtml.includes('data-sheet-info-tab="skills"') &&
    !sheetHtml.includes('data-sheet-info-panel="skills"') &&
    !sheetHtml.includes('id="skillSummaryRows"'),
  "The Character tab must own the only full skills editor without a duplicate Skills tab.",
);
assert(
  sheetHtml.indexOf('id="skillSearch"') >
    sheetHtml.indexOf('id="skillSummaryCollapse"') &&
    sheetHtml.indexOf('id="skillRows"') >
      sheetHtml.indexOf('id="skillSummaryCollapse"'),
  "The full skills editor must live inside the Character tab Skills accordion.",
);
assert(
  !sheetPage.includes("skillSummaryRows") &&
    sheetCss.includes("min-width: 540px"),
  "Embedded skills must use the shared editor and preserve every column on narrow screens.",
);
assert(
  !sheetHtml.includes("skill-table-wrap") &&
    !sheetHtml.includes("table table-dark table-sm align-middle compact-table skill-table") &&
    sheetCss.includes("--bs-table-bg: transparent") &&
    sheetCss.includes("border-bottom: 0") &&
    sheetPage.includes('class="skill-calc-row d-none"') &&
    sheetPage.includes('skillCalcRow.dataset.hasCalculation = "true"'),
  "The Skills table must be unframed, borderless, and omit unused calculation rows.",
);
assert(
  !sheetHtml.includes('class="maneuver-block"') &&
    !sheetCss.includes(".maneuver-block {") &&
    sheetCss.includes(".bab-grid,\n.maneuver-fields {") &&
    sheetCss.includes("grid-template-columns: repeat(3, minmax(85px, 1fr))"),
  "CMB and CMD must be unframed while BAB shares their aligned three-column layout.",
);

const weaponRenderer = sheetPage.slice(
  sheetPage.indexOf("function addWeapon"),
  sheetPage.indexOf("function addArmor"),
);
const weaponDisplayOrder = [
  'data-attack-total',
  'data-weapon-attack-calc',
  '<label>Damage</label>',
  'data-weapon-damage-calc',
  '<label>Critical</label>',
].map((marker) => weaponRenderer.indexOf(marker));
assert(
  weaponDisplayOrder.every((index) => index >= 0) &&
    weaponDisplayOrder.every(
      (index, position) => position === 0 || index > weaponDisplayOrder[position - 1],
    ),
  "Weapon cards must show attack details under attack, followed by damage and its details.",
);
const weaponSummaryCss = sheetCss.slice(
  sheetCss.indexOf(".weapon-summary {"),
  sheetCss.indexOf(".maneuver-grid {"),
);
assert(
  weaponSummaryCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") &&
    weaponSummaryCss.includes(".weapon-attack-summary {") &&
    weaponSummaryCss.includes("grid-column: 1 / -1"),
  "Weapon attack values and explanations must occupy the full row before damage.",
);
assert(
  sheetCss.includes(".weapon-summary [data-attack-total]") &&
    sheetCss.includes(".weapon-summary [data-damage-total]") &&
    sheetCss.includes("max-width: none"),
  "Weapon attack and damage totals must be full-width exceptions to compact calculated boxes.",
);
assert(
  sheetPage.includes(
    "const buffRows = formatBreakdown(items, total, showCalculations);",
  ) &&
    sheetPage.includes("includeAppliedEffects = true") &&
    sheetPage.includes("const normalItems = includeAppliedEffects") &&
    !sheetPage.includes(
      'const buffRows = showCalculations ? formatBreakdown(items, total) : "";',
    ),
  "Conditional calculations must remain visible when ordinary effect explanations are hidden.",
);

console.log("Character sheet persistence checks passed.");
