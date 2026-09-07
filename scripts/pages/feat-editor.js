let featData = { source: "", sheet: "", generatedAt: "", types: [], feats: [] };
let selectedIndex = -1;
let searchTerm = "";
let typeFilter = "";
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;
let dirty = false;
let suppressDirty = false;
let currentEffectsAccordion = null;

const FEAT_FLAGS = [
  ["teamwork", "Teamwork"],
  ["critical", "Critical"],
  ["grit", "Grit"],
  ["style", "Style"],
  ["performance", "Performance"],
  ["racial", "Racial"],
  ["companion_familiar", "Companion / Familiar"],
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
  return window.PFFeatData?.slugify
    ? window.PFFeatData.slugify(text)
    : String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "feat";
}

function splitCommaList(value = "") {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitLineList(value = "") {
  return String(value || "")
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinCommaList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function joinLineList(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function setStatus(message, type = "info") {
  const status = el("featEditorStatus");
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
  document.title = `${dirty ? "* " : ""}PathFriends Feat Editor`;
  renderFeatList();
}

function normalizeFeat(feat = {}) {
  return window.PFFeatData?.normalizeFeat
    ? window.PFFeatData.normalizeFeat(feat)
    : feat;
}

function rebuildTypeGroups() {
  featData.types = window.PFFeatData?.rebuildTypeGroups
    ? window.PFFeatData.rebuildTypeGroups(featData.feats || [])
    : [];
}

function featPayload() {
  rebuildTypeGroups();
  if (window.PFFeatData?.compactFeatData) {
    return window.PFFeatData.compactFeatData({
      source: featData.source || window.PFFeatData.dataPath || "data/feats.json",
      sheet: featData.sheet || "",
      generatedAt: featData.generatedAt || new Date().toISOString(),
      schemaVersion: featData.schemaVersion || 1,
      types: featData.types,
      feats: featData.feats,
    });
  }
  return featData;
}

function typeNames() {
  return [
    ...new Set(
      (featData.feats || [])
        .flatMap((feat) => feat.types || [feat.type || "General"])
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

function renderTypeFilter() {
  const current = typeFilter;
  el("featTypeFilter").innerHTML = `
    <option value="">All Types</option>
    ${typeNames()
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}" ${current === name ? "selected" : ""}>${escapeHtml(name)}</option>`,
      )
      .join("")}
  `;
}

function filteredFeatIndexes() {
  const term = searchTerm.trim().toLowerCase();
  return (featData.feats || [])
    .map((feat, index) => ({ feat, index }))
    .filter(({ feat }) => {
      const haystack = [
        feat.name,
        feat.type,
        ...(feat.types || []),
        feat.source,
        feat.prerequisites,
        feat.benefit,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!typeFilter || (feat.types || []).includes(typeFilter) || feat.type === typeFilter) &&
        (!term || haystack.includes(term))
      );
    })
    .sort(
      (left, right) =>
        String(left.feat.name || "").localeCompare(String(right.feat.name || "")) ||
        String(left.feat.id || "").localeCompare(String(right.feat.id || "")),
    )
    .map((item) => item.index);
}

function renderFeatList() {
  const indexes = filteredFeatIndexes();
  el("featCount").innerHTML =
    `${(featData.feats || []).length} feats${dirty ? ' <span class="dirty-dot" title="Unsaved changes"></span>' : ""}`;
  el("featList").innerHTML =
    indexes
      .map((index) => {
        const feat = featData.feats[index];
        return `
          <button class="btn ${index === selectedIndex ? "btn-primary" : "btn-outline-light"} btn-sm" type="button" data-feat-index="${index}">
            <span class="feat-list-name">${escapeHtml(feat.name || "Unnamed Feat")}</span>
            <span class="feat-type">${escapeHtml(feat.type || "")}</span>
          </button>
        `;
      })
      .join("") || `<div class="small-text">No matching feats.</div>`;

  el("featList")
    .querySelectorAll("[data-feat-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        commitSelectedFeat();
        selectedIndex = Number(button.dataset.featIndex);
        renderFeatList();
        renderSelectedFeat();
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
      <textarea id="${id}" class="form-control form-control-sm feat-textarea ${tall ? "feat-textarea-tall" : ""}">${escapeHtml(value || "")}</textarea>
    </div>
  `;
}

function selectBlock(id, label, value, options, extra = "") {
  return `
    <div class="${extra}">
      <label for="${id}">${escapeHtml(label)}</label>
      <select id="${id}" class="form-select form-select-sm">
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option || "None")}</option>`,
          )
          .join("")}
      </select>
    </div>
  `;
}

function featFlagGrid(feat) {
  const flags = feat.flags || {};
  return `
    <div class="feat-flags-grid">
      ${FEAT_FLAGS.map(
        ([key, label]) => `
          <div class="feat-flag">
            <input id="featFlag-${key}" data-feat-flag="${key}" class="form-check-input m-0" type="checkbox" ${flags[key] ? "checked" : ""}>
            <label for="featFlag-${key}">${escapeHtml(label)}</label>
          </div>
        `,
      ).join("")}
    </div>
  `;
}

function mountFeatEffects(feat) {
  const mount = el("featEffectsAccordion");
  currentEffectsAccordion = null;
  if (!mount || !window.PFEffectEditor) return;
  currentEffectsAccordion = window.PFEffectEditor.mountEffectsAccordion(mount, {
    idPrefix: `feat${selectedIndex}Effects`,
    effectsKey: "effects",
    onChange: () => {
      if (!suppressDirty) setDirty(true);
    },
  });
  suppressDirty = true;
  currentEffectsAccordion.reset(feat);
  suppressDirty = false;
}

function autoSizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function autoSizeTextareas() {
  el("featEditorPanel")
    ?.querySelectorAll(".feat-textarea")
    .forEach(autoSizeTextarea);
}

function renderSelectedFeat() {
  const feat = featData.feats[selectedIndex];
  if (!feat) {
    el("featEditorPanel").innerHTML =
      `<div class="small-text">Choose a feat to edit.</div>`;
    currentEffectsAccordion = null;
    return;
  }

  const allTypes = typeNames();
  if (!allTypes.includes(feat.type || "General")) allTypes.push(feat.type || "General");
  const confidenceOptions = ["none", "low", "medium", "high", "manual"];

  el("featEditorPanel").innerHTML = `
    <div class="feat-detail-header">
      <div>
        <h4 class="mb-0">${escapeHtml(feat.name || "Unnamed Feat")}</h4>
        <div class="feat-type-badges">
          ${(feat.types || [])
            .map((type) => `<span class="badge text-bg-secondary">${escapeHtml(type)}</span>`)
            .join("")}
        </div>
      </div>
      <button id="deleteSelectedFeatBtn" class="btn btn-outline-danger btn-sm" type="button">
        <i class="bi bi-trash"></i> Delete
      </button>
    </div>

    <section class="level-card mb-3">
      <strong class="d-block mb-2">Feat Details</strong>
      <div class="feat-summary-grid">
        ${inputBlock("featName", "Name", feat.name, "grid-column-half")}
        ${inputBlock("featId", "ID", feat.id)}
        ${inputBlock("featSlug", "Slug", feat.slug)}
        ${selectBlock("featType", "Primary Type", feat.type || "General", allTypes)}
        ${inputBlock("featTypes", "All Types", joinCommaList(feat.types), "grid-column-half")}
        ${inputBlock("featSource", "Source", feat.source)}
        ${inputBlock("featSheetId", "Sheet ID", feat.sheetId)}
        ${selectBlock("featEffectConfidence", "Effect Confidence", feat.effectConfidence || "none", confidenceOptions)}
        ${inputBlock("featRaceName", "Race", feat.raceName)}
        ${inputBlock("featPrerequisiteFeats", "Prerequisite Feats", joinCommaList(feat.prerequisiteFeats), "grid-column-half")}
        ${inputBlock("featSuggestedTraits", "Suggested Traits", joinCommaList(feat.suggestedTraits), "grid-column-half")}
        <div>
          <label for="featMultiples">Can Be Taken More Than Once</label>
          <div class="form-check form-switch mt-1">
            <input id="featMultiples" class="form-check-input" type="checkbox" ${feat.multiples ? "checked" : ""}>
          </div>
        </div>
        <div class="grid-column-full">
          <label>Flags</label>
          ${featFlagGrid(feat)}
        </div>
        ${textareaBlock("featDescription", "Description", feat.description, "grid-column-full", true)}
        ${textareaBlock("featPrerequisites", "Prerequisites", feat.prerequisites, "grid-column-full")}
        ${textareaBlock("featBenefit", "Benefit", feat.benefit, "grid-column-full", true)}
        ${textareaBlock("featNormal", "Normal", feat.normal, "grid-column-half")}
        ${textareaBlock("featSpecial", "Special", feat.special, "grid-column-half")}
        ${textareaBlock("featGoal", "Goal", feat.goal, "grid-column-half")}
        ${textareaBlock("featCompletionBenefit", "Completion Benefit", feat.completionBenefit, "grid-column-half")}
        ${textareaBlock("featNote", "Note", feat.note, "grid-column-half")}
        ${textareaBlock("featEffectNotes", "Effect Notes", joinLineList(feat.effectNotes), "grid-column-half")}
      </div>
    </section>

    <section class="level-card">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
        <strong>Effects and Extras</strong>
        <span class="small-text">Correct inferred rows here; these use the same format as class features, traits, and items.</span>
      </div>
      <div id="featEffectsAccordion" class="accordion shared-extra-accordion"></div>
    </section>
  `;

  mountFeatEffects(feat);
  autoSizeTextareas();

  el("deleteSelectedFeatBtn")?.addEventListener("click", deleteSelectedFeat);
  el("featEditorPanel")
    .querySelectorAll("input, textarea, select")
    .forEach((input) => {
      input.addEventListener("input", () => {
        if (input.classList.contains("feat-textarea")) autoSizeTextarea(input);
        setDirty(true);
      });
      input.addEventListener("change", () => setDirty(true));
    });
}

function collectFlags() {
  return Object.fromEntries(
    FEAT_FLAGS.map(([key]) => [
      key,
      Boolean(el("featEditorPanel")?.querySelector(`[data-feat-flag="${key}"]`)?.checked),
    ]),
  );
}

function commitSelectedFeat() {
  const feat = featData.feats[selectedIndex];
  if (!feat) return;

  const primaryType = el("featType")?.value.trim() || "General";
  const types = splitCommaList(el("featTypes")?.value || primaryType);
  if (!types.includes(primaryType)) types.unshift(primaryType);
  const extras = currentEffectsAccordion?.collect?.() || {};
  const next = normalizeFeat({
    ...feat,
    id: el("featId")?.value.trim() || feat.id || slugify(el("featName")?.value),
    slug: el("featSlug")?.value.trim() || slugify(el("featName")?.value),
    sheetId: el("featSheetId")?.value.trim() || "",
    name: el("featName")?.value.trim() || feat.name,
    type: primaryType,
    types,
    source: el("featSource")?.value.trim() || "",
    raceName: el("featRaceName")?.value.trim() || "",
    prerequisites: el("featPrerequisites")?.value.trim() || "",
    prerequisiteFeats: splitCommaList(el("featPrerequisiteFeats")?.value),
    suggestedTraits: splitCommaList(el("featSuggestedTraits")?.value),
    description: el("featDescription")?.value.trim() || "",
    benefit: el("featBenefit")?.value.trim() || "",
    normal: el("featNormal")?.value.trim() || "",
    special: el("featSpecial")?.value.trim() || "",
    goal: el("featGoal")?.value.trim() || "",
    completionBenefit: el("featCompletionBenefit")?.value.trim() || "",
    note: el("featNote")?.value.trim() || "",
    multiples: Boolean(el("featMultiples")?.checked),
    flags: collectFlags(),
    effectConfidence: el("featEffectConfidence")?.value || "manual",
    effectNotes: splitLineList(el("featEffectNotes")?.value),
    effects: extras.effects || [],
    damageReduction: extras.damageReduction || [],
    spellResistance: extras.spellResistance || [],
    immunities: extras.immunities || [],
    classSkillGrants: extras.classSkillGrants || [],
    sizeChanges: extras.sizeChanges || [],
    spellLikeAbilities: extras.spellLikeAbilities || [],
    generatedEquipment: extras.generatedEquipment || [],
  });

  featData.feats[selectedIndex] = next;
  rebuildTypeGroups();
}

function addFeat() {
  commitSelectedFeat();
  const id = `custom-feat-${Date.now()}`;
  const feat = normalizeFeat({
    id,
    slug: id,
    name: "New Feat",
    type: typeFilter || "General",
    types: [typeFilter || "General"],
    effectConfidence: "manual",
  });
  featData.feats.push(feat);
  selectedIndex = featData.feats.length - 1;
  setDirty(true);
  renderTypeFilter();
  renderFeatList();
  renderSelectedFeat();
}

function deleteSelectedFeat() {
  const feat = featData.feats[selectedIndex];
  if (!feat) return;
  if (!confirm(`Delete ${feat.name || "this feat"}?`)) return;
  featData.feats.splice(selectedIndex, 1);
  selectedIndex = Math.min(selectedIndex, featData.feats.length - 1);
  setDirty(true);
  renderTypeFilter();
  renderFeatList();
  renderSelectedFeat();
}

async function loadDefaultFeats() {
  featData = await window.PFFeatData.loadFeats();
  featData.feats = (featData.feats || []).map(normalizeFeat);
  rebuildTypeGroups();
  selectedIndex = featData.feats.length ? 0 : -1;
  setDirty(false);
  renderTypeFilter();
  renderFeatList();
  renderSelectedFeat();
  setStatus(
    "Loaded feat data from data/feats.json. Use Open Project Folder to save directly into this project.",
    "info",
  );
}

async function readFeatsFromProjectDirectory(handle) {
  dataDirectoryHandle = await handle.getDirectoryHandle("data");
  const featHandle = await dataDirectoryHandle.getFileHandle("feats.json");
  const rawFeatData = JSON.parse(await (await featHandle.getFile()).text());
  featData = window.PFFeatData?.normalizeFeatData
    ? window.PFFeatData.normalizeFeatData(rawFeatData)
    : rawFeatData;
  featData.feats = (featData.feats || []).map(normalizeFeat);
  rebuildTypeGroups();
  selectedIndex = featData.feats.length ? 0 : -1;
  setDirty(false);
  renderTypeFilter();
  renderFeatList();
  renderSelectedFeat();
  setStatus("Opened feat data from the selected project folder.", "success");
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
  await readFeatsFromProjectDirectory(projectDirectoryHandle);
}

async function saveFeatsFile() {
  commitSelectedFeat();
  const payload = featPayload();
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
    const handle = await dataDirectoryHandle.getFileHandle("feats.json", {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify(payload, null, 2)}\n`);
    await writable.close();
    window.PFFeatData?.reset?.();
    setDirty(false);
    setStatus("Saved feat data inside data/feats.json.", "success");
    return;
  }

  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "feats.json";
  link.click();
  URL.revokeObjectURL(url);
  setDirty(false);
  setStatus(
    "Downloaded feats.json because direct project saving is unavailable.",
    "warning",
  );
}

function exportSelectedFeat() {
  const feat = featData.feats[selectedIndex];
  if (!feat) {
    setStatus("Select a feat first.", "warning");
    return;
  }
  commitSelectedFeat();
  const filename = `${slugify(feat.name)}.json`;
  const blob = new Blob([`${JSON.stringify(feat, null, 2)}\n`], {
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

async function initFeatEditor() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  const admin = await PFApp.isAppAdmin();
  if (!admin) {
    document.querySelector("main").innerHTML =
      `<div class="alert alert-warning">Only app admins can access this tool.</div>`;
    return;
  }
  await loadDefaultFeats();
}

el("featSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderFeatList();
});

el("featTypeFilter").addEventListener("change", (event) => {
  typeFilter = event.target.value;
  renderFeatList();
});

el("addFeatBtn").addEventListener("click", addFeat);

el("openProjectFolderBtn").addEventListener("click", async () => {
  try {
    await openProjectFolder();
  } catch (error) {
    setStatus(error.message || "Could not open the project folder.", "danger");
  }
});

el("saveFeatsFileBtn").addEventListener("click", async () => {
  try {
    await saveFeatsFile();
  } catch (error) {
    setStatus(error.message || "Could not save feat data.", "danger");
  }
});

el("exportSelectedFeatBtn").addEventListener("click", () => {
  try {
    exportSelectedFeat();
  } catch (error) {
    setStatus(error.message || "Could not export the selected feat.", "danger");
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

initFeatEditor().catch((error) => {
  setStatus(error.message || "Could not load feat data.", "danger");
});
