(function () {
  const BASE_PATH = "data/classes/";
  const POOL_BASE_PATH = "data/class-feature-pools/";
  let indexCache = null;
  let classesCache = null;
  let poolIndexCache = null;
  const classCache = new Map();
  const poolCache = new Map();

  async function loadIndex() {
    if (indexCache) return indexCache;
    const response = await fetch(`${BASE_PATH}index.json`, {
      cache: "no-cache",
    });
    if (!response.ok)
      throw new Error("Could not load data/classes/index.json.");
    const data = await response.json();
    indexCache = Array.isArray(data) ? data : [];
    return indexCache;
  }

  async function loadAllClasses() {
    if (classesCache) return classesCache;
    const index = await loadIndex();
    classesCache = await Promise.all(index.map(loadClass));
    return classesCache;
  }

  async function loadPoolIndex() {
    if (poolIndexCache) return poolIndexCache;
    const response = await fetch(`${POOL_BASE_PATH}index.json`, {
      cache: "no-cache",
    });
    if (!response.ok)
      throw new Error("Could not load data/class-feature-pools/index.json.");
    const data = await response.json();
    poolIndexCache = Array.isArray(data) ? data : [];
    return poolIndexCache;
  }

  async function loadPoolCatalog(entryOrId) {
    const index = await loadPoolIndex();
    const entry =
      typeof entryOrId === "string"
        ? index.find(
            (candidate) =>
              String(candidate.id || "").toLowerCase() ===
                entryOrId.toLowerCase() ||
              String(candidate.file || "").toLowerCase() ===
                entryOrId.toLowerCase(),
          )
        : entryOrId;
    if (!entry?.file)
      throw new Error(`Could not find class feature pool ${entryOrId || "catalog"}.`);
    if (!poolCache.has(entry.file)) {
      const request = fetch(`${POOL_BASE_PATH}${entry.file}`, {
        cache: "no-cache",
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`Could not load class feature pool ${entry.id || entry.file}.`);
          return response.json();
        })
        .then((catalog) => ({ ...catalog, __poolFile: entry.file }))
        .catch((error) => {
          poolCache.delete(entry.file);
          throw error;
        });
      poolCache.set(entry.file, request);
    }
    return poolCache.get(entry.file);
  }

  async function loadAllPoolCatalogs() {
    const index = await loadPoolIndex();
    return Promise.all(index.map(loadPoolCatalog));
  }

  function resolveSourceClass(value, className) {
    if (Array.isArray(value))
      return value.map((entry) => resolveSourceClass(entry, className));
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        entry === "$sourceClass"
          ? className
          : resolveSourceClass(entry, className),
      ]),
    );
  }

  function withPoolCatalogs(definition, catalogs = []) {
    return {
      ...definition,
      __classFeaturePoolCatalogs: Object.fromEntries(
        catalogs.map((catalog) => [
          catalog.id,
          resolveSourceClass(catalog, definition.name || definition.className || ""),
        ]),
      ),
    };
  }

  async function attachPoolCatalogs(definition) {
    const ids = [
      ...new Set(
        Object.values(definition.classFeaturePools || {})
          .map((pool) => String(pool.catalog || "").trim())
          .filter(Boolean),
      ),
    ];
    const catalogs = await Promise.all(ids.map(loadPoolCatalog));
    return withPoolCatalogs(definition, catalogs);
  }

  async function loadClass(entryOrName) {
    const index = await loadIndex();
    const entry =
      typeof entryOrName === "string"
        ? index.find(
            (candidate) =>
              String(candidate.name || "").toLowerCase() ===
                entryOrName.toLowerCase() ||
              String(candidate.file || "").toLowerCase() ===
                entryOrName.toLowerCase(),
          )
        : entryOrName;
    if (!entry?.file)
      throw new Error(`Could not find class data for ${entryOrName || "class"}.`);

    if (!classCache.has(entry.file)) {
      const request = fetch(`${BASE_PATH}${entry.file}`, {
        cache: "no-cache",
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(
              `Could not load class data for ${entry.name || entry.file}.`,
            );
          return response.json();
        })
        .then(attachPoolCatalogs)
        .then((cls) => ({ ...cls, __classFile: entry.file }))
        .catch((error) => {
          classCache.delete(entry.file);
          throw error;
        });
      classCache.set(entry.file, request);
    }
    return classCache.get(entry.file);
  }

  async function loadClassesByNames(names = []) {
    const wanted = new Set(
      (Array.isArray(names) ? names : [names])
        .map((name) => String(name || "").trim().toLowerCase())
        .filter(Boolean),
    );
    if (!wanted.size) return [];
    const index = await loadIndex();
    return Promise.all(
      index
        .filter((entry) =>
          wanted.has(String(entry.name || "").trim().toLowerCase()),
        )
        .map(loadClass),
    );
  }

  function featurePools(definition = {}, feature = {}) {
    const attachments = definition.classFeaturePools || {};
    const catalogs = definition.__classFeaturePoolCatalogs || {};
    return (Array.isArray(feature.poolRefs) ? feature.poolRefs : [])
      .map((poolId) => {
        const attachment = attachments[poolId];
        if (!attachment) return null;
        const catalog = catalogs[attachment.catalog];
        if (!catalog) return null;
        return { ...catalog, ...attachment, options: catalog.options || [] };
      })
      .filter(Boolean);
  }

  function reset() {
    indexCache = null;
    classesCache = null;
    poolIndexCache = null;
    classCache.clear();
    poolCache.clear();
  }

  window.PFClassData = {
    basePath: BASE_PATH,
    poolBasePath: POOL_BASE_PATH,
    loadIndex,
    loadClass,
    loadClassesByNames,
    loadAllClasses,
    loadPoolIndex,
    loadPoolCatalog,
    loadAllPoolCatalogs,
    withPoolCatalogs,
    featurePools,
    reset,
  };
})();
