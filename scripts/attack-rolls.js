(function (root, factory) {
  const api = factory(root);
  if (root) root.PFAttackRolls = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const ATTACK_TYPES = Object.freeze({
    melee: { label: "Melee Attack", ability: "str", rollKind: "attacks" },
    ranged: { label: "Ranged Attack", ability: "dex", rollKind: "attacks" },
    "melee-touch": { label: "Melee Touch Attack", ability: "str", rollKind: "attacks" },
    "ranged-touch": { label: "Ranged Touch Attack", ability: "dex", rollKind: "attacks" },
    "cmb-bull-rush": { label: "Bull Rush", ability: "str", rollKind: "cmb" },
    "cmb-dirty-trick": { label: "Dirty Trick", ability: "str", rollKind: "cmb" },
    "cmb-disarm": { label: "Disarm", ability: "str", rollKind: "cmb" },
    "cmb-drag": { label: "Drag", ability: "str", rollKind: "cmb" },
    "cmb-grapple": { label: "Grapple", ability: "str", rollKind: "cmb" },
    "cmb-overrun": { label: "Overrun", ability: "str", rollKind: "cmb" },
    "cmb-reposition": { label: "Reposition", ability: "str", rollKind: "cmb" },
    "cmb-steal": { label: "Steal", ability: "str", rollKind: "cmb" },
    "cmb-sunder": { label: "Sunder", ability: "str", rollKind: "cmb" },
    "cmb-trip": { label: "Trip", ability: "str", rollKind: "cmb" },
  });

  const ATTACK_ABILITIES = new Set([
    "default",
    "casting",
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha",
  ]);

  const PAYLOAD_KEYS = Object.freeze([
    "effects",
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "useUntrained",
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
  ]);

  function numberOr(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function scaledValue(value, scale, context = {}) {
    if (root?.PFDamageRolls?.scaledValue)
      return root.PFDamageRolls.scaledValue(value, scale, context);
    if (root?.PFBuffs?.scaledBonusValue) {
      return root.PFBuffs.scaledBonusValue(
        { value, bonusScale: scale },
        {
          casterLevel: context.casterLevel,
          characterLevel: context.characterLevel,
          classLevel: context.classLevel,
          classLevels: context.classLevels,
        },
        context,
      );
    }
    return numberOr(value, 0);
  }

  function normalizeAttack(attack = {}, index = 0) {
    const attackType = ATTACK_TYPES[attack.attackType]
      ? attack.attackType
      : "melee-touch";
    const customBab = optionalNumber(attack.customBab);
    return {
      ...attack,
      id: String(attack.id || `attack-${index + 1}`),
      label: String(attack.label || `Attack ${index + 1}`).trim(),
      attackCount: Math.max(1, Math.floor(numberOr(attack.attackCount, 1))),
      attackCountScale: attack.attackCountScale || null,
      attackType,
      attackAbility: ATTACK_ABILITIES.has(attack.attackAbility)
        ? attack.attackAbility
        : "default",
      originalBabScale: attack.originalBabScale || null,
      customBab:
        customBab === 0 && !attack.customBabScale ? null : customBab,
      customBabScale: attack.customBabScale || null,
    };
  }

  function normalizeAttacks(attacks = []) {
    return (Array.isArray(attacks) ? attacks : []).map(normalizeAttack);
  }

  function abilityModifier(attack, context = {}) {
    if (attack.attackAbility === "casting") {
      return {
        ability: String(context.castingAbility || "casting").toLowerCase(),
        label: String(context.castingAbility || "Casting").toUpperCase(),
        modifier: numberOr(context.castingAbilityMod, 0),
      };
    }
    const ability =
      attack.attackAbility && attack.attackAbility !== "default"
        ? attack.attackAbility
        : ATTACK_TYPES[attack.attackType].ability;
    const longNames = {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
    };
    const longName = longNames[ability];
    const explicit =
      context.abilityMods?.[ability] ??
      context.abilityMods?.[longName] ??
      context.abilityMods?.[ability.toUpperCase()];
    if (Number.isFinite(Number(explicit))) {
      return { ability, label: ability.toUpperCase(), modifier: Number(explicit) };
    }
    const score = context.abilityScores?.[ability] ?? context.abilityScores?.[longName];
    return {
      ability,
      label: ability.toUpperCase(),
      modifier: Number.isFinite(Number(score))
        ? Math.floor((Number(score) - 10) / 2)
        : 0,
    };
  }

  function calculateAttack(attack, context = {}) {
    const normalized = normalizeAttack(attack);
    const count = Math.max(
      1,
      Math.floor(
        scaledValue(
          normalized.attackCount,
          normalized.attackCountScale,
          context,
        ),
      ),
    );
    const bab =
      normalized.customBab === null
        ? scaledValue(
            numberOr(context.bab, 0),
            normalized.originalBabScale,
            context,
          )
        : scaledValue(
            normalized.customBab,
            normalized.customBabScale,
            context,
          );
    const ability = abilityModifier(normalized, context);
    const contextConditionals =
      ATTACK_TYPES[normalized.attackType].rollKind === "cmb"
        ? context.cmbConditionals
        : context.attackConditionals;
    return {
      ...normalized,
      count,
      bab,
      ability: ability.ability,
      abilityLabel: ability.label,
      abilityBonus: ability.modifier,
      attackBonus: bab + ability.modifier,
      attackTypeLabel: ATTACK_TYPES[normalized.attackType].label,
      rollKind: ATTACK_TYPES[normalized.attackType].rollKind,
      conditionals: [
        ...(Array.isArray(contextConditionals) ? contextConditionals : []),
        ...(Array.isArray(context.attackConditionalsByType?.[normalized.attackType])
          ? context.attackConditionalsByType[normalized.attackType]
          : []),
        ...(Array.isArray(normalized.conditionals) ? normalized.conditionals : []),
      ],
    };
  }

  function rollAttacks(attacks = [], context = {}, random = Math.random) {
    return normalizeAttacks(attacks).flatMap((attack, attackIndex) => {
      const calculated = calculateAttack(attack, context);
      return Array.from({ length: calculated.count }, (_, sequence) => {
        const die = Math.floor(random() * 20) + 1;
        return {
          attackIndex,
          sequence,
          attack: calculated,
          die,
          bonus: calculated.attackBonus,
          total: die + calculated.attackBonus,
          hit: false,
        };
      });
    });
  }

  function payloadForSuccessfulAttacks(effect = {}, results = []) {
    const resolved = { ...effect };
    delete resolved.attackRolls;
    const successful = (Array.isArray(results) ? results : []).filter(
      (result) => result.hit,
    );
    const keys = root?.PFEffectMechanics?.mechanicKeys?.() || PAYLOAD_KEYS;
    keys.filter((key) => key !== "attackRolls").forEach((key) => {
      const targetKey = key === "effects" && Array.isArray(effect.bonuses)
        ? "bonuses"
        : key;
      const base = Array.isArray(effect[targetKey]) ? effect[targetKey] : [];
      const additions = successful.flatMap((result) => {
        const rows = Array.isArray(result.attack?.[key])
          ? result.attack[key]
          : key === "effects" && Array.isArray(result.attack?.bonuses)
            ? result.attack.bonuses
            : [];
        return rows;
      });
      resolved[targetKey] = [...base, ...additions];
    });
    return resolved;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function signed(value) {
    const number = Number(value || 0);
    return number >= 0 ? `+${number}` : String(number);
  }

  function ensureModal() {
    if (typeof document === "undefined") return null;
    let modal = document.getElementById("effectAttackRollModal");
    if (modal) return modal;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal fade" id="effectAttackRollModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="effectAttackRollModalLabel">Attack</h5>
            </div>
            <div class="modal-body" id="effectAttackRollModalBody"></div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="effectAttackRollConfirm">Continue</button>
            </div>
          </div>
        </div>
      </div>`,
    );
    return document.getElementById("effectAttackRollModal");
  }

  function resultCard(result, index, rolling, allowSelection) {
    const sequence = result.attack.count > 1 ? ` ${result.sequence + 1}` : "";
    return `<section class="attack-roll-card" data-attack-result-index="${index}">
      <div class="attack-roll-result-label">${escapeHtml(result.attack.label)}${sequence} <span>${escapeHtml(result.attack.attackTypeLabel)}</span></div>
      <div class="attack-roll-die-value${rolling ? " is-rolling" : ""}" data-attack-die>${escapeHtml(rolling ? 0 : result.die)}</div>
      <div class="attack-roll-result-row"><span>Bonus</span><strong>${escapeHtml(signed(result.bonus))}</strong></div>
      <hr class="attack-roll-total-divider">
      <div class="attack-roll-result-row attack-roll-total-row"><span>Total</span><strong data-attack-total>${escapeHtml(rolling ? "..." : result.total)}</strong></div>
      <div class="attack-roll-formula">BAB ${escapeHtml(signed(result.attack.bab))} + ${escapeHtml(result.attack.abilityLabel)} ${escapeHtml(signed(result.attack.abilityBonus))}</div>
      <div class="d20-boost-pool" data-attack-conditionals></div>
      ${
        allowSelection
          ? `<label class="attack-roll-hit form-check${rolling ? " d-none" : ""}">
        <input class="form-check-input" type="checkbox" data-attack-hit>
        <span class="form-check-label">${result.attack.rollKind === "cmb" ? "Succeeded" : "Hit"}</span>
      </label>`
          : ""
      }
    </section>`;
  }

  function renderConditionals(body, results) {
    body.querySelectorAll("[data-attack-result-index]").forEach((card) => {
      const result = results[Number(card.dataset.attackResultIndex)];
      const entries = (Array.isArray(result?.attack?.conditionals)
        ? result.attack.conditionals
        : []
      ).filter((entry) => numberOr(entry?.value ?? entry?.bonus, 0));
      const host = card.querySelector("[data-attack-conditionals]");
      if (!host || !entries.length) return;
      result.appliedConditionals ||= [];
      host.innerHTML = `<div class="d20-boost-pool-title">Applicable conditionals</div>${entries
        .map((entry, index) => {
          const value = numberOr(entry.value ?? entry.bonus, 0);
          const label =
            entry.source || entry.name || entry.label || entry.appliesWhen || "Conditional";
          return `<label class="form-check"><input class="form-check-input" type="checkbox" data-attack-conditional="${index}"><span class="form-check-label">${escapeHtml(label)} (${escapeHtml(signed(value))})</span></label>`;
        })
        .join("")}`;
      host.querySelectorAll("[data-attack-conditional]").forEach((input) =>
        input.addEventListener("change", () => {
          const index = Number(input.dataset.attackConditional);
          const entry = entries[index];
          const value = numberOr(entry?.value ?? entry?.bonus, 0);
          result.total += input.checked ? value : -value;
          if (input.checked) result.appliedConditionals.push(entry);
          else
            result.appliedConditionals = result.appliedConditionals.filter(
              (selected) => selected !== entry,
            );
          card.querySelector("[data-attack-total]").textContent = result.total;
        }),
      );
    });
  }

  function resultsHtml(results, rolling = false) {
    return `<div class="attack-roll-list">${results
      .map((result, index) =>
        resultCard(result, index, rolling, results.length > 1),
      )
      .join("")}</div>`;
  }

  function boostFormula(resource) {
    const boost = resource.boost;
    const dice = boost.diceCount ? `${boost.diceCount}d${boost.dieType}` : "";
    const staticValue = numberOr(boost.staticValue, 0);
    return [dice, staticValue ? signed(staticValue) : ""].filter(Boolean).join(" ") || "+0";
  }

  function renderBoostPools(body, results, session, context) {
    if (!root?.PFD20Boosts || !session) return;
    body.querySelectorAll("[data-attack-result-index]").forEach((card) => {
      const result = results[Number(card.dataset.attackResultIndex)];
      const rollKind = result.attack.rollKind || "attacks";
      const resources = root.PFD20Boosts.collectResources({
        sources: session.sources,
        usage: session.usage,
        rollKind,
        context,
        activeEffects: session.activeEffects,
      });
      let pool = card.querySelector("[data-d20-boost-pool]");
      if (!pool) {
        pool = document.createElement("div");
        pool.dataset.d20BoostPool = "";
        pool.className = "d20-boost-pool";
        card.appendChild(pool);
      }
      pool.innerHTML = resources.length
        ? `<div class="d20-boost-pool-title">Available boosts</div>${resources.map((resource, index) => `<div class="d20-boost-resource"><button class="btn btn-outline-info btn-sm" type="button" data-apply-d20-boost="${index}"><span>${escapeHtml(resource.source.name || resource.boost.label)}</span><small>${escapeHtml(boostFormula(resource))} ${escapeHtml(resource.boost.bonusType)} &middot; ${resource.remaining}/${resource.maxUses}</small></button><button class="btn btn-outline-light btn-sm btn-icon" type="button" data-refill-d20-boost="${index}" title="Refill uses" aria-label="Refill uses"><i class="bi bi-arrow-clockwise"></i></button></div>`).join("")}<div class="d20-boost-applied" data-d20-boost-applied></div>`
        : "";
      const applied = pool.querySelector("[data-d20-boost-applied]");
      if (applied && result.appliedD20Boosts?.length) {
        applied.innerHTML = result.appliedD20Boosts.map((entry) => `<div>${escapeHtml(entry.label)}: ${signed(entry.value)}${entry.effective !== entry.value ? ` (${signed(entry.effective)} stacks)` : ""}</div>`).join("");
      }
      pool.querySelectorAll("[data-apply-d20-boost]").forEach((button) => button.addEventListener("click", async () => {
        const resource = resources[Number(button.dataset.applyD20Boost)];
        if (!resource) return;
        const rolled = root.PFD20Boosts.rollBoost(resource, Math.random, { ...context, sourceEffect: resource.source });
        result.appliedD20Boosts ||= [];
        const baseline = root.PFD20Boosts.baselineBonuses({
          sources: session.sources,
          rollKind,
          context,
          roll: { label: result.attack.label, attackType: result.attack.attackType },
        });
        const effective = root.PFD20Boosts.stackingValue([...baseline, ...result.appliedD20Boosts], rolled);
        result.appliedD20Boosts.push({ ...rolled, effective, label: resource.source.name || resource.boost.label });
        result.total += effective;
        card.querySelector("[data-attack-total]").textContent = result.total;
        session.usage = root.PFD20Boosts.spend(session.usage, resource);
        renderBoostPools(body, results, session, context);
        await session.onUsageChange?.(session.usage);
      }));
      pool.querySelectorAll("[data-refill-d20-boost]").forEach((button) => button.addEventListener("click", async () => {
        const resource = resources[Number(button.dataset.refillD20Boost)];
        if (!resource) return;
        session.usage = root.PFD20Boosts.refill(session.usage, resource);
        renderBoostPools(body, results, session, context);
        await session.onUsageChange?.(session.usage);
      }));
    });
  }

  function animate(body) {
    body.querySelectorAll("[data-attack-die]").forEach((node) => {
      node.textContent = String(Math.floor(Math.random() * 20) + 1);
    });
  }

  async function open({ title = "Attack", attacks = [], context = {} } = {}) {
    const normalized = normalizeAttacks(attacks);
    if (!normalized.length || !root?.bootstrap?.Modal) return null;
    const results = rollAttacks(normalized, context);
    const modalEl = ensureModal();
    const body = modalEl.querySelector("#effectAttackRollModalBody");
    const confirm = modalEl.querySelector("#effectAttackRollConfirm");
    const dismiss = modalEl.querySelector(".modal-footer [data-bs-dismiss]");
    modalEl.querySelector("#effectAttackRollModalLabel").textContent = title;
    body.innerHTML = resultsHtml(results, true);
    dismiss.textContent = "Cancel";
    dismiss.disabled = true;
    confirm.textContent = "Rolling...";
    confirm.disabled = true;
    const modal = root.bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: "static",
      keyboard: false,
    });
    return new Promise((resolve) => {
      let settled = false;
      let completed = false;
      let interval = null;
      let timeout = null;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const onHidden = () => {
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        finish(completed ? results : null);
      };
      modalEl.addEventListener("hidden.bs.modal", onHidden);
      confirm.onclick = () => {
        const singleAttack = results.length === 1;
        body.querySelectorAll("[data-attack-result-index]").forEach((card) => {
          const result = results[Number(card.dataset.attackResultIndex)];
          result.hit =
            singleAttack ||
            Boolean(card.querySelector("[data-attack-hit]")?.checked);
        });
        completed = true;
        modal.hide();
      };
      modal.show();
      animate(body);
      interval = setInterval(() => animate(body), 55);
      timeout = setTimeout(() => {
        clearInterval(interval);
        interval = null;
        body.innerHTML = resultsHtml(results, false);
        renderConditionals(body, results);
        renderBoostPools(body, results, context.d20BoostSession, context);
        dismiss.disabled = false;
        confirm.textContent = "Continue";
        confirm.disabled = false;
      }, 1000);
    });
  }

  function summary(results = []) {
    return (Array.isArray(results) ? results : [])
      .map(
        (result) =>
          `${result.attack.label}${result.attack.count > 1 ? ` ${result.sequence + 1}` : ""}: d20 ${signed(result.bonus)} = ${result.total} (${result.hit ? (result.attack.rollKind === "cmb" ? "success" : "hit") : (result.attack.rollKind === "cmb" ? "failure" : "miss")})`,
      )
      .join("; ");
  }

  return {
    ATTACK_TYPES,
    PAYLOAD_KEYS,
    normalizeAttack,
    normalizeAttacks,
    calculateAttack,
    rollAttacks,
    payloadForSuccessfulAttacks,
    open,
    summary,
  };
});
