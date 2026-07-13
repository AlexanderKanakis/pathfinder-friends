const fs = require("fs");
const path = require("path");

const CLASS_DIR = path.resolve(__dirname, "..", "data", "classes");
const INDEX_PATH = path.join(CLASS_DIR, "index.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadClasses() {
  const index = readJson(INDEX_PATH);
  return index.map(entry => ({
    ...readJson(path.join(CLASS_DIR, entry.file)),
    __classFile: entry.file
  }));
}

function classIndexEntry(entry) {
  return {
    name: entry.name || "Unnamed Class",
    type: entry.type || entry.category || "base",
    category: entry.category || entry.type || "base",
    sourceUrl: entry.sourceUrl || "",
    spellcastingClass: Boolean(entry.spellcastingClass),
    file: entry.__classFile
  };
}

function saveClasses(classes) {
  writeJson(INDEX_PATH, classes.map(classIndexEntry));
  for (const cls of classes) {
    if (!cls.__classFile) throw new Error(`Class ${cls.name || "Unnamed Class"} is missing __classFile.`);
    const payload = { ...cls };
    delete payload.__classFile;
    writeJson(path.join(CLASS_DIR, cls.__classFile), payload);
  }
}

module.exports = {
  CLASS_DIR,
  INDEX_PATH,
  loadClasses,
  saveClasses
};
