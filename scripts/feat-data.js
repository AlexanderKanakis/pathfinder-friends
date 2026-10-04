(function () {
  const DATA_PATH = "data/feats.json";
  const MECHANIC_KEYS = window.PFEffectMechanics?.mechanicKeys?.() || [
    "effects",
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "bonusRanks",
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

  let featDataCache = null;

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function slugify(text = "") {
    return (
      String(text || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "feat"
    );
  }

  function listFromValue(value) {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizedFlags(flags = {}, types = []) {
    const typeSet = new Set(types.map((type) => slugify(type).replaceAll("-", "_")));
    return {
      teamwork: Boolean(flags.teamwork || typeSet.has("teamwork")),
      critical: Boolean(flags.critical || typeSet.has("critical")),
      grit: Boolean(flags.grit || typeSet.has("grit")),
      style: Boolean(flags.style || typeSet.has("style")),
      performance: Boolean(flags.performance || typeSet.has("performance")),
      racial: Boolean(flags.racial || typeSet.has("racial")),
      companion_familiar: Boolean(
        flags.companion_familiar ||
          flags.companionFamiliar ||
          typeSet.has("companion_familiar"),
      ),
    };
  }

  function normalizeFeat(feat = {}) {
    const name = feat.name || "Unnamed Feat";
    const types = listFromValue(feat.types || feat.type || "General");
    const primaryType = feat.type || types[0] || "General";
    const normalized = {
      ...cloneJson(feat),
      id: feat.id || feat.slug || slugify(name),
      slug: feat.slug || slugify(name),
      sheetId: feat.sheetId || "",
      name,
      type: primaryType,
      types: types.length ? types : [primaryType],
      description: feat.description || "",
      prerequisites: feat.prerequisites || "",
      prerequisiteFeats: listFromValue(feat.prerequisiteFeats),
      benefit: feat.benefit || "",
      normal: feat.normal || "",
      special: feat.special || "",
      source: feat.source || "",
      raceName: feat.raceName || "",
      note: feat.note || "",
      goal: feat.goal || "",
      completionBenefit: feat.completionBenefit || "",
      multiples: Boolean(feat.multiples),
      suggestedTraits: listFromValue(feat.suggestedTraits),
      effectConfidence: feat.effectConfidence || "none",
      effectNotes: Array.isArray(feat.effectNotes) ? feat.effectNotes : [],
    };

    normalized.flags = normalizedFlags(feat.flags || {}, normalized.types);
    MECHANIC_KEYS.forEach((key) => {
      normalized[key] = Array.isArray(feat[key]) ? feat[key] : [];
    });
    return normalized;
  }

  function rebuildTypeGroups(feats = []) {
    const groups = new Map();
    feats.forEach((feat) => {
      const types = listFromValue(feat.types || feat.type || "General");
      (types.length ? types : ["General"]).forEach((type) => {
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(feat.id || feat.slug || slugify(feat.name));
      });
    });
    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, ids]) => ({
        name,
        count: ids.length,
        feats: ids,
      }));
  }

  function normalizeFeatData(data = {}) {
    const feats = (Array.isArray(data.feats) ? data.feats : [])
      .map(normalizeFeat)
      .filter((feat) => feat.name);
    return {
      ...cloneJson(data),
      source: data.source || DATA_PATH,
      sheet: data.sheet || "",
      generatedAt: data.generatedAt || new Date().toISOString(),
      schemaVersion: data.schemaVersion || 1,
      types: rebuildTypeGroups(feats),
      feats,
    };
  }

  function compactFeatData(data = {}) {
    const normalized = normalizeFeatData(data);
    return {
      source: normalized.source || DATA_PATH,
      sheet: normalized.sheet || "",
      generatedAt: normalized.generatedAt || new Date().toISOString(),
      schemaVersion: normalized.schemaVersion || 1,
      types: rebuildTypeGroups(normalized.feats),
      feats: normalized.feats.map(normalizeFeat),
    };
  }

  async function loadFeats() {
    if (featDataCache) return cloneJson(featDataCache);
    const response = await fetch(`./${DATA_PATH}`, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${DATA_PATH}`);
    }
    featDataCache = normalizeFeatData(await response.json());
    return cloneJson(featDataCache);
  }

  function reset() {
    featDataCache = null;
  }

  window.PFFeatData = {
    dataPath: DATA_PATH,
    mechanicKeys: MECHANIC_KEYS,
    slugify,
    normalizeFeat,
    normalizeFeatData,
    compactFeatData,
    rebuildTypeGroups,
    loadFeats,
    reset,
  };
})();
