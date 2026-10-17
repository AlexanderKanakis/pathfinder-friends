(function (root) {
  const VERSION = 1;
  const catalogSignatureCache = new WeakMap();
  const PATCH_FIELDS = new Set([
    "source",
    "bonuses",
    "durationConfig",
    "auraConfig",
    "branches",
    "decisionOwner",
    "contributionOptions",
    "emittedAuras",
    "activationGroup",
    "abilityFamily",
    "resourcePool",
    "trackActive",
    "abilityContext",
    "attributeScaleContext",
    "spellCalculations",
    "description",
    "detailUrl",
    "detailData",
  ]);

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function normalized(value) {
    return String(value || "").trim().toLowerCase();
  }

  function same(left, right) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
  }

  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${value.length}:${(hash >>> 0).toString(36)}`;
  }

  function catalogSignature(catalog = []) {
    if (catalogSignatureCache.has(catalog)) return catalogSignatureCache.get(catalog);
    const fields = mechanicFields();
    const value = catalog.map((effect) => {
      const entry = {
        id: effect.id || "",
        category: effect.category || "",
        name: effect.name || "",
        source: effect.source || "",
      };
      fields.forEach((key) => {
        if (effect[key] !== undefined) entry[key] = effect[key];
      });
      return entry;
    });
    const signature = hashText(JSON.stringify(value));
    catalogSignatureCache.set(catalog, signature);
    return signature;
  }

  function mechanicFields() {
    return new Set([
      ...PATCH_FIELDS,
      ...(root.PFEffectMechanics?.extraKeys?.() || []),
    ]);
  }

  function catalogMatch(effect, catalog = []) {
    const category = normalized(effect.category);
    const name = normalized(effect.name);
    const source = normalized(effect.source);
    const candidates = catalog.filter(
      (entry) =>
        normalized(entry.category) === category && normalized(entry.name) === name,
    );
    if (!candidates.length) return null;
    return (
      candidates.find((entry) => normalized(entry.source) === source) ||
      candidates[0]
    );
  }

  function patchFrom(base, effect) {
    const patch = {};
    mechanicFields().forEach((key) => {
      if (effect[key] === undefined || same(effect[key], base?.[key])) return;
      patch[key] = clone(effect[key]);
    });
    return patch;
  }

  function effectReference(effect, catalog = [], passive = false) {
    if (effect?.ownedSpell) {
      return {
        kind: "spell",
        id: String(effect.id || ""),
        name: String(effect.name || effect.spell?.name || "Spell"),
        spellMeta: clone(effect.spellMeta || {}),
        attributeScaleContext: clone(effect.attributeScaleContext || null),
        passive,
      };
    }
    if (effect?.fromAbility && normalized(effect.category) === "class feature") {
      return {
        kind: "class-ability",
        id: String(effect.id || ""),
        name: String(effect.name || "Class Feature"),
        source: String(effect.source || ""),
        passive,
      };
    }
    const base = catalogMatch(effect || {}, catalog);
    if (base) {
      return {
        kind: "catalog",
        catalogId: String(base.id || ""),
        category: String(base.category || effect.category || "Effect"),
        name: String(base.name || effect.name || "Effect"),
        source: String(base.source || effect.source || ""),
        patch: patchFrom(base, effect || {}),
        passive,
      };
    }
    // User-authored inventory powers do not have a canonical catalog row to
    // reference. Preserve only those exceptional payloads so the derived
    // index never drops a power while canonical sources remain references.
    return {
      kind: "custom",
      id: String(effect?.id || ""),
      value: clone(effect || {}),
      passive,
    };
  }

  function strictSpellSignature(references = []) {
    const spells = (Array.isArray(references) ? references : [])
      .filter(
        (reference) =>
          reference?.kind === "spell" &&
          String(reference.spellMeta?.kind || "spell") !== "sla",
      )
      .map((reference) => [
        normalized(reference.spellMeta?.className),
        Number(reference.spellMeta?.level || 0),
        normalized(reference.spellMeta?.bucket),
        normalized(reference.name),
      ])
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    return hashText(JSON.stringify(spells));
  }

  function build({ signature = "", activatable = [], spells = [], passives = [], catalog = [] } = {}) {
    const spellReferences = spells.map((effect) => effectReference(effect, catalog));
    return {
      version: VERSION,
      signature: String(signature || ""),
      spellSignature: strictSpellSignature(spellReferences),
      catalogSignature: catalogSignature(catalog),
      generatedAt: new Date().toISOString(),
      activatable: activatable.map((effect) => effectReference(effect, catalog)),
      spells: spellReferences,
      passives: passives.map((effect) => effectReference(effect, catalog, true)),
    };
  }

  function mergePatch(base, patch) {
    return { ...clone(base || {}), ...clone(patch || {}) };
  }

  function findCatalogReference(reference, catalog = []) {
    return (
      catalog.find(
        (entry) =>
          reference.catalogId && String(entry.id || "") === reference.catalogId,
      ) ||
      catalogMatch(reference, catalog)
    );
  }

  function spellEffect(spell = {}, reference = {}) {
    const metadata = reference.spellMeta || {};
    const mechanics = root.PFEffectMechanics?.activeMechanics?.(spell, {
      activeOnly: true,
    }) || { effects: [] };
    const effect = {
      id:
        reference.id ||
        `spell:${metadata.kind || "spell"}:${metadata.className || ""}:${metadata.level ?? ""}:${spell.name || reference.name || "spell"}`,
      name: spell.name || reference.name || "Spell",
      category: "Spell",
      source:
        metadata.kind === "sla"
          ? `${metadata.source || "Spell-Like Ability"} | ${metadata.frequency || "At will"}`
          : metadata.className || "Spell",
      bonuses: mechanics.effects || [],
      durationConfig: mechanics.durationConfig || null,
      auraConfig: mechanics.auraConfig || null,
      ...(root.PFEffectMechanics?.hasBranches?.(mechanics)
        ? { branches: mechanics.branches }
        : {}),
      duration: root.PFEffectMeta?.durationLabel
        ? root.PFEffectMeta.durationLabel(mechanics.durationConfig || {})
        : "variable",
      ownedSpell: true,
      spellMeta: clone(metadata),
      spell,
      attributeScaleContext: clone(reference.attributeScaleContext || null),
      ...root.PFEffectMechanics?.copyActivationConfig?.(mechanics),
    };
    (root.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
      if (Array.isArray(mechanics[key]) && mechanics[key].length)
        effect[key] = mechanics[key];
    });
    return effect;
  }

  function resolveReferences(
    references = [],
    { catalog = [], classAbilities = [], spellDefinitions = [] } = {},
  ) {
    const classesById = new Map(
      classAbilities.map((effect) => [String(effect.id || ""), effect]),
    );
    const spellsByName = new Map(
      spellDefinitions.map((spell) => [normalized(spell.name), spell]),
    );
    return references
      .map((reference) => {
        if (reference.kind === "class-ability") {
          return (
            classesById.get(reference.id) ||
            classAbilities.find(
              (effect) =>
                normalized(effect.name) === normalized(reference.name) &&
                normalized(effect.source).startsWith(normalized(reference.source)),
            ) ||
            null
          );
        }
        if (reference.kind === "spell") {
          const spell = spellsByName.get(normalized(reference.name)) || {
            name: reference.name,
          };
          return spellEffect(spell, reference);
        }
        if (reference.kind === "catalog") {
          const base = findCatalogReference(reference, catalog);
          return base ? mergePatch(base, reference.patch) : null;
        }
        if (reference.kind === "custom") return clone(reference.value);
        return null;
      })
      .filter(Boolean);
  }

  function resolve(index, context = {}) {
    if (!isUsable(index, null, context.catalog)) return null;
    return {
      activatable: resolveReferences(index.activatable, context),
      spells: resolveReferences(index.spells, context),
      passives: resolveReferences(index.passives, context),
    };
  }

  function resolveSpells(index) {
    if (!isUsable(index)) return [];
    return resolveReferences(index.spells, { spellDefinitions: [] });
  }

  function spellsFromSheet(sheet = {}) {
    const classNames = new Map();
    (Array.isArray(sheet.classProgression) ? sheet.classProgression : []).forEach(
      (row) => {
        if (!row?.className) return;
        classNames.set(
          String(row.className).replace(/[^a-z0-9]+/gi, "_"),
          row.className,
        );
      },
    );
    const results = [];
    const seen = new Set();
    Object.entries(sheet.spells || {}).forEach(([classKey, state]) => {
      const className = classNames.get(classKey) || classKey.replaceAll("_", " ");
      ["known", "book", "prepared"].forEach((bucket) => {
        Object.entries(state?.[bucket] || {}).forEach(([level, names]) => {
          (Array.isArray(names) ? names : []).filter(Boolean).forEach((name) => {
            const key = `${classKey}:${bucket}:${level}:${normalized(name)}`;
            if (seen.has(key)) return;
            seen.add(key);
            results.push(
              spellEffect(
                { name },
                {
                  kind: "spell",
                  name,
                  spellMeta: {
                    kind: "spell",
                    className,
                    level: Number(level),
                    bucket,
                  },
                },
              ),
            );
          });
        });
      });
    });
    return results;
  }

  function isUsable(index, signature = null, catalog = null) {
    return Boolean(
      index &&
        Number(index.version) === VERSION &&
        Array.isArray(index.activatable) &&
        Array.isArray(index.spells) &&
        Array.isArray(index.passives) &&
        (signature === null || String(index.signature || "") === String(signature)) &&
        (catalog === null ||
          String(index.catalogSignature || "") === catalogSignature(catalog)),
    );
  }

  function isUsableForSheet(index, sheet = {}) {
    if (!isUsable(index) || !index.spellSignature) return false;
    const sheetReferences = spellsFromSheet(sheet).map((effect) =>
      effectReference(effect),
    );
    return index.spellSignature === strictSpellSignature(sheetReferences);
  }

  root.PFPowerIndex = {
    VERSION,
    build,
    resolve,
    resolveSpells,
    spellsFromSheet,
    isUsable,
    isUsableForSheet,
    catalogSignature,
  };
})(window);
