const fs = require("fs");
const path = require("path");

const classDir = path.join(__dirname, "..", "data", "classes");
const poolDir = path.join(__dirname, "..", "data", "class-feature-pools");
const sheetPage = fs.readFileSync(
  path.join(__dirname, "pages", "character-sheet.js"),
  "utf8",
);
const files = fs
  .readdirSync(classDir)
  .filter((file) => file.endsWith(".json") && file !== "index.json");

let poolRefs = 0;
const poolIndex = JSON.parse(
  fs.readFileSync(path.join(poolDir, "index.json"), "utf8"),
);
const catalogs = new Map(
  poolIndex.map((entry) => {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(poolDir, entry.file), "utf8"),
    );
    if (catalog.id !== entry.id)
      throw new Error(`${entry.file}: catalog id does not match index.`);
    if (!catalog.name || !Array.isArray(catalog.options))
      throw new Error(`${entry.file}: catalog requires a name and options.`);
    const names = new Set();
    catalog.options.forEach((option) => {
      const name = String(option?.name || "").trim().toLowerCase();
      if (!name) throw new Error(`${entry.file}: option has no name.`);
      if (names.has(name))
        throw new Error(`${entry.file}: duplicate option ${option.name}.`);
      names.add(name);
    });
    return [entry.id, catalog];
  }),
);
if (catalogs.size !== poolIndex.length)
  throw new Error("Duplicate catalog ids in class feature pool index.");
const usedCatalogs = new Set();

files.forEach((file) => {
  const definition = JSON.parse(
    fs.readFileSync(path.join(classDir, file), "utf8"),
  );
  const attachments = definition.classFeaturePools || {};
  const used = new Set();

  (definition.levelProgression || definition.levels || []).forEach((level) => {
    (level.classFeatures || level.special || []).forEach((feature) => {
      if (!feature || typeof feature !== "object") return;
      if (Array.isArray(feature.pools) || Array.isArray(feature.choicePools)) {
        throw new Error(`${file}: ${feature.name} contains an inline pool.`);
      }
      (feature.poolRefs || []).forEach((poolId) => {
        poolRefs += 1;
        used.add(poolId);
        const pool = attachments[poolId];
        if (!pool)
          throw new Error(`${file}: missing classFeaturePools.${poolId}.`);
        if (Array.isArray(pool.options))
          throw new Error(`${file}: classFeaturePools.${poolId} embeds options.`);
        if (!pool.catalog || !catalogs.has(pool.catalog))
          throw new Error(`${file}: classFeaturePools.${poolId} has an invalid catalog.`);
        usedCatalogs.add(pool.catalog);
      });
    });
  });

  Object.keys(attachments).forEach((poolId) => {
    if (!used.has(poolId))
      throw new Error(`${file}: unused classFeaturePools.${poolId}.`);
  });
});

if (!poolRefs || !catalogs.size) throw new Error("No class feature pools found.");
catalogs.forEach((catalog, catalogId) => {
  if (!usedCatalogs.has(catalogId))
    throw new Error(`${catalogId}: catalog is not attached to a class.`);
});
const renderClassFeatures = sheetPage.slice(
  sheetPage.indexOf("function renderClassFeatures()"),
  sheetPage.indexOf("function renderSpellProgression"),
);
if (
  !renderClassFeatures.includes("...feature,") ||
  renderClassFeatures.includes("pools: featurePools(feature, definition)")
) {
  throw new Error(
    "Character-sheet class feature rendering must preserve the canonical feature fields used by shared pickers.",
  );
}
console.log(
  `Class feature pool catalogs verified (${catalogs.size} standalone catalogs, ${poolRefs} references).`,
);
