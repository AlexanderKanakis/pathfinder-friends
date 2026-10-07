const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const picker = fs.readFileSync(
  path.join(rootDir, "modals", "feat-picker.js"),
  "utf8",
);

assert(picker.includes('id="featPickerCategory"'));
assert(picker.includes('aria-label="Feat category"'));
assert(picker.includes('id="featPickerSearch"'));
assert(!picker.includes('id="featPickerTabs"'));
assert(!picker.includes("function renderTabs"));
assert(picker.includes("grid-template-columns: minmax(180px, 240px) minmax(0, 1fr)"));
assert(picker.includes("@media (max-width: 700px)"));
assert(picker.includes("grid-template-columns: 1fr"));
assert(picker.includes("min-height: 0"));
assert(picker.includes("padding: 0.5rem 0.65rem"));
assert(picker.includes('state.category = event.target.value || "General"'));

console.log("Feat picker layout checks passed.");
