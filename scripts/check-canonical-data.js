const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const authoredCheck = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "migrate-canonical-data.js")],
  { cwd: root, encoding: "utf8" },
);
assert.strictEqual(
  authoredCheck.status,
  0,
  authoredCheck.stdout || authoredCheck.stderr || "Authored JSON is not canonical.",
);

const runtimeFiles = [
  "scripts/effect-mechanics.js",
  "modals/effect-duration-editor.js",
  "scripts/app-supabase.js",
  "scripts/pages/character-sheet.js",
  "scripts/race-data.js",
];
const runtime = runtimeFiles
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
for (const legacyMarker of [
  "activatable === true",
  "attributeModifierSource",
  "abilityBonuses",
  "sharedAmongTargets",
  "hydrateSheetArmorRules",
  "loadArmorRulesCatalog",
  "legacyCategoryReplacementOperations",
  "promoteLegacyAdditionsToReplacements",
  "legacyState?.characterId",
  "row.details?.activeMechanics",
]) {
  assert(
    !runtime.includes(legacyMarker),
    `Runtime legacy compatibility remains: ${legacyMarker}`,
  );
}

const migrationPath = path.join(
  root,
  "supabase/migrations/20261007000100_canonicalize_legacy_runtime_data.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
for (const required of [
  "_pf_canonicalize_legacy_json",
  "_pf_canonicalize_sheet",
  "_pf_hydrate_armor_array",
  "active_buffs->>'characterId'",
  "details.effectMechanics",
  'drop policy if exists "members can create loot"',
  'drop policy if exists "members can update loot"',
  'create policy "members can create loot"',
  'create policy "members can update loot"',
  "drop column if exists effects",
  "drop column if exists spell_like_abilities",
]) {
  assert(migration.includes(required), `Migration is missing ${required}`);
}
assert(
  !/drop\s+column[\s\S]{0,120}\bcascade\b/i.test(migration),
  "Canonical migration must not cascade legacy column removal.",
);

const schema = fs.readFileSync(path.join(root, "supabase-schema.sql"), "utf8");
const lootPolicyStart = schema.indexOf(
  'drop policy if exists "members can create loot"',
);
const lootPolicyEnd = schema.indexOf(
  'drop policy if exists "members can delete loot"',
  lootPolicyStart,
);
assert(lootPolicyStart >= 0 && lootPolicyEnd > lootPolicyStart);
const lootWritePolicies = schema.slice(lootPolicyStart, lootPolicyEnd);
assert(
  !lootWritePolicies.includes("jsonb_typeof(effects)"),
  "Loot write policies still depend on the retired effects column.",
);

const armorPayload = migration.match(/\$armor\$\s*([\s\S]*?)\s*\$armor\$/)?.[1];
assert(armorPayload, "Migration armor rules payload is missing.");
const migratedArmorKeys = new Set(
  JSON.parse(armorPayload).map((rule) => rule.rule_key),
);
const armorCatalog = JSON.parse(
  fs.readFileSync(path.join(root, "data", "armor-shields.json"), "utf8"),
);
const armorRuleKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/^\s*\+\d+\s+/, "")
    .replace(/\s+armor\s*$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
armorCatalog
  .filter((item) => item.details?.armorGroup !== "Extras")
  .forEach((item) =>
    assert(
      migratedArmorKeys.has(armorRuleKey(item.name)),
      `Migration armor rules are missing ${item.name}`,
    ),
  );

console.log("Canonical authored data, runtime gateways, and database migration checks passed.");
