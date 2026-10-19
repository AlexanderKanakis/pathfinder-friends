(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectSaves = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const CHECKS = Object.freeze([
    ["fortitude", "Fortitude"],
    ["reflex", "Reflex"],
    ["will", "Will"],
    ["cmb", "CMB Check"],
    ["cmd", "CMD Check"],
    ["skill", "Skill Check"],
    ["attack", "Attack Roll"],
  ]);

  const clone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  const enabled = (config) => Boolean(config?.enabled && config.check);
  const normalize = (config = {}) => ({
    enabled: enabled(config),
    check: String(config.check || "fortitude").toLowerCase(),
    checkDetail: String(config.checkDetail || "").trim(),
    partial: Boolean(config.partial),
    partialMechanics:
      config.partialMechanics && typeof config.partialMechanics === "object"
        ? clone(config.partialMechanics)
        : {},
  });

  function saveDifficulty(effect = {}, config = {}, options = {}) {
    const candidates = [
      options.saveDc,
      effect.saveDc,
      effect.spellCalculations?.spellDc?.total,
      effect.castRollContext?.spellCalculations?.spellDc?.total,
      config.dc,
    ];
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined || candidate === "")
        continue;
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  function saveOutcome({ die = 0, total = 0, dc = null } = {}) {
    if (Number(die) === 1) return { known: true, success: false, label: "Failure" };
    if (Number(die) === 20) return { known: true, success: true, label: "Success" };
    if (dc === null || dc === undefined || dc === "" || !Number.isFinite(Number(dc)))
      return { known: false, success: null, label: "Result unavailable" };
    const success = Number(total) >= Number(dc);
    return { known: true, success, label: success ? "Success" : "Failure" };
  }

  function mechanicKeys() {
    return root.PFEffectMechanics?.mechanicKeys?.() || ["effects"];
  }

  function hasSave(item = {}) {
    if (enabled(item.saveConfig)) return true;
    return mechanicKeys().some((key) =>
      (Array.isArray(item[key]) ? item[key] : []).some((row) =>
        enabled(row?.saveConfig),
      ),
    );
  }

  function rowForCheck(sheet = {}, config = {}) {
    const check = normalize(config).check;
    const detail = normalize(config).checkDetail.toLowerCase();
    const calculated = sheet.calculated || {};
    if (["fortitude", "reflex", "will"].includes(check)) {
      const aliases = check === "fortitude" ? ["fort", "fortitude"] : [check];
      const row = (calculated.saves || []).find((entry) =>
        aliases.includes(String(entry.key || entry.label || "").toLowerCase()),
      );
      const raw = sheet.saves?.[check === "fortitude" ? "fort" : check] || {};
      return {
        label: CHECKS.find(([value]) => value === check)?.[1] || check,
        bonus: number(row?.total ?? raw.total ?? raw.base),
        conditionals: row?.conditionals || [],
      };
    }
    if (["cmb", "cmd"].includes(check)) {
      return {
        label: check.toUpperCase(),
        bonus: number(calculated.combat?.[check] ?? sheet.fields?.[`${check}Total`]),
        conditionals: calculated.combat?.conditionals?.[check] || [],
      };
    }
    if (check === "skill") {
      const row = (calculated.skills || []).find((entry) =>
        [entry.key, entry.label].some(
          (value) => String(value || "").toLowerCase() === detail,
        ),
      );
      return {
        label: row?.label || config.checkDetail || "Skill Check",
        bonus: row?.usable === false ? 0 : number(row?.total),
        conditionals: row?.conditionals || [],
      };
    }
    const weapons = calculated.weapons || [];
    const weapon = weapons.find((entry) =>
      String(entry.name || "").toLowerCase().includes(detail),
    ) || weapons[0];
    const attack = String(weapon?.attack || "").match(/[+-]?\d+/)?.[0];
    return {
      label: weapon?.name ? `${weapon.name} Attack` : "Attack Roll",
      bonus: number(attack ?? calculated.combat?.attack),
      conditionals: weapon?.attackConditionals || [],
    };
  }

  function conditionalValue(entry = {}) {
    return number(entry.value ?? entry.bonus ?? entry.total);
  }

  function modalElement() {
    let modal = root.document?.getElementById("effectSaveResolutionModal");
    if (modal) return modal;
    modal = root.document.createElement("div");
    modal.id = "effectSaveResolutionModal";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-light">
        <div class="modal-header"><h5 class="modal-title" data-save-title>Saving Throw</h5></div>
        <div class="modal-body">
          <div class="text-secondary small mb-2" data-save-target></div>
          <div class="roll-result-card">
            <div class="roll-result-label" data-save-label></div>
            <div class="roll-die-value" data-save-die>20</div>
            <div class="roll-breakdown">
              <div class="roll-breakdown-row"><span>Bonus</span><strong data-save-bonus></strong></div>
              <div class="roll-breakdown-row"><span>Conditional</span><strong data-save-conditional>+0</strong></div>
              <hr class="roll-total-divider"><div class="roll-breakdown-row roll-total-row"><span>Total</span><strong data-save-total></strong></div>
            </div>
            <div class="roll-result-note" data-save-note></div>
          </div>
          <div class="vstack gap-1 mt-3" data-save-conditionals></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-warning" type="button" data-save-reroll><i class="bi bi-arrow-clockwise me-1"></i>Reroll</button>
          <button class="btn btn-outline-light" type="button" data-save-result="cancel">Cancel</button>
          <button class="btn btn-outline-info d-none" type="button" data-save-result="partial">Apply Partial</button>
          <button class="btn btn-primary" type="button" data-save-result="full">Apply Effect</button>
        </div>
      </div></div>`;
    root.document.body.appendChild(modal);
    return modal;
  }

  async function prompt({ config, effect = {}, sheet, title = "Effect", targetName = "Target", random = Math.random, ...options } = {}) {
    const normalized = normalize(config);
    const profile = rowForCheck(sheet, normalized);
    const dc = saveDifficulty(effect, normalized, options);
    if (!root.document || !root.bootstrap?.Modal) {
      const die = Math.floor(random() * 20) + 1;
      return { action: die === 1 ? "full" : die === 20 ? (normalized.partial ? "partial" : "cancel") : "cancel", die, bonus: profile.bonus, total: die + profile.bonus };
    }
    const modal = modalElement();
    const instance = root.bootstrap.Modal.getOrCreateInstance(modal, {
      backdrop: "static",
      keyboard: false,
    });
    modal.querySelector("[data-save-title]").textContent = `${title}: Save`;
    modal.querySelector("[data-save-target]").textContent = targetName;
    modal.querySelector("[data-save-label]").textContent = profile.label;
    modal.querySelector("[data-save-bonus]").textContent = profile.bonus >= 0 ? `+${profile.bonus}` : String(profile.bonus);
    const partialButton = modal.querySelector('[data-save-result="partial"]');
    partialButton.classList.toggle("d-none", !normalized.partial);
    const conditionals = (profile.conditionals || []).filter((entry) => conditionalValue(entry));
    const selected = new Set();
    const dieNode = modal.querySelector("[data-save-die]");
    const totalNode = modal.querySelector("[data-save-total]");
    const conditionalNode = modal.querySelector("[data-save-conditional]");
    const noteNode = modal.querySelector("[data-save-note]");
    const rerollButton = modal.querySelector("[data-save-reroll]");
    const fullButton = modal.querySelector('[data-save-result="full"]');
    const cancelButton = modal.querySelector('[data-save-result="cancel"]');
    let die = 1;
    let animation = null;
    let revealTimer = null;
    let rolling = false;
    const update = () => {
      const conditional = [...selected].reduce((sum, index) => sum + conditionalValue(conditionals[index]), 0);
      const total = die + profile.bonus + conditional;
      const outcome = saveOutcome({ die, total, dc });
      conditionalNode.textContent = conditional >= 0 ? `+${conditional}` : String(conditional);
      totalNode.textContent = total;
      noteNode.textContent = outcome.label;
      noteNode.classList.toggle("text-success", outcome.success === true);
      noteNode.classList.toggle("text-danger", outcome.success === false);
      noteNode.classList.toggle("text-secondary", !outcome.known);
      fullButton.disabled = die === 20;
      cancelButton.disabled = die === 1;
      partialButton.disabled = die === 1;
      return { conditional, total, success: outcome.success };
    };
    const list = modal.querySelector("[data-save-conditionals]");
    list.innerHTML = conditionals.length
      ? `<div class="small text-secondary">Applicable conditionals</div>${conditionals.map((entry, index) => `<label class="form-check"><input class="form-check-input" type="checkbox" data-save-conditional-index="${index}"><span class="form-check-label">${escapeHtml(entry.source || entry.name || entry.label || entry.appliesWhen || "Conditional")} (${conditionalValue(entry) >= 0 ? "+" : ""}${conditionalValue(entry)})</span></label>`).join("")}`
      : "";
    const conditionalInputs = [
      ...list.querySelectorAll("[data-save-conditional-index]"),
    ];
    conditionalInputs.forEach((input) => input.addEventListener("change", () => {
      const index = Number(input.dataset.saveConditionalIndex);
      if (input.checked) selected.add(index); else selected.delete(index);
      if (!rolling) update();
    }));
    const setRolling = (value) => {
      rolling = value;
      rerollButton.disabled = value;
      fullButton.disabled = value;
      partialButton.disabled = value;
      conditionalInputs.forEach((input) => {
        input.disabled = value;
      });
      if (value) {
        totalNode.textContent = "...";
        noteNode.textContent = "Rolling...";
        noteNode.classList.remove("text-success", "text-danger");
        noteNode.classList.add("text-secondary");
      }
    };
    const roll = () => {
      if (animation) root.clearInterval(animation);
      if (revealTimer) root.clearTimeout(revealTimer);
      die = Math.floor(random() * 20) + 1;
      setRolling(true);
      animation = root.setInterval(() => {
        dieNode.textContent = Math.floor(Math.random() * 20) + 1;
      }, 55);
      revealTimer = root.setTimeout(() => {
        root.clearInterval(animation);
        animation = null;
        revealTimer = null;
        dieNode.textContent = die;
        setRolling(false);
        update();
      }, 900);
    };
    instance.show();
    roll();
    return new Promise((resolve) => {
      const finish = (action) => {
        if (rolling && action !== "cancel") return;
        if (animation) root.clearInterval(animation);
        if (revealTimer) root.clearTimeout(revealTimer);
        animation = null;
        revealTimer = null;
        const totals = update();
        instance.hide();
        resolve({ action, die, bonus: profile.bonus, ...totals });
      };
      rerollButton.onclick = roll;
      modal.querySelectorAll("[data-save-result]").forEach((button) => {
        button.onclick = () => finish(button.dataset.saveResult);
      });
    });
  }

  function metadata(effect = {}) {
    const next = { ...effect };
    mechanicKeys().forEach((key) => delete next[key]);
    delete next.saveConfig;
    return next;
  }

  function mergeMechanics(base = {}, addition = {}) {
    const next = { ...base };
    mechanicKeys().forEach((key) => {
      const rows = [...(Array.isArray(base[key]) ? base[key] : []), ...(Array.isArray(addition[key]) ? addition[key] : [])];
      if (rows.length) next[key] = rows;
      else delete next[key];
    });
    return next;
  }

  async function resolve(effect = {}, options = {}) {
    let next = clone(effect);
    if (enabled(next.saveConfig)) {
      const result = await prompt({ ...options, effect: next, config: next.saveConfig });
      if (!result) return null;
      const exempt = metadata(next);
      mechanicKeys().forEach((key) => {
        const rows = (Array.isArray(next[key]) ? next[key] : []).filter(
          (row) => row?.saveMode === "none" || enabled(row?.saveConfig),
        ).map((row) => {
          const clean = { ...row };
          delete clean.saveMode;
          return clean;
        });
        if (rows.length) exempt[key] = rows;
      });
      if (result.action === "full") {
        next._saveResolution = "save-failure";
        delete next.saveConfig;
        mechanicKeys().forEach((key) => {
          if (!Array.isArray(next[key])) return;
          next[key] = next[key].map((row) => {
            const clean = { ...row };
            delete clean.saveMode;
            return clean;
          });
        });
      } else if (result.action === "partial") {
        next = mergeMechanics(exempt, next.saveConfig.partialMechanics);
        next._saveResolution = "partial";
      } else {
        next = exempt;
        next._saveResolution = "save-success";
      }
    }
    for (const key of mechanicKeys()) {
      const rows = Array.isArray(next[key]) ? next[key] : [];
      const kept = [];
      for (const row of rows) {
        if (!enabled(row?.saveConfig)) {
          kept.push(row);
          continue;
        }
        const result = await prompt({ ...options, effect: next, config: row.saveConfig });
        if (!result) return null;
        if (result.action === "full") {
          const clean = { ...row };
          delete clean.saveConfig;
          kept.push(clean);
        } else if (result.action === "partial") {
          const partial = row.saveConfig.partialMechanics || {};
          const rowsForKey = Array.isArray(partial[key]) ? partial[key] : [];
          kept.push(...rowsForKey);
          mechanicKeys().filter((item) => item !== key).forEach((item) => {
            if (!Array.isArray(partial[item]) || !partial[item].length) return;
            next[item] = [...(Array.isArray(next[item]) ? next[item] : []), ...partial[item]];
          });
        }
      }
      if (kept.length) next[key] = kept;
      else delete next[key];
    }
    delete next.saveDc;
    return next;
  }

  return {
    CHECKS,
    normalize,
    enabled,
    hasSave,
    rowForCheck,
    saveOutcome,
    prompt,
    resolve,
  };
});
