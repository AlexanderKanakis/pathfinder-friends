const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const mechanics = require("./effect-mechanics.js");

const mechanicKeys = mechanics.mechanicKeys();
const extraKeys = mechanics.extraKeys();
const promptedChoiceKeys = mechanics.promptedChoiceMechanicKeys();

function readProjectFile(file) {
  return fs.readFileSync(path.join(rootDir, file), "utf8");
}

function keyLiteral(key) {
  return `"${key}"`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyReference(text, key) {
  if (text.includes(keyLiteral(key))) return true;
  return new RegExp(`(^|[^A-Za-z0-9_$])${escapeRegex(key)}([^A-Za-z0-9_$]|$)`).test(
    text,
  );
}

function checkRegistryGateway(results, gateway) {
  const text = readProjectFile(gateway.file);
  const expected = `PFEffectMechanics?.${gateway.registryMethod}`;
  if (!text.includes(expected)) {
    results.push(
      `${gateway.name}: expected ${gateway.file} to use ${expected}().`,
    );
  }
}

function checkLiteralGateway(results, gateway) {
  const text = readProjectFile(gateway.file);
  const missing = gateway.keys.filter((key) => !hasKeyReference(text, key));
  if (missing.length) {
    results.push(`${gateway.name}: ${gateway.file} missing ${missing.join(", ")}`);
  }
}

function functionBody(text, functionName) {
  let start = text.indexOf(`function ${functionName}`);
  if (start < 0) start = text.indexOf(`async ${functionName}`);
  if (start < 0) start = text.indexOf(`${functionName}(`);
  if (start < 0) return "";
  const paramsEnd = text.indexOf(")", start);
  const open = text.indexOf("{", paramsEnd > -1 ? paramsEnd : start);
  if (open < 0) return "";
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return "";
}

function keyAliases(key) {
  if (key === mechanics.baseEffectKey) return [key, "bonuses"];
  if (key === "conditionalVariables")
    return [
      key,
      "conditionalVariables",
      "effectConditionalVariables",
      "resolveConditionalVariables",
      "conditionalVariables(",
    ];
  return [key];
}

function checkChoiceFunctionGateway(results, gateway) {
  const text = readProjectFile(gateway.file);
  const body = functionBody(text, gateway.functionName);
  if (!body) {
    results.push(
      `${gateway.name}: ${gateway.file} missing function ${gateway.functionName}.`,
    );
    return;
  }
  const missing = gateway.keys.filter(
    (key) => !keyAliases(key).some((alias) => hasKeyReference(body, alias)),
  );
  if (missing.length) {
    results.push(
      `${gateway.name}: ${gateway.file} ${gateway.functionName} missing ${missing.join(", ")}`,
    );
  }
}

function checkHtmlInclude(results, file) {
  const text = readProjectFile(file);
  if (!text.includes("scripts/effect-mechanics.js")) {
    results.push(`${file}: missing scripts/effect-mechanics.js include.`);
  }
}

function checkMarkers(results, gateway) {
  const text = readProjectFile(gateway.file);
  const missing = gateway.markers.filter((marker) => !text.includes(marker));
  if (missing.length) {
    results.push(
      `${gateway.name}: ${gateway.file} missing ${missing.join(", ")}`,
    );
  }
}

function checkGroupedMechanicPayload(results) {
  const source = {
    effects: [{ stat: "ac", value: 1 }],
    auraConfig: { enabled: true, rangeFeet: 10 },
    activeMechanics: {
      effects: [{ stat: "attack", value: 2 }],
      spellResistance: [{ amount: 11 }],
      durationConfig: { count: 1, unit: "minute" },
      auraConfig: { enabled: true, rangeFeet: 30 },
    },
  };
  const payload = mechanics.mechanicPayload(source);
  if (payload.effects?.[0]?.stat !== "ac") {
    results.push("Grouped mechanic payload: Passive effects were not preserved.");
  }
  if (payload.activeMechanics?.effects?.[0]?.stat !== "attack") {
    results.push("Grouped mechanic payload: Active effects were not preserved.");
  }
  if (payload.activeMechanics?.spellResistance?.[0]?.amount !== 11) {
    results.push("Grouped mechanic payload: Active extras were not preserved.");
  }
  if (payload.activeMechanics?.durationConfig?.unit !== "minute") {
    results.push("Grouped mechanic payload: Active duration was not preserved.");
  }
  if (payload.auraConfig?.rangeFeet !== 10) {
    results.push("Grouped mechanic payload: Passive aura configuration was not preserved.");
  }
  if (payload.activeMechanics?.auraConfig?.rangeFeet !== 30) {
    results.push("Grouped mechanic payload: Active aura configuration was not preserved.");
  }
}

function checkEffectBranches(results) {
  const source = {
    effects: [{ stat: "ac", value: 1 }],
    branches: [
      { id: "offense", name: "Offense", effects: [{ stat: "attack", value: 2 }] },
      { id: "defense", name: "Defense", effects: [{ stat: "ac", value: 3 }] },
    ],
    activeMechanics: {
      branches: [
        { id: "fire", name: "Fire", damageRolls: [{ damageType: "fire" }] },
        { id: "cold", name: "Cold", damageRolls: [{ damageType: "cold" }] },
      ],
    },
  };
  const passive = mechanics.passiveMechanics(source);
  const active = mechanics.activeMechanics(source);
  const resolved = mechanics.resolveBranch(passive, "defense");
  if (!mechanics.hasBranches(passive) || !mechanics.hasBranches(active))
    results.push("Effect branches: Passive or Active branches were not preserved.");
  if (resolved?.effects?.length !== 2 || resolved.selectedBranchName !== "Defense")
    results.push("Effect branches: selected mechanics were not merged correctly.");
  if (mechanics.hasBranches(resolved))
    results.push("Effect branches: resolved mechanics still request another branch.");
  if (!mechanics.canReselectBranch(resolved) || !mechanics.hasBranches(mechanics.branchSource(resolved)))
    results.push("Effect branches: resolved mechanics cannot reopen their original branch options.");

  const editor = readProjectFile("scripts/effect-editor.js");
  if (!editor.includes("PassiveCreateBranch") || !editor.includes("ActiveCreateBranch"))
    results.push("Effect branches: shared Passive/Active editor controls are missing.");
  for (const file of [
    "scripts/buff-tracker-widget.js",
    "modals/pending-effect-choices.js",
    "scripts/pages/map.js",
    "scripts/pages/character-sheet.js",
  ]) {
    if (!readProjectFile(file).includes("chooseBranch"))
      results.push(`Effect branches: ${file} does not resolve branch choices.`);
  }
}

function checkAuraLinks(results) {
  const link = mechanics.createAuraLink(
    { id: "caster-token", kind: "character" },
    {
      id: "aura-of-doom",
      name: "Aura of Doom",
      category: "Spell",
      auraConfig: { enabled: true, rangeFeet: 20 },
      effects: [{ stat: "ac", value: -2 }],
      applyConditions: [{ name: "Shaken" }],
      casterLevel: 10,
      remaining: 1000,
    },
    { id: "linked-aura" },
  );
  if (!link || link.aura.linkedEffectId !== link.controller.id)
    results.push("Aura links: Aura and active-effect controller are not linked.");
  if (link.aura.radius !== 4 || link.aura.rangeFeet !== 20)
    results.push("Aura links: Authored range was not preserved.");
  if (!mechanics.isAuraController(link.controller))
    results.push("Aura links: Controller marker is missing.");
  if (
    link.controller.effects ||
    link.controller.bonuses ||
    link.controller.applyConditions
  )
    results.push("Aura links: Controller must not apply aura mechanics to its caster.");
  if (link.controller.remaining !== 1000 || link.controller.casterLevel !== 10)
    results.push("Aura links: Controller did not retain spell duration metadata.");

  const passive = mechanics.createAuraLink(
    { id: "caster-token", kind: "character" },
    {
      name: "Passive Aura",
      auraConfig: { enabled: true, rangeFeet: 10 },
      effects: [{ stat: "ac", value: 1 }],
    },
    { id: "passive-aura", kind: "passive" },
  );
  if (passive.aura.linkedEffectId)
    results.push("Aura links: Passive auras must not require an active controller.");

  const map = readProjectFile("scripts/pages/map.js");
  const sheet = readProjectFile("scripts/pages/character-sheet.js");
  const tracker = readProjectFile("scripts/buff-tracker-widget.js");
  if (!map.includes("removed?.linkedEffectId") || !map.includes("reconcileTokenLinkedAuras"))
    results.push("Aura links: Map aura/effect removal synchronization is missing.");
  if (!sheet.includes("syncCurrentMapLinkedAuras(activeBuffs)"))
    results.push("Aura links: Character-sheet effect removal does not remove its aura.");
  if (!tracker.includes("this.active.push(controller)"))
    results.push("Aura links: Aura activation is not listed as an active effect.");
}

function checkInventoryActiveAbilityGateway(results) {
  const text = readProjectFile("scripts/pages/character-sheet.js");
  const body = functionBody(text, "collectActivatableAbilities");
  if (!body.includes("characterInventoryItems") || !body.includes("activeMechanics?.(item)")) {
    results.push(
      "Inventory activations: collectActivatableAbilities must collect item Active mechanics.",
    );
  }
  if (/itemAbilities[\s\S]*?\.filter\(\(item\)\s*=>\s*isLootEquipped/.test(body)) {
    results.push(
      "Inventory activations: carried item Active mechanics must not require equipping.",
    );
  }
}

function checkMapItemActiveAbilityGateway(results) {
  const text = readProjectFile("scripts/pages/map.js");
  const body = functionBody(text, "characterActivatableAbilities");
  if (
    !body.includes("loadLootItems") ||
    !body.includes("activeMechanics?.(item)") ||
    !body.includes('category: "Item"')
  ) {
    results.push(
      "Map item activations: characterActivatableAbilities must include assigned item Active mechanics.",
    );
  }
  const openBody = functionBody(text, "openMapEffects");
  if (!openBody.includes("activatableAbilities")) {
    results.push(
      "Map item activations: the token Effects tracker must receive character activations.",
    );
  }
}

function checkMapEffectGroupNavigation(results) {
  const script = readProjectFile("scripts/pages/map.js");
  const html = readProjectFile("map.html");
  for (const group of ["personal", "spells", "conditions", "other", "passives"]) {
    if (
      !script.includes(`${group}:`) ||
      !html.includes(`data-quick-effect-group="${group}"`)
    ) {
      results.push(`Map effect groups: missing ${group} navigation support.`);
    }
  }
  if (!script.includes("quickEffectGroupFor")) {
    results.push("Map effect groups: missing effect classification gateway.");
  }
  if (
    !script.includes("characterOwnedSpellEffects") ||
    !script.includes("renderOwnedSpellEffects") ||
    !script.includes("renderOtherEffectGroups") ||
    !script.includes("activatableEffectSourcesForCharacter") ||
    !script.includes("passiveEffectSourcesForCharacter") ||
    !script.includes("openMapOwnedSpellDetails") ||
    !script.includes("spellDetailsForCharacter") ||
    !script.includes("authoredCatalogEffects") ||
    !script.includes("catalogEffect: true") ||
    !script.includes('quickEffectGroup === "other"')
  ) {
    results.push(
      "Map effect groups: owned spells, calculated spell details, authored source catalogs, and character passives must use their dedicated gateways.",
    );
  }
}

const registryGateways = [
  {
    name: "Race data normalization",
    file: "scripts/race-data.js",
    registryMethod: "mechanicKeys",
  },
  {
    name: "Feat data normalization",
    file: "scripts/feat-data.js",
    registryMethod: "mechanicKeys",
  },
];

const literalGateways = [
  {
    name: "Race editor save/load/override UI",
    file: "scripts/pages/race-editor.js",
    keys: mechanicKeys,
  },
  {
    name: "Character sheet effect collection/application",
    file: "scripts/pages/character-sheet.js",
    keys: mechanicKeys,
  },
  {
    name: "Feat editor save UI",
    file: "scripts/pages/feat-editor.js",
    keys: extraKeys,
  },
  {
    name: "Feat data fallback",
    file: "scripts/feat-data.js",
    keys: mechanicKeys,
  },
  {
    name: "Spell editor save UI",
    file: "scripts/pages/spell-editor.js",
    keys: extraKeys,
  },
  {
    name: "Spell cast pending choices",
    file: "modals/pending-effect-choices.js",
    keys: extraKeys,
  },
  {
    name: "Racial traits choice modal",
    file: "modals/racial-traits.js",
    keys: [
      "effects",
      "classSkillGrants",
      "spellLikeAbilities",
      "casterLevelBonuses",
      "spellDcBonuses",
      "effectiveAttributeBonuses",
      "grantDomains",
    ],
  },
  {
    name: "Buff tracker author/apply UI",
    file: "scripts/buff-tracker-widget.js",
    keys: extraKeys,
  },
  {
    name: "Map quick effects",
    file: "scripts/pages/map.js",
    keys: extraKeys,
  },
  {
    name: "Bag of Holding loot effects",
    file: "scripts/pages/bag-of-holding.js",
    keys: extraKeys,
  },
  {
    name: "Loot persistence gateway",
    file: "scripts/app-supabase.js",
    keys: mechanicKeys,
  },
  {
    name: "Item catalog effect save UI",
    file: "scripts/pages/item-catalog-editor.js",
    keys: extraKeys,
  },
  {
    name: "Class feature editor save UI",
    file: "modals/class-feature-editor.js",
    keys: extraKeys,
  },
  {
    name: "Class feature pool propagation",
    file: "scripts/pages/class-editor.js",
    keys: extraKeys,
  },
  {
    name: "Effect editor shared collector",
    file: "scripts/effect-editor.js",
    keys: extraKeys,
  },
];

const choiceFunctionGateways = [
  {
    name: "Racial trait card choice detector",
    file: "modals/racial-traits.js",
    functionName: "traitHasChoiceStats",
    keys: promptedChoiceKeys,
  },
  {
    name: "Racial trait override choice detector",
    file: "modals/racial-traits.js",
    functionName: "operationNeedsChoice",
    keys: promptedChoiceKeys.filter(
      (key) =>
        ![
          mechanics.baseEffectKey,
          "classSkillGrants",
          "conditionalVariables",
        ].includes(key),
    ),
  },
  {
    name: "Character sheet racial trait choice detector",
    file: "scripts/pages/character-sheet.js",
    functionName: "racialTraitMechanicsHaveChoiceStats",
    keys: promptedChoiceKeys,
  },
  {
    name: "Character sheet racial override choice detector",
    file: "scripts/pages/character-sheet.js",
    functionName: "racialTraitOverrideHasChoiceStats",
    keys: promptedChoiceKeys.filter((key) => key !== "conditionalVariables"),
  },
  {
    name: "Class feature choice detector",
    file: "scripts/pages/character-sheet.js",
    functionName: "classFeatureMechanicsNeedChoice",
    keys: promptedChoiceKeys.filter((key) => key !== "conditionalVariables"),
  },
  {
    name: "Feat choice detector",
    file: "scripts/pages/character-sheet.js",
    functionName: "featHasChoiceBearingMechanics",
    keys: promptedChoiceKeys,
  },
  {
    name: "Buff tracker apply-time choice detector",
    file: "scripts/buff-tracker-widget.js",
    functionName: "addEffectDefinition",
    keys: promptedChoiceKeys,
  },
  {
    name: "Pending effect request resolver",
    file: "modals/pending-effect-choices.js",
    functionName: "resolveRequest",
    keys: promptedChoiceKeys,
  },
  {
    name: "Map quick-effect choice detector",
    file: "scripts/pages/map.js",
    functionName: "resolveEffectChoicesForToken",
    keys: promptedChoiceKeys,
  },
];

const htmlGateways = [
  "character-sheet.html",
  "map.html",
  "race-editor.html",
  "feat-editor.html",
  "spell-editor.html",
  "class-editor.html",
  "item-catalog-editor.html",
  "bag-of-holding.html",
];

const mechanicGroupGateways = [
  {
    name: "Shared Passive/Active editor",
    file: "scripts/effect-editor.js",
    markers: ["function mountMechanicGroups", "activeMechanics"],
  },
  ...[
    "modals/class-feature-editor.js",
    "scripts/pages/race-editor.js",
    "scripts/pages/feat-editor.js",
    "scripts/pages/item-catalog-editor.js",
    "scripts/pages/bag-of-holding.js",
  ].map((file) => ({
    name: "Passive/Active authoring gateway",
    file,
    markers: ["mountMechanicGroups"],
  })),
  {
    name: "Spell active-only authoring gateway",
    file: "scripts/pages/spell-editor.js",
    markers: ["mountMechanicGroups", "activeOnly: true"],
  },
  {
    name: "Character sheet mechanic group runtime",
    file: "scripts/pages/character-sheet.js",
    markers: ["mountMechanicGroups", "passiveMechanics", "activeMechanics"],
  },
  {
    name: "Class feature active runtime",
    file: "scripts/class-feature-abilities.js",
    markers: ["activeMechanics", "auraConfig"],
  },
  {
    name: "Aura activation runtime",
    file: "scripts/pages/map.js",
    markers: ["installAutomaticAura", "syncTokenPassiveAuras", "advanceAutomaticAuras"],
  },
  {
    name: "Character-sheet aura activation gateway",
    file: "scripts/buff-tracker-widget.js",
    markers: ["onAuraActivate", "auraConfig"],
  },
  {
    name: "Bag source and save mechanic propagation",
    file: "scripts/pages/bag-of-holding.js",
    markers: [
      "mechanicPayload",
      "...lootEffectPayload(item)",
      "payload.activeMechanics = active",
    ],
  },
  {
    name: "Loot Passive/Active persistence",
    file: "scripts/app-supabase.js",
    markers: [
      "LOOT_MECHANIC_KEYS",
      "effectMechanics",
      "row.details?.effectMechanics?.activeMechanics",
      "effectMechanics.activeMechanics = item.activeMechanics",
    ],
  },
];

const errors = [];
checkGroupedMechanicPayload(errors);
checkEffectBranches(errors);
checkAuraLinks(errors);
checkInventoryActiveAbilityGateway(errors);
checkMapItemActiveAbilityGateway(errors);
checkMapEffectGroupNavigation(errors);
registryGateways.forEach((gateway) => checkRegistryGateway(errors, gateway));
literalGateways.forEach((gateway) => checkLiteralGateway(errors, gateway));
choiceFunctionGateways.forEach((gateway) =>
  checkChoiceFunctionGateway(errors, gateway),
);
htmlGateways.forEach((file) => checkHtmlInclude(errors, file));
mechanicGroupGateways.forEach((gateway) => checkMarkers(errors, gateway));

if (errors.length) {
  console.error("Effect gateway checks failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Effect gateway checks passed for ${mechanicKeys.length} mechanics across ${literalGateways.length} data gateways, ${choiceFunctionGateways.length} choice gateways, and ${mechanicGroupGateways.length} Passive/Active gateways.`,
);
