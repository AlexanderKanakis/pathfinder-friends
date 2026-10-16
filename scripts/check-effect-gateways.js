const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

function checkRuntimeBonusPersistenceGate(results) {
  const text = readProjectFile("scripts/buff-tracker-widget.js");
  const body = functionBody(text, "hasPersistentEffectMechanics");
  if (!body.includes("effect.bonuses")) {
    results.push(
      "Buff tracker persistence gate must accept resolved runtime bonuses.",
    );
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
  if (
    !mechanics.hasAnyMechanics({
      auraConfig: { enabled: true, rangeFeet: 10 },
    })
  ) {
    results.push("Grouped mechanic payload: Aura-only mechanics were discarded.");
  }
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
  if (!/branchEditors\.length > 1[\s\S]{0,180}\.\.\.mechanicsOnly\(\{\}\)[\s\S]{0,100}branches: currentBranches\(\)/.test(editor))
    results.push("Effect branches: branch collection does not preserve the complete mechanic-array contract required by save handlers.");
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
  const editor = readProjectFile("scripts/effect-editor.js");
  const classFeatureEditor = readProjectFile(
    "modals/class-feature-editor.js",
  );
  const classFeaturePoolEditor = readProjectFile(
    "modals/class-feature-pool-editor.js",
  );
  const auraDeliverySource = readProjectFile("modals/aura-delivery-choice.js");
  if (
    !editor.includes("AURA_DETAILS_MODAL_ID}AffectsSource") ||
    !editor.includes("affectsSource.checked = Boolean(existingConfig.affectsSource)")
  ) {
    results.push(
      "Aura links: shared editor does not expose and restore the affects-source setting.",
    );
  }
  if (
    !editor.includes("AURA_DETAILS_MODAL_ID}TargetsEmit") ||
    !editor.includes("allowTargetsEmit && existingConfig.targetsEmitAura")
  ) {
    results.push(
      "Aura links: shared editor does not expose and restore the targets-emit setting.",
    );
  }
  if (
    !editor.includes("AURA_DETAILS_MODAL_ID}IndependentToken") ||
    !editor.includes("independentToken.checked = Boolean(existingConfig.independentToken)")
  ) {
    results.push(
      "Aura links: shared editor does not expose and restore independent map tokens.",
    );
  }
  if (
    !editor.includes("AURA_DETAILS_MODAL_ID}Light") ||
    !editor.includes("AURA_DETAILS_MODAL_ID}SpecialVision") ||
    !editor.includes('revealMode: "light"') ||
    !editor.includes('revealMode: "specialVision"')
  ) {
    results.push(
      "Aura links: shared editor does not expose mutually exclusive light and Special Vision modes.",
    );
  }
  if (
    !classFeatureEditor.includes("if (auraConfig) feature.auraConfig = auraConfig") ||
    !classFeaturePoolEditor.includes('"auraConfig",')
  ) {
    results.push(
      "Aura links: class-feature pool choices do not preserve or clear passive aura configuration.",
    );
  }
  if (
    !editor.includes("Aura Details") ||
    !editor.includes("rangeScale = await openScaleModal") ||
    !editor.includes("title: \"Aura Range Scale\"") ||
    !editor.includes("Effect Persists Outside Aura") ||
    !editor.includes("PFEffectDurationEditor")
  ) {
    results.push(
      "Aura links: Aura settings are not consolidated behind the shared details/scaling editor.",
    );
  }
  if (
    editor.includes("IndependentToken`).checked = false") ||
    editor.includes("TargetsEmit`).checked = false")
  ) {
    results.push(
      "Aura links: Independent and target-emitted delivery must be authorable together.",
    );
  }
  const auraChoiceContext = { window: {}, structuredClone };
  vm.runInNewContext(auraDeliverySource, auraChoiceContext);
  const dualDelivery = {
    name: "Flexible Aura",
    auraConfig: {
      enabled: true,
      independentToken: true,
      targetsEmitAura: true,
    },
  };
  const targetDelivery =
    auraChoiceContext.window.PFAuraDeliveryChoice.withDelivery(
      dualDelivery,
      "target",
    );
  if (
    !auraChoiceContext.window.PFAuraDeliveryChoice.needsChoice(dualDelivery) ||
    targetDelivery.auraConfig.independentToken ||
    !targetDelivery.auraConfig.targetsEmitAura ||
    !dualDelivery.auraConfig.independentToken
  ) {
    results.push(
      "Aura links: Cast-time aura placement does not resolve both authored delivery modes safely.",
    );
  }

  const previousBuffs = global.PFBuffs;
  global.PFBuffs = {
    scaledBonusValue(rawBonus, effect) {
      return Number(rawBonus.value || 0) + Number(effect.casterLevel || 0);
    },
  };
  const scaledRange = mechanics.resolveAuraRange({
    casterLevel: 7,
    auraConfig: {
      enabled: true,
      rangeFeet: 10,
      rangeScale: { source: { type: "caster" } },
    },
  });
  global.PFBuffs = previousBuffs;
  if (scaledRange !== 17)
    results.push("Aura links: Range scaling is not resolved from the cast snapshot.");

  const link = mechanics.createAuraLink(
    { id: "caster-token", kind: "character" },
    {
      id: "aura-of-doom",
      name: "Aura of Doom",
      category: "Spell",
      auraConfig: {
        enabled: true,
        rangeFeet: 20,
        revealMode: "specialVision",
        lingerDurationConfig: {
          count: 1,
          unit: "round",
          factors: [{ type: "caster" }],
        },
      },
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
  if (link.aura.revealMode !== "specialVision")
    results.push("Aura links: Authored map reveal mode was not preserved.");
  if (link.aura.effect.auraLingerDurationConfig?.unit !== "round")
    results.push("Aura links: Recipient effect did not retain lingering duration.");
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

  const previousEffectMeta = global.PFEffectMeta;
  global.PFEffectMeta = {
    parseDuration(config, context) {
      return Number(config.count || 0) * Number(context.casterLevel || 1);
    },
    durationLabel() {
      return "1 round / caster level";
    },
  };
  const lingering = mechanics.beginAuraLinger(
    {
      ...link.aura.effect,
      auraSourceId: "source",
      auraTokenId: "caster-token",
    },
    { durationAnchorTokenId: "recipient-token" },
  );
  if (
    !lingering?.auraLingering ||
    lingering.remaining !== 10 ||
    lingering.durationAnchorTokenId !== "recipient-token"
  ) {
    results.push("Aura links: Leaving an aura did not start its configured lingering duration.");
  }
  const restored = mechanics.restoreAuraBoundEffect(lingering, link.aura);
  if (restored.auraLingering || restored.remaining !== link.aura.remaining)
    results.push("Aura links: Re-entering an aura did not restore aura-bound duration state.");
  global.PFEffectMeta = previousEffectMeta;

  const independent = mechanics.createIndependentAuraToken(
    { id: "caster-token", kind: "character", ownerId: "owner", x: 3, y: 4 },
    {
      id: "independent-aura",
      name: "Independent Aura",
      category: "Spell",
      auraConfig: { enabled: true, rangeFeet: 15, independentToken: true },
      effects: [{ stat: "ac", value: -1 }],
      remaining: 4,
    },
    { tokenId: "aura-token" },
  );
  if (
    independent?.token?.kind !== "aura" ||
    independent.token.w !== 1 ||
    independent.token.h !== 1 ||
    independent.token.automaticAuras?.[0]?.id !== independent.aura.id
  ) {
    results.push("Aura links: Independent aura did not create a one-cell map token.");
  }
  if (
    independent?.controller?.independentAuraTokenId !== "aura-token" ||
    independent?.aura?.durationAnchorTokenId !== "caster-token" ||
    independent?.aura?.effect?.casterTokenId !== "caster-token"
  ) {
    results.push(
      "Aura links: Independent aura did not retain its caster/controller lifecycle links.",
    );
  }

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

  const mapRevealSource = readProjectFile("scripts/pages/map.js");
  if (
    !mapRevealSource.includes('aura.revealMode === "light"') ||
    !mapRevealSource.includes('aura.revealMode === "specialVision"') ||
    !mapRevealSource.includes("installEmittedAutomaticAuras")
  ) {
    results.push(
      "Aura links: map light and Special Vision calculations do not include effect auras.",
    );
  }

  const replacement = mechanics.createAuraLink(
    { id: "caster-token", kind: "character" },
    {
      id: "aura-of-doom",
      name: "Aura of Doom",
      category: "Spell",
      auraConfig: { enabled: true, rangeFeet: 30 },
      effects: [{ stat: "ac", value: -3 }],
    },
    { id: "replacement-aura" },
  );
  const replacedAuras = mechanics.upsertLinkedAura(
    [link.aura, passive.aura],
    replacement.aura,
    "caster-token",
  );
  if (
    replacedAuras.length !== 2 ||
    replacedAuras.some((aura) => aura.id === link.aura.id) ||
    !replacedAuras.some((aura) => aura.id === passive.aura.id)
  ) {
    results.push("Aura links: Reactivation did not replace only the matching active aura.");
  }
  const legacyController = { ...link.controller };
  delete legacyController.auraSourceEffectId;
  const replacedControllers = mechanics.upsertAuraController(
    [legacyController],
    replacement.controller,
    "caster-token",
  );
  if (
    replacedControllers.length !== 1 ||
    replacedControllers[0].id !== replacement.controller.id
  ) {
    results.push("Aura links: Reactivation did not replace the matching controller effect.");
  }
  const reconciledAuras = mechanics.reconcileLinkedAuras(
    replacedAuras,
    [],
  );
  if (
    reconciledAuras.length !== 1 ||
    reconciledAuras[0].id !== passive.aura.id
  ) {
    results.push("Aura links: Removing a controller did not remove its map aura.");
  }

  const map = readProjectFile("scripts/pages/map.js");
  const sheet = readProjectFile("scripts/pages/character-sheet.js");
  const tracker = readProjectFile("scripts/buff-tracker-widget.js");
  const pendingChoices = readProjectFile("modals/pending-effect-choices.js");
  if (!map.includes("removed?.linkedEffectId") || !map.includes("reconcileTokenLinkedAuras"))
    results.push("Aura links: Map aura/effect removal synchronization is missing.");
  if (!sheet.includes("syncCurrentMapLinkedAuras(activeBuffs)"))
    results.push("Aura links: Character-sheet effect removal does not remove its aura.");
  if (
    !map.includes("removeIndependentAuraToken") ||
    !map.includes("expiredIndependentTokenIds") ||
    !sheet.includes("removeAuraApplicationsForMapTokens")
  ) {
    results.push(
      "Aura links: Independent token deletion, expiry, and recipient cleanup are incomplete.",
    );
  }
  if (!tracker.includes("this.active.push(controller)"))
    if (!tracker.includes("upsertAuraController"))
      results.push("Aura links: Aura activation is not listed as an active effect.");
  if (!map.includes("auraEffectApplying") || !map.includes("spinner-border-sm"))
    results.push("Aura links: Applying an aura does not show a loading indicator.");
  if (!map.includes("sameAuraApplication") || !map.includes("auraDefinitionId"))
    results.push("Aura links: Reapplying an aura does not replace its stale recipient effect.");
  if (
    !tracker.includes("showActiveEffectCategory(effect = {})") ||
    !tracker.includes("this.showActiveEffectCategory(controller)")
  )
    results.push(
      "Aura links: Newly activated auras must reveal their active-effect category.",
    );
  if (
    !map.includes("async function applyQuickSourceAura") ||
    !functionBody(map, "applyQuickSourceAura").includes("queueSave()") ||
    !functionBody(map, "openMapEffects").includes("queueSave()")
  )
    results.push(
      "Aura links: Both map activation paths must persist the updated aura state.",
    );
  if (
    !map.includes("!state.effect.auraConfig?.targetsEmitAura") ||
    !map.includes("installLinkedAutomaticAura(token, appliedEffect)") ||
    !sheet.includes("!payload.auraConfig?.targetsEmitAura") ||
    !sheet.includes("applySpellEffectToTarget(") ||
    !sheet.includes("state.target") ||
    !tracker.includes("onTargetedAuraActivate")
  ) {
    results.push(
      "Aura links: target-emitted auras do not consistently use target selection on map and character sheet.",
    );
  }
  if (
    !pendingChoices.includes("prepareTargetAura") ||
    !pendingChoices.includes("targetAuraPlacement")
  ) {
    results.push(
      "Aura links: cross-device choices cannot install an aura on the selected target.",
    );
  }
  if (
    !sheet.includes("PFAuraDeliveryChoice.choose") ||
    !map.includes("PFAuraDeliveryChoice.choose") ||
    !tracker.includes("PFAuraDeliveryChoice.choose") ||
    !readProjectFile("character-sheet.html").includes(
      "modals/aura-delivery-choice.js",
    ) ||
    !readProjectFile("map.html").includes("modals/aura-delivery-choice.js")
  ) {
    results.push(
      "Aura links: Cast-time aura placement is not shared by character-sheet and map flows.",
    );
  }
  if (
    !sheet.includes("async function loadCurrentSheetMapState") ||
    !functionBody(sheet, "loadCurrentSheetMapState").includes("otherSlots") ||
    !functionBody(sheet, "createAuraOnCurrentMap").includes(
      "currentSheetSourceToken",
    )
  ) {
    results.push(
      "Aura links: Character-sheet aura activation cannot locate its source token across map slots.",
    );
  }
  const sourceLookup = functionBody(sheet, "currentSheetSourceToken");
  const auraActivation = functionBody(sheet, "createAuraOnCurrentMap");
  if (
    !sourceLookup.includes("normalizedMapActorName") ||
    !sourceLookup.includes("sameName.length === 1")
  ) {
    results.push(
      "Aura links: Character-sheet aura activation cannot recover an unambiguous token with a stale character reference.",
    );
  }
  if (
    !auraActivation.includes('reason: "source-token"') ||
    !auraActivation.includes('reason: "resource"') ||
    !auraActivation.includes('reason: "map-save"') ||
    !sheet.includes('result.reason === "source-token"')
  ) {
    results.push(
      "Aura links: Character-sheet aura failures are collapsed into a misleading missing-token warning.",
    );
  }
}

function checkSpellBrowserLayouts(results) {
  const context = {
    window: { PFEffectMechanics: mechanics },
    document: {},
    console,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(
    readProjectFile("scripts/buff-tracker-widget.js"),
    context,
  );
  const render = context.window.PFEffectTracker?.browser?.spellsHtml;
  if (typeof render !== "function") {
    results.push("Spell browser: Shared spell renderer is unavailable.");
    return;
  }
  const row = (name, metadata, index = 0) => ({
    effect: { name, spellMeta: metadata },
    index,
  });
  const spontaneous = render([
    row("Cure Light Wounds", {
      kind: "spell",
      className: "Bard",
      level: 1,
      bucket: "known",
      preparation: "spontaneous",
    }),
  ]);
  if (
    !spontaneous.includes("effect-browser-spell-columns is-single") ||
    spontaneous.includes("Prepared Today") ||
    spontaneous.includes("effect-browser-spell-mobile-tabs")
  ) {
    results.push("Spell browser: Spontaneous casters must use one spell list.");
  }
  const dailyList = render([
    row("Blessing of Fervor", {
      kind: "spell",
      className: "Cleric",
      level: 4,
      bucket: "prepared",
      preparation: "daily-list",
    }),
  ]);
  if (
    !dailyList.includes("effect-browser-spell-columns is-single") ||
    !dailyList.includes("Prepared Today") ||
    dailyList.includes("Known / In Book") ||
    dailyList.includes("effect-browser-spell-mobile-tabs")
  ) {
    results.push("Spell browser: Daily-list casters must use one prepared list.");
  }
  const spellbook = render([
    row("Magic Missile", {
      kind: "spell",
      className: "Wizard",
      level: 1,
      bucket: "book",
      preparation: "spellbook",
    }),
    row(
      "Shield",
      {
        kind: "spell",
        className: "Wizard",
        level: 1,
        bucket: "prepared",
        preparation: "spellbook",
      },
      1,
    ),
  ]);
  if (
    !spellbook.includes("Known / In Book") ||
    !spellbook.includes("Prepared Today") ||
    !spellbook.includes("effect-browser-spell-mobile-tabs")
  ) {
    results.push("Spell browser: Spellbook casters must retain both spell lists.");
  }
  const spellLike = render([
    row("Dancing Lights", {
      kind: "sla",
      className: "Spell-Like Abilities",
      level: 0,
    }),
    row(
      "Darkness",
      { kind: "sla", className: "Spell-Like Abilities", level: 2 },
      1,
    ),
  ]);
  if (
    !spellLike.includes("effect-browser-sla-list") ||
    spellLike.includes("effect-browser-spell-level") ||
    spellLike.includes("effect-browser-spell-column-title")
  ) {
    results.push("Spell browser: Spell-like abilities must render as one plain list.");
  }

  for (const file of [
    "scripts/pages/character-sheet.js",
    "scripts/pages/map.js",
  ]) {
    if (!readProjectFile(file).includes("spellcasting.preparation"))
      results.push(`Spell browser: ${file} does not pass the class preparation mode.`);
  }
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
  const tracker = readProjectFile("scripts/buff-tracker-widget.js");
  for (const group of [
    "spells",
    "conditions",
    "class",
    "racial",
    "feats",
    "items",
    "other",
  ]) {
    if (!tracker.includes(`["${group}",`)) {
      results.push(`Map effect groups: missing ${group} navigation support.`);
    }
  }
  if (
    !script.includes("quickEffectGroupFor") ||
    !script.includes("window.PFEffectTracker?.sourceGroup?.(effect)")
  ) {
    results.push("Map effect groups: missing shared effect classification gateway.");
  }
  if (tracker.includes('["personal",'))
    results.push("Map effect groups: obsolete Personal navigation is still present.");
  if (tracker.includes('["passives",'))
    results.push("Map effect groups: passive effects must not appear in Use Powers.");
  if (
    !script.includes("characterOwnedSpellEffects") ||
    !script.includes("browser.spellsHtml") ||
    !script.includes("browser.rowHtml") ||
    !script.includes("window.PFEffectTracker?.browser?.navHtml?.()") ||
    !script.includes("activatableEffectSourcesForCharacter") ||
    !script.includes("passiveEffectSourcesForCharacter") ||
    !script.includes("openMapOwnedSpellDetails") ||
    !script.includes("spellDetailsForCharacter") ||
    !script.includes("authoredCatalogEffects") ||
    !script.includes("catalogEffect: true") ||
    !script.includes('quickEffectGroup === "other"') ||
    !html.includes('class="nav nav-pills effect-browser-nav"')
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
    functionName: "resolveActivationDecisions",
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
  "class-feature-pool-editor.html",
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
    name: "Standalone class feature pool authoring gateway",
    file: "scripts/pages/class-feature-pool-editor.js",
    markers: ["PFClassFeaturePoolEditor.open", "poolPayload"],
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
checkSpellBrowserLayouts(errors);
checkInventoryActiveAbilityGateway(errors);
checkMapItemActiveAbilityGateway(errors);
checkMapEffectGroupNavigation(errors);
checkRuntimeBonusPersistenceGate(errors);
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
