// Shared read-side loader for the core Pathfinder item catalogs
// (weapons, armor & shields, mundane items, wondrous items) -- the
// item-editor.html equivalent of scripts/class-data.js. Every page that
// needs these (bag-of-holding, character-sheet, item-editor) fetches
// through here instead of each hand-rolling its own fetch+cache.
//
// Unlike class data (171 small per-class files + an index), each of
// these catalogs is one big JSON array, so there's no per-entry file
// to resolve -- just fetch the array and cache it in memory.
(function () {
  const CATALOGS = {
    weapons: { file: "data/weapons.json", label: "Weapons" },
    armorShields: { file: "data/armor-shields.json", label: "Armor & Shields" },
    mundaneItems: { file: "data/mundane-items.json", label: "Mundane Items" },
    wondrousItems: { file: "data/wondrous.json", label: "Wondrous Items" },
  };

  const cache = new Map();

  async function loadCatalog(key, { cache: cachePolicy = "no-cache" } = {}) {
    const catalog = CATALOGS[key];
    if (!catalog) throw new Error(`Unknown item catalog: ${key}`);
    if (cache.has(key)) return cache.get(key);
    let items = [];
    try {
      const response = await fetch(`./${catalog.file}`, { cache: cachePolicy });
      if (response.ok) {
        const data = await response.json();
        items = Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.info(`No ${catalog.file} found yet.`, error);
    }
    cache.set(key, items);
    return items;
  }

  function invalidate(key) {
    if (key) cache.delete(key);
    else cache.clear();
  }

  window.PFItemData = {
    CATALOGS,
    loadCatalog,
    loadWeapons: () => loadCatalog("weapons"),
    loadArmorShields: () => loadCatalog("armorShields"),
    loadMundaneItems: () => loadCatalog("mundaneItems"),
    loadWondrousItems: () => loadCatalog("wondrousItems"),
    invalidate,
  };
})();
