(function () {
  function abilityMod(score) {
    return Math.floor((Number(score) - 10) / 2);
  }

  function fmt(value) {
    return value >= 0 ? `+${value}` : String(value);
  }

  function normalizeStat(stat) {
    const key = String(stat || "").toLowerCase().trim();
    const aliases = {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
      fort: "fortitude",
      ac: "ac",
      "remove dex bonus to ac": "remove dex bonus to ac",
      "remove dexterity bonus to ac": "remove dex bonus to ac",
      "deny dex bonus to ac": "remove dex bonus to ac",
      "deny dexterity bonus to ac": "remove dex bonus to ac",
      "str skill checks": "strength skill checks",
      "dex skill checks": "dexterity skill checks",
      "con skill checks": "constitution skill checks",
      "int skill checks": "intelligence skill checks",
      "wis skill checks": "wisdom skill checks",
      "cha skill checks": "charisma skill checks",
      "str skills": "strength skill checks",
      "dex skills": "dexterity skill checks",
      "con skills": "constitution skill checks",
      "int skills": "intelligence skill checks",
      "wis skills": "wisdom skill checks",
      "cha skills": "charisma skill checks",
      "extra attacks": "extra attack",
      "extra attack at highest bab": "extra attack",
      "extra attacks at highest bab": "extra attack"
    };
    return aliases[key] || key;
  }

  function stacksByType(type) {
    return type === "untyped" || type === "dodge" || type === "circumstance";
  }

  function applyBonuses(bonuses) {
    let total = 0;
    const used = [];
    const ignored = [];
    const conditional = [];
    const grouped = {};

    bonuses.filter(bonus => bonus.conditional).forEach(bonus => {
      conditional.push({ ...bonus, conditionalReason: bonus.appliesWhen || "conditional" });
    });

    bonuses.filter(bonus => !bonus.conditional).forEach(bonus => {
      const type = bonus.type || "untyped";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(bonus);
    });

    Object.entries(grouped).forEach(([type, typedBonuses]) => {
      const stacking = typedBonuses.filter(b => stacksByType(type) || b.stacks || b.value < 0);
      const nonStacking = typedBonuses.filter(b => !stacksByType(type) && !b.stacks && b.value >= 0);

      stacking.forEach(b => {
        total += Number(b.value || 0);
        used.push(b);
      });

      if (nonStacking.length) {
        const best = nonStacking.reduce((a, b) => Number(a.value) >= Number(b.value) ? a : b);
        total += Number(best.value || 0);
        used.push(best);
        nonStacking.filter(b => b !== best).forEach(b => ignored.push({ ...b, ignoredReason: `${type} bonus is superseded by ${best.source}` }));
      }
    });

    return { total, used, ignored, conditional };
  }

  function scaledBonusValue(rawBonus, casterLevel) {
    const scale = rawBonus.bonusScale || rawBonus.scale;
    const baseValue = Number(rawBonus.value || 0);
    const level = Math.max(1, Number(casterLevel || 1));
    if (!scale) return baseValue;

    let value = baseValue;
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    milestones
      .map(milestone => ({
        level: Number(milestone.level || 0),
        value: Number(milestone.value || 0)
      }))
      .filter(milestone => milestone.level > 0 && milestone.level <= level)
      .sort((a, b) => a.level - b.level)
      .forEach(milestone => {
        value = milestone.value;
      });

    const every = scale.every || {};
    const afterLevel = Number(every.afterLevel || every.after || 0);
    const everyLevels = Number(every.everyLevels || every.every || 0);
    const increase = Number(every.increase || 0);
    if (afterLevel > 0 && everyLevels > 0 && increase) {
      value += Math.floor(Math.max(0, level - afterLevel) / everyLevels) * increase;
    }

    return value;
  }

  function describeBonuses(bonuses) {
    if (!bonuses.length) return "no active buff modifiers";
    return bonuses.map(b => `${b.source} ${fmt(Number(b.value || 0))} ${b.type || "untyped"}`).join(", ");
  }

  function collectBuffModifiers(activeBuffs) {
    const map = {};

    activeBuffs.forEach(buff => {
      (buff.bonuses || []).forEach(rawBonus => {
        const stat = normalizeStat(rawBonus.stat);
        if (!map[stat]) map[stat] = [];
        map[stat].push({
          ...rawBonus,
          stat,
          value: scaledBonusValue(rawBonus, buff.casterLevel),
          type: rawBonus.type || "untyped",
          source: buff.name,
          casterLevel: buff.casterLevel
        });
      });
    });

    return map;
  }

  function dexDenialBonus(rawBonus, dexBonus) {
    return {
      ...rawBonus,
      value: -Math.max(0, Number(dexBonus || 0)),
      type: rawBonus.type || "condition",
      detail: rawBonus.appliesWhen || rawBonus.detail || "removes DEX bonus to AC"
    };
  }

  function applyDexDenialToAc(bonuses, dexBonus) {
    const result = { total: 0, used: [], ignored: [], conditional: [] };
    const normalized = (bonuses || []).map(bonus => dexDenialBonus(bonus, dexBonus));
    normalized
      .filter(bonus => bonus.conditional)
      .forEach(bonus => result.conditional.push({ ...bonus, conditionalReason: bonus.appliesWhen || "removes DEX bonus to AC" }));

    const active = normalized.filter(bonus => !bonus.conditional);
    if (!active.length || Math.max(0, Number(dexBonus || 0)) <= 0) return result;

    result.total = active[0].value;
    result.used.push(active[0]);
    active.slice(1).forEach(bonus => result.ignored.push({ ...bonus, ignoredReason: `${active[0].source} already removes DEX bonus to AC` }));
    return result;
  }

  function addBreakdown(breakdown, stat, label, value, type = "derived", detail = "") {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({ stat, source: label, value, type, detail, applied: true });
  }

  function addIgnoredBreakdown(breakdown, stat, bonus, reason) {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({
      stat,
      source: bonus.source,
      value: bonus.value,
      type: bonus.type || "untyped",
      detail: reason || bonus.ignoredReason || "not applied",
      applied: false
    });
  }

  function addConditionalBreakdown(breakdown, stat, bonus) {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({
      stat,
      source: bonus.source,
      value: bonus.value,
      type: bonus.type || "untyped",
      detail: bonus.appliesWhen || bonus.conditionalReason || "conditional",
      applied: "conditional",
      conditional: true
    });
  }

  function calculateStatsDetailed(activeBuffs, baseline) {
    const buffMap = collectBuffModifiers(activeBuffs || []);
    const totals = {};
    const bonuses = {};
    const breakdown = {};

    const abilityKeys = {
      strength: "str",
      dexterity: "dex",
      constitution: "con",
      intelligence: "int",
      wisdom: "wis",
      charisma: "cha"
    };

    const abilityScores = {};
    const abilityMods = {};
    const abilityCauses = {};

    Object.entries(abilityKeys).forEach(([stat, key]) => {
      const applied = applyBonuses(buffMap[stat] || []);
      const score = Number(baseline[key] || 0) + applied.total;
      abilityScores[stat] = score;
      abilityMods[stat] = abilityMod(score);
      abilityCauses[stat] = describeBonuses(applied.used);
      totals[stat] = `${score} (${fmt(abilityMods[stat])})`;
      addBreakdown(breakdown, stat, "Base", Number(baseline[key] || 0), "score");
      applied.used.forEach(b => addBreakdown(breakdown, stat, b.source, b.value, b.type));
      applied.ignored.forEach(b => addIgnoredBreakdown(breakdown, stat, b));
      applied.conditional.forEach(b => addConditionalBreakdown(breakdown, stat, b));
      bonuses[stat] = applied.total;
    });

    const direct = {};
    const directCauses = {};
    Object.keys(buffMap).forEach(stat => {
      if (abilityKeys[stat] || ["ac", "natural armor", "deflection", "remove dex bonus to ac"].includes(stat)) return;
      const applied = applyBonuses(buffMap[stat]);
      direct[stat] = applied.total;
      directCauses[stat] = describeBonuses(applied.used);
      applied.used.forEach(b => addBreakdown(breakdown, stat, b.source, b.value, b.type));
      applied.ignored.forEach(b => addIgnoredBreakdown(breakdown, stat, b));
      applied.conditional.forEach(b => addConditionalBreakdown(breakdown, stat, b));
      bonuses[stat] = applied.total;
    });

    const acSizeApplied = applyBonuses((buffMap.ac || []).filter(b => b.type === "size"));
    const armorApplied = applyBonuses((buffMap.ac || []).filter(b => b.type === "armor"));
    const shieldApplied = applyBonuses((buffMap.ac || []).filter(b => b.type === "shield"));
    const naturalApplied = applyBonuses(buffMap["natural armor"] || []);
    const deflectionApplied = applyBonuses(buffMap.deflection || []);
    const acMiscApplied = applyBonuses((buffMap.ac || []).filter(b => !["armor", "shield", "size"].includes(b.type)));
    const acSizeFromBuffs = acSizeApplied.total;
    const combatSize = Number(baseline.sizeCombat || 0) - acSizeFromBuffs;
    const acSize = Number(baseline.sizeAc || 0) + acSizeFromBuffs;
    const armorFromAcBuffs = armorApplied.total;
    const shieldFromAcBuffs = shieldApplied.total;
    const naturalFromDedicated = naturalApplied.total;
    const deflectionFromDedicated = deflectionApplied.total;
    const acMiscBuffs = acMiscApplied.total;
    const armor = Math.max(Number(baseline.armor || 0), armorFromAcBuffs);
    const shield = Math.max(Number(baseline.shield || 0), shieldFromAcBuffs);
    const naturalArmor = Number(baseline.naturalArmor || 0) + naturalFromDedicated;
    const deflection = Number(baseline.deflection || 0) + deflectionFromDedicated;
    const acMisc = Number(baseline.acMisc || 0) + acMiscBuffs;
    const dexMod = abilityMods.dexterity;
    const positiveDex = Math.max(0, dexMod);
    const dexDeniedApplied = applyDexDenialToAc(buffMap["remove dex bonus to ac"] || [], positiveDex);
    const cmdAcTypes = ["circumstance", "deflection", "dodge", "insight", "luck", "morale", "profane", "sacred"];
    const cmdAcApplied = applyBonuses((buffMap.ac || []).filter(b =>
      cmdAcTypes.includes(b.type) || (b.value < 0 && !["armor", "shield", "natural armor", "size"].includes(b.type))
    ));
    const cmdAcBonus = cmdAcApplied.total + deflectionFromDedicated;

    const acDexMod = dexMod + dexDeniedApplied.total;
    const flatDexMod = Math.min(0, dexMod);
    const dodgeAcBuffs = applyBonuses((buffMap.ac || []).filter(b => b.type === "dodge")).total;
    totals.ac = 10 + armor + shield + acDexMod + acSize + naturalArmor + deflection + acMisc;
    totals["touch ac"] = 10 + acDexMod + acSize + deflection + acMisc;
    totals["flat-footed ac"] = 10 + armor + shield + flatDexMod + acSize + naturalArmor + deflection + acMisc - dodgeAcBuffs;
    addBreakdown(breakdown, "ac", "Formula", totals.ac, "10 + armor + shield + Dex + size + natural + deflection + misc", `DEX ${abilityScores.dexterity} (${fmt(dexMod)}): ${abilityCauses.dexterity}`);
    acSizeApplied.used.forEach(b => addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies as size AC"));
    acSizeApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    acSizeApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    armorApplied.used.forEach(b => {
      if (armorFromAcBuffs > Number(baseline.armor || 0)) addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies as armor bonus");
      else addIgnoredBreakdown(breakdown, "ac", b, `armor bonus is superseded by equipped armor ${Number(baseline.armor || 0)}`);
    });
    armorApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    armorApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    shieldApplied.used.forEach(b => {
      if (shieldFromAcBuffs > Number(baseline.shield || 0)) addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies as shield bonus");
      else addIgnoredBreakdown(breakdown, "ac", b, `shield bonus is superseded by equipped shield ${Number(baseline.shield || 0)}`);
    });
    shieldApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    shieldApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    naturalApplied.used.forEach(b => addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies as natural armor"));
    naturalApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    naturalApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    deflectionApplied.used.forEach(b => addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies as deflection"));
    deflectionApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    deflectionApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    acMiscApplied.used.forEach(b => addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies to AC"));
    acMiscApplied.ignored.forEach(b => addIgnoredBreakdown(breakdown, "ac", b));
    acMiscApplied.conditional.forEach(b => addConditionalBreakdown(breakdown, "ac", b));
    dexDeniedApplied.used.forEach(b => {
      addBreakdown(breakdown, "ac", b.source, b.value, b.type, "removes DEX bonus to AC");
      addBreakdown(breakdown, "touch ac", b.source, b.value, b.type, "removes DEX bonus to touch AC");
    });
    dexDeniedApplied.ignored.forEach(b => {
      addIgnoredBreakdown(breakdown, "ac", b);
      addIgnoredBreakdown(breakdown, "touch ac", b);
    });
    dexDeniedApplied.conditional.forEach(b => {
      addConditionalBreakdown(breakdown, "ac", b);
      addConditionalBreakdown(breakdown, "touch ac", { ...b, appliesWhen: b.appliesWhen || b.detail || "removes DEX bonus to touch AC" });
    });
    addBreakdown(breakdown, "touch ac", "Formula", totals["touch ac"], "10 + Dex + size + deflection + misc", `DEX ${abilityScores.dexterity} (${fmt(dexMod)}): ${abilityCauses.dexterity}`);
    addBreakdown(breakdown, "flat-footed ac", "Formula", totals["flat-footed ac"], "AC without positive Dex/dodge");

    totals.fortitude = Number(baseline.fortBase || 0) + abilityMods.constitution + (direct.fortitude || 0);
    totals.reflex = Number(baseline.reflexBase || 0) + abilityMods.dexterity + (direct.reflex || 0);
    totals.will = Number(baseline.willBase || 0) + abilityMods.wisdom + (direct.will || 0);

    totals.initiative = abilityMods.dexterity + Number(baseline.initMisc || 0) + (direct.initiative || 0);
    totals["melee attack"] = Number(baseline.bab || 0) + abilityMods.strength + acSize + (direct.attack || 0) + (direct["melee attack"] || 0);
    totals["ranged attack"] = Number(baseline.bab || 0) + abilityMods.dexterity + acSize + (direct.attack || 0) + (direct["ranged attack"] || 0);
    totals.damage = abilityMods.strength + (direct.damage || 0);
    totals.cmb = Number(baseline.bab || 0) + abilityMods.strength + combatSize + Number(baseline.cmbMisc || 0) + (direct.cmb || 0) + (direct.attack || 0);
    totals.cmd = 10 + Number(baseline.bab || 0) + abilityMods.strength + abilityMods.dexterity + combatSize + Number(baseline.cmdMisc || 0) + cmdAcBonus + (direct.cmd || 0);
    totals["hit points"] = Number(baseline.hitPoints || 0) + (Number(baseline.hitDice || 0) * (abilityMods.constitution - abilityMod(baseline.con))) + (direct["hit points"] || 0);
    totals["skill checks"] = direct["skill checks"] || 0;
    totals["spell resistance"] = direct["spell resistance"] || 0;
    bonuses.ac = totals.ac - (10 + Number(baseline.armor || 0) + Number(baseline.shield || 0) + abilityMod(baseline.dex) + Number(baseline.sizeAc || 0) + Number(baseline.naturalArmor || 0) + Number(baseline.deflection || 0) + Number(baseline.acMisc || 0));
    bonuses["touch ac"] = totals["touch ac"] - (10 + abilityMod(baseline.dex) + Number(baseline.sizeAc || 0) + Number(baseline.deflection || 0) + Number(baseline.acMisc || 0));
    bonuses["flat-footed ac"] = totals["flat-footed ac"] - ((10 + Number(baseline.armor || 0) + Number(baseline.shield || 0) + abilityMod(baseline.dex) + Number(baseline.sizeAc || 0) + Number(baseline.naturalArmor || 0) + Number(baseline.deflection || 0) + Number(baseline.acMisc || 0)) - Math.max(0, abilityMod(baseline.dex)));
    bonuses.fortitude = totals.fortitude - (Number(baseline.fortBase || 0) + abilityMod(baseline.con));
    bonuses.reflex = totals.reflex - (Number(baseline.reflexBase || 0) + abilityMod(baseline.dex));
    bonuses.will = totals.will - (Number(baseline.willBase || 0) + abilityMod(baseline.wis));
    bonuses.initiative = totals.initiative - (abilityMod(baseline.dex) + Number(baseline.initMisc || 0));
    bonuses.cmb = totals.cmb - (Number(baseline.bab || 0) + abilityMod(baseline.str) + Number(baseline.sizeCombat || 0) + Number(baseline.cmbMisc || 0));
    bonuses.cmd = totals.cmd - (10 + Number(baseline.bab || 0) + abilityMod(baseline.str) + abilityMod(baseline.dex) + Number(baseline.sizeCombat || 0) + Number(baseline.cmdMisc || 0));
    bonuses["hit points"] = totals["hit points"] - Number(baseline.hitPoints || 0);
    cmdAcApplied.used.forEach(b => addBreakdown(breakdown, "cmd", b.source, b.value, b.type, "AC bonus applies to CMD"));
    deflectionApplied.used.forEach(b => addBreakdown(breakdown, "cmd", b.source, b.value, b.type, "deflection applies to CMD"));

    return { totals, bonuses, breakdown, abilityScores, abilityMods, buffMap };
  }

  window.PFBuffs = { abilityMod, fmt, calculateStatsDetailed };
})();
