let poolCatalogs = [];
let selectedPoolIndex = -1;
let poolSearchTerm = "";
let poolDirectoryHandle = null;
let poolDirty = false;
let decisionsOnly = false;
let aurasOnly = false;

const el = (id) => document.getElementById(id);
const cloneJson = (value) => JSON.parse(JSON.stringify(value || {}));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(value) {
  return (
    String(value || "pool")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pool"
  );
}

function setStatus(message, type = "info") {
  const status = el("poolEditorStatus");
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
  status.classList.remove("d-none");
}

function setDirty(value = true) {
  poolDirty = value;
  document.title = `${poolDirty ? "* " : ""}PathFriends Pool Catalog Editor`;
  renderPoolList();
}

function ensurePoolFile(pool) {
  pool.id = String(pool.id || slug(pool.name));
  pool.__poolFile = pool.__poolFile || `${pool.id}.json`;
}

function poolPayload(pool) {
  const payload = cloneJson(pool);
  delete payload.__poolFile;
  return payload;
}

function poolIndexEntry(pool) {
  ensurePoolFile(pool);
  return {
    id: pool.id,
    name: pool.name || pool.id,
    file: pool.__poolFile,
  };
}

function filteredPoolIndexes() {
  const term = poolSearchTerm.trim().toLowerCase();
  return poolCatalogs
    .map((pool, index) => ({ pool, index }))
    .filter(({ pool }) => {
      if (decisionsOnly && !window.PFEffectDecisions.hasDecision(pool))
        return false;
      if (aurasOnly && !window.PFEffectMechanics.hasAura(pool)) return false;
      if (!term) return true;
      const optionNames = (pool.options || [])
        .map((option) => option.name || "")
        .join(" ");
      return `${pool.name || ""} ${pool.id || ""} ${optionNames}`
        .toLowerCase()
        .includes(term);
    })
    .sort((a, b) =>
      String(a.pool.name || a.pool.id).localeCompare(
        String(b.pool.name || b.pool.id),
      ),
    )
    .map(({ index }) => index);
}

function renderPoolList() {
  const indexes = filteredPoolIndexes();
  el("poolCount").innerHTML = `${indexes.length} of ${poolCatalogs.length} pools${
    poolDirty ? ' <span class="dirty-dot" title="Unsaved changes"></span>' : ""
  }`;
  el("poolList").innerHTML = indexes.length
    ? indexes
        .map((index) => {
          const pool = poolCatalogs[index];
          return `
            <div class="admin-review-list-row">
              <button class="btn ${index === selectedPoolIndex ? "btn-primary" : "btn-outline-light"} btn-sm pool-catalog-button" type="button" data-pool-index="${index}">
                <span>${escapeHtml(pool.name || pool.id)}</span>
                <span class="class-type">${(pool.options || []).length}</span>
              </button>
              ${PFAdminReviewMarker.buttonHtml(pool, `data-review-pool-index="${index}"`, "option pool")}
            </div>`;
        })
        .join("")
    : '<div class="small-text">No matching pools.</div>';
  el("poolList").querySelectorAll("[data-pool-index]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPoolIndex = Number(button.dataset.poolIndex);
      renderPoolList();
      renderSelectedPool();
    });
  });
  el("poolList")
    .querySelectorAll("[data-review-pool-index]")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        PFAdminReviewMarker.toggle(
          poolCatalogs[Number(button.dataset.reviewPoolIndex)],
        );
        setDirty(true);
      });
    });
}

function renderSelectedPool() {
  const pool = poolCatalogs[selectedPoolIndex];
  if (!pool) {
    el("poolEditorPanel").innerHTML =
      '<div class="small-text">Choose a pool to edit.</div>';
    return;
  }
  el("poolEditorPanel").innerHTML = `
    <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
      <div>
        <h4 class="mb-1">${escapeHtml(pool.name || pool.id)}</h4>
        <div class="small-text"><code>${escapeHtml(pool.id)}</code> · ${(pool.options || []).length} options</div>
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-edit-selected-pool><i class="bi bi-pencil"></i> Edit Pool</button>
    </div>
    ${pool.description ? `<p>${escapeHtml(pool.description)}</p>` : ""}
    <div class="sheet-title mb-2">Options</div>
    <ul class="pool-option-list">
      ${(pool.options || [])
        .filter(
          (option) =>
            (!decisionsOnly || window.PFEffectDecisions.hasDecision(option)) &&
            (!aurasOnly || window.PFEffectMechanics.hasAura(option)),
        )
        .map((option) => `<li>${escapeHtml(option.name || "Unnamed option")}</li>`)
        .join("") || '<li class="small-text">No options yet.</li>'}
    </ul>`;
  el("poolEditorPanel")
    .querySelector("[data-edit-selected-pool]")
    .addEventListener("click", editSelectedPool);
}

async function editSelectedPool() {
  const current = poolCatalogs[selectedPoolIndex];
  if (!current) return;
  const edited = await PFClassFeaturePoolEditor.open(cloneJson(current));
  if (!edited) return;
  poolCatalogs[selectedPoolIndex] = {
    ...edited,
    id: current.id,
    __poolFile: current.__poolFile,
    ...(current.needsReview ? { needsReview: true } : {}),
  };
  setDirty(true);
  renderSelectedPool();
}

async function addPool() {
  const edited = await PFClassFeaturePoolEditor.open({
    name: "New Pool",
    options: [],
  });
  if (!edited) return;
  const base = slug(edited.name);
  let id = base;
  let suffix = 2;
  while (poolCatalogs.some((pool) => pool.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  poolCatalogs.push({ ...edited, id, __poolFile: `${id}.json` });
  selectedPoolIndex = poolCatalogs.length - 1;
  setDirty(true);
  renderSelectedPool();
}

async function loadDefaultPools() {
  poolCatalogs = (await PFClassData.loadAllPoolCatalogs()).map((pool) => ({
    ...pool,
    __poolFile: pool.__poolFile || `${pool.id}.json`,
  }));
  const requested = new URLSearchParams(window.location.search).get("catalog");
  selectedPoolIndex = requested
    ? poolCatalogs.findIndex((pool) => pool.id === requested)
    : poolCatalogs.length
      ? 0
      : -1;
  if (selectedPoolIndex < 0 && poolCatalogs.length) selectedPoolIndex = 0;
  setDirty(false);
  renderSelectedPool();
  setStatus("Loaded standalone option pool catalogs.", "info");
}

async function readPoolsFromProject(handle) {
  const dataDirectory = await handle.getDirectoryHandle("data");
  poolDirectoryHandle = await dataDirectory.getDirectoryHandle(
    "class-feature-pools",
  );
  const indexHandle = await poolDirectoryHandle.getFileHandle("index.json");
  const index = JSON.parse(await (await indexHandle.getFile()).text());
  poolCatalogs = await Promise.all(
    index.map(async (entry) => {
      const fileHandle = await poolDirectoryHandle.getFileHandle(entry.file);
      return {
        ...JSON.parse(await (await fileHandle.getFile()).text()),
        __poolFile: entry.file,
      };
    }),
  );
  selectedPoolIndex = poolCatalogs.length ? 0 : -1;
  setDirty(false);
  renderSelectedPool();
  setStatus("Opened option pools from the selected project folder.", "success");
}

async function openProjectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("This browser cannot write directly to project folders.", "warning");
    return;
  }
  const project = await window.showDirectoryPicker({ mode: "readwrite" });
  await readPoolsFromProject(project);
}

async function savePools() {
  if (!poolDirectoryHandle && window.showDirectoryPicker) {
    const project = await window.showDirectoryPicker({ mode: "readwrite" });
    const dataDirectory = await project.getDirectoryHandle("data");
    poolDirectoryHandle = await dataDirectory.getDirectoryHandle(
      "class-feature-pools",
      { create: true },
    );
  }
  if (!poolDirectoryHandle) {
    setStatus(
      "Direct folder saving is unavailable. Export the selected pool instead.",
      "warning",
    );
    return;
  }
  const indexHandle = await poolDirectoryHandle.getFileHandle("index.json", {
    create: true,
  });
  const indexWritable = await indexHandle.createWritable();
  await indexWritable.write(
    `${JSON.stringify(poolCatalogs.map(poolIndexEntry), null, 2)}\n`,
  );
  await indexWritable.close();
  for (const pool of poolCatalogs) {
    ensurePoolFile(pool);
    const handle = await poolDirectoryHandle.getFileHandle(pool.__poolFile, {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify(poolPayload(pool), null, 2)}\n`);
    await writable.close();
  }
  await window.PFCatalogCache?.invalidatePrefix?.("data/class-feature-pools/");
  setDirty(false);
  setStatus("Saved option pools inside data/class-feature-pools.", "success");
}

function exportSelectedPool() {
  const pool = poolCatalogs[selectedPoolIndex];
  if (!pool) return;
  ensurePoolFile(pool);
  const blob = new Blob([`${JSON.stringify(poolPayload(pool), null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pool.__poolFile;
  link.click();
  URL.revokeObjectURL(url);
  void window.PFCatalogCache?.invalidate?.([
    `data/class-feature-pools/${pool.__poolFile}`,
    "data/class-feature-pools/index.json",
  ]);
}

async function initPoolEditor() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  if (!(await PFApp.isAppAdmin())) {
    window.location.href = "index.html";
    return;
  }
  el("poolSearch").addEventListener("input", (event) => {
    poolSearchTerm = event.target.value;
    renderPoolList();
  });
  window.PFEffectDecisions.bindFilterButton(
    el("poolDecisionFilter"),
    (active) => {
      decisionsOnly = active;
      const indexes = filteredPoolIndexes();
      if (!indexes.includes(selectedPoolIndex))
        selectedPoolIndex = indexes[0] ?? -1;
      renderPoolList();
      renderSelectedPool();
    },
  );
  window.PFEffectDecisions.bindFilterButton(el("poolAuraFilter"), (active) => {
    aurasOnly = active;
    const indexes = filteredPoolIndexes();
    if (!indexes.includes(selectedPoolIndex)) selectedPoolIndex = indexes[0] ?? -1;
    renderPoolList();
    renderSelectedPool();
  });
  el("newPoolBtn").addEventListener("click", addPool);
  el("openProjectFolderBtn").addEventListener("click", openProjectFolder);
  el("savePoolsBtn").addEventListener("click", savePools);
  el("exportSelectedPoolBtn").addEventListener("click", exportSelectedPool);
  window.addEventListener("beforeunload", (event) => {
    if (!poolDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
  await loadDefaultPools();
}

initPoolEditor().catch((error) =>
  setStatus(error.message || "Could not load option pools.", "danger"),
);
