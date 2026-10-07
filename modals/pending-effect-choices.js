// Player-side half of the cross-device choice flow: a GM applying a
// choice-needing effect to a character they don't own (buff-tracker-
// widget.js's requestEffectChoice) queues a row in
// effect_choice_requests instead of picking for that player. This
// module polls for pending requests against every character the current
// user controls and lets them answer -- on whatever device/session they
// happen to have open -- without the requester ever seeing the picker.
//
// Handles a user controlling multiple characters the same way it
// handles one: every pending request for every character they control
// shows up in the same panel, answered one at a time.
(function () {
  const PANEL_ID = "pendingEffectChoicesPanel";
  const CHOICE_POOL_MECHANIC_KEYS =
    window.PFEffectMechanics?.extraKeys?.() || [
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
      "damageRolls",
    ];
  let pollTimer = null;
  let pollOptions = null;
  const resolving = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function ensureStyle() {
    if (document.getElementById("pendingEffectChoicesStyles")) return;
    const style = document.createElement("style");
    style.id = "pendingEffectChoicesStyles";
    style.textContent = `
      .pending-effect-choices-panel {
        position: fixed;
        top: 70px;
        right: 16px;
        z-index: 1080;
        width: min(320px, calc(100vw - 32px));
        background: #1c1c1c;
        border: 1px solid #444;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        overflow: hidden;
      }
      .pending-effect-choices-header {
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 600;
        background: #242424;
        border-bottom: 1px solid #333;
        color: #f5e9c8;
      }
      .pending-effect-choices-list {
        max-height: 260px;
        overflow-y: auto;
      }
      .pending-effect-choices-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid #2c2c2c;
      }
      .pending-effect-choices-row:last-child {
        border-bottom: none;
      }
      .pending-effect-choices-name {
        color: #fff;
        font-weight: 600;
        font-size: 13px;
      }
      .pending-effect-choices-source {
        color: #aaa;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    ensureStyle();
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "pending-effect-choices-panel d-none";
    document.body.appendChild(panel);
    return panel;
  }

  function renderPanel(requests) {
    const panel = ensurePanel();
    if (!requests.length) {
      panel.classList.add("d-none");
      panel.innerHTML = "";
      return;
    }
    panel.classList.remove("d-none");
    panel.innerHTML = `
      <div class="pending-effect-choices-header">
        <i class="bi bi-magic"></i> ${requests.length} effect${requests.length === 1 ? "" : "s"} waiting for your choice
      </div>
      <div class="pending-effect-choices-list">
        ${requests
          .map(
            (request) => `
          <div class="pending-effect-choices-row">
            <div>
              <div class="pending-effect-choices-name">${escapeHtml(request.effect_name || "Effect")}</div>
              ${request.characterName ? `<div class="pending-effect-choices-source">for ${escapeHtml(request.characterName)}</div>` : ""}
            </div>
            <button class="btn btn-info btn-sm" type="button" data-resolve-request="${escapeHtml(request.id)}">Choose</button>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
    panel.querySelectorAll("[data-resolve-request]").forEach((button) => {
      button.addEventListener("click", () => {
        const request = requests.find(
          (item) => item.id === button.dataset.resolveRequest,
        );
        if (request) resolveRequest(request);
      });
    });
  }

  // Walks every "choice:" stat in a list of stat-bearing items (an
  // ability's bonuses, or its classSkillGrants -- both carry the same
  // { stat, skillName? } shape) the same way buff-tracker-widget.js's
  // resolveChoiceStats does. Returns the resolved list, or null if a
  // pick was cancelled.
  async function resolveChoiceStats(items, request) {
    const list = Array.isArray(items) ? items : [];
    const resolved = [];
    let equipment;
    let equipmentLoaded = false;
    for (const item of list) {
      if (!window.PFEffectStats?.isChoiceStat(item.stat)) {
        resolved.push(item);
        continue;
      }
      const poolId = window.PFEffectStats.choicePoolIdFromStat(item.stat);
      const pool = window.PFEffectStats.poolById(poolId);
      if (pool?.kind === "equipment" && !equipmentLoaded) {
        equipment = await pollOptions?.choicePoolEquipmentFor?.(
          request.character_id,
        );
        equipmentLoaded = true;
      }
      const options = await window.PFEffectStats.resolveChoicePoolOptions(
        poolId,
        {
          skills: pollOptions?.choicePoolSkillsFor?.(request.character_id),
          equipment,
          choicePool: item.choicePool,
        },
      );
      const picked = window.PFEffectChoicePicker
        ? await window.PFEffectChoicePicker.open({
            title: `${request.effect_name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}: Choose ${pool?.label || "a Target"}`,
            options,
          })
        : null;
      if (!picked) return null;
      resolved.push(
        window.PFEffectStats.resolveChoiceStatItem(item, picked, options),
      );
    }
    return resolved;
  }

  function bonusUsesFavoredEnemyScale(bonus = {}) {
    const source = (bonus.bonusScale || bonus.scale || {}).source || {};
    return source.type === "special" && source.special === "favored-enemy-bonus";
  }

  function favoredEnemyScaleTarget(bonus = {}) {
    return (
      bonus.bonusScale?.favoredEnemyTarget ||
      bonus.bonusScale?.target ||
      bonus.scale?.favoredEnemyTarget ||
      bonus.scale?.target ||
      bonus.favoredEnemyTarget ||
      bonus.targetFavoredEnemy ||
      ""
    );
  }

  function needsFavoredEnemyScaleChoice(bonus = {}) {
    if (!bonusUsesFavoredEnemyScale(bonus)) return false;
    if (favoredEnemyScaleTarget(bonus)) return false;
    return (
      !bonus.appliesWhen ||
      /favou?red enemy|\{[^{}]+\}/i.test(bonus.appliesWhen)
    );
  }

  async function resolveFavoredEnemyScaleTargets(items = [], request = {}) {
    const list = Array.isArray(items) ? items : [];
    if (!list.some(needsFavoredEnemyScaleChoice)) return list;
    const options = pollOptions?.favoredEnemyOptionsFor?.(request.character_id) || [];
    if (!options.length) return null;
    const resolved = [];
    for (const item of list) {
      if (!needsFavoredEnemyScaleChoice(item)) {
        resolved.push(item);
        continue;
      }
      const picked = window.PFEffectChoicePicker
        ? await window.PFEffectChoicePicker.open({
            title: `${request.effect_name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}: Choose Favored Enemy`,
            options,
          })
        : null;
      if (!picked) return null;
      const target =
        typeof picked === "object"
          ? picked.favoredEnemyTarget || picked.name || picked.value
          : String(picked || "");
      if (!target) return null;
      const scale = item.bonusScale || item.scale || {};
      resolved.push({
        ...item,
        bonusScale: { ...scale, favoredEnemyTarget: target },
        favoredEnemyTarget: target,
        conditional: true,
        appliesWhen:
          !item.appliesWhen || /favou?red enemy|\{[^{}]+\}/i.test(item.appliesWhen)
            ? `against ${target}`
            : item.appliesWhen,
      });
    }
    return resolved;
  }

  function spellLikeChoiceList(entry = {}) {
    return (
      entry.spellChoiceList ||
      window.PFEffectStats?.customSpellLikeListById?.(
        entry.spellChoiceListId || "",
      ) ||
      null
    );
  }

  async function resolveSpellLikeAbilityChoices(entries, request) {
    const list = Array.isArray(entries) ? entries : [];
    if (!list.some(spellLikeChoiceList)) return list;
    const resolved = [];
    for (const entry of list) {
      const choiceList = spellLikeChoiceList(entry);
      if (!choiceList) {
        resolved.push(entry);
        continue;
      }
      const spells = (choiceList.items || []).map((item) => ({
        name: item.name || item.spellName || item.label || item.value,
        spellName: item.name || item.spellName || item.label || item.value,
      }));
      const picked = window.PFMagicSearchModal
        ? await window.PFMagicSearchModal.open({
            title: `${request.effect_name || "Effect"}: Choose SLA`,
            spells,
          })
        : null;
      if (!picked) return null;
      const { spellChoiceList, spellChoiceListId, ...rest } = entry;
      resolved.push({
        ...rest,
        spellName: picked.name || picked.spellName || "Spell",
      });
    }
    return resolved;
  }

  function spellAdjustmentEntriesNeedChoice(entries = []) {
    return (Array.isArray(entries) ? entries : []).some((entry) =>
      window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(entry),
    );
  }

  async function resolveSpellAdjustmentChoices(entries = [], request = {}) {
    const list = Array.isArray(entries) ? entries : [];
    if (!spellAdjustmentEntriesNeedChoice(list)) return list;
    if (!window.PFEffectEditor?.resolveSpellAdjustmentChoices) return null;
    return window.PFEffectEditor.resolveSpellAdjustmentChoices(list, {
      title: `${request.effect_name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}`,
    });
  }

  function grantDomainEntriesNeedChoice(entries = []) {
    return (Array.isArray(entries) ? entries : []).some((entry) =>
      window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(entry),
    );
  }

  async function resolveGrantDomainChoices(entries = [], request = {}) {
    const list = Array.isArray(entries) ? entries : [];
    if (!grantDomainEntriesNeedChoice(list)) return list;
    if (!window.PFEffectEditor?.resolveGrantDomainChoices) return null;
    return window.PFEffectEditor.resolveGrantDomainChoices(list, {
      title: `${request.effect_name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}`,
    });
  }

  function conditionalVariables(effect = {}) {
    return Array.isArray(effect.conditionalVariables)
      ? effect.conditionalVariables
      : [];
  }

  function normalizeConditionalVariableKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ");
  }

  function cleanFavoredEnemyLabel(value = "") {
    return String(value || "")
      .replace(/\s*\([+-]?\d+\)\s*$/g, "")
      .trim();
  }

  function conditionalVariableTokenValue(key = "", choice = {}) {
    const fallback = choice?.label || choice?.name || choice?.value || "";
    return normalizeConditionalVariableKey(key).startsWith("favored enemy")
      ? cleanFavoredEnemyLabel(choice?.value || choice?.name || fallback)
      : fallback;
  }

  function conditionalChoiceLabel(choices = {}, key = "") {
    const wanted = normalizeConditionalVariableKey(key);
    if (!wanted) return "";
    const entry = Object.entries(choices || {}).find(
      ([choiceKey]) => normalizeConditionalVariableKey(choiceKey) === wanted,
    )?.[1];
    return normalizeConditionalVariableKey(key).startsWith("favored enemy")
      ? cleanFavoredEnemyLabel(entry?.value || entry?.name || entry?.label || "")
      : entry?.label || entry?.name || entry?.value || "";
  }

  function favoredEnemyOptionsWithTargets(options = [], targets = []) {
    const byTarget = new Map();
    const add = (option = {}) => {
      const target = cleanFavoredEnemyLabel(
        option.favoredEnemyTarget || option.name || option.value || option.label || "",
      );
      if (!target) return;
      const key = target.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (!key || byTarget.has(key)) return;
      byTarget.set(key, {
        ...option,
        value: target,
        name: target,
        favoredEnemyTarget: target,
        label: target,
      });
    };
    (Array.isArray(options) ? options : []).forEach(add);
    targets.forEach((target) =>
      add({
        value: target,
        label: target,
        name: target,
        favoredEnemyTarget: target,
      }),
    );
    return [...byTarget.values()].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }

  function replaceConditionalVariableTokens(text = "", choices = {}) {
    return String(text || "").replace(/\{([^{}]+)\}/g, (match, key) => {
      const choice = choices[normalizeConditionalVariableKey(key)];
      return choice ? conditionalVariableTokenValue(key, choice) || match : match;
    });
  }

  function interpolateConditionalVariables(value, choices = {}) {
    if (Array.isArray(value))
      return value.map((item) => interpolateConditionalVariables(item, choices));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          interpolateConditionalVariables(entry, choices),
        ]),
      );
    }
    if (typeof value === "string")
      return replaceConditionalVariableTokens(value, choices);
    return value;
  }

  async function resolveConditionalVariables(effect = {}, request = {}) {
    const variables = conditionalVariables(effect)
      .map((variable) => ({
        ...variable,
        key: normalizeConditionalVariableKey(
          variable.key || variable.name || variable.label,
        ),
        poolId:
          variable.poolId ||
          variable.pool ||
          variable.source ||
          "ranger-favored-enemies",
      }))
      .filter((variable) => variable.key);
    if (!variables.length) return effect;
    const choices = { ...(effect.conditionalChoices || {}) };
    for (const variable of variables) {
      if (choices[variable.key]) continue;
      const pool = window.PFEffectStats?.conditionalVariablePoolById?.(
        variable.poolId,
      );
      const additionalTargets = [
        conditionalChoiceLabel(choices, "favored enemy"),
      ].filter(Boolean);
      const options =
        variable.poolId === "character-favored-enemies"
          ? favoredEnemyOptionsWithTargets(
              pollOptions?.favoredEnemyOptionsFor?.(request.character_id) || [],
              additionalTargets,
            )
          : (await window.PFEffectStats?.resolveConditionalVariableOptions?.(
              variable.poolId,
            )) || [];
      const picked = window.PFEffectChoicePicker
        ? await window.PFEffectChoicePicker.open({
            title: `${request.effect_name || effect.name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}: Choose ${variable.label || variable.key}`,
            options,
          })
        : null;
      if (!picked) return null;
      const pickedValue =
        typeof picked === "object" ? picked.value : String(picked || "");
      const pickedOption =
        options.find((option) => String(option.value) === pickedValue) ||
        (typeof picked === "object" ? picked : null);
      choices[variable.key] = {
        value: pickedValue,
        label: pickedOption?.label || pickedValue,
        poolId: variable.poolId,
        poolLabel: pool?.label || variable.poolLabel || "",
      };
    }
    return interpolateConditionalVariables(
      {
        ...effect,
        conditionalVariables: variables,
        conditionalChoices: choices,
      },
      choices,
    );
  }
  function choicePools(effect = {}) {
    return Array.isArray(effect.choicePools)
      ? effect.choicePools
      : Array.isArray(effect.pools)
        ? effect.pools
        : [];
  }

  function appendChoicePoolMechanics(target = {}, option = {}) {
    const effects = Array.isArray(option.effects)
      ? option.effects
      : Array.isArray(option.bonuses)
        ? option.bonuses
        : [];
    if (effects.length) {
      target.bonuses = [
        ...(Array.isArray(target.bonuses) ? target.bonuses : []),
        ...effects,
      ];
    }
    CHOICE_POOL_MECHANIC_KEYS.forEach((key) => {
      const rows = Array.isArray(option[key]) ? option[key] : [];
      if (!rows.length) return;
      target[key] = [
        ...(Array.isArray(target[key]) ? target[key] : []),
        ...rows,
      ];
    });
  }

  async function resolveChoicePoolOptionMechanics(option = {}, request = {}) {
    const choiceResolvedEffects = await resolveChoiceStats(
      option.effects || option.bonuses,
      request,
    );
    if (choiceResolvedEffects === null) return null;
    const resolvedEffects = await resolveFavoredEnemyScaleTargets(
      choiceResolvedEffects,
      request,
    );
    if (resolvedEffects === null) return null;
    const resolvedClassSkillGrants = await resolveChoiceStats(
      option.classSkillGrants,
      request,
    );
    if (resolvedClassSkillGrants === null) return null;
    const resolvedBonusRanks = await resolveChoiceStats(
      option.bonusRanks,
      request,
    );
    if (resolvedBonusRanks === null) return null;
    const resolvedSpellLikeAbilities = await resolveSpellLikeAbilityChoices(
      option.spellLikeAbilities,
      request,
    );
    if (resolvedSpellLikeAbilities === null) return null;
    const resolvedCasterLevelBonuses = await resolveSpellAdjustmentChoices(
      option.casterLevelBonuses,
      request,
    );
    if (resolvedCasterLevelBonuses === null) return null;
    const resolvedSpellDcBonuses = await resolveSpellAdjustmentChoices(
      option.spellDcBonuses,
      request,
    );
    if (resolvedSpellDcBonuses === null) return null;
    const resolvedEffectiveAttributeBonuses =
      await resolveSpellAdjustmentChoices(
        option.effectiveAttributeBonuses,
        request,
      );
    if (resolvedEffectiveAttributeBonuses === null) return null;
    const resolvedGrantDomains = await resolveGrantDomainChoices(
      option.grantDomains,
      request,
    );
    if (resolvedGrantDomains === null) return null;
    return {
      ...option,
      effects: resolvedEffects,
      classSkillGrants: resolvedClassSkillGrants,
      bonusRanks: resolvedBonusRanks,
      spellLikeAbilities: resolvedSpellLikeAbilities,
      casterLevelBonuses: resolvedCasterLevelBonuses,
      spellDcBonuses: resolvedSpellDcBonuses,
      effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses,
      grantDomains: resolvedGrantDomains,
    };
  }

  async function resolveChoicePools(effect = {}, request = {}) {
    const pools = choicePools(effect);
    if (!pools.length) return {};
    if (!window.PFClassFeatureChoicePicker) return null;
    const mechanics = {};
    for (const [index, pool] of pools.entries()) {
      const poolKey = pool.name || `Choice ${index + 1}`;
      const choice = await PFClassFeatureChoicePicker.open({
        title: `${request.effect_name || effect.name || "Effect"}: ${pool.name || "Choose Feature"}`,
        poolName: pool.name || "Effect Choice",
        description: pool.description || "",
        selected: effect.poolChoices?.[poolKey] || "",
        options: Array.isArray(pool.options) ? pool.options : [],
      });
      if (choice === null) return null;
      if (!choice) continue;
      const option = (pool.options || []).find((item) => item.name === choice);
      if (!option) continue;
      const resolvedOption = await resolveChoicePoolOptionMechanics(
        option,
        request,
      );
      if (!resolvedOption) return null;
      appendChoicePoolMechanics(mechanics, resolvedOption);
    }
    return mechanics;
  }

  // Then saves the finished effect straight into that character's own
  // buff state and marks the request resolved. Cancelling a pick leaves
  // the request pending (nothing saved) so it just reappears next poll.
  async function resolveRequest(request) {
    if (resolving.has(request.id)) return;
    resolving.add(request.id);
    try {
      let ability = request.ability || {};
      if (window.PFEffectMechanics?.hasBranches?.(ability)) {
        ability = await window.PFEffectMechanics.chooseBranch(ability, {
          title: ability.name || request.effect_name || "Effect",
        });
        if (!ability) return;
      }
      const choiceResolved = await resolveChoiceStats(ability.bonuses, request);
      if (choiceResolved === null) return;
      const resolved = await resolveFavoredEnemyScaleTargets(
        choiceResolved,
        request,
      );
      if (resolved === null) return;
      const resolvedClassSkillGrants = await resolveChoiceStats(
        ability.classSkillGrants,
        request,
      );
      if (resolvedClassSkillGrants === null) return;
      const resolvedBonusRanks = await resolveChoiceStats(
        ability.bonusRanks,
        request,
      );
      if (resolvedBonusRanks === null) return;

      const resolvedSpellLikeAbilities = await resolveSpellLikeAbilityChoices(
        ability.spellLikeAbilities,
        request,
      );
      if (resolvedSpellLikeAbilities === null) return;
      const resolvedCasterLevelBonuses = await resolveSpellAdjustmentChoices(
        ability.casterLevelBonuses,
        request,
      );
      if (resolvedCasterLevelBonuses === null) return;
      const resolvedSpellDcBonuses = await resolveSpellAdjustmentChoices(
        ability.spellDcBonuses,
        request,
      );
      if (resolvedSpellDcBonuses === null) return;
      const resolvedEffectiveAttributeBonuses =
        await resolveSpellAdjustmentChoices(
          ability.effectiveAttributeBonuses,
          request,
        );
      if (resolvedEffectiveAttributeBonuses === null) return;
      const resolvedGrantDomains = await resolveGrantDomainChoices(
        ability.grantDomains,
        request,
      );
      if (resolvedGrantDomains === null) return;
      const resolvedChoicePools = await resolveChoicePools(ability, request);
      if (resolvedChoicePools === null) return;
      const { choicePools: _choicePools, pools: _pools, poolChoices, ...abilityBase } =
        ability;

      const finalized = {
        ...abilityBase,
        bonuses: resolved,
        ...(resolvedClassSkillGrants.length
          ? { classSkillGrants: resolvedClassSkillGrants }
          : {}),
        ...(resolvedBonusRanks.length ? { bonusRanks: resolvedBonusRanks } : {}),
        ...(resolvedSpellLikeAbilities.length
          ? { spellLikeAbilities: resolvedSpellLikeAbilities }
          : {}),
        ...(resolvedCasterLevelBonuses.length
          ? { casterLevelBonuses: resolvedCasterLevelBonuses }
          : {}),
        ...(resolvedSpellDcBonuses.length
          ? { spellDcBonuses: resolvedSpellDcBonuses }
          : {}),
        ...(resolvedEffectiveAttributeBonuses.length
          ? { effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses }
          : {}),
        ...(resolvedGrantDomains.length
          ? { grantDomains: resolvedGrantDomains }
          : {}),
      };
      appendChoicePoolMechanics(finalized, resolvedChoicePools);
      const variableResolved = await resolveConditionalVariables(
        finalized,
        request,
      );
      if (variableResolved === null) return;
      const existing = await window.PFApp.loadBuffState(
        pollOptions.contextKey,
        request.character_id,
      );
      const nextBuffs = [
        ...(Array.isArray(existing) ? existing : []),
        variableResolved,
      ];
      const saved = await window.PFApp.saveBuffState(
        nextBuffs,
        pollOptions.contextKey,
        request.character_id,
      );
      if (!saved?.ok) {
        alert("Could not save your choice -- try again.");
        return;
      }
      await window.PFApp.resolveEffectChoiceRequest(request.id, resolved);
      pollOptions?.onResolved?.(request.character_id, finalized);
    } finally {
      resolving.delete(request.id);
      poll();
    }
  }

  async function poll() {
    if (!pollOptions) return;
    const characterIds = pollOptions.characterIds?.() || [];
    const requests =
      (await window.PFApp?.loadPendingEffectChoiceRequests?.(characterIds)) ||
      [];
    const withNames = requests
      .filter((request) => !resolving.has(request.id))
      .map((request) => ({
        ...request,
        characterName: pollOptions.characterNameFor?.(request.character_id) || "",
      }));
    renderPanel(withNames);
  }

  // options: {
  //   contextKey,
  //   characterIds: () => string[] -- every character the current user
  //     controls, re-evaluated each poll so it stays correct if that
  //     changes mid-session,
  //   characterNameFor: (id) => string,
  //   choicePoolSkillsFor: (id) => [[name, ability], ...] (optional),
  //   choicePoolEquipmentFor: async (id) => { weapons, armor } (optional),
  //   favoredEnemyOptionsFor: (id) => choice options for that character's
  //     currently selected favored enemies (optional),
  //   onResolved: (characterId, finalizedEffect) -- called after a
  //     choice is saved, so the page can refresh anything showing that
  //     character's active effects,
  //   intervalMs (optional, default 12000),
  // }
  function start(options = {}) {
    stop();
    pollOptions = options;
    const loop = async () => {
      await poll();
      pollTimer = setTimeout(loop, options.intervalMs || 12000);
    };
    loop();
  }

  function stop() {
    clearTimeout(pollTimer);
    pollTimer = null;
    pollOptions = null;
    document.getElementById(PANEL_ID)?.remove();
  }

  window.PFPendingEffectChoices = { start, stop };
})();




