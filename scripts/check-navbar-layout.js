const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const navbarPath = path.join(root, "scripts", "navbar.js");
const navbarSource = fs.readFileSync(navbarPath, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  navbarSource.includes("navbar-expand-xxl"),
  "The global navbar must stay collapsed below Bootstrap's 1400px breakpoint.",
);
assert(
  !/navbar-expand-(?:sm|md|lg|xl)\b/.test(navbarSource),
  "The navbar expands before its contents can safely fit on one row.",
);
assert(
  navbarSource.includes("@media (min-width: 1400px)"),
  "Desktop navbar styles must use the same breakpoint as navbar-expand-xxl.",
);
assert(
  navbarSource.includes("flex-wrap: nowrap"),
  "The expanded desktop navbar must not wrap.",
);

const navbarPages = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .filter((name) =>
    fs.readFileSync(path.join(root, name), "utf8").includes("scripts/navbar.js"),
  );

assert(navbarPages.length > 0, "No pages include the global navbar script.");

for (const page of navbarPages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  assert(
    html.includes('scripts/navbar.js?v=responsive-navbar-1'),
    `${page} must use the current navbar cache key.`,
  );
}

console.log(
  `Navbar layout guard passed for ${navbarPages.length} HTML pages.`,
);
