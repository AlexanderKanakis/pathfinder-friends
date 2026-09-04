let raceData = { source: "", generatedAt: "", groups: [], races: [] };
let selectedIndex = -1;
let searchTerm = "";
let groupFilter = "";
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;
let dirty = false;
let traitEffectEditors = new Map();

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
    .map((part) => part.trim().toLowerCase())
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
    replaces: Array.isArray(trait.replaces) ? trait.replaces : [],
    modifies: Array.isArray(trait.modifies) ? trait.modifies : [],
    effects: Array.isArray(trait.effects) ? trait.effects : [],
    damageReduction: Array.isArray(trait.damageReduction)
      ? trait.damageReduction
      : [],
    spellResistance: Array.isArray(trait.spellResistance)
      ? trait.spellResistance
      : [],
    classSkillGrants: Array.isArray(trait.classSkillGrants)
      ? trait.classSkillGrants
      : [],
    sizeChanges: Array.isArray(trait.sizeChanges) ? trait.sizeChanges : [],
    spellLikeAbilities: Array.isArray(trait.spellLikeAbilities)
      ? trait.spellLikeAbilities
      : [],
  };
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

function traitCard(kind, trait, index) {
  const isAlternate = kind === "alternateTraits";
  return `
    <article class="trait-card" data-trait-kind="${kind}" data-trait-index="${index}">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <strong>${escapeHtml(trait.name || "Trait")}</strong>
        <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-trait aria-label="Delete trait">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      <div class="trait-grid">
        <div>
          <label>Name</label>
          <input data-trait-field="name" class="form-control form-control-sm" value="${escapeHtml(trait.name || "")}">
        </div>
        <div>
          <label>Category</label>
          <input data-trait-field="category" class="form-control form-control-sm" value="${escapeHtml(trait.category || "")}">
        </div>
        ${
          isAlternate
            ? `
          <div class="trait-relation-grid">
            <div>
              <label>Replaces</label>
              <input data-trait-field="replaces" class="form-control form-control-sm" value="${escapeHtml(joinList(trait.replaces))}" placeholder="hatred, stonecunning">
            </div>
            <div>
              <label>Modifies</label>
              <input data-trait-field="modifies" class="form-control form-control-sm" value="${escapeHtml(joinList(trait.modifies))}" placeholder="elven magic">
            </div>
          </div>
        `
            : `<div></div>`
        }
        <div class="grid-column-full">
          <label>Description</label>
          <textarea data-trait-field="description" class="form-control form-control-sm trait-textarea">${escapeHtml(trait.description || "")}</textarea>
        </div>
      </div>
      <div id="raceTraitEffects-${kind}-${index}" class="accordion shared-extra-accordion mt-2" data-trait-effect-mount></div>
    </article>
  `;
}

function traitSection(title, kind, traits) {
  return `
    <section class="level-card mb-3">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>${escapeHtml(title)}</strong>
        <button class="btn btn-outline-info btn-sm" type="button" data-add-trait="${kind}">
          <i class="bi bi-plus-lg"></i> Trait
        </button>
      </div>
      <div class="trait-list">
        ${traits.map((trait, index) => traitCard(kind, trait, index)).join("") || `<div class="small-text">No traits recorded.</div>`}
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
  ["standardTraits", "alternateTraits"].forEach((kind) => {
    (race[kind] || []).forEach((trait, index) => {
      const mount = document.getElementById(`raceTraitEffects-${kind}-${index}`);
      if (!mount || !window.PFEffectEditor) return;
      const editor = window.PFEffectEditor.mountEffectsAccordion(mount, {
        idPrefix: `race${selectedIndex}${kind}${index}`,
        effectsKey: "effects",
        onChange: () => setDirty(true),
      });
      editor.reset(trait);
      traitEffectEditors.set(`${kind}:${index}`, editor);
    });
  });
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

    ${traitSection("Standard Racial Traits", "standardTraits", race.standardTraits || [])}
    ${traitSection("Alternate Racial Traits", "alternateTraits", race.alternateTraits || [])}
    ${favoredBonusSection(race)}
  `;

  mountTraitEffectEditors(race);

  el("raceEditorPanel")
    .querySelectorAll("input, textarea, select")
    .forEach((input) => {
      input.addEventListener("input", () => setDirty(true));
      input.addEventListener("change", () => setDirty(true));
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

function collectTrait(card) {
  const kind = card.dataset.traitKind;
  const index = Number(card.dataset.traitIndex);
  const editor = traitEffectEditors.get(`${kind}:${index}`);
  const extras = editor?.collect?.() || {};
  const name = card.querySelector('[data-trait-field="name"]').value.trim();
  return {
    name: name || "Trait",
    category: card.querySelector('[data-trait-field="category"]').value.trim(),
    description: card
      .querySelector('[data-trait-field="description"]')
      .value.trim(),
    replaces: splitList(card.querySelector('[data-trait-field="replaces"]')?.value),
    modifies: splitList(card.querySelector('[data-trait-field="modifies"]')?.value),
    effects: extras.effects || [],
    damageReduction: extras.damageReduction || [],
    spellResistance: extras.spellResistance || [],
    classSkillGrants: extras.classSkillGrants || [],
    sizeChanges: extras.sizeChanges || [],
    spellLikeAbilities: extras.spellLikeAbilities || [],
  };
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
