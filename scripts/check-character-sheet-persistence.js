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

console.log("Character sheet persistence checks passed.");
