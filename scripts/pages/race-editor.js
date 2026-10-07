let raceData = { source: "", generatedAt: "", groups: [], races: [] };
let selectedIndex = -1;
let searchTerm = "";
let groupFilter = "";
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;
let dirty = false;
let traitEffectEditors = new Map();
let traitModifierOverrideEditors = new Map();
let traitDurationConfigs = new Map();
let traitDurationEditor = null;

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(text = "") {
  return (
    String(text || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "race"
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function splitList(value = "") {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function setStatus(message, type = "info") {
  const status = el("raceEditorStatus");
  if (!message) {
    status.classList.add("d-none");
    return;
  }
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
  status.classList.remove("d-none");
}

function setDirty(value = true) {
  dirty = value;
  document.title = `${dirty ? "* " : ""}PathFriends Race Editor`;
  renderRaceList();
}

function normalizeTrait(trait = {}) {
  return {
    name: trait.name || "Trait",
    category: trait.category || "",
    description: trait.description || "",
    activatable: Boolean(trait.activatable),
    activeMechanics:
      trait.activeMechanics && typeof trait.activeMechanics === "object"
        ? cloneJson(trait.activeMechanics)
        : null,
    attributeRequirement:
      trait.attributeRequirement && typeof trait.attributeRequirement === "object"
        ? trait.attributeRequirement
        : null,
    replaces: Array.isArray(trait.replaces) ? trait.replaces : [],
    modifies: Array.isArray(trait.modifies) ? trait.modifies : [],
    modifiedTraitOverrides: Array.isArray(trait.modifiedTraitOverrides)
      ? trait.modifiedTraitOverrides
      : [],
    effects: Array.isArray(trait.effects) ? trait.effects : [],
    damageReduction: Array.isArray(trait.damageReduction)
      ? trait.damageReduction
      : [],
    spellResistance: Array.isArray(trait.spellResistance)
      ? trait.spellResistance
      : [],
    immunities: Array.isArray(trait.immunities) ? trait.immunities : [],
    applyConditions: Array.isArray(trait.applyConditions)
      ? trait.applyConditions
      : [],
    classSkillGrants: Array.isArray(trait.classSkillGrants)
      ? trait.classSkillGrants
      : [],
    bonusRanks: Array.isArray(trait.bonusRanks) ? trait.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(trait.extraRanksPerLevel)
      ? trait.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(trait.featGrants) ? trait.featGrants : [],
    sizeChanges: Array.isArray(trait.sizeChanges) ? trait.sizeChanges : [],
    spellLikeAbilities: Array.isArray(trait.spellLikeAbilities)
      ? trait.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(trait.casterLevelBonuses)
      ? trait.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(trait.spellDcBonuses)
      ? trait.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(trait.effectiveAttributeBonuses)
      ? trait.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(trait.grantDomains) ? trait.grantDomains : [],
    generatedEquipment: Array.isArray(trait.generatedEquipment)
      ? trait.generatedEquipment
      : [],
    conditionalVariables: Array.isArray(trait.conditionalVariables)
      ? trait.conditionalVariables
      : [],
    damageRolls: Array.isArray(trait.damageRolls) ? trait.damageRolls : [],
    activatableAbilities: Array.isArray(trait.activatableAbilities)
      ? cloneJson(trait.activatableAbilities)
      : [],
    choicePools: Array.isArray(trait.choicePools)
      ? cloneJson(trait.choicePools)
      : Array.isArray(trait.pools)
        ? cloneJson(trait.pools)
        : [],
    durationConfig:
      trait.durationConfig && typeof trait.durationConfig === "object"
        ? trait.durationConfig
        : null,
  };
}

const ATTRIBUTE_REQUIREMENT_OPTIONS = ["", "STR", "DEX", "CON", "INT", "WIS", "CHA"];

function normalizeAttributeKey(value = "") {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  const aliases = {
    str: "STR",
    strength: "STR",
    dex: "DEX",
    dexterity: "DEX",
    con: "CON",
    constitution: "CON",
    int: "INT",
    intelligence: "INT",
    wis: "WIS",
    wisdom: "WIS",
    cha: "CHA",
    charisma: "CHA",
  };
  return aliases[key] || "";
}

function normalizeAttributeRequirement(data = {}) {
  const source =
    data.attributeRequirement ||
    data.attributeScoreRequirement ||
    data.abilityRequirement ||
    {};
  const attribute = normalizeAttributeKey(
    source.attribute || source.ability || data.requiredAttribute || "",
  );
  const score = Number(
    source.score ?? source.minimumScore ?? source.minimumAbilityScore ?? "",
  );
  return {
    attribute,
    score: Number.isFinite(score) && score > 0 ? Math.floor(score) : "",
  };
}

function hasAttributeRequirement(data = {}) {
  const requirement = normalizeAttributeRequirement(data);
  return Boolean(requirement.attribute && requirement.score);
}

function normalizeFavoredBonus(bonus = {}) {
  return {
    className: bonus.className || "Class",
    description: bonus.description || "",
    effects: Array.isArray(bonus.effects) ? bonus.effects : [],
  };
}

function normalizeRace(race = {}) {
  return {
    ...race,
    name: race.name || race.race || "Unnamed Race",
    race: race.race || race.name || "Unnamed Race",
    group: race.group || "Other Races",
    link: race.link || "",
    racePoints: race.racePoints ?? null,
    standardTraits: Array.isArray(race.standardTraits)
      ? race.standardTraits.map(normalizeTrait)
      : [],
    alternateTraits: Array.isArray(race.alternateTraits)
      ? race.alternateTraits.map(normalizeTrait)
      : [],
    favoredClassBonuses: Array.isArray(race.favoredClassBonuses)
      ? race.favoredClassBonuses.map(normalizeFavoredBonus)
      : [],
  };
}

function rebuildGroups() {
  const order = [
    ...new Set([
      ...(raceData.groups || []).map((group) => group.name),
      ...(raceData.races || []).map((race) => race.group || "Other Races"),
    ]),
  ].filter(Boolean);
  raceData.groups = order.map((name) => ({
    name,
    races: raceData.races.filter((race) => race.group === name),
  }));
}

function racePayload() {
  rebuildGroups();
  if (window.PFRaceData?.compactRaceData) {
    return window.PFRaceData.compactRaceData({
      source: raceData.source || window.PFRaceData.dataPath || "data/races.json",
      generatedAt: raceData.generatedAt || new Date().toISOString(),
      groups: raceData.groups,
      races: raceData.races,
    });
  }
  return {
    source: raceData.source || window.PFRaceData?.dataPath || "data/races.json",
    generatedAt: raceData.generatedAt || new Date().toISOString(),
    schemaVersion: 2,
    groups: raceData.groups,
    races: raceData.races,
  };
}

function renderGroupFilter() {
  const groups = (raceData.groups || []).map((group) => group.name).filter(Boolean);
  el("raceGroupFilter").innerHTML = `
    <option value="">All Groups</option>
    ${groups
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}" ${groupFilter === name ? "selected" : ""}>${escapeHtml(name)}</option>`,
      )
      .join("")}
  `;
}

function filteredRaceIndexes() {
  const term = searchTerm.trim().toLowerCase();
  return raceData.races
    .map((race, index) => ({ race, index }))
    .filter(
      ({ race }) =>
        (!groupFilter || race.group === groupFilter) &&
        (!term || String(race.name || "").toLowerCase().includes(term)),
    )
    .sort(
      (a, b) =>
        String(a.race.group || "").localeCompare(String(b.race.group || "")) ||
        String(a.race.name || "").localeCompare(String(b.race.name || "")),
    )
    .map((item) => item.index);
}

function renderRaceList() {
  const indexes = filteredRaceIndexes();
  el("raceCount").innerHTML =
    `${raceData.races.length} races${dirty ? ' <span class="dirty-dot" title="Unsaved changes"></span>' : ""}`;
  el("raceList").innerHTML =
    indexes
      .map((index) => {
        const race = raceData.races[index];
        return `
      <button class="btn ${index === selectedIndex ? "btn-primary" : "btn-outline-light"} btn-sm" type="button" data-race-index="${index}">
        <span>${escapeHtml(race.name || "Unnamed Race")}</span>
        <span class="race-group">${escapeHtml(race.group || "")}</span>
      </button>
    `;
      })
      .join("") || `<div class="small-text">No matching races.</div>`;
  el("raceList")
    .querySelectorAll("[data-race-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        commitSelectedRace();
        selectedIndex = Number(button.dataset.raceIndex);
        renderRaceList();
        renderSelectedRace();
      });
    });
}

function inputBlock(id, label, value, extra = "") {
  return `
    <div class="${extra}">
      <label for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" class="form-control form-control-sm" value="${escapeHtml(value ?? "")}">
    </div>
  `;
}

function traitKey(kind, index) {
  return `${kind}:${index}`;
}

function traitDurationLabel(config) {
  const fallback = {
    count: null,
    unit: "variable",
    factors: [],
  };
  if (window.PFEffectMeta?.durationLabel) {
    return window.PFEffectMeta.durationLabel(config || fallback);
  }
  return config?.unit || "variable";
}

const TRAIT_MECHANIC_KEYS = window.PFEffectMechanics?.mechanicKeys?.() || [
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
  "damageRolls",
];

const TRAIT_MECHANIC_LABELS = {
  effects: "Effects",
  damageReduction: "DR",
  spellResistance: "SR",
  immunities: "Immunities",
  applyConditions: "Conditions",
  classSkillGrants: "Class Skills",
  bonusRanks: "Bonus Ranks",
  extraRanksPerLevel: "Ranks",
  featGrants: "Feats",
  sizeChanges: "Size",
  spellLikeAbilities: "SLAs",
  casterLevelBonuses: "CL",
  spellDcBonuses: "DC",
  effectiveAttributeBonuses: "Attr",
  grantDomains: "Domains",
  generatedEquipment: "Gear",
  conditionalVariables: "Vars",
  damageRolls: "Damage",
};

function traitMechanicCount(item = {}, key = "") {
  return Array.isArray(item[key]) ? item[key].length : 0;
}

function traitHasAnyMechanics(item = {}) {
  return (
    ["passive", "active"].some((group) =>
      TRAIT_MECHANIC_KEYS.some((key) =>
        mechanicOperations(item, key, group).some(
          (operation) =>
            operation.action === "remove" ||
            (["add", "replace"].includes(operation.action) && operation.value),
        ),
      ),
    ) || Boolean(item.activeDurationConfig)
  );
}

function traitMechanicSummary(item = {}) {
  const parts = ["passive", "active"].flatMap((group) => {
    const mechanics = traitMechanicGroup(item, group);
    return TRAIT_MECHANIC_KEYS.map((key) => {
      const count = traitMechanicCount(mechanics, key);
      return count
        ? `${group === "active" ? "Active " : ""}${TRAIT_MECHANIC_LABELS[key]} ${count}`
        : "";
    }).filter(Boolean);
  });
  return parts.length ? parts.join(" · ") : "No mechanics entered.";
}

function relationKey(value = "") {
  return slugify(value).replace(/-/g, "");
}

function stableMechanicKey(value) {
  return JSON.stringify(stableMechanicValue(value));
}

function stableMechanicValue(value) {
  if (Array.isArray(value)) return value.map(stableMechanicValue);
  if (!value || typeof value !== "object") return value ?? null;
  const spellName = String(
    value.spellName || value.spell?.name || value.name || "",
  ).trim();
  if (
    spellName &&
    !value.stat &&
    (value.frequency ||
      value.minimumLevel !== undefined ||
      value.level !== undefined ||
      value.castingAttr ||
      value.minimumScore !== undefined)
  ) {
    const minimumLevel = Number(value.minimumLevel ?? value.level ?? 1) || 1;
    return {
      frequency: String(value.frequency || "").trim(),
      minimumLevel,
      spellName,
    };
  }
  const sorted = {};
  Object.keys(value)
    .sort()
    .forEach((key) => {
      sorted[key] = stableMechanicValue(value[key]);
    });
  return sorted;
}

function mechanicOperations(override = {}, key = "", group = "passive") {
  const operationMap =
    group === "active"
      ? override.activeMechanicOverrides
      : override.mechanicOverrides;
  const operations = operationMap?.[key];
  return Array.isArray(operations) ? operations : [];
}

function mechanicOperationFor(
  override = {},
  key = "",
  row = {},
  index = 0,
  group = "passive",
) {
  return [...mechanicOperations(override, key, group)]
    .reverse()
    .find(
      (operation) =>
        operation.action !== "add" &&
        (operation.targetKey
          ? operation.targetKey === stableMechanicKey(row)
          : Number(operation.targetIndex) === index),
    );
}

function mechanicAdditions(override = {}, group = "passive") {
  return Object.fromEntries(
    TRAIT_MECHANIC_KEYS.map((key) => [
      key,
      mechanicOperations(override, key, group)
        .filter((operation) => operation.action === "add" && operation.value)
        .map((operation) => operation.value),
    ]),
  );
}

function mechanicRowSummary(key = "", row = {}) {
  if (key === "effects") {
    const stat = row.skillName || row.stat || "effect";
    const value = Number(row.value || 0);
    const type = row.type ? ` ${row.type}` : "";
    return `${stat} ${value > 0 ? "+" : ""}${value}${type}`;
  }
  if (key === "damageReduction") {
    return `DR ${Number(row.amount || 0)}/${row.overcomeType || "-"}`;
  }
  if (key === "spellResistance") {
    return `SR ${Number(row.amount || 0)}${row.appliesWhen ? ` (${row.appliesWhen})` : ""}`;
  }
  if (key === "immunities") {
    const name = row.name || row.immunity || row.type || "Immunity";
    return `Immune ${name}${row.appliesWhen ? ` (${row.appliesWhen})` : ""}`;
  }
  if (key === "applyConditions") {
    return window.PFEffectEditor.applyConditionText(row);
  }
  if (key === "classSkillGrants") {
    return `${row.skillName || row.stat || "Skill"} becomes a class skill`;
  }
  if (key === "bonusRanks") {
    return window.PFEffectEditor.bonusRanksText(row);
  }
  if (key === "extraRanksPerLevel") {
    return window.PFEffectEditor.extraRanksPerLevelText(row);
  }
  if (key === "featGrants") {
    return window.PFEffectEditor.featGrantText(row);
  }
  if (key === "sizeChanges") {
    const value = Number(row.value ?? row.steps ?? 0);
    return `Size ${value > 0 ? "+" : ""}${value}`;
  }
  if (key === "spellLikeAbilities") {
    const level = Number(row.minimumLevel ?? row.level ?? 1) || 1;
    const listName =
      row.spellChoiceList?.name || row.spellList?.name || row.spellChoiceListName;
    const spellName =
      row.spellName ||
      row.name ||
      row.spell?.name ||
      (listName ? `Choose from ${listName}` : "Spell");
    return `${row.frequency || "1/day"} ${spellName}${level > 1 ? ` at level ${level}` : ""}`;
  }
  if (key === "casterLevelBonuses") {
    return window.PFEffectEditor.casterLevelBonusText(row);
  }
  if (key === "spellDcBonuses") {
    return window.PFEffectEditor.spellDcBonusText(row);
  }
  if (key === "effectiveAttributeBonuses") {
    return window.PFEffectEditor.effectiveAttributeBonusText(row);
  }
  if (key === "grantDomains") {
    return window.PFEffectEditor.grantDomainText(row);
  }
  if (key === "generatedEquipment") {
    return `${row.type || "Equipment"}: ${row.name || row.item || "Generated item"}`;
  }
  return JSON.stringify(row);
}

function mechanicReplacementMountId(
  kind,
  traitIndex,
  overrideIndex,
  group,
  key,
  rowIndex,
) {
  return `raceTraitOverride-${kind}-${traitIndex}-${overrideIndex}-${group}-${key}-${rowIndex}`;
}

function traitMechanicGroup(trait = {}, group = "passive") {
  const mechanics = window.PFEffectMechanics;
  if (group === "active") {
    return (
      mechanics?.activeMechanics?.(trait) ||
      (trait.activatable ? trait : trait.activeMechanics || {})
    );
  }
  return (
    mechanics?.passiveMechanics?.(trait) ||
    (trait.activatable ? {} : trait)
  );
}

function createMechanicEditorRow(key = "", data = {}, options = {}) {
  if (!window.PFEffectEditor) return null;
  const rowOptions = {
    onDelete: () => {},
    skills: options.skills,
  };
  const builders = {
    effects: () =>
      window.PFEffectEditor.createBonusRow(data, {
        ...rowOptions,
        effectStats: window.PFEffectStats?.allStats?.(),
      }),
    damageReduction: () => window.PFEffectEditor.createDrRow(data, rowOptions),
    spellResistance: () => window.PFEffectEditor.createSrRow(data, rowOptions),
    immunities: () =>
      window.PFEffectEditor.createImmunityRow(data, rowOptions),
    applyConditions: () =>
      window.PFEffectEditor.createApplyConditionRow(data, rowOptions),
    classSkillGrants: () =>
      window.PFEffectEditor.createClassSkillRow(data, rowOptions),
    bonusRanks: () =>
      window.PFEffectEditor.createBonusRanksRow(data, rowOptions),
    extraRanksPerLevel: () =>
      window.PFEffectEditor.createExtraRanksPerLevelRow(data, rowOptions),
    featGrants: () =>
      window.PFEffectEditor.createFeatGrantRow(data, rowOptions),
    sizeChanges: () =>
      window.PFEffectEditor.createSizeChangeRow(data, rowOptions),
    spellLikeAbilities: () =>
      window.PFEffectEditor.createSpellLikeAbilityRow(data, rowOptions),
    casterLevelBonuses: () =>
      window.PFEffectEditor.createSpellAdjustmentRow(
        "casterLevel",
        data,
        rowOptions,
      ),
    spellDcBonuses: () =>
      window.PFEffectEditor.createSpellAdjustmentRow(
        "spellDc",
        data,
        rowOptions,
      ),
    effectiveAttributeBonuses: () =>
      window.PFEffectEditor.createEffectiveAttributeBonusRow(data, rowOptions),
    grantDomains: () =>
      window.PFEffectEditor.createGrantDomainRow(data, rowOptions),
    generatedEquipment: () =>
      window.PFEffectEditor.createGeneratedEquipmentRow(data, rowOptions),
    conditionalVariables: () =>
      window.PFEffectEditor.createConditionalVariableRow(data, rowOptions),
    damageRolls: () =>
      window.PFEffectEditor.createDamageRollRow(data, rowOptions),
  };
  const row = builders[key]?.();
  if (!row?.element) return null;
  row.element.classList.add("trait-mechanic-editor-row");
  row.element.querySelectorAll("input, select, textarea, button").forEach((input) => {
    input.addEventListener("input", () => options.onChange?.());
    input.addEventListener("change", () => options.onChange?.());
  });
  return row;
}

function findStandardTraitByName(race = {}, name = "") {
  const key = relationKey(name);
  return (race.standardTraits || []).find(
    (trait) => relationKey(trait.name || trait.trait || "") === key,
  );
}

function modifiedTraitOverrideFor(trait = {}, standardTraitName = "") {
  const key = relationKey(standardTraitName);
  return (trait.modifiedTraitOverrides || []).find(
    (override) => relationKey(override.trait || override.name || "") === key,
  );
}

function modifiedTraitOverrideSection(kind, trait, index, race = {}) {
  if (kind !== "alternateTraits" || !(trait.modifies || []).length) return "";
  const rows = (trait.modifies || [])
    .map((name, overrideIndex) => {
      const standardTrait = findStandardTraitByName(race, name);
      const traitName = standardTrait?.name || name;
      if (!traitName) return "";
      const override = modifiedTraitOverrideFor(trait, traitName) || {};
      const mechanicRows = ["passive", "active"]
        .map((group) => {
          const standardMechanics = traitMechanicGroup(standardTrait, group);
          const rows = TRAIT_MECHANIC_KEYS.map((key) => {
            const standardRows = Array.isArray(standardMechanics?.[key])
              ? standardMechanics[key]
              : [];
            if (!standardRows.length) return "";
            return `
              <div class="trait-mechanic-group" data-mechanic-group="${key}">
                <div class="trait-mechanic-group-title">${escapeHtml(TRAIT_MECHANIC_LABELS[key])}</div>
                ${standardRows
                  .map((row, rowIndex) => {
                    const operation = mechanicOperationFor(
                      override,
                      key,
                      row,
                      rowIndex,
                      group,
                    );
                    const action = operation?.action || "keep";
                    return `
                      <div
                        class="trait-mechanic-row"
                        data-mechanic-scope="${group}"
                        data-mechanic-key="${key}"
                        data-mechanic-row-index="${rowIndex}"
                        data-mechanic-target-key="${escapeHtml(stableMechanicKey(row))}"
                      >
                        <div>
                          <div class="small-text">Standard Row</div>
                          <div class="trait-mechanic-summary">${escapeHtml(mechanicRowSummary(key, row))}</div>
                        </div>
                        <div>
                          <label>Action</label>
                          <select class="form-select form-select-sm" data-mechanic-action>
                            <option value="keep" ${action === "keep" ? "selected" : ""}>Keep</option>
                            <option value="replace" ${action === "replace" ? "selected" : ""}>Replace</option>
                            <option value="remove" ${action === "remove" ? "selected" : ""}>Remove</option>
                          </select>
                        </div>
                        <div
                          class="trait-mechanic-replacement ${action === "replace" ? "" : "d-none"}"
                          id="${mechanicReplacementMountId(kind, index, overrideIndex, group, key, rowIndex)}"
                          data-mechanic-replacement-mount
                        ></div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `;
          })
            .filter(Boolean)
            .join("");
          return rows
            ? `<div class="trait-mechanic-scope"><strong>${group === "active" ? "Active" : "Passive"}</strong>${rows}</div>`
            : "";
        })
        .filter(Boolean)
        .join("");
      return `
        <section
          class="trait-modifier-override-card"
          data-trait-modifier-override="${escapeHtml(traitName)}"
          data-trait-modifier-override-index="${overrideIndex}"
        >
          <div class="trait-modifier-override-head">
            <strong>${escapeHtml(traitName)}</strong>
            <span>Replacement mechanics if filled</span>
          </div>
          <div class="small-text">
            Current standard mechanics: ${escapeHtml(
              standardTrait ? traitMechanicSummary(standardTrait) : "No matching standard trait found.",
            )}
          </div>
          ${
            mechanicRows ||
            `<div class="small-text">This standard trait has no authored mechanics yet. Use additions below.</div>`
          }
          <div class="trait-mechanic-additions">
            <div class="trait-mechanic-group-title">Additions</div>
            <div class="small-text">Add only mechanics that the modified trait gains beyond kept/replaced rows.</div>
          </div>
          <div
            id="raceTraitOverrideAdditions-${kind}-${index}-${overrideIndex}"
            class="mt-2"
            data-trait-modifier-additions-mount
          ></div>
          ${
            traitHasAnyMechanics(override)
              ? `<div class="small-text mt-1">Row override entered.</div>`
              : ""
          }
        </section>
      `;
    })
    .filter(Boolean)
    .join("");
  if (!rows) return "";
  return `
    <div class="trait-modifier-overrides grid-column-full">
      <div class="trait-modifier-overrides-title">Modified Trait Overrides</div>
      <div class="small-text">
        Keep standard rows by default. Replace or remove only the rows this alternate changes, and use additions for new rows.
      </div>
      ${rows}
    </div>
  `;
}

function traitCard(kind, trait, index, race = {}) {
  const isAlternate = kind === "alternateTraits";
  const attributeRequirement = normalizeAttributeRequirement(trait);
  const requirementOpen = hasAttributeRequirement(trait);
  return `
    <article class="trait-card" data-trait-kind="${kind}" data-trait-index="${index}">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <strong>${escapeHtml(trait.name || "Trait")}</strong>
        <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-trait aria-label="Delete trait">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      <div class="trait-grid ${isAlternate ? "trait-grid-alternate" : ""}">
        <div>
          <label>Name</label>
          <input data-trait-field="name" class="form-control form-control-sm" value="${escapeHtml(trait.name || "")}">
        </div>
        <div class="trait-category-field">
          <label>Category</label>
          <input data-trait-field="category" class="form-control form-control-sm" value="${escapeHtml(trait.category || "")}">
        </div>
        <div class="trait-activatable-field">
          <label>Requirements</label>
          <button
            class="btn btn-outline-secondary btn-sm"
            type="button"
            data-toggle-trait-attribute-requirement
            aria-expanded="${requirementOpen ? "true" : "false"}"
            title="Attribute score requirement"
          >Req</button>
        </div>
        <div class="trait-attribute-requirement-field grid-column-full ${requirementOpen ? "" : "d-none"}" data-trait-attribute-requirement>
          <div>
            <label>Required Attribute</label>
            <select data-trait-field="requiredAttribute" class="form-select form-select-sm">
              ${ATTRIBUTE_REQUIREMENT_OPTIONS.map(
                (ability) =>
                  `<option value="${escapeHtml(ability)}" ${
                    attributeRequirement.attribute === ability ? "selected" : ""
                  }>${escapeHtml(ability || "None")}</option>`,
              ).join("")}
            </select>
          </div>
          <div>
            <label>Minimum Score</label>
            <input data-trait-field="requiredScore" class="form-control form-control-sm" type="number" min="1" value="${escapeHtml(attributeRequirement.score)}">
          </div>
        </div>
        ${
          isAlternate
            ? `
          <div class="trait-relation-grid">
            <div class="trait-relation-field" data-trait-relation-field="replaces">
              <label>Replaces</label>
              <input
                data-trait-field="replaces"
                data-trait-relation-input="replaces"
                class="form-control form-control-sm"
                value="${escapeHtml(joinList(trait.replaces))}"
                placeholder="Search standard traits"
                autocomplete="off"
              >
              <div class="trait-relation-suggestions" data-trait-relation-suggestions="replaces"></div>
            </div>
            <div class="trait-relation-field" data-trait-relation-field="modifies">
              <label>Modifies</label>
              <input
                data-trait-field="modifies"
                data-trait-relation-input="modifies"
                class="form-control form-control-sm"
                value="${escapeHtml(joinList(trait.modifies))}"
                placeholder="Search standard traits"
                autocomplete="off"
              >
              <div class="trait-relation-suggestions" data-trait-relation-suggestions="modifies"></div>
            </div>
          </div>
        `
            : ``
        }
        <div class="grid-column-full">
          <label>Description</label>
          <textarea data-trait-field="description" class="form-control form-control-sm trait-textarea">${escapeHtml(trait.description || "")}</textarea>
        </div>
        ${modifiedTraitOverrideSection(kind, trait, index, race)}
      </div>
      <div id="raceTraitEffects-${kind}-${index}" class="accordion shared-extra-accordion mt-2" data-trait-effect-mount></div>
    </article>
  `;
}

function traitSection(title, kind, traits, race = {}) {
  return `
    <section class="level-card mb-3">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>${escapeHtml(title)}</strong>
        <button class="btn btn-outline-info btn-sm" type="button" data-add-trait="${kind}">
          <i class="bi bi-plus-lg"></i> Trait
        </button>
      </div>
      <div class="trait-list">
        ${traits.map((trait, index) => traitCard(kind, trait, index, race)).join("") || `<div class="small-text">No traits recorded.</div>`}
      </div>
    </section>
  `;
}

function favoredBonusRow(bonus, index) {
  return `
    <div class="favored-bonus-row" data-favored-index="${index}">
      <div>
        <label>Class</label>
        <input data-favored-field="className" class="form-control form-control-sm" value="${escapeHtml(bonus.className || "")}">
      </div>
      <div>
        <label>Bonus</label>
        <textarea data-favored-field="description" class="form-control form-control-sm trait-textarea">${escapeHtml(bonus.description || "")}</textarea>
      </div>
      <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-favored aria-label="Delete favored class bonus">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
}

function favoredBonusSection(race) {
  const bonuses = race.favoredClassBonuses || [];
  return `
    <section class="level-card mb-3">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>Paizo Favored Class Bonuses</strong>
        <button class="btn btn-outline-info btn-sm" type="button" data-add-favored>
          <i class="bi bi-plus-lg"></i> Bonus
        </button>
      </div>
      <div class="trait-list">
        ${bonuses.map(favoredBonusRow).join("") || `<div class="small-text">No favored class bonuses recorded.</div>`}
      </div>
    </section>
  `;
}

function mountTraitEffectEditors(race) {
  traitEffectEditors = new Map();
  traitModifierOverrideEditors = new Map();
  traitDurationConfigs = new Map();
  ["standardTraits", "alternateTraits"].forEach((kind) => {
    (race[kind] || []).forEach((trait, index) => {
      traitDurationConfigs.set(traitKey(kind, index), trait.durationConfig || null);
      const mount = document.getElementById(`raceTraitEffects-${kind}-${index}`);
      if (!mount || !window.PFEffectEditor) return;
      const editor = window.PFEffectEditor.mountMechanicGroups(mount, {
        idPrefix: `race${selectedIndex}${kind}${index}`,
        effectsKey: "effects",
        onChange: () => setDirty(true),
      });
      editor.reset(trait);
      traitEffectEditors.set(`${kind}:${index}`, editor);

      if (kind !== "alternateTraits") return;
      (trait.modifies || []).forEach((modifiedTraitName, overrideIndex) => {
        const traitName =
          findStandardTraitByName(race, modifiedTraitName)?.name ||
          modifiedTraitName;
        const standardTrait = findStandardTraitByName(race, traitName);
        const override =
          modifiedTraitOverrideFor(trait, traitName) || { trait: traitName };
        const editorKey = `${kind}:${index}:${relationKey(traitName)}`;
        const overrideEditors = {
          additions: null,
          replacements: new Map(),
        };
        ["passive", "active"].forEach((group) => {
          const standardMechanics = traitMechanicGroup(standardTrait, group);
          TRAIT_MECHANIC_KEYS.forEach((mechanicKey) => {
            const standardRows = Array.isArray(standardMechanics?.[mechanicKey])
              ? standardMechanics[mechanicKey]
              : [];
            standardRows.forEach((standardRow, rowIndex) => {
              const mount = document.getElementById(
                mechanicReplacementMountId(
                  kind,
                  index,
                  overrideIndex,
                  group,
                  mechanicKey,
                  rowIndex,
                ),
              );
              if (!mount || !window.PFEffectEditor) return;
              const operation = mechanicOperationFor(
                override,
                mechanicKey,
                standardRow,
                rowIndex,
                group,
              );
              const replacement = operation?.value || standardRow;
              const rowController = createMechanicEditorRow(
                mechanicKey,
                replacement,
                {
                  skills: [],
                  onChange: () => setDirty(true),
                },
              );
              if (!rowController) return;
              mount.innerHTML = "";
              mount.appendChild(rowController.element);
              overrideEditors.replacements.set(
                `${group}:${mechanicKey}:${rowIndex}`,
                {
                  key: mechanicKey,
                  rowIndex,
                  collect: rowController.collect,
                },
              );
            });
          });
        });
        const additionsMount = document.getElementById(
          `raceTraitOverrideAdditions-${kind}-${index}-${overrideIndex}`,
        );
        if (additionsMount && window.PFEffectEditor) {
          const additionsEditor = window.PFEffectEditor.mountMechanicGroups(
            additionsMount,
            {
              idPrefix: `race${selectedIndex}${kind}${index}Override${overrideIndex}Additions`,
              effectsKey: "effects",
              allowBranches: false,
              onChange: () => setDirty(true),
            },
          );
          additionsEditor.reset({
            ...mechanicAdditions(override, "passive"),
            activeMechanics: {
              ...mechanicAdditions(override, "active"),
              ...(override.activeDurationConfig
                ? { durationConfig: override.activeDurationConfig }
                : {}),
            },
          });
          overrideEditors.additions = additionsEditor;
        }
        traitModifierOverrideEditors.set(editorKey, overrideEditors);
      });
    });
  });
  autoSizeTraitTextareas();
}

function updateTraitRequirementToggle(card) {
  const panel = card.querySelector("[data-trait-attribute-requirement]");
  const button = card.querySelector("[data-toggle-trait-attribute-requirement]");
  if (!panel || !button) return;
  const open = !panel.classList.contains("d-none");
  button.setAttribute("aria-expanded", String(open));
  button.classList.toggle("btn-outline-info", open);
  button.classList.toggle("btn-outline-secondary", !open);
}

function toggleTraitAttributeRequirement(card) {
  const panel = card.querySelector("[data-trait-attribute-requirement]");
  if (!panel) return;
  panel.classList.toggle("d-none");
  updateTraitRequirementToggle(card);
}

function openTraitDurationEditor(card) {
  if (!window.PFEffectDurationEditor) return;
  const key = traitKey(card.dataset.traitKind, Number(card.dataset.traitIndex));
  traitDurationEditor =
    traitDurationEditor || new window.PFEffectDurationEditor("racialTrait");
  traitDurationEditor.open(traitDurationConfigs.get(key) || {}, (config) => {
    traitDurationConfigs.set(key, config);
    updateTraitDurationSummary(card);
    setDirty(true);
  });
}

function relationTraitOptions(race = {}) {
  return (race.standardTraits || [])
    .map((trait) => trait.name || trait.trait || "")
    .filter(Boolean)
    .map((name) => ({
      name,
      search: `${name} ${slugify(name).replace(/-/g, " ")}`.toLowerCase(),
    }));
}

function relationInputParts(input) {
  return splitList(input.value);
}

function relationInputQuery(input) {
  const parts = String(input.value || "").split(",");
  return (parts[parts.length - 1] || "").trim().toLowerCase();
}

function setRelationInputParts(input, parts) {
  input.value = parts.filter(Boolean).join(", ");
}

function appendRelationTrait(input, name) {
  const parts = relationInputParts(input);
  const currentQuery = relationInputQuery(input);
  const hasTrailingQuery =
    currentQuery &&
    parts.length &&
    parts[parts.length - 1].toLowerCase() === currentQuery;
  if (hasTrailingQuery) parts.pop();
  const exists = parts.some(
    (part) => slugify(part) === slugify(name),
  );
  if (!exists) parts.push(name);
  setRelationInputParts(input, parts);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function canonicalizeRelationInput(input, race = {}) {
  const field = input.dataset.traitRelationInput;
  const options = field === "replaces" ? { strict: true } : {};
  if (!window.PFRaceData?.canonicalTraitTargets) return;
  setRelationInputParts(
    input,
    window.PFRaceData.canonicalTraitTargets(
      relationInputParts(input),
      race.standardTraits || [],
      options,
    ),
  );
}

function refreshModifierOverridePanels(input) {
  if (input.dataset.traitRelationInput !== "modifies") return;
  commitSelectedRace();
  setDirty(true);
  renderSelectedRace();
}

function renderRelationSuggestions(input, race = {}) {
  const wrapper = input.closest("[data-trait-relation-field]");
  const suggestions = wrapper?.querySelector("[data-trait-relation-suggestions]");
  if (!suggestions) return;
  const query = relationInputQuery(input);
  const selected = new Set(relationInputParts(input).map(slugify));
  const matches = relationTraitOptions(race)
    .filter((option) => !selected.has(slugify(option.name)))
    .filter((option) => !query || option.search.includes(query))
    .slice(0, 10);
  suggestions.innerHTML = matches.length
    ? matches
        .map(
          (option) => `
            <button class="trait-relation-suggestion" type="button" data-relation-option="${escapeHtml(option.name)}">
              ${escapeHtml(option.name)}
            </button>
          `,
        )
        .join("")
    : query
      ? `<div class="trait-relation-empty">No standard trait match.</div>`
      : "";
  suggestions.classList.toggle("is-open", Boolean(suggestions.innerHTML));
  suggestions
    .querySelectorAll("[data-relation-option]")
    .forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        appendRelationTrait(input, button.dataset.relationOption);
        canonicalizeRelationInput(input, race);
        refreshModifierOverridePanels(input);
        renderRelationSuggestions(input, race);
      });
    });
}

function hideRelationSuggestions(input) {
  const suggestions = input
    .closest("[data-trait-relation-field]")
    ?.querySelector("[data-trait-relation-suggestions]");
  if (!suggestions) return;
  suggestions.classList.remove("is-open");
}

function mountTraitRelationSearches(race = {}) {
  el("raceEditorPanel")
    .querySelectorAll("[data-trait-relation-input]")
    .forEach((input) => {
      input.addEventListener("focus", () => renderRelationSuggestions(input, race));
      input.addEventListener("input", () => renderRelationSuggestions(input, race));
      input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hideRelationSuggestions(input);
          return;
        }
        if (event.key !== "Enter") return;
        const first = input
          .closest("[data-trait-relation-field]")
          ?.querySelector("[data-relation-option]");
        if (!first) return;
        event.preventDefault();
        appendRelationTrait(input, first.dataset.relationOption);
        canonicalizeRelationInput(input, race);
        refreshModifierOverridePanels(input);
        renderRelationSuggestions(input, race);
      });
      input.addEventListener("blur", () => {
        canonicalizeRelationInput(input, race);
        refreshModifierOverridePanels(input);
        setTimeout(() => hideRelationSuggestions(input), 120);
      });
    });
}

function mountModifierOverrideActionControls() {
  el("raceEditorPanel")
    .querySelectorAll("[data-mechanic-action]")
    .forEach((select) => {
      const sync = () => {
        const row = select.closest("[data-mechanic-key]");
        const replacement = row?.querySelector("[data-mechanic-replacement-mount]");
        replacement?.classList.toggle("d-none", select.value !== "replace");
      };
      select.addEventListener("change", () => {
        sync();
        setDirty(true);
      });
      sync();
    });
}

function autoSizeTraitTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function autoSizeTraitTextareas() {
  el("raceEditorPanel")
    ?.querySelectorAll(".trait-textarea")
    .forEach(autoSizeTraitTextarea);
}

function renderSelectedRace() {
  const race = raceData.races[selectedIndex];
  if (!race) {
    el("raceEditorPanel").innerHTML =
      `<div class="small-text">Choose a race to edit.</div>`;
    return;
  }

  el("raceEditorPanel").innerHTML = `
    <div class="d-flex justify-content-between gap-2 flex-wrap mb-3">
      <div>
        <h4 class="mb-0">${escapeHtml(race.name || "Unnamed Race")}</h4>
        <div class="small-text">${escapeHtml(race.group || "race")}${race.link ? ` | ${escapeHtml(race.link)}` : ""}</div>
      </div>
    </div>

    <section class="level-card mb-3">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>Summary</strong>
      </div>
      <div class="race-summary-grid">
        ${inputBlock("raceName", "Race Name", race.name)}
        ${inputBlock("raceGroup", "Group", race.group)}
        ${inputBlock("racePoints", "Race Points", race.racePoints ?? "")}
        ${inputBlock("raceLink", "Source URL", race.link)}
        ${inputBlock("raceAbilityPlus", "Ability Score Plus", race.abilityScorePlus)}
        ${inputBlock("raceAbilityMinus", "Ability Score Minus", race.abilityScoreMinus)}
        ${inputBlock("raceSize", "Size", race.size)}
        ${inputBlock("raceType", "Type", race.type)}
        ${inputBlock("raceSpeed", "Speed", race.speed)}
        ${inputBlock("raceStartingLanguages", "Starting Languages", race.startingLanguages)}
        ${inputBlock("raceSenses", "Senses", race.senses)}
        ${inputBlock("raceDefensiveTraits", "Defensive Traits", race.defensiveTraits)}
        ${inputBlock("raceOffensiveTraits", "Offensive Traits", race.offensiveTraits)}
        ${inputBlock("raceSkillBonuses", "Skill Bonuses", race.skillBonuses)}
        ${inputBlock("raceBonusFeats", "Bonus Feats", race.bonusFeats)}
        ${inputBlock("raceSpellLikeOrSupernaturalAbilities", "Spell-Like / Supernatural", race.spellLikeOrSupernaturalAbilities)}
      </div>
    </section>

    ${traitSection("Standard Racial Traits", "standardTraits", race.standardTraits || [], race)}
    ${traitSection("Alternate Racial Traits", "alternateTraits", race.alternateTraits || [], race)}
    ${favoredBonusSection(race)}
  `;

  mountTraitEffectEditors(race);
  mountTraitRelationSearches(race);
  mountModifierOverrideActionControls();
  el("raceEditorPanel")
    .querySelectorAll("[data-trait-kind]")
    .forEach(updateTraitRequirementToggle);

  el("raceEditorPanel")
    .querySelectorAll("input, textarea, select")
    .forEach((input) => {
      input.addEventListener("input", () => {
        if (input.classList.contains("trait-textarea")) {
          autoSizeTraitTextarea(input);
        }
        setDirty(true);
      });
      input.addEventListener("change", () => setDirty(true));
    });
  el("raceEditorPanel")
    .querySelectorAll("[data-toggle-trait-attribute-requirement]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-trait-kind]");
        if (card) toggleTraitAttributeRequirement(card);
      });
    });
  el("raceEditorPanel")
    .querySelectorAll("[data-add-trait]")
    .forEach((button) => {
      button.addEventListener("click", () => addTrait(button.dataset.addTrait));
    });
  el("raceEditorPanel")
    .querySelectorAll("[data-delete-trait]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-trait-kind]");
        deleteTrait(card.dataset.traitKind, Number(card.dataset.traitIndex));
      });
    });
  el("raceEditorPanel")
    .querySelector("[data-add-favored]")
    ?.addEventListener("click", addFavoredBonus);
  el("raceEditorPanel")
    .querySelectorAll("[data-delete-favored]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("[data-favored-index]");
        deleteFavoredBonus(Number(row.dataset.favoredIndex));
      });
    });
}

function collectModifiedTraitOverrides(card, kind, index) {
  if (kind !== "alternateTraits") return [];
  return [...card.querySelectorAll("[data-trait-modifier-override]")]
    .map((section) => {
      const trait = section.dataset.traitModifierOverride || "";
      const editors = traitModifierOverrideEditors.get(
        `${kind}:${index}:${relationKey(trait)}`,
      );
      const mechanicOverrides = Object.fromEntries(
        TRAIT_MECHANIC_KEYS.map((key) => [key, []]),
      );
      const activeMechanicOverrides = Object.fromEntries(
        TRAIT_MECHANIC_KEYS.map((key) => [key, []]),
      );
      section.querySelectorAll("[data-mechanic-key]").forEach((row) => {
        const group = row.dataset.mechanicScope || "passive";
        const mechanicKey = row.dataset.mechanicKey;
        const rowIndex = Number(row.dataset.mechanicRowIndex || 0);
        const targetKey = row.dataset.mechanicTargetKey || "";
        const action =
          row.querySelector("[data-mechanic-action]")?.value || "keep";
        if (action === "keep") return;
        const operation = {
          action,
          targetIndex: rowIndex,
          targetKey,
        };
        if (action === "replace") {
          const replacement = editors?.replacements
            ?.get(`${group}:${mechanicKey}:${rowIndex}`)
            ?.collect?.();
          if (!replacement) return;
          operation.value = replacement;
        }
        const operationMap =
          group === "active" ? activeMechanicOverrides : mechanicOverrides;
        operationMap[mechanicKey].push(operation);
      });
      const additions = editors?.additions?.collect?.() || {};
      TRAIT_MECHANIC_KEYS.forEach((key) => {
        (Array.isArray(additions[key]) ? additions[key] : []).forEach((value) => {
          mechanicOverrides[key].push({
            action: "add",
            value,
            preserveAsAddition: true,
          });
        });
        const activeAdditions = additions.activeMechanics?.[key];
        (Array.isArray(activeAdditions) ? activeAdditions : []).forEach(
          (value) => {
            activeMechanicOverrides[key].push({
              action: "add",
              value,
              preserveAsAddition: true,
            });
          },
        );
      });
      const override = {
        trait,
        mechanicOverrides,
        activeMechanicOverrides,
        ...(additions.activeMechanics?.durationConfig
          ? { activeDurationConfig: additions.activeMechanics.durationConfig }
          : {}),
      };
      return traitHasAnyMechanics(override) ? override : null;
    })
    .filter(Boolean);
}

function collectTrait(card) {
  const kind = card.dataset.traitKind;
  const index = Number(card.dataset.traitIndex);
  const sourceTrait = raceData.races[selectedIndex]?.[kind]?.[index] || {};
  const editor = traitEffectEditors.get(`${kind}:${index}`);
  const extras = editor?.collect?.() || {};
  const name = card.querySelector('[data-trait-field="name"]').value.trim();
  const trait = {
    name: name || "Trait",
    category: card.querySelector('[data-trait-field="category"]').value.trim(),
    description: card
      .querySelector('[data-trait-field="description"]')
      .value.trim(),
    replaces: splitList(card.querySelector('[data-trait-field="replaces"]')?.value),
    modifies: splitList(card.querySelector('[data-trait-field="modifies"]')?.value),
    modifiedTraitOverrides: collectModifiedTraitOverrides(card, kind, index),
    effects: extras.effects || [],
    ...(extras.branches?.length ? { branches: extras.branches } : {}),
    damageReduction: extras.damageReduction || [],
    spellResistance: extras.spellResistance || [],
    immunities: extras.immunities || [],
    applyConditions: extras.applyConditions || [],
    classSkillGrants: extras.classSkillGrants || [],
    bonusRanks: extras.bonusRanks || [],
    extraRanksPerLevel: extras.extraRanksPerLevel || [],
    featGrants: extras.featGrants || [],
    sizeChanges: extras.sizeChanges || [],
    spellLikeAbilities: extras.spellLikeAbilities || [],
    casterLevelBonuses: extras.casterLevelBonuses || [],
    spellDcBonuses: extras.spellDcBonuses || [],
    effectiveAttributeBonuses: extras.effectiveAttributeBonuses || [],
    grantDomains: extras.grantDomains || [],
    generatedEquipment: extras.generatedEquipment || [],
    conditionalVariables: extras.conditionalVariables || [],
    damageRolls: extras.damageRolls || [],
    activeMechanics: extras.activeMechanics,
    activatableAbilities: Array.isArray(sourceTrait.activatableAbilities)
      ? cloneJson(sourceTrait.activatableAbilities)
      : [],
    choicePools: Array.isArray(sourceTrait.choicePools)
      ? cloneJson(sourceTrait.choicePools)
      : Array.isArray(sourceTrait.pools)
        ? cloneJson(sourceTrait.pools)
        : [],
  };
  const requiredAttribute = card.querySelector(
    '[data-trait-field="requiredAttribute"]',
  )?.value;
  const requiredScore = Number(
    card.querySelector('[data-trait-field="requiredScore"]')?.value || 0,
  );
  if (
    requiredAttribute &&
    Number.isFinite(requiredScore) &&
    requiredScore > 0
  ) {
    trait.attributeRequirement = {
      attribute: requiredAttribute,
      score: Math.floor(requiredScore),
    };
  }
  return trait;
}

function collectFavoredBonus(row) {
  return {
    className: row.querySelector('[data-favored-field="className"]').value.trim(),
    description: row
      .querySelector('[data-favored-field="description"]')
      .value.trim(),
    effects: [],
  };
}

function commitSelectedRace() {
  const race = raceData.races[selectedIndex];
  if (!race || !el("raceName")) return;
  race.name = el("raceName").value.trim() || race.name;
  race.race = race.name;
  race.group = el("raceGroup").value.trim() || "Other Races";
  race.link = el("raceLink").value.trim();
  race.racePoints = el("racePoints").value.trim()
    ? Number(el("racePoints").value || 0)
    : null;
  race.abilityScorePlus = el("raceAbilityPlus").value.trim();
  race.abilityScoreMinus = el("raceAbilityMinus").value.trim();
  race.size = el("raceSize").value.trim();
  race.type = el("raceType").value.trim();
  race.speed = el("raceSpeed").value.trim();
  race.startingLanguages = el("raceStartingLanguages").value.trim();
  race.senses = el("raceSenses").value.trim();
  race.defensiveTraits = el("raceDefensiveTraits").value.trim();
  race.offensiveTraits = el("raceOffensiveTraits").value.trim();
  race.skillBonuses = el("raceSkillBonuses").value.trim();
  race.bonusFeats = el("raceBonusFeats").value.trim();
  race.spellLikeOrSupernaturalAbilities = el(
    "raceSpellLikeOrSupernaturalAbilities",
  ).value.trim();
  race.standardTraits = [
    ...document.querySelectorAll('[data-trait-kind="standardTraits"]'),
  ].map(collectTrait);
  race.alternateTraits = [
    ...document.querySelectorAll('[data-trait-kind="alternateTraits"]'),
  ].map(collectTrait);
  if (window.PFRaceData?.canonicalTraitTargets) {
    race.alternateTraits = race.alternateTraits.map((trait) => ({
      ...trait,
      replaces: window.PFRaceData.canonicalTraitTargets(
        trait.replaces,
        race.standardTraits,
        { strict: true },
      ),
      modifies: window.PFRaceData.canonicalTraitTargets(
        trait.modifies,
        race.standardTraits,
      ),
      modifiedTraitOverrides: window.PFRaceData.canonicalizeModifiedTraitOverrides
        ? window.PFRaceData.canonicalizeModifiedTraitOverrides(
            trait.modifiedTraitOverrides,
            race.standardTraits,
          )
        : trait.modifiedTraitOverrides,
    }));
  }
  race.favoredClassBonuses = [
    ...document.querySelectorAll("[data-favored-index]"),
  ].map(collectFavoredBonus);
  race.slug = slugify(race.name);
}

function addTrait(kind) {
  commitSelectedRace();
  raceData.races[selectedIndex][kind].push(normalizeTrait({ name: "New Trait" }));
  setDirty(true);
  renderSelectedRace();
}

function deleteTrait(kind, index) {
  if (!confirm("Delete this racial trait?")) return;
  commitSelectedRace();
  raceData.races[selectedIndex][kind].splice(index, 1);
  setDirty(true);
  renderSelectedRace();
}

function addFavoredBonus() {
  commitSelectedRace();
  raceData.races[selectedIndex].favoredClassBonuses.push(
    normalizeFavoredBonus({ className: "Class" }),
  );
  setDirty(true);
  renderSelectedRace();
}

function deleteFavoredBonus(index) {
  if (!confirm("Delete this favored class bonus?")) return;
  commitSelectedRace();
  raceData.races[selectedIndex].favoredClassBonuses.splice(index, 1);
  setDirty(true);
  renderSelectedRace();
}

async function loadDefaultRaces() {
  raceData = await window.PFRaceData.loadRaces();
  raceData.races = (raceData.races || []).map(normalizeRace);
  rebuildGroups();
  selectedIndex = raceData.races.length ? 0 : -1;
  setDirty(false);
  renderGroupFilter();
  renderRaceList();
  renderSelectedRace();
  setStatus(
    "Loaded race data from data/races.json. Use Open Project Folder to save directly into this project.",
    "info",
  );
}

async function readRacesFromProjectDirectory(handle) {
  dataDirectoryHandle = await handle.getDirectoryHandle("data");
  const raceHandle = await dataDirectoryHandle.getFileHandle("races.json");
  const rawRaceData = JSON.parse(await (await raceHandle.getFile()).text());
  raceData = window.PFRaceData?.normalizeRaceData
    ? window.PFRaceData.normalizeRaceData(rawRaceData)
    : rawRaceData;
  raceData.races = (raceData.races || []).map(normalizeRace);
  rebuildGroups();
  selectedIndex = raceData.races.length ? 0 : -1;
  setDirty(false);
  renderGroupFilter();
  renderRaceList();
  renderSelectedRace();
  setStatus("Opened race data from the selected project folder.", "success");
}

async function openProjectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus(
      "This browser cannot write directly to project folders.",
      "warning",
    );
    return;
  }
  projectDirectoryHandle = await window.showDirectoryPicker({
    mode: "readwrite",
  });
  await readRacesFromProjectDirectory(projectDirectoryHandle);
}

async function saveRacesFile() {
  commitSelectedRace();
  const payload = racePayload();
  if (!dataDirectoryHandle && projectDirectoryHandle) {
    dataDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle(
      "data",
      { create: true },
    );
  }
  if (!dataDirectoryHandle && window.showDirectoryPicker) {
    projectDirectoryHandle = await window.showDirectoryPicker({
      mode: "readwrite",
    });
    dataDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle(
      "data",
      { create: true },
    );
  }
  if (dataDirectoryHandle) {
    const handle = await dataDirectoryHandle.getFileHandle("races.json", {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify(payload, null, 2)}\n`);
    await writable.close();
    window.PFRaceData?.reset?.();
    setDirty(false);
    setStatus("Saved race data inside data/races.json.", "success");
    return;
  }
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "races.json";
  link.click();
  URL.revokeObjectURL(url);
  setDirty(false);
  setStatus(
    "Downloaded races.json because direct project saving is unavailable.",
    "warning",
  );
}

function exportSelectedRace() {
  const race = raceData.races[selectedIndex];
  if (!race) {
    setStatus("Select a race first.", "warning");
    return;
  }
  commitSelectedRace();
  const filename = `${slugify(race.name)}.json`;
  const blob = new Blob([`${JSON.stringify(race, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded ${filename}.`, "success");
}

async function initRaceEditor() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  const admin = await PFApp.isAppAdmin();
  if (!admin) {
    document.querySelector("main").innerHTML =
      `<div class="alert alert-warning">Only app admins can access this tool.</div>`;
    return;
  }
  await loadDefaultRaces();
}

el("raceSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderRaceList();
});

el("raceGroupFilter").addEventListener("change", (event) => {
  groupFilter = event.target.value;
  renderRaceList();
});

el("openProjectFolderBtn").addEventListener("click", async () => {
  try {
    await openProjectFolder();
  } catch (error) {
    setStatus(error.message || "Could not open the project folder.", "danger");
  }
});

el("saveRacesFileBtn").addEventListener("click", async () => {
  try {
    await saveRacesFile();
  } catch (error) {
    setStatus(error.message || "Could not save race data.", "danger");
  }
});

el("exportSelectedRaceBtn").addEventListener("click", () => {
  try {
    exportSelectedRace();
  } catch (error) {
    setStatus(error.message || "Could not export the selected race.", "danger");
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

initRaceEditor();
