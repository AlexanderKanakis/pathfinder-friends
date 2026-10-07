const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const mapHtml = fs.readFileSync(path.join(rootDir, "map.html"), "utf8");
const mapJs = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "map.js"),
  "utf8",
);

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `Missing ${name}().`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not read ${name}().`);
}

assert(mapHtml.includes('id="quickConditionModal"'));
assert(mapHtml.includes('id="quickConditionDescription"'));
assert(mapHtml.includes('id="quickConditionTurns"'));
assert(mapHtml.includes('data-item-stepper-delta="-1"'));
assert(mapHtml.includes('data-item-stepper-delta="1"'));
assert(mapHtml.includes('id="confirmQuickCondition"'));

const cardBody = functionBody(mapJs, "effectCardHtml");
const conditionBranch = cardBody.slice(
  cardBody.indexOf("if (condition && !passive)"),
  cardBody.indexOf("const needsCl"),
);
assert(conditionBranch.includes("quick-condition-card"));
assert(!conditionBranch.includes("effect-type-icon"));
assert(!conditionBranch.includes("data-quick-turns"));
assert(!conditionBranch.includes("data-quick-permanent"));
assert(!conditionBranch.includes("quick-effect-info"));

const bindingBody = functionBody(mapJs, "bindQuickEffectCards");
assert(bindingBody.includes("openQuickConditionConfig(effect)"));
const confirmationBody = functionBody(mapJs, "confirmQuickConditionConfig");
assert(confirmationBody.includes("quickConditionTurns"));
assert(confirmationBody.includes("permanent: false"));
assert(confirmationBody.includes("chooseQuickEffect"));

console.log("Map condition picker checks passed.");
