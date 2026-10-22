let templateData = { source: "", generatedAt: "", schemaVersion: 1, templates: [] };
let selectedTemplateId = "";
let searchTerm = "";
let decisionsOnly = false;
let aurasOnly = false;
let summonsOnly = false;
let effectGroups = null;
let dirty = false;
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;

const el = (id) => document.getElementById(id);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

function setStatus(message, type = "info") {
  const node = el("templateEditorStatus");
  node.textContent = message || "";
  node.className = "alert py-2" + (message ? " alert-" + type : " d-none");
}

function setDirty(value = true) {
  dirty = value;
  document.title = (dirty ? "* " : "") + "PathFriends Template Editor";
}

function selectedTemplate() {
  return (
    templateData.templates.find(
      (entry) => String(entry.id) === String(selectedTemplateId),
    ) || null
  );
}

function filteredTemplates() {
  const term = searchTerm.trim().toLowerCase();
  return templateData.templates
    .filter((entry) => {
      const text = [
        entry.name,
        entry.templateType,
        entry.crAdjustment,
        entry.source,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!term || text.includes(term)) &&
        (!decisionsOnly || window.PFEffectDecisions.hasDecision(entry)) &&
        (!aurasOnly || window.PFEffectMechanics.hasAura(entry)) &&
        (!summonsOnly || window.PFSummonCreatures.hasSummon(entry))
      );
    })
    .sort((left, right) =>
      String(left.name || "").localeCompare(String(right.name || "")),
    );
}

function renderList() {
  const entries = filteredTemplates();
  el("templateCount").textContent =
    entries.length + " of " + templateData.templates.length + " templates";
  el("templateList").innerHTML =
    entries
      .map(
        (entry) =>
          '<button class="' +
          (String(entry.id) === String(selectedTemplateId) ? "active" : "") +
          '" type="button" data-template-id="' +
          escapeHtml(entry.id) +
          '"><strong>' +
          escapeHtml(entry.name) +
          '</strong><div class="small text-secondary">' +
          escapeHtml(
            [entry.templateType, entry.crAdjustment ? "CR " + entry.crAdjustment : ""]
              .filter(Boolean)
              .join(" | "),
          ) +
          "</div></button>",
      )
      .join("") || '<div class="small text-secondary">No matching templates.</div>';
  el("templateList")
    .querySelectorAll("[data-template-id]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        commitSelected();
        selectedTemplateId = button.dataset.templateId;
        renderList();
        renderEditor();
      }),
    );
}

function field(id, label, value, type = "text") {
  return (
    "<div><label for=\"" +
    id +
    "\">" +
    escapeHtml(label) +
    "</label><input id=\"" +
    id +
    '" class="form-control form-control-sm" type="' +
    type +
    '" value="' +
    escapeHtml(value ?? "") +
    '"></div>'
  );
}

function renderEditor() {
  const entry = selectedTemplate();
  effectGroups = null;
  if (!entry) {
    el("templateEditorPanel").innerHTML =
      '<div class="small text-secondary">Choose a template to edit.</div>';
    return;
  }
  el("templateEditorPanel").innerHTML = [
    '<div class="d-flex justify-content-between gap-2 align-items-start mb-3">',
    "<div><h4 class=\"mb-0\">" + escapeHtml(entry.name) + "</h4>",
    '<div class="small text-secondary">' + escapeHtml(entry.id) + "</div></div>",
    '<button id="deleteTemplateBtn" class="btn btn-outline-danger btn-sm" type="button"><i class="bi bi-trash"></i> Delete</button></div>',
    '<div class="template-meta-grid mb-3">',
    field("templateName", "Name", entry.name),
    field("templateId", "ID", entry.id),
    field("templateCr", "CR Adjustment", entry.crAdjustment),
    field("templateType", "Template Type", entry.templateType),
    field("templateSource", "Source", entry.source),
    field("templateSourceUrl", "Source URL", entry.sourceUrl, "url"),
    field("templateUrl", "Detail URL", entry.url, "url"),
    '<label class="form-check mt-4"><input id="templateSimple" class="form-check-input" type="checkbox"' +
      (entry.simple ? " checked" : "") +
      '><span class="form-check-label">Simple template</span></label>',
    '<label class="form-check mt-4"><input id="templateSummonReady" class="form-check-input" type="checkbox"' +
      (entry.usableWithSummons ? " checked" : "") +
      '><span class="form-check-label">Official summon option</span></label>',
    "</div>",
    '<div class="template-description-grid mb-3"><div><label for="templateDescriptionHtml">Description HTML</label>',
    '<textarea id="templateDescriptionHtml" class="form-control form-control-sm">' +
      escapeHtml(entry.descriptionHtml) +
      '</textarea></div><div><label>Preview</label><div id="templateDescriptionPreview" class="template-rich-preview"></div></div></div>',
    '<h5>Template Mechanics</h5><div id="templateEffectsAccordion"></div>',
  ].join("");

  const mechanics = {
    ...(entry.passiveMechanics || {}),
    activeMechanics: entry.activeMechanics || {},
  };
  effectGroups = window.PFEffectEditor.mountMechanicGroups(
    el("templateEffectsAccordion"),
    {
      idPrefix: "template-" + entry.id,
      effectsKey: "effects",
      onChange: () => setDirty(true),
    },
  );
  effectGroups.reset(mechanics);
  el("templateDescriptionPreview").innerHTML = entry.descriptionHtml || "";
  el("templateDescriptionHtml").addEventListener("input", (event) => {
    el("templateDescriptionPreview").innerHTML = event.target.value;
    setDirty(true);
  });
  el("templateEditorPanel")
    .querySelectorAll("input")
    .forEach((input) => input.addEventListener("input", () => setDirty(true)));
  el("deleteTemplateBtn").addEventListener("click", deleteSelected);
}

function commitSelected() {
  const entry = selectedTemplate();
  if (!entry || !el("templateName")) return;
  const mechanics = effectGroups?.collect?.() || {};
  const activeMechanics = clone(mechanics.activeMechanics || {});
  delete mechanics.activeMechanics;
  const next = window.PFTemplateData.normalizeTemplate({
    ...entry,
    id:
      el("templateId").value.trim() ||
      window.PFTemplateData.slugify(el("templateName").value),
    name: el("templateName").value.trim() || "Unnamed Template",
    crAdjustment: el("templateCr").value.trim(),
    templateType: el("templateType").value.trim(),
    source: el("templateSource").value.trim(),
    sourceUrl: el("templateSourceUrl").value.trim(),
    url: el("templateUrl").value.trim(),
    simple: el("templateSimple").checked,
    usableWithSummons: el("templateSummonReady").checked,
    descriptionHtml: el("templateDescriptionHtml").value.trim(),
    passiveMechanics: mechanics,
    activeMechanics,
  });
  const index = templateData.templates.indexOf(entry);
  templateData.templates[index] = next;
  selectedTemplateId = next.id;
}

function addTemplate() {
  commitSelected();
  const entry = window.PFTemplateData.normalizeTemplate({
    id: "custom-template-" + Date.now(),
    name: "New Template",
    templateType: "Acquired",
    descriptionHtml: "<p>Template description.</p>",
  });
  templateData.templates.push(entry);
  selectedTemplateId = entry.id;
  setDirty(true);
  renderList();
  renderEditor();
}

function deleteSelected() {
  const entry = selectedTemplate();
  if (!entry || !confirm("Delete " + entry.name + "?")) return;
  templateData.templates = templateData.templates.filter(
    (item) => item !== entry,
  );
  selectedTemplateId = templateData.templates[0]?.id || "";
  setDirty(true);
  renderList();
  renderEditor();
}

async function loadTemplates(data = null) {
  templateData = window.PFTemplateData.normalizeData(
    data || (await window.PFTemplateData.load({ fresh: true })),
  );
  selectedTemplateId = templateData.templates[0]?.id || "";
  setDirty(false);
  renderList();
  renderEditor();
}

async function openProject() {
  if (!window.showDirectoryPicker) {
    setStatus("This browser cannot write directly to project folders.", "warning");
    return;
  }
  projectDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  dataDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle("data");
  const handle = await dataDirectoryHandle.getFileHandle("templates.json");
  await loadTemplates(JSON.parse(await (await handle.getFile()).text()));
  setStatus("Opened data/templates.json from the selected project.", "success");
}

async function saveTemplates() {
  commitSelected();
  if (!dataDirectoryHandle && window.showDirectoryPicker) {
    projectDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    dataDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle("data", {
      create: true,
    });
  }
  const payload = {
    ...templateData,
    schemaVersion: 1,
    templates: templateData.templates
      .map(window.PFTemplateData.normalizeTemplate)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
  const text = JSON.stringify(payload, null, 2) + "\n";
  if (dataDirectoryHandle) {
    const handle = await dataDirectoryHandle.getFileHandle("templates.json", {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    setStatus("Saved data/templates.json.", "success");
  } else {
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "templates.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded templates.json.", "warning");
  }
  await window.PFCatalogCache?.invalidate?.("data/templates.json");
  window.PFTemplateData.reset();
  setDirty(false);
}

function bindFilter(id, setter) {
  window.PFEffectDecisions.bindFilterButton(el(id), (active) => {
    commitSelected();
    setter(active);
    const entries = filteredTemplates();
    if (!entries.some((entry) => entry.id === selectedTemplateId))
      selectedTemplateId = entries[0]?.id || "";
    renderList();
    renderEditor();
  });
}

async function init() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  if (!(await PFApp.isAppAdmin())) {
    document.querySelector("main").innerHTML =
      '<div class="alert alert-warning">Only app admins can access this tool.</div>';
    return;
  }
  await loadTemplates();
  setStatus(
    "Loaded descriptions from each template detail page. Open the project folder to save edits directly.",
    "info",
  );
}

el("templateSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderList();
});
el("addTemplateBtn").addEventListener("click", addTemplate);
el("openTemplateProjectBtn").addEventListener("click", () =>
  openProject().catch((error) => setStatus(error.message, "danger")),
);
el("saveTemplatesBtn").addEventListener("click", () =>
  saveTemplates().catch((error) => setStatus(error.message, "danger")),
);
bindFilter("templateDecisionFilter", (active) => {
  decisionsOnly = active;
});
bindFilter("templateAuraFilter", (active) => {
  aurasOnly = active;
});
bindFilter("templateSummonFilter", (active) => {
  summonsOnly = active;
});
window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});
init().catch((error) => setStatus(error.message, "danger"));
