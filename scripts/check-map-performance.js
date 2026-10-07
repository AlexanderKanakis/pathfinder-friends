const fs = require("fs");

const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");

function requireText(source, text, message) {
  if (!source.includes(text)) throw new Error(message);
}

function rejectText(source, text, message) {
  if (source.includes(text)) throw new Error(message);
}

requireText(
  map,
  "const refreshed = await PFApp.loadContextCharacters(mapContextKey);",
  "Map character refreshes must stay on the bulk context query.",
);
rejectText(
  map,
  "ensureMapCharacterCalculatedSummary",
  "Ordinary map refreshes must not recalculate every character sheet.",
);
rejectText(
  map,
  "ensureMapEnemyCalculatedSummary",
  "Ordinary map refreshes must not recalculate every enemy sheet.",
);
requireText(
  map,
  "authoredCatalogEffectsPromise = loadAuthoredCatalogEffects()",
  "The authored effect catalog must be cached.",
);
requireText(
  map,
  "scheduleOutOfRangeAuraCleanup(item.id)",
  "D-pad movement must debounce and scope aura cleanup.",
);
requireText(
  map,
  "void recalculateCharacterSheetFromMap(\n      token.characterId,\n      character,\n      nextActiveBuffs,",
  "Map effect application must not wait for character recalculation.",
);
requireText(
  map,
  "bridge.recalculateCharacterSnapshot",
  "Map effect recalculation must reuse the in-memory character snapshot.",
);
requireText(
  map,
  "await PFApp.updateCharacterEffectState?.(",
  "The effect tracker must use the atomic character-effect update gateway.",
);
rejectText(
  map,
  "await recalculateCharacterSheetFromMap(token.characterId);\r\n        const character",
  "The effect tracker must not recalculate and then reload the character.",
);
requireText(
  map,
  "readyTargets.map(async ({ token, effect })",
  "Resolved multi-target effects must apply concurrently.",
);
requireText(
  sheet,
  "async function mapEffectSourcesForCharacter",
  "The character-sheet bridge must expose the combined map source gateway.",
);
requireText(
  sheet,
  "spells: await collectBridgeOwnedSpellEffects()",
  "The combined bridge must resolve owned spells before returning.",
);
requireText(
  sheet,
  "async function recalculateAndSaveCharacterSnapshot",
  "The bridge must support snapshot-based character recalculation.",
);
requireText(
  sheet,
  "void queueSheetBridgeSummarySave(async () =>",
  "Calculated-summary persistence must not block the local result.",
);

console.log("Map performance guards passed.");
