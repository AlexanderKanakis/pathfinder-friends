(function () {
  const BASE_PATH = "data/classes/";
  let indexCache = null;
  let classesCache = null;
  const classCache = new Map();

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

  function reset() {
    indexCache = null;
    classesCache = null;
    classCache.clear();
  }

  window.PFClassData = {
    basePath: BASE_PATH,
    loadIndex,
    loadClass,
    loadClassesByNames,
    loadAllClasses,
    reset,
  };
})();
