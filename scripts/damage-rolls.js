(function (root, factory) {
  const api = factory(root);
  if (root) root.PFDamageRolls = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const DIE_SIDES = [2, 3, 4, 6, 8, 10, 12, 20, 100];

  function numberOr(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function optionalMaximum(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  function normalizeProfile(profile = {}, { conditional = false } = {}) {
    return {
      ...(conditional
        ? {
            label: String(profile.label || "Conditional damage").trim(),
            appliesWhen: String(profile.appliesWhen || "").trim(),
          }
        : {}),
      diceCount: Math.max(0, Math.floor(numberOr(profile.diceCount, 0))),
      dieType: DIE_SIDES.includes(Number(profile.dieType))
        ? Number(profile.dieType)
        : Math.max(2, Math.floor(numberOr(profile.dieType, 6))),
      diceCountMax: optionalMaximum(profile.diceCountMax),
      staticDamage: numberOr(profile.staticDamage, 0),
      staticDamageMax: optionalMaximum(profile.staticDamageMax),
      damageType: String(profile.damageType || "untyped").trim() || "untyped",
      diceCountScale: profile.diceCountScale || null,
      staticDamageScale: profile.staticDamageScale || null,
      maximizeDice: Boolean(profile.maximizeDice),
      damageMultiplier: Math.max(0, numberOr(profile.damageMultiplier, 1)),
    };
  }

  function normalizeRoll(roll = {}, index = 0) {
    const standard = normalizeProfile(roll);
    return {
      id: String(roll.id || `damage-${index + 1}`),
      label: String(roll.label || `Damage ${index + 1}`).trim(),
      ...standard,
      conditionals: (Array.isArray(roll.conditionals) ? roll.conditionals : [])
        .map((profile) => normalizeProfile(profile, { conditional: true }))
        .filter((profile) => profile.label),
    };
  }

  function normalizeRolls(rolls = []) {
    return (Array.isArray(rolls) ? rolls : []).map(normalizeRoll);
  }

  function requiresProfileChoice(rolls = []) {
    return normalizeRolls(rolls).some((roll) => roll.conditionals.length > 0);
  }

  function fallbackScaledValue(value, scale, context = {}) {
    if (!scale) return numberOr(value, 0);
    const source = scale.source || { type: "caster" };
    const level =
      source.type === "character"
        ? numberOr(context.characterLevel, 1)
        : source.type === "class"
          ? numberOr(context.classLevels?.[source.className], context.classLevel || 1)
          : numberOr(context.casterLevel, 1);
    const multiplier = scale.levelMultiplier;
    let total = numberOr(value, 0);
    if (multiplier && numberOr(multiplier.denominator, 0) > 0) {
      total += Math.floor(
        (level * numberOr(multiplier.numerator, 0)) /
          numberOr(multiplier.denominator, 1),
      );
    }
    (Array.isArray(scale.milestones) ? scale.milestones : [])
      .filter((entry) => numberOr(entry.level, 0) <= level)
      .sort((a, b) => numberOr(a.level) - numberOr(b.level))
      .forEach((entry) => {
        total = numberOr(entry.value, total);
      });
    const every = scale.every || {};
    const from = numberOr(every.fromLevel || every.afterLevel || every.after, 0);
    const interval = numberOr(every.everyLevels || every.every, 0);
    if (from > 0 && interval > 0 && level >= from) {
      total +=
        (Math.floor((level - from) / interval) + 1) *
        numberOr(every.increase, 0);
    }
    const attributeBonuses = Array.isArray(scale.attributeBonuses)
      ? scale.attributeBonuses
      : scale.attributeBonus
        ? [scale.attributeBonus]
        : [];
    attributeBonuses.forEach((entry) => {
      const key = String(entry.ability || entry.attribute || "").toLowerCase();
      const modifier = numberOr(context.abilityMods?.[key], 0);
      total += Math.floor(
        (modifier * Math.max(1, numberOr(entry.numerator, 1))) /
          Math.max(1, numberOr(entry.denominator, 1)),
      );
    });
    return scale.minimumOne ? Math.max(1, total) : total;
  }

  function scaledValue(value, scale, context = {}) {
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
    return fallbackScaledValue(value, scale, context);
  }

  function selectedProfile(roll, conditionalIndex = -1) {
    const normalized = normalizeRoll(roll);
    if (conditionalIndex < 0 || !normalized.conditionals[conditionalIndex]) {
      return { ...normalized, profileLabel: "Standard" };
    }
    const conditional = normalized.conditionals[conditionalIndex];
    return {
      ...conditional,
      damageType: conditional.damageType || normalized.damageType,
      profileLabel: conditional.label,
    };
  }

  function calculateRoll(roll, context = {}, conditionalIndex = -1) {
    const profile = selectedProfile(roll, conditionalIndex);
    let diceCount = Math.max(
      0,
      Math.floor(scaledValue(profile.diceCount, profile.diceCountScale, context)),
    );
    let staticDamage = scaledValue(
      profile.staticDamage,
      profile.staticDamageScale,
      context,
    );
    if (profile.diceCountMax !== null)
      diceCount = Math.min(diceCount, profile.diceCountMax);
    if (profile.staticDamageMax !== null)
      staticDamage = Math.min(staticDamage, profile.staticDamageMax);
    const diceFormula = diceCount > 0 ? `${diceCount}d${profile.dieType}` : "";
    const staticFormula = staticDamage
      ? diceFormula
        ? ` ${staticDamage >= 0 ? "+" : "-"} ${Math.abs(staticDamage)}`
        : String(staticDamage)
      : "";
    const baseFormula = `${diceFormula}${staticFormula}` || "0";
    return {
      label: normalizeRoll(roll).label,
      profileLabel: profile.profileLabel,
      appliesWhen: profile.appliesWhen || "",
      diceCount,
      dieType: profile.dieType,
      staticDamage,
      damageType: profile.damageType,
      ...(profile.maximizeDice ? { maximizeDice: true } : {}),
      ...(profile.damageMultiplier !== 1
        ? { damageMultiplier: profile.damageMultiplier }
        : {}),
      formula: `${baseFormula}${profile.maximizeDice && diceCount ? " (maximized)" : ""}${profile.damageMultiplier !== 1 ? ` x ${profile.damageMultiplier}` : ""}`,
    };
  }

  function rollCalculated(calculated, random = Math.random) {
    const dice = Array.from({ length: calculated.diceCount }, () =>
      calculated.maximizeDice
        ? calculated.dieType
        : Math.floor(random() * calculated.dieType) + 1,
    );
    const subtotal =
      dice.reduce((sum, value) => sum + value, 0) + calculated.staticDamage;
    return {
      ...calculated,
      dice,
      subtotal,
      total: Math.floor(subtotal * numberOr(calculated.damageMultiplier, 1)),
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureModal() {
    if (typeof document === "undefined") return null;
    let modal = document.getElementById("damageRollModal");
    if (modal) return modal;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal fade" id="damageRollModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="damageRollModalLabel">Damage</h5>
            </div>
            <div class="modal-body" id="damageRollModalBody"></div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="damageRollConfirm">Roll Damage</button>
            </div>
          </div>
        </div>
      </div>`,
    );
    return document.getElementById("damageRollModal");
  }

  function profileOptions(roll) {
    const normalized = normalizeRoll(roll);
    return [
      `<option value="-1">Standard</option>`,
      ...normalized.conditionals.map(
        (profile, index) =>
          `<option value="${index}">${escapeHtml(profile.label)}</option>`,
      ),
    ].join("");
  }

  function configurationHtml(rolls, context) {
    return `<div class="damage-roll-list">${rolls
      .map((roll, index) => {
        const calculated = calculateRoll(roll, context);
        return `<section class="damage-roll-card" data-damage-roll-index="${index}">
          <div class="damage-roll-card-heading">
            <strong>${escapeHtml(roll.label)}</strong>
            <span class="damage-roll-formula" data-damage-preview>${escapeHtml(calculated.formula)} ${escapeHtml(calculated.damageType)}</span>
          </div>
          ${
            roll.conditionals.length
              ? `<select class="form-select" aria-label="${escapeHtml(roll.label)} damage profile" data-damage-profile>${profileOptions(roll)}</select>`
              : ""
          }
        </section>`;
      })
      .join("")}</div>`;
  }

  function signedValue(value) {
    const number = Number(value || 0);
    return number >= 0 ? `+${number}` : String(number);
  }

  function resultLabelHtml(result, index, count) {
    const sequence = count > 1 ? ` ${index + 1}` : "";
    const descriptors = [];
    if (String(result.label || "").trim().toLowerCase() !== "damage") {
      descriptors.push(result.label);
    }
    if (result.profileLabel !== "Standard") descriptors.push(result.profileLabel);
    return `<div class="damage-roll-result-label">Damage${sequence}${
      descriptors.length
        ? `<span class="damage-roll-result-descriptor"> &middot; ${escapeHtml(descriptors.join(" · "))}</span>`
        : ""
    }</div>`;
  }

  function resultCardHtml(result, index, count, rolling = false) {
    const hasDice = result.dice.length > 0;
    const diceTotal = result.dice.reduce((sum, value) => sum + value, 0);
    const diceText = hasDice ? result.dice.join(" + ") : "";
    return `<section class="damage-roll-card damage-roll-result-card${hasDice ? " has-dice" : " static-only"}" data-damage-result-index="${index}">
      ${resultLabelHtml(result, index, count)}
      ${
        hasDice
          ? `<div class="damage-roll-die-value${rolling ? " is-rolling" : ""}" data-damage-roll-dice-total>${escapeHtml(rolling ? 0 : diceTotal)}</div>`
          : ""
      }
      <div class="damage-roll-result-breakdown">
        ${
          hasDice
            ? `<div class="damage-roll-result-row"><span>Rolls</span><strong data-damage-roll-dice>${escapeHtml(rolling ? "0" : diceText)}</strong></div>
              <div class="damage-roll-result-row"><span>Bonus</span><strong>${escapeHtml(signedValue(result.staticDamage))}</strong></div>
              <hr class="damage-roll-total-divider">`
            : ""
        }
        <div class="damage-roll-result-row damage-roll-total-row"><span>Total</span><strong data-damage-roll-total>${escapeHtml(rolling && hasDice ? "..." : result.total)}</strong></div>
      </div>
      <div class="damage-roll-result-note">${escapeHtml(result.formula)} ${escapeHtml(result.damageType)}</div>
    </section>`;
  }
  function rollingHtml(results) {
    return `<div class="damage-roll-list">${results
      .map((result, index) =>
        resultCardHtml(result, index, results.length, result.dice.length > 0),
      )
      .join("")}</div>`;
  }

  function animateRollingResults(body, results) {
    results.forEach((result, index) => {
      if (!result.dice.length || result.maximizeDice) return;
      const section = body.querySelector(`[data-damage-result-index="${index}"]`);
      if (!section) return;
      const dice = Array.from(
        { length: result.dice.length },
        () => Math.floor(Math.random() * result.dieType) + 1,
      );
      section.querySelector("[data-damage-roll-dice-total]").textContent =
        dice.reduce((sum, value) => sum + value, 0);
      section.querySelector("[data-damage-roll-dice]").textContent =
        dice.length ? dice.join(" + ") : "0";
    });
  }

  function resultsHtml(results) {
    return `<div class="damage-roll-list">${results
      .map((result, index) => resultCardHtml(result, index, results.length))
      .join("")}</div>`;
  }
  async function open({ title = "Damage", rolls = [], context = {} } = {}) {
    const normalized = normalizeRolls(rolls);
    if (!normalized.length || !root?.bootstrap?.Modal) return null;
    const needsProfileChoice = requiresProfileChoice(normalized);
    const modalEl = ensureModal();
    const body = modalEl.querySelector("#damageRollModalBody");
    const confirm = modalEl.querySelector("#damageRollConfirm");
    const dismiss = modalEl.querySelector(".modal-footer [data-bs-dismiss]");
    modalEl.querySelector("#damageRollModalLabel").textContent = title;
    body.innerHTML = needsProfileChoice
      ? configurationHtml(normalized, context)
      : "";
    dismiss.textContent = "Cancel";
    dismiss.disabled = false;
    confirm.textContent = "Roll Damage";
    confirm.disabled = false;
    confirm.classList.remove("d-none");
    if (needsProfileChoice) {
      body.querySelectorAll("[data-damage-profile]").forEach((select) => {
        select.addEventListener("change", () => {
          const card = select.closest("[data-damage-roll-index]");
          const roll = normalized[Number(card.dataset.damageRollIndex)];
          const profileIndex = Number(select.value);
          const calculated = calculateRoll(roll, context, profileIndex);
          card.querySelector("[data-damage-preview]").textContent =
            `${calculated.formula} ${calculated.damageType}`;
        });
      });
    }
    const modal = root.bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: "static",
      keyboard: false,
    });
    return new Promise((resolve) => {
      let settled = false;
      let rolledResults = null;
      let animationInterval = null;
      let animationTimeout = null;
      const clearAnimation = () => {
        if (animationInterval) clearInterval(animationInterval);
        if (animationTimeout) clearTimeout(animationTimeout);
        animationInterval = null;
        animationTimeout = null;
      };
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const onHidden = () => {
        clearAnimation();
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        finish(rolledResults);
      };
      modalEl.addEventListener("hidden.bs.modal", onHidden);
      const runDamageRoll = () => {
        rolledResults = normalized.map((roll, index) => {
          const selected = body.querySelector(
            `[data-damage-roll-index="${index}"] [data-damage-profile]`,
          );
          return rollCalculated(
            calculateRoll(roll, context, selected ? Number(selected.value) : -1),
          );
        });
        const showFinalResults = () => {
          body.innerHTML = resultsHtml(rolledResults);
          dismiss.textContent = "Close";
          dismiss.disabled = false;
          confirm.textContent = "Continue";
          confirm.disabled = false;
          confirm.onclick = () => {
            modal.hide();
          };
        };
        if (!rolledResults.some((result) => result.dice.length > 0)) {
          showFinalResults();
          return;
        }
        if (!rolledResults.some((result) => result.dice.length > 0 && !result.maximizeDice)) {
          showFinalResults();
          return;
        }
        body.innerHTML = rollingHtml(rolledResults);
        dismiss.disabled = true;
        confirm.disabled = true;
        confirm.textContent = "Rolling...";
        animateRollingResults(body, rolledResults);
        animationInterval = setInterval(
          () => animateRollingResults(body, rolledResults),
          55,
        );
        animationTimeout = setTimeout(() => {
          clearAnimation();
          showFinalResults();
        }, 1000);
      };
      confirm.onclick = runDamageRoll;
      modal.show();
      if (!needsProfileChoice) runDamageRoll();
    });
  }

  function summary(results = []) {
    return results
      .map(
        (result) =>
          `${result.label}${result.profileLabel !== "Standard" ? ` (${result.profileLabel})` : ""}: ${result.formula} = ${result.total} ${result.damageType}`,
      )
      .join("; ");
  }

  return {
    DIE_SIDES,
    normalizeProfile,
    normalizeRoll,
    normalizeRolls,
    requiresProfileChoice,
    calculateRoll,
    rollCalculated,
    open,
    summary,
  };
});
