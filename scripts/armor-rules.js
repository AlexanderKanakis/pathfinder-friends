(function (root, factory) {
  const api = factory();
  if (root) root.PFArmorRules = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function optionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function isMithral(item = {}) {
    return /mithral/i.test(
      String(item.specialMaterial || item.special_material || ""),
    );
  }

  function armorCategory(item = {}) {
    if (String(item.type || "").toLowerCase() === "shield") return "shield";
    const group = String(item.armorGroup || item.armor_group || "").toLowerCase();
    if (group.includes("heavy")) return "heavy";
    if (group.includes("medium")) return "medium";
    return "light";
  }

  function effectiveArmorCategory(item = {}) {
    const category = armorCategory(item);
    if (!isMithral(item) || category === "shield" || category === "light")
      return category;
    return category === "heavy" ? "medium" : "light";
  }

  function itemMaxDex(item = {}) {
    const value = optionalNumber(item.maxDex ?? item.max_dex);
    if (value === null) return null;
    return value + (isMithral(item) ? 2 : 0);
  }

  function itemSpellFailure(item = {}) {
    const value = optionalNumber(item.failure ?? item.spellFailure);
    if (value === null) return 0;
    return Math.max(0, value - (isMithral(item) ? 10 : 0));
  }

  function summarizeEquipment(items = []) {
    const entries = (Array.isArray(items) ? items : []).map((item) => ({
      item,
      name: item.item || item.name || item.type || "Armor",
      category: effectiveArmorCategory(item),
      maxDex: itemMaxDex(item),
      spellFailure: itemSpellFailure(item),
    }));
    const caps = entries
      .map((entry) => entry.maxDex)
      .filter((value) => value !== null);
    return {
      maxDex: caps.length ? Math.min(...caps) : null,
      spellFailure: entries.reduce(
        (total, entry) => total + entry.spellFailure,
        0,
      ),
      entries,
    };
  }

  function dexterityForArmorClass(dexterityModifier, maximumDexterity) {
    const dexterity = Number(dexterityModifier) || 0;
    const cap = optionalNumber(maximumDexterity);
    if (cap === null || dexterity <= 0) return dexterity;
    return Math.min(dexterity, cap);
  }

  function hasSomaticComponent(components = "") {
    return String(components || "")
      .split(",")
      .some((part) => /^\s*S(?:\s|\(|$)/i.test(part));
  }

  function normalizedClassName(className = "") {
    return String(className || "")
      .trim()
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function classIgnoresEntry(className, classLevel, entry) {
    const name = normalizedClassName(className);
    const level = Math.max(0, Number(classLevel) || 0);
    const category = entry.category;
    if (name === "bard") return category === "light" || category === "shield";
    if (name === "skald")
      return ["light", "medium", "shield"].includes(category);
    if (name === "bloodrager")
      return category === "light" || category === "medium";
    if (name === "summoner" || name === "summoner unchained")
      return category === "light";
    if (name === "magus") {
      if (category === "shield") return false;
      if (category === "light") return true;
      if (category === "medium") return level >= 7;
      if (category === "heavy") return level >= 13;
    }
    return false;
  }

  function arcaneSpellFailure({
    className = "",
    classLevel = 0,
    magicType = "arcane",
    sourceKind = "strict-spells",
    components = "",
    equipment = [],
  } = {}) {
    const summary = summarizeEquipment(equipment);
    const result = {
      chance: 0,
      applies: false,
      reason: "",
      entries: summary.entries,
    };
    if (String(magicType || "").toLowerCase() !== "arcane") {
      result.reason = "not an arcane spell";
      return result;
    }
    if (String(sourceKind || "").toLowerCase() !== "strict-spells") {
      result.reason = "not a spell subject to armor failure";
      return result;
    }
    if (!hasSomaticComponent(components)) {
      result.reason = "no somatic component";
      return result;
    }
    const applicable = summary.entries.filter(
      (entry) => !classIgnoresEntry(className, classLevel, entry),
    );
    result.entries = summary.entries.map((entry) => ({
      ...entry,
      ignored: !applicable.includes(entry),
    }));
    result.chance = Math.min(
      100,
      applicable.reduce((total, entry) => total + entry.spellFailure, 0),
    );
    result.applies = result.chance > 0;
    result.reason = result.applies ? "armor and shield spell failure" : "no applicable spell failure";
    return result;
  }

  return {
    optionalNumber,
    isMithral,
    armorCategory,
    effectiveArmorCategory,
    itemMaxDex,
    itemSpellFailure,
    summarizeEquipment,
    dexterityForArmorClass,
    hasSomaticComponent,
    arcaneSpellFailure,
  };
});
