(function (root, factory) {
  const api = factory(root);
  if (root) root.PFWeaponDamage = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const DIE_SIDES = Object.freeze([2, 3, 4, 6, 8, 10, 12, 20, 100]);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseLegacyFormula(value = "") {
    const match = String(value || "").trim().match(
      /^([+-]?(?:(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?|(\d+)))\s*(.*)$/i,
    );
    if (!match) return null;
    return {
      diceCount: Number(match[2] || 0),
      dieType: Number(match[3] || 6),
      staticDamage: match[6] !== undefined
        ? Number(match[6]) * (String(match[1]).startsWith("-") ? -1 : 1)
        : Number(match[5] || 0) * (match[4] === "-" ? -1 : 1),
      damageType: String(match[7] || "").trim(),
    };
  }

  function normalizeEntry(entry = {}) {
    if (typeof entry === "string") {
      const parsed = parseLegacyFormula(entry);
      return parsed ? normalizeEntry(parsed) : null;
    }
    const legacy = parseLegacyFormula(entry?.formula || "") || {};
    const diceCount = Math.max(0, Math.floor(Number(entry?.diceCount ?? legacy.diceCount ?? 0) || 0));
    const requestedDie = Number(entry?.dieType ?? legacy.dieType ?? 6);
    const staticDamage = Number(entry?.staticDamage ?? entry?.staticValue ?? legacy.staticDamage ?? 0) || 0;
    const diceCountScale = entry?.diceCountScale || null;
    const staticDamageScale = entry?.staticDamageScale || entry?.staticValueScale || null;
    if (!diceCount && !staticDamage && !diceCountScale && !staticDamageScale)
      return null;
    return {
      diceCount,
      dieType: DIE_SIDES.includes(requestedDie) ? requestedDie : 6,
      diceCountMax: optionalNumber(entry?.diceCountMax),
      staticDamage,
      staticDamageMax: optionalNumber(entry?.staticDamageMax ?? entry?.staticValueMax),
      diceCountScale,
      staticDamageScale,
      damageType: String(entry?.damageType ?? entry?.type ?? legacy.damageType ?? "").trim(),
      ...(entry?.maximizeDice ? { maximizeDice: true } : {}),
      ...(Number(entry?.damageMultiplier || 1) !== 1
        ? { damageMultiplier: Number(entry.damageMultiplier) }
        : {}),
    };
  }

  function normalize(entries) {
    if (typeof entries === "string") {
      try { entries = JSON.parse(entries); } catch { entries = [entries]; }
    }
    return (Array.isArray(entries) ? entries : []).map(normalizeEntry).filter(Boolean);
  }

  function formulaFor(entry = {}, context = {}) {
    const value = normalizeEntry(entry);
    if (!value) return null;
    const rolls = root?.PFEffectRolls;
    const calculated = rolls?.calculateFormula?.(rolls.damageFormula(value), context);
    if (calculated) return calculated;
    const dice = value.diceCount ? `${value.diceCount}d${value.dieType}` : "";
    const flat = value.staticDamage
      ? `${dice && value.staticDamage > 0 ? "+" : ""}${value.staticDamage}`
      : "";
    return { ...value, staticValue: value.staticDamage, formula: `${dice}${flat}` || "0" };
  }

  function formulaText(entry = {}, context = {}) {
    return formulaFor(entry, context)?.formula || "0";
  }

  function formatEntry(entry = {}, context = {}) {
    const value = normalizeEntry(entry);
    if (!value) return "";
    return `${formulaText(value, context)}${value.damageType ? ` ${value.damageType}` : ""}`;
  }

  function format(entries, context = {}) {
    return normalize(entries).map((entry) => ` + ${formatEntry(entry, context)}`).join("");
  }

  function stepper(field, value, { min = "", placeholder = "", label = "value" } = {}) {
    return `<div class="modal-number-stepper" data-weapon-damage-stepper>
      <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-weapon-damage-step="-1" aria-label="Decrease ${escapeHtml(label)}">-</button>
      <input class="form-control form-control-sm text-center" type="number" ${min === "" ? "" : `min="${escapeHtml(min)}"`} value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(placeholder)}" data-extra-damage-field="${escapeHtml(field)}">
      <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-weapon-damage-step="1" aria-label="Increase ${escapeHtml(label)}">+</button>
    </div>`;
  }

  function row(entry = {}) {
    const value = normalizeEntry(entry) || {
      diceCount: 1, dieType: 6, diceCountMax: null,
      staticDamage: 0, staticDamageMax: null, damageType: "",
    };
    const dice = DIE_SIDES.map(
      (side) => `<option value="${side}" ${value.dieType === side ? "selected" : ""}>d${side}</option>`,
    ).join("");
    return `<section class="shared-weapon-extra-damage-row" data-extra-damage-row>
      <div><label>Number of Dice</label>${stepper("diceCount", value.diceCount, { min: 0, label: "number of dice" })}</div>
      <div><label>Die</label><select class="form-select form-select-sm" data-extra-damage-field="dieType">${dice}</select></div>
      <div><label>Maximum Dice</label>${stepper("diceCountMax", value.diceCountMax ?? "", { min: 0, placeholder: "None", label: "maximum dice" })}</div>
      <div class="shared-generated-scale-control" data-extra-damage-scale="dice"><button class="btn btn-outline-info btn-sm" type="button" data-extra-damage-scale-button>Scale Dice</button><span class="small text-secondary" data-extra-damage-scale-summary></span></div>
      <div><label>Static Damage</label>${stepper("staticDamage", value.staticDamage, { label: "static damage" })}</div>
      <div><label>Maximum Static</label>${stepper("staticDamageMax", value.staticDamageMax ?? "", { min: 0, placeholder: "None", label: "maximum static damage" })}</div>
      <div class="shared-generated-scale-control" data-extra-damage-scale="static"><button class="btn btn-outline-info btn-sm" type="button" data-extra-damage-scale-button>Scale Static</button><span class="small text-secondary" data-extra-damage-scale-summary></span></div>
      <div><label>Damage Type</label><input class="form-control form-control-sm" data-extra-damage-field="damageType" list="sharedDamageTypes" value="${escapeHtml(value.damageType)}" placeholder="fire"></div>
      <button type="button" class="btn btn-outline-danger btn-sm btn-icon" data-remove-extra-damage aria-label="Remove damage component" title="Remove"><i class="bi bi-trash"></i></button>
    </section>`;
  }

  function wireRow(element, entry = {}) {
    const value = normalizeEntry(entry) || {};
    element.querySelectorAll("[data-weapon-damage-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        const min = input.min === "" ? -Infinity : Number(input.min);
        input.value = String(Math.max(
          min,
          (Number(input.value || 0) || 0) + Number(button.dataset.weaponDamageStep),
        ));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    [["dice", value.diceCountScale], ["static", value.staticDamageScale]].forEach(
      ([key, scale]) => {
        const host = element.querySelector(`[data-extra-damage-scale="${key}"]`);
        if (root?.PFEffectEditor?.wireScaleButton) {
          root.PFEffectEditor.wireScaleButton(
            host,
            scale || null,
            host.querySelector("[data-extra-damage-scale-summary]"),
            host.querySelector("[data-extra-damage-scale-button]"),
          );
        } else {
          host.classList.add("d-none");
        }
      },
    );
  }

  function collectRow(element) {
    const field = (name) =>
      element.querySelector(`[data-extra-damage-field="${name}"]`)?.value ?? "";
    return normalizeEntry({
      diceCount: Number(field("diceCount") || 0),
      dieType: Number(field("dieType") || 6),
      diceCountMax: optionalNumber(field("diceCountMax")),
      staticDamage: Number(field("staticDamage") || 0),
      staticDamageMax: optionalNumber(field("staticDamageMax")),
      diceCountScale: element.querySelector('[data-extra-damage-scale="dice"]')?._bonusScale || null,
      staticDamageScale: element.querySelector('[data-extra-damage-scale="static"]')?._bonusScale || null,
      damageType: field("damageType").trim(),
    });
  }

  function mount(container, entries = [], options = {}) {
    if (!container) return;
    const values = normalize(entries);
    container.innerHTML = `<div class="vstack gap-2" data-extra-damage-rows>${values.map(row).join("")}</div>
      ${options.addButton === false ? "" : '<button type="button" class="btn btn-outline-info btn-sm mt-2" data-add-extra-damage><i class="bi bi-plus"></i> Add Damage</button>'}`;
    container.querySelectorAll("[data-extra-damage-row]").forEach((element, index) =>
      wireRow(element, values[index]),
    );
    container.onclick = (event) => {
      if (event.target.closest("[data-add-extra-damage]")) {
        const rows = container.querySelector("[data-extra-damage-rows]");
        rows.insertAdjacentHTML("beforeend", row());
        wireRow(rows.lastElementChild, {});
      } else if (event.target.closest("[data-remove-extra-damage]")) {
        event.target.closest("[data-extra-damage-row]")?.remove();
      }
    };
  }

  function collect(container) {
    if (!container) return [];
    return [...container.querySelectorAll("[data-extra-damage-row]")]
      .map(collectRow)
      .filter(Boolean);
  }

  return {
    DIE_SIDES, normalizeEntry, normalize, formulaFor, formulaText,
    formatEntry, format, mount, collect,
  };
});
