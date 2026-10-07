(function (root) {
  let catalogPromise = null;

  function catalogEffectFromMechanics(entry, mechanics, { category, source, id, variant = "" }) {
    const effect = {
      id,
      name: entry.name || entry.title || entry.label || "Effect",
      category,
      source: [source, variant].filter(Boolean).join(" | "),
      bonuses: mechanics.effects || [],
      durationConfig: mechanics.durationConfig || entry.durationConfig || null,
      auraConfig: mechanics.auraConfig || entry.auraConfig || null,
      ...(root.PFEffectMechanics?.hasBranches?.(mechanics)
        ? { branches: mechanics.branches }
        : {}),
      duration: root.PFEffectMeta?.durationLabel
        ? root.PFEffectMeta.durationLabel(mechanics.durationConfig || entry.durationConfig || {})
        : "variable",
      description: entry.description || entry.benefit || entry.summary || entry.details?.description || "",
      detailUrl: entry.link || entry.url || entry.sourceUrl || "",
      detailData: entry.details && typeof entry.details === "object" ? entry.details : {},
      catalogEffect: true,
    };
    (root.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
      if (Array.isArray(mechanics[key]) && mechanics[key].length) effect[key] = mechanics[key];
    });
    return effect;
  }

  function collect(rootValue, { category, source, idPrefix, directAsActive = false }) {
    const results = [];
    const seenObjects = new WeakSet();
    const mechanicKeys = new Set([
      "activeMechanics",
      "passiveMechanics",
      "effects",
      "branches",
      ...(root.PFEffectMechanics?.extraKeys?.() || []),
    ]);
    let sequence = 0;
    const add = (entry, mechanics, entrySource, variant) => {
      if (!mechanics || !root.PFEffectMechanics?.hasAnyMechanics?.(mechanics)) return;
      const name = String(entry.name || entry.title || entry.label || "").trim();
      if (!name) return;
      results.push(catalogEffectFromMechanics(entry, mechanics, {
        category,
        source: entrySource || source,
        id: idPrefix + ":" + sequence++ + ":" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        variant,
      }));
    };
    const walk = (value, inheritedSource = source) => {
      if (!value || typeof value !== "object" || seenObjects.has(value)) return;
      seenObjects.add(value);
      if (Array.isArray(value)) {
        value.forEach((entry) => walk(entry, inheritedSource));
        return;
      }
      const entrySource = String(value.name || value.title || value.label || "").trim() || inheritedSource;
      const active = root.PFEffectMechanics?.activeMechanics?.(value, { activeOnly: directAsActive });
      const passive = directAsActive ? null : root.PFEffectMechanics?.passiveMechanics?.(value);
      const hasActive = Boolean(active && root.PFEffectMechanics?.hasAnyMechanics?.(active));
      const hasPassive = Boolean(passive && root.PFEffectMechanics?.hasAnyMechanics?.(passive));
      add(value, active, inheritedSource, hasPassive ? "Active" : "");
      add(value, passive, inheritedSource, hasActive ? "Passive" : "");
      Object.entries(value).forEach(([key, child]) => {
        if (!mechanicKeys.has(key)) walk(child, entrySource);
      });
    };
    walk(rootValue);
    return results;
  }

  async function loadCatalog() {
    const safeLoad = async (loader, fallback) => {
      try { return (await loader?.()) ?? fallback; }
      catch (error) { console.warn("Could not load an authored effect catalog.", error); return fallback; }
    };
    const itemCatalogKeys = Object.keys(root.PFItemData?.CATALOGS || {});
    const [conditions, classes, races, feats, spells, itemCatalogs] = await Promise.all([
      safeLoad(() => root.PFApp?.loadConditionDefinitions?.(), []),
      safeLoad(() => root.PFClassData?.loadAllClasses?.(), []),
      safeLoad(() => root.PFRaceData?.loadRaces?.(), { races: [] }),
      safeLoad(() => root.PFFeatData?.loadFeats?.(), { feats: [] }),
      safeLoad(() => root.PFSpellData?.loadSpells?.(), []),
      Promise.all(itemCatalogKeys.map((key) => safeLoad(() => root.PFItemData.loadCatalog(key), []))),
    ]);
    const authored = [
      ...(conditions || []).map((condition) => ({ ...condition, catalogEffect: true })),
      ...collect(classes, { category: "Class Ability", source: "Class", idPrefix: "class" }),
      ...collect(races?.races || races, { category: "Racial Trait", source: "Race", idPrefix: "race" }),
      ...collect(feats?.feats || feats, { category: "Feat", source: "Feat", idPrefix: "feat" }),
      ...collect(spells, { category: "Spell", source: "Spell", idPrefix: "spell", directAsActive: true }),
      ...collect(itemCatalogs, { category: "Item", source: "Item", idPrefix: "item" }),
    ];
    const unique = new Map();
    authored.forEach((effect) => {
      const key = [effect.category, effect.name, effect.source]
        .map((part) => String(part || "").trim().toLowerCase()).join("::");
      if (!unique.has(key)) unique.set(key, effect);
    });
    return [...unique.values()];
  }

  root.PFEffectCatalog = {
    load() {
      if (!catalogPromise) catalogPromise = loadCatalog().catch((error) => { catalogPromise = null; throw error; });
      return catalogPromise;
    },
    clear() { catalogPromise = null; },
  };
})(window);
