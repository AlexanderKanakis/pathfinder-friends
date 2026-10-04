let spellData = [];
let selectedIndex = -1;
let searchTerm = "";
let schoolFilter = "";
let levelFilter = "";
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;
let dirty = false;
let suppressDirty = false;
let currentEffectsAccordion = null;

const SPELL_EFFECT_EXTRA_KEYS = window.PFEffectMechanics?.extraKeys?.() || [
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
];

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
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "spell"
  );
}

function splitCommaList(value = "") {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinCommaList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function setStatus(message, type = "info") {
  const status = el("spellEditorStatus");
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
  document.title = `${dirty ? "* " : ""}PathFriends Spell Editor`;
  renderSpellList();
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function spellDetails(spell = {}) {
  if (!spell.details || typeof spell.details !== "object") spell.details = {};
  return spell.details;
}

function spellSchool(spell = {}) {
  return (
    String(spell.details?.school || "")
      .split(/[,(]/)[0]
      .trim()
      .toLowerCase() || "unknown"
  );
}

function titleCase(value = "") {
  return String(value || "")
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function spellLevels(spell = {}) {
  const levels = String(spell.details?.level || "");
  const found = [...levels.matchAll(/\b(\d+)\b/g)]
    .map((match) => Number(match[1]))
    .filter((level) => level >= 0 && level <= 9);
  return [...new Set(found)].sort((left, right) => left - right);
}

function primarySpellLevel(spell = {}) {
  const levels = spellLevels(spell);
  return levels.length ? levels[0] : 0;
}

function schoolNames() {
  return [...new Set(spellData.map(spellSchool))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function renderFilters() {
  const currentSchool = schoolFilter;
  const currentLevel = levelFilter;
  el("spellSchoolFilter").innerHTML = `
    <option value="">All Schools</option>
    ${schoolNames()
      .map(
        (school) =>
          `<option value="${escapeHtml(school)}" ${currentSchool === school ? "selected" : ""}>${escapeHtml(titleCase(school))}</option>`,
      )
      .join("")}
  `;
  el("spellLevelFilter").innerHTML = `
    <option value="">All Levels</option>
    ${Array.from({ length: 10 }, (_, level) => level)
      .map(
        (level) =>
          `<option value="${level}" ${String(currentLevel) === String(level) ? "selected" : ""}>${level}</option>`,
      )
      .join("")}
  `;
}

function spellSearchHaystack(spell = {}) {
  const details = spell.details || {};
  return [
    spell.name,
    spell.link,
    details.level,
    details.school,
    ...(Array.isArray(details.descriptors) ? details.descriptors : []),
    details.casting_time,
    details.components,
    details.range,
    details.target,
    details.area,
    details.duration,
    details.saving_throw,
    details.spell_resistance,
    details.description,
  ]
    .join(" ")
    .toLowerCase();
}

function filteredSpellIndexes() {
  const term = searchTerm.trim().toLowerCase();
  return spellData
    .map((spell, index) => ({ spell, index }))
    .filter(({ spell }) => {
      const levels = spellLevels(spell);
      return (
        (!schoolFilter || spellSchool(spell) === schoolFilter) &&
        (!levelFilter || levels.includes(Number(levelFilter))) &&
        (!term || spellSearchHaystack(spell).includes(term))
      );
    })
    .sort(
      (left, right) =>
        spellSchool(left.spell).localeCompare(spellSchool(right.spell)) ||
        primarySpellLevel(left.spell) - primarySpellLevel(right.spell) ||
        String(left.spell.name || "").localeCompare(String(right.spell.name || "")),
    )
    .map((item) => item.index);
}

function groupLabelFor(spell = {}) {
  return `${titleCase(spellSchool(spell))} | Level ${primarySpellLevel(spell)}`;
}

function renderSpellList() {
  const indexes = filteredSpellIndexes();
  el("spellCount").innerHTML =
    `${spellData.length} spells${dirty ? ' <span class="dirty-dot" title="Unsaved changes"></span>' : ""}`;
  let currentGroup = "";
  const html = indexes
    .map((index) => {
      const spell = spellData[index];
      const group = groupLabelFor(spell);
      const heading =
        group === currentGroup
          ? ""
          : ((currentGroup = group),
            `<div class="spell-group-heading">${escapeHtml(group)}</div>`);
      return `
        ${heading}
        <button class="btn ${index === selectedIndex ? "btn-primary" : "btn-outline-light"} btn-sm" type="button" data-spell-index="${index}">
          <span class="spell-list-name">${escapeHtml(spell.name || "Unnamed Spell")}</span>
          <span class="spell-list-meta">${escapeHtml((spell.details?.descriptors || []).join(", "))}</span>
        </button>
      `;
    })
    .join("");
  el("spellList").innerHTML =
    html || `<div class="small-text">No matching spells.</div>`;

  el("spellList")
    .querySelectorAll("[data-spell-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        commitSelectedSpell();
        selectedIndex = Number(button.dataset.spellIndex);
        renderSpellList();
        renderSelectedSpell();
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

function textareaBlock(id, label, value, extra = "", tall = false) {
  return `
    <div class="${extra}">
      <label for="${id}">${escapeHtml(label)}</label>
      <textarea id="${id}" class="form-control form-control-sm spell-textarea ${tall ? "spell-textarea-tall" : ""}">${escapeHtml(value || "")}</textarea>
    </div>
  `;
}

function mountSpellEffects(spell) {
  const mount = el("spellEffectsAccordion");
  currentEffectsAccordion = null;
  if (!mount || !window.PFEffectEditor) return;
  currentEffectsAccordion = window.PFEffectEditor.mountMechanicGroups(mount, {
    idPrefix: `spell${selectedIndex}Effects`,
    activeOnly: true,
    effectsKey: "effects",
    onChange: () => {
      if (!suppressDirty) setDirty(true);
    },
  });
  suppressDirty = true;
  currentEffectsAccordion.reset(spell);
  suppressDirty = false;
}

function autoSizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function autoSizeTextareas() {
  el("spellEditorPanel")
    ?.querySelectorAll(".spell-textarea")
    .forEach(autoSizeTextarea);
}

function renderSelectedSpell() {
  const spell = spellData[selectedIndex];
  if (!spell) {
    el("spellEditorPanel").innerHTML =
      `<div class="small-text">Choose a spell to edit.</div>`;
    currentEffectsAccordion = null;
    return;
  }
  const details = spellDetails(spell);
  el("spellEditorPanel").innerHTML = `
    <div class="spell-detail-header">
      <div>
        <h4 class="mb-0">${escapeHtml(spell.name || "Unnamed Spell")}</h4>
        <div class="spell-detail-badges">
          <span class="badge text-bg-secondary">${escapeHtml(titleCase(spellSchool(spell)))}</span>
          <span class="badge text-bg-secondary">Level ${escapeHtml(primarySpellLevel(spell))}</span>
          ${(details.descriptors || [])
            .map((descriptor) => `<span class="badge text-bg-info">${escapeHtml(descriptor)}</span>`)
            .join("")}
        </div>
      </div>
      ${spell.link ? `<a class="btn btn-outline-info btn-sm" href="${escapeHtml(spell.link)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Source</a>` : ""}
    </div>

    <section class="level-card mb-3">
      <strong class="d-block mb-2">Spell Details</strong>
      <div class="spell-summary-grid">
        ${inputBlock("spellName", "Name", spell.name, "grid-column-half")}
        ${inputBlock("spellLink", "Source Link", spell.link, "grid-column-half")}
        ${inputBlock("spellSchool", "School", details.school, "grid-column-half")}
        ${inputBlock("spellDescriptors", "Descriptors", joinCommaList(details.descriptors), "grid-column-half")}
        ${inputBlock("spellLevel", "Level", details.level, "grid-column-full")}
        ${inputBlock("spellCastingTime", "Casting Time", details.casting_time, "grid-column-half")}
        ${inputBlock("spellComponents", "Components", details.components, "grid-column-half")}
        ${inputBlock("spellRange", "Range", details.range, "grid-column-half")}
        ${inputBlock("spellTarget", "Target", details.target, "grid-column-half")}
        ${inputBlock("spellArea", "Area", details.area, "grid-column-half")}
        ${inputBlock("spellDuration", "Duration", details.duration, "grid-column-half")}
        ${inputBlock("spellSavingThrow", "Saving Throw", details.saving_throw, "grid-column-half")}
        ${inputBlock("spellResistance", "Spell Resistance", details.spell_resistance, "grid-column-half")}
        ${textareaBlock("spellDescription", "Description", details.description, "grid-column-full", true)}
      </div>
    </section>

    <section class="level-card">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>Effects and Extras</strong>
        <span class="small-text">These are applied when a spell is cast from the character sheet.</span>
      </div>
      <div id="spellEffectsAccordion" class="accordion shared-extra-accordion"></div>
    </section>
  `;

  mountSpellEffects(spell);
  autoSizeTextareas();
  el("spellEditorPanel")
    .querySelectorAll("input, textarea, select")
    .forEach((input) => {
      input.addEventListener("input", () => {
        if (input.classList.contains("spell-textarea")) autoSizeTextarea(input);
        setDirty(true);
      });
      input.addEventListener("change", () => setDirty(true));
    });
}

function compactSpell(spell = {}) {
  const next = cloneJson(spell);
  SPELL_EFFECT_EXTRA_KEYS.forEach((key) => {
    if (Array.isArray(next[key]) && !next[key].length) delete next[key];
  });
  if (Array.isArray(next.effects) && !next.effects.length) delete next.effects;
  return next;
}

function commitSelectedSpell() {
  const spell = spellData[selectedIndex];
  if (!spell) return;
  const grouped = currentEffectsAccordion?.collect?.() || {};
  const extras = grouped.activeMechanics || {};
  const details = {
    ...spellDetails(spell),
    level: el("spellLevel")?.value.trim() || "",
    school: el("spellSchool")?.value.trim() || "",
    casting_time: el("spellCastingTime")?.value.trim() || "",
    components: el("spellComponents")?.value.trim() || "",
    range: el("spellRange")?.value.trim() || "",
    target: el("spellTarget")?.value.trim() || "",
    area: el("spellArea")?.value.trim() || "",
    duration: el("spellDuration")?.value.trim() || "",
    saving_throw: el("spellSavingThrow")?.value.trim() || "",
    spell_resistance: el("spellResistance")?.value.trim() || "",
    description: el("spellDescription")?.value || "",
    descriptors: splitCommaList(el("spellDescriptors")?.value),
  };
  spellData[selectedIndex] = compactSpell({
    ...spell,
    name: el("spellName")?.value.trim() || spell.name || "Unnamed Spell",
    link: el("spellLink")?.value.trim() || "",
    details,
    effects: extras.effects || [],
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
    generatedEquipment: extras.generatedEquipment || [],
    conditionalVariables: extras.conditionalVariables || [],
    casterLevelBonuses: extras.casterLevelBonuses || [],
    spellDcBonuses: extras.spellDcBonuses || [],
    effectiveAttributeBonuses: extras.effectiveAttributeBonuses || [],
    grantDomains: extras.grantDomains || [],
    activeMechanics: grouped.activeMechanics,
  });
}

async function loadDefaultSpells() {
  spellData = (await window.PFSpellData.loadSpells()).map((spell) =>
    compactSpell(cloneJson(spell)),
  );
  selectedIndex = spellData.length ? 0 : -1;
  setDirty(false);
  renderFilters();
  renderSpellList();
  renderSelectedSpell();
  setStatus(
    "Loaded spell data from data/spells.json. Use Open Project Folder to save directly into this project.",
    "info",
  );
}

async function readSpellsFromProjectDirectory(handle) {
  dataDirectoryHandle = await handle.getDirectoryHandle("data");
  const spellHandle = await dataDirectoryHandle.getFileHandle("spells.json");
  const raw = JSON.parse(await (await spellHandle.getFile()).text());
  spellData = (Array.isArray(raw) ? raw : raw.spells || []).map((spell) =>
    compactSpell(cloneJson(spell)),
  );
  selectedIndex = spellData.length ? 0 : -1;
  setDirty(false);
  renderFilters();
  renderSpellList();
  renderSelectedSpell();
  setStatus("Opened spell data from the selected project folder.", "success");
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
  await readSpellsFromProjectDirectory(projectDirectoryHandle);
}

async function saveSpellsFile() {
  commitSelectedSpell();
  const payload = spellData.map(compactSpell);
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
    const handle = await dataDirectoryHandle.getFileHandle("spells.json", {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify(payload, null, 2)}\n`);
    await writable.close();
    window.PFSpellData?.reset?.();
    setDirty(false);
    setStatus("Saved spell data inside data/spells.json.", "success");
    return;
  }

  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spells.json";
  link.click();
  URL.revokeObjectURL(url);
  setDirty(false);
  setStatus(
    "Downloaded spells.json because direct project saving is unavailable.",
    "warning",
  );
}

function exportSelectedSpell() {
  const spell = spellData[selectedIndex];
  if (!spell) {
    setStatus("Select a spell first.", "warning");
    return;
  }
  commitSelectedSpell();
  const filename = `${slugify(spell.name)}.json`;
  const blob = new Blob([`${JSON.stringify(spellData[selectedIndex], null, 2)}\n`], {
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

async function initSpellEditor() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  const admin = await PFApp.isAppAdmin();
  if (!admin) {
    document.querySelector("main").innerHTML =
      `<div class="alert alert-warning">Only app admins can access this tool.</div>`;
    return;
  }
  await loadDefaultSpells();
}

el("spellSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderSpellList();
});

el("spellSchoolFilter").addEventListener("change", (event) => {
  schoolFilter = event.target.value;
  renderSpellList();
});

el("spellLevelFilter").addEventListener("change", (event) => {
  levelFilter = event.target.value;
  renderSpellList();
});

el("openProjectFolderBtn").addEventListener("click", async () => {
  try {
    await openProjectFolder();
  } catch (error) {
    setStatus(error.message || "Could not open the project folder.", "danger");
  }
});

el("saveSpellsFileBtn").addEventListener("click", async () => {
  try {
    await saveSpellsFile();
  } catch (error) {
    setStatus(error.message || "Could not save spell data.", "danger");
  }
});

el("exportSelectedSpellBtn").addEventListener("click", () => {
  try {
    exportSelectedSpell();
  } catch (error) {
    setStatus(error.message || "Could not export the selected spell.", "danger");
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

initSpellEditor().catch((error) => {
  setStatus(error.message || "Could not load spell data.", "danger");
});
