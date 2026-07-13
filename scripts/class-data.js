(function () {
  const BASE_PATH = "data/classes/";
  let indexCache = null;
  let classesCache = null;

  async function loadIndex() {
    if (indexCache) return indexCache;
    const response = await fetch(`${BASE_PATH}index.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load data/classes/index.json.");
    const data = await response.json();
    indexCache = Array.isArray(data) ? data : [];
    return indexCache;
  }

  async function loadAllClasses() {
    if (classesCache) return classesCache;
    const index = await loadIndex();
    classesCache = await Promise.all(index.map(async entry => {
      const response = await fetch(`${BASE_PATH}${entry.file}`, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Could not load class data for ${entry.name || entry.file}.`);
      const cls = await response.json();
      return { ...cls, __classFile: entry.file };
    }));
    return classesCache;
  }

  function reset() {
    indexCache = null;
    classesCache = null;
  }

  window.PFClassData = {
    basePath: BASE_PATH,
    loadIndex,
    loadAllClasses,
    reset
  };
})();
