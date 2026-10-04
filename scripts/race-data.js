(function () {
  const DATA_PATH = "data/races.json";
  let raceDataCache = null;

  function slugify(text = "") {
    return (
      String(text || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "race"
    );
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function traitRelationKey(value = "") {
    return (
      String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\b(?:racial\s+)?traits?\b/g, "")
        .replace(/^(?:and|or|the|a|an|one or more of the)\s+/i, "")
        .replace(/[^a-z0-9]+/g, "") || ""
    );
  }

  function normalizedRelationText(value = "") {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\b(?:racial\s+)?traits?\b/g, "")
      .replace(/^(?:and|or|the|a|an|one or more of the)\s+/i, "")
      .replace(/\s+/g, " ")
      .replace(/[.;:,]+$/g, "")
      .trim();
  }

  function relationWords(value = "") {
    const ignored = new Set([
      "a",
      "an",
      "and",
      "bonus",
      "bonuses",
      "check",
      "checks",
      "from",
      "of",
      "on",
      "or",
      "racial",
      "the",
      "trait",
      "traits",
      "with",
    ]);
    return normalizedRelationText(value)
      .split(/[^a-z0-9]+/i)
      .map((word) => word.trim())
      .map((word) => word.replace(/s$/i, ""))
      .filter((word) => word.length > 2 && !ignored.has(word));
  }

  function canonicalTraitTarget(target = "", standardTraits = [], options = {}) {
    const normalized = normalizedRelationText(target);
    const targetKey = traitRelationKey(normalized);
    if (!targetKey) return "";

    const scored = (standardTraits || [])
      .map((trait) => {
        const name = trait.name || trait.trait || "";
        const nameText = normalizedRelationText(name);
        const nameKey = traitRelationKey(name);
        if (!nameKey) return null;
        const description = normalizedRelationText(trait.description || "");
        let score = 0;
        if (targetKey === nameKey) score += 1000;
        if (normalized === nameText) score += 900;
        if (normalized.includes(nameText)) score += 850;
        if (targetKey.endsWith(nameKey) || targetKey.startsWith(nameKey)) {
          score += 600;
        }
        if (nameKey.includes(targetKey) && targetKey.length >= 5) {
          score += 500;
        }
        const targetWords = relationWords(normalized);
        const nameWords = relationWords(nameText);
        const descriptionWords = relationWords(description);
        const wordHits = nameWords.filter((word) => targetWords.includes(word));
        if (nameWords.length && wordHits.length === nameWords.length) {
          score += 420;
        } else {
          score += wordHits.length * 90;
        }
        const descriptionHits = targetWords.filter((word) =>
          descriptionWords.includes(word),
        );
        if (
          targetWords.length &&
          descriptionHits.length === targetWords.length
        ) {
          score += 300;
        }
        if (normalized.length >= 8 && description.includes(normalized)) {
          score += 350;
        }
        return score ? { name, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored[0]?.score >= 90) return scored[0].name;
    return options.strict ? "" : normalized;
  }

  function canonicalTraitTargets(targets = [], standardTraits = [], options = {}) {
    const seen = new Set();
    return (Array.isArray(targets) ? targets : [])
      .map((target) => canonicalTraitTarget(target, standardTraits, options))
      .filter(Boolean)
      .filter((target) => {
        const key = traitRelationKey(target);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  const TRAIT_MECHANIC_KEYS =
    window.PFEffectMechanics?.mechanicKeys?.() || [
      "effects",
      "damageReduction",
      "spellResistance",
      "immunities",
      "applyConditions",
      "classSkillGrants",
      "extraRanksPerLevel",
      "featGrants",
      "sizeChanges",
      "spellLikeAbilities",
      "casterLevelBonuses",
      "spellDcBonuses",
      "effectiveAttributeBonuses",
      "grantDomains",
      "generatedEquipment",
      "conditionalVariables",
    ];

  function hasTraitOverrideMechanics(override = {}) {
    return (
      [override.mechanicOverrides, override.activeMechanicOverrides].some(
        (group) =>
          TRAIT_MECHANIC_KEYS.some((key) =>
            normalizedMechanicOperations(group?.[key]).some(
              (operation) =>
                operation.action === "remove" ||
                (["add", "replace"].includes(operation.action) &&
                  operation.value),
            ),
          ),
      ) || Boolean(override.activeDurationConfig)
    );
  }

  function traitMechanicGroup(trait = {}, group = "passive") {
    const mechanics = window.PFEffectMechanics;
    if (group === "active") {
      return (
        mechanics?.activeMechanics?.(trait) ||
        (trait.activatable ? trait : trait.activeMechanics || {})
      );
    }
    return (
      mechanics?.passiveMechanics?.(trait) ||
      (trait.activatable ? {} : trait)
    );
  }

  function stableMechanicKey(value) {
    return JSON.stringify(stableMechanicValue(value));
  }

  function stableMechanicValue(value) {
    if (Array.isArray(value)) return value.map(stableMechanicValue);
    if (!value || typeof value !== "object") return value ?? null;
    const sorted = {};
    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = stableMechanicValue(value[key]);
      });
    return sorted;
  }

  function normalizedMechanicOperations(operations = []) {
    const seen = new Set();
    return (Array.isArray(operations) ? operations : [])
      .map((operation) => {
        const action = ["replace", "remove", "add"].includes(operation?.action)
          ? operation.action
          : "";
        if (!action) return null;
        const normalized = { action };
        if (action !== "add") {
          normalized.targetIndex = Number.isFinite(Number(operation.targetIndex))
            ? Number(operation.targetIndex)
            : 0;
          normalized.targetKey = operation.targetKey || "";
        }
        if (action !== "remove") normalized.value = operation.value || null;
        if (action === "add" && operation.preserveAsAddition)
          normalized.preserveAsAddition = true;
        if (action !== "remove" && !normalized.value) return null;
        return normalized;
      })
      .filter(Boolean)
      .filter((operation) => {
        const key = [
          operation.action,
          operation.targetIndex ?? "",
          operation.targetKey || "",
          stableMechanicKey(operation.value),
        ].join(":");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function promoteLegacyAdditionsToReplacements(
    operations = [],
    standardRows = [],
  ) {
    if (!standardRows.length) return operations;
    if (
      operations.some(
        (operation) =>
          operation.action === "replace" || operation.action === "remove",
      )
    )
      return operations;
    let targetIndex = 0;
    return operations.map((operation) => {
      if (
        operation.action !== "add" ||
        operation.preserveAsAddition ||
        targetIndex >= standardRows.length
      )
        return operation;
      const index = targetIndex++;
      return {
        action: "replace",
        targetIndex: index,
        targetKey: stableMechanicKey(standardRows[index]),
        value: operation.value,
      };
    });
  }

  function legacyCategoryReplacementOperations(
    key = "",
    override = {},
    standardTrait = {},
  ) {
    if (!Array.isArray(override[key]) || !override[key].length) return [];
    const standardRows = Array.isArray(standardTrait[key])
      ? standardTrait[key]
      : [];
    return [
      ...standardRows.map((row, targetIndex) => ({
        action: "remove",
        targetIndex,
        targetKey: stableMechanicKey(row),
      })),
      ...override[key].map((value) => ({
        action: "add",
        value,
      })),
    ];
  }

  function canonicalizeModifiedTraitOverrides(
    overrides = [],
    standardTraits = [],
  ) {
    const seen = new Set();
    return (Array.isArray(overrides) ? overrides : [])
      .map((override) => {
        const trait = canonicalTraitTarget(
          override?.trait || override?.name || "",
          standardTraits,
        );
        if (!trait) return null;
        const standardTrait = (standardTraits || []).find(
          (entry) => traitRelationKey(entry.name || entry.trait || "") === traitRelationKey(trait),
        );
        const normalized = {
          trait,
          mechanicOverrides: {},
          activeMechanicOverrides: {},
        };
        const passiveMechanics = traitMechanicGroup(standardTrait, "passive");
        const activeMechanics = traitMechanicGroup(standardTrait, "active");
        TRAIT_MECHANIC_KEYS.forEach((key) => {
          const passiveRows = Array.isArray(passiveMechanics?.[key])
            ? passiveMechanics[key]
            : [];
          const activeRows = Array.isArray(activeMechanics?.[key])
            ? activeMechanics[key]
            : [];
          const legacyOperations = [
            ...normalizedMechanicOperations(override.mechanicOverrides?.[key]),
            ...legacyCategoryReplacementOperations(key, override, standardTrait),
          ];
          const legacyTargetsActive =
            standardTrait?.activatable === true &&
            !standardTrait?.activeMechanics &&
            !passiveRows.length &&
            activeRows.length;
          const passiveOperations = promoteLegacyAdditionsToReplacements(
            legacyTargetsActive ? [] : legacyOperations,
            passiveRows,
          );
          const activeOperations = promoteLegacyAdditionsToReplacements(
            [
              ...normalizedMechanicOperations(
                override.activeMechanicOverrides?.[key],
              ),
              ...(legacyTargetsActive ? legacyOperations : []),
            ],
            activeRows,
          );
          if (passiveOperations.length)
            normalized.mechanicOverrides[key] = passiveOperations;
          if (activeOperations.length)
            normalized.activeMechanicOverrides[key] = activeOperations;
        });
        if (override.activeDurationConfig) {
          normalized.activeDurationConfig = cloneJson(
            override.activeDurationConfig,
          );
        }
        return normalized;
      })
      .filter(Boolean)
      .filter(hasTraitOverrideMechanics)
      .filter((override) => {
        const key = traitRelationKey(override.trait);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function normalizeTraitRelations(race = {}) {
    const standardTraits = Array.isArray(race.standardTraits)
      ? race.standardTraits
      : [];
    const alternateTraits = Array.isArray(race.alternateTraits)
      ? race.alternateTraits.map((trait) => ({
          ...trait,
          replaces: canonicalTraitTargets(trait.replaces, standardTraits, {
            strict: true,
          }),
          modifies: canonicalTraitTargets(trait.modifies, standardTraits),
          modifiedTraitOverrides: canonicalizeModifiedTraitOverrides(
            trait.modifiedTraitOverrides,
            standardTraits,
          ),
        }))
      : [];
    return {
      ...race,
      standardTraits,
      alternateTraits,
    };
  }

  function normalizeRace(race = {}) {
    const name = race.name || race.race || "Unnamed Race";
    return normalizeTraitRelations({
      ...race,
      name,
      race: race.race || name,
      slug: race.slug || slugify(name),
      group: race.group || "Other Races",
    });
  }

  function operationMatchesRow(operation = {}, row = {}, index = 0) {
    return operation.targetKey
      ? operation.targetKey === stableMechanicKey(row)
      : Number(operation.targetIndex) === index;
  }

  function applyMechanicOperations(baseRows = [], operations = []) {
    const rows = (Array.isArray(baseRows) ? baseRows : [])
      .map((row, index) => {
        const operation = [...(Array.isArray(operations) ? operations : [])]
          .reverse()
          .find((entry) => operationMatchesRow(entry, row, index));
        if (!operation || operation.action === "keep") return row;
        if (operation.action === "remove") return null;
        return operation.action === "replace" && operation.value
          ? operation.value
          : row;
      })
      .filter(Boolean);
    const additions = (Array.isArray(operations) ? operations : [])
      .filter((operation) => operation.action === "add" && operation.value)
      .map((operation) => operation.value);
    return [...rows, ...additions];
  }

  function applyModifiedTraitOverride(trait = {}, override = {}) {
    if (!hasTraitOverrideMechanics(override)) return trait;
    const passiveSource = traitMechanicGroup(trait, "passive");
    const activeSource = { ...traitMechanicGroup(trait, "active") };
    const merged = { ...trait };
    TRAIT_MECHANIC_KEYS.forEach((key) => {
      const passiveOperations = normalizedMechanicOperations(
        override.mechanicOverrides?.[key],
      );
      merged[key] = passiveOperations.length
        ? applyMechanicOperations(passiveSource[key], passiveOperations)
        : Array.isArray(passiveSource[key])
          ? passiveSource[key]
          : [];

      const activeOperations = normalizedMechanicOperations(
        override.activeMechanicOverrides?.[key],
      );
      activeSource[key] = activeOperations.length
        ? applyMechanicOperations(activeSource[key], activeOperations)
        : Array.isArray(activeSource[key])
          ? activeSource[key]
          : [];
    });
    const durationConfig =
      override.activeDurationConfig || activeSource.durationConfig || null;
    const hasActive = window.PFEffectMechanics?.hasAnyMechanics
      ? window.PFEffectMechanics.hasAnyMechanics(activeSource)
      : TRAIT_MECHANIC_KEYS.some((key) => activeSource[key]?.length);
    if (hasActive || durationConfig) {
      merged.activeMechanics = {
        ...activeSource,
        ...(durationConfig ? { durationConfig } : {}),
      };
    } else {
      delete merged.activeMechanics;
    }
    return merged;
  }

  function compactGroupRaceRef(entry = {}) {
    if (typeof entry === "string") return entry;
    return entry.slug || slugify(entry.name || entry.race || "");
  }

  function normalizeRaceData(data = {}) {
    const races = (Array.isArray(data.races) ? data.races : [])
      .map(normalizeRace)
      .filter((race) => race.name);
    const raceBySlug = new Map(races.map((race) => [race.slug, race]));
    const sourceGroups = Array.isArray(data.groups) ? data.groups : [];
    const groups = sourceGroups
      .map((group) => ({
        name: group.name || "Other Races",
        races: (Array.isArray(group.races) ? group.races : [])
          .map((entry) => raceBySlug.get(compactGroupRaceRef(entry)))
          .filter(Boolean),
      }))
      .filter((group) => group.races.length);
    const groupedSlugs = new Set(
      groups.flatMap((group) => group.races.map((race) => race.slug)),
    );
    races
      .filter((race) => !groupedSlugs.has(race.slug))
      .forEach((race) => {
        const groupName = race.group || "Other Races";
        let group = groups.find((entry) => entry.name === groupName);
        if (!group) {
          group = { name: groupName, races: [] };
          groups.push(group);
        }
        group.races.push(race);
      });
    return {
      ...cloneJson(data),
      groups,
      races,
    };
  }

  function compactRaceData(data = {}) {
    const normalized = normalizeRaceData(data);
    return {
      source: normalized.source || DATA_PATH,
      generatedAt: normalized.generatedAt || new Date().toISOString(),
      schemaVersion: 2,
      groups: normalized.groups.map((group) => ({
        name: group.name,
        races: group.races.map((race) => race.slug),
      })),
      races: normalized.races,
    };
  }

  async function loadRaces() {
    if (raceDataCache) return raceDataCache;
    const response = await fetch(DATA_PATH, { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load data/races.json.");
    const data = await response.json();
    raceDataCache = normalizeRaceData(data);
    return raceDataCache;
  }

  function reset() {
    raceDataCache = null;
  }

  window.PFRaceData = {
    applyModifiedTraitOverride,
    dataPath: DATA_PATH,
    compactRaceData,
    canonicalTraitTargets,
    canonicalizeModifiedTraitOverrides,
    loadRaces,
    normalizeRaceData,
    reset,
    slugify,
  };
})();
