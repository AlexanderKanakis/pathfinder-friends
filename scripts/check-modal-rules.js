const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function filesBelow(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(absolute, extension);
    return entry.name.endsWith(extension) ? [absolute] : [];
  });
}

function source(file) {
  return fs.readFileSync(file, "utf8");
}

const htmlFiles = filesBelow(root, ".html").filter(
  (file) => !path.basename(file).startsWith("_edit_"),
);
const javascriptFiles = filesBelow(root, ".js").filter((file) => {
  const name = path.basename(file);
  return !name.startsWith("_edit_") && !name.startsWith("check-");
});

for (const file of [...htmlFiles, ...javascriptFiles]) {
  const contents = source(file);
  assert(
    !contents.includes("btn-close"),
    `${path.relative(root, file)} contains a modal header close button.`,
  );
}

const staticModalToken = /<div\s+[\s\S]{0,160}?class="modal fade"[\s\S]{0,220}?id="([^"]+)"/g;
for (const file of htmlFiles) {
  const contents = source(file);
  const matches = [...contents.matchAll(staticModalToken)];
  if (!matches.length) continue;
  assert(
    contents.includes('href="css/modal-rules.css'),
    `${path.relative(root, file)} does not load the shared modal styles.`,
  );
  assert(
    contents.includes('src="scripts/modal-rules.js'),
    `${path.relative(root, file)} does not load the shared modal behavior.`,
  );
  matches.forEach((match, index) => {
    const end = matches[index + 1]?.index ?? contents.length;
    const fragment = contents.slice(match.index, end);
    assert(
      fragment.includes("modal-footer"),
      `${path.relative(root, file)}#${match[1]} has no persistent footer.`,
    );
    assert(
      !/on(?:click|change|input|submit|keydown|keyup)=/i.test(fragment),
      `${path.relative(root, file)}#${match[1]} contains inline JavaScript.`,
    );
  });
}

for (const file of javascriptFiles) {
  const contents = source(file);
  const token = '<div class="modal fade"';
  let start = contents.indexOf(token);
  while (start >= 0) {
    const next = contents.indexOf(token, start + token.length);
    const fragment = contents.slice(start, next < 0 ? contents.length : next);
    const id = fragment.match(/id="([^"]+)/)?.[1] || "generated modal";
    assert(
      fragment.includes("modal-footer"),
      `${path.relative(root, file)}#${id} has no persistent footer.`,
    );
    start = next;
  }
}

const modalRules = source(path.join(root, "scripts", "modal-rules.js"));
assert(modalRules.includes(".modal input[type='number']"));
assert(modalRules.includes("MutationObserver"));
assert(modalRules.includes('classList.add("modal-dialog-scrollable")'));

const modalStyles = source(path.join(root, "css", "modal-rules.css"));
assert(modalStyles.includes("@media (max-width: 575.98px)"));
assert(modalStyles.includes(".modal .modal-header,"));
assert(modalStyles.includes(".modal .modal-body {\n    padding: 0.5rem;"));
assert(modalStyles.includes(".modal .nav-link {"));
assert(modalStyles.includes(".modal .accordion-button {"));
assert(modalStyles.includes("grid-template-columns: 1.75rem minmax(0, 1fr) 1.75rem;"));
assert(modalStyles.includes(".modal.modal-workspace .modal-dialog {"));
assert(modalStyles.includes(".modal.modal-workspace .modal-content {"));

const characterSheetStyles = source(
  path.join(root, "css", "character-sheet.css"),
);
assert(
  !characterSheetStyles.includes("#effectTrackerModal .modal-header"),
  "Shared modal sizing must not be duplicated in the Effects modal.",
);

const effectEditorStyles = source(path.join(root, "css", "effect-editor.css"));
assert(
  effectEditorStyles.includes(
    '.shared-apply-condition-row > button[aria-label="Delete applied condition"]',
  ),
  "Apply Condition must keep its delete control at the shared icon-button size.",
);
assert(
  !effectEditorStyles.includes(".shared-apply-condition-row button,"),
  "Mobile effect styles must not stretch the Apply Condition delete button.",
);
assert(
  effectEditorStyles.includes(
    "grid-template-columns: repeat(6, minmax(105px, 1fr));",
  ),
  "Configurable conditions must use the shared ordered formula grid.",
);
const effectEditorSource = source(path.join(root, "scripts", "effect-editor.js"));
const applyConditionSource = effectEditorSource.slice(
  effectEditorSource.indexOf("function createApplyConditionRow"),
  effectEditorSource.indexOf("function createConditionalVariableRow"),
);
assert(
  applyConditionSource.indexOf("<label>Number of Dice</label>") <
    applyConditionSource.indexOf("<label>Static</label>"),
  "Configurable condition dice fields must appear before static fields.",
);

const allModalSources = [...htmlFiles, ...javascriptFiles]
  .map(source)
  .join("\n");
assert(
  !/modal-footer[\s\S]{0,800}>\s*Close\s*</i.test(allModalSources),
  "Modal footer dismiss buttons must be labelled Cancel.",
);

console.log(
  "Modal checks passed for compact mobile layout, persistent footers, Cancel exits, separate handlers, and numeric steppers.",
);
