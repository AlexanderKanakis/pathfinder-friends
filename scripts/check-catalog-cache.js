const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("scripts/catalog-cache.js", "utf8");

function cacheStorage() {
  const stores = new Map([["pathfriends-rule-catalogs-old", new Map()]]);
  const requestKey = (request) =>
    new URL(typeof request === "string" ? request : request.url).href;
  return {
    stores,
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) {
          return store.get(requestKey(request))?.clone();
        },
        async put(request, response) {
          store.set(requestKey(request), response.clone());
        },
        async delete(request) {
          return store.delete(requestKey(request));
        },
        async keys() {
          return [...store.keys()].map((url) => new Request(url));
        },
      };
    },
  };
}

function createRuntime(pathname = "/map.html") {
  let calls = 0;
  const caches = cacheStorage();
  const location = {
    href: `http://127.0.0.1:8765${pathname}`,
    origin: "http://127.0.0.1:8765",
    pathname,
  };
  const window = {
    caches,
    location,
    Request,
    Response,
    URL,
    console,
    addEventListener() {},
    fetch: async (input) => {
      calls += 1;
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      await Promise.resolve();
      return new Response(JSON.stringify({ call: calls, path: url.pathname }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  };
  vm.runInNewContext(source, { window, URL, Request, Response, console });
  return { window, caches, calls: () => calls };
}

(async () => {
  const runtime = createRuntime();
  await runtime.window.PFCatalogCache.ready;
  assert.equal(runtime.window.PFCatalogCache.version, "2");
  assert.equal(runtime.caches.stores.has("pathfriends-rule-catalogs-old"), false);

  const first = await runtime.window.fetch("data/spells.json", { cache: "no-cache" });
  assert.equal((await first.json()).call, 1);
  const second = await runtime.window.fetch("./data/spells.json");
  assert.equal((await second.json()).call, 1);
  assert.equal(runtime.calls(), 1, "A cached catalog must not return to the network.");

  const concurrent = await Promise.all([
    runtime.window.fetch("data/feats.json"),
    runtime.window.fetch("data/feats.json"),
  ]);
  assert.deepEqual(
    await Promise.all(concurrent.map((response) => response.json())),
    [
      { call: 2, path: "/data/feats.json" },
      { call: 2, path: "/data/feats.json" },
    ],
  );
  assert.equal(runtime.calls(), 2, "Concurrent catalog requests must share one fetch.");

  await runtime.window.PFCatalogCache.invalidate("data/spells.json");
  const refreshed = await runtime.window.fetch("data/spells.json");
  assert.equal((await refreshed.json()).call, 3);

  await runtime.window.fetch("data/classes/index.json");
  await runtime.window.fetch("data/classes/wizard.json");
  await runtime.window.PFCatalogCache.invalidatePrefix("data/classes/");
  await runtime.window.fetch("data/classes/index.json");
  assert.equal(runtime.calls(), 6, "Prefix invalidation must evict split catalogs.");

  await runtime.window.fetch("api/live-state");
  await runtime.window.fetch("api/live-state");
  assert.equal(runtime.calls(), 8, "Non-catalog requests must never be cached.");

  const editor = createRuntime("/spell-editor.html");
  await editor.window.fetch("data/spells.json");
  await editor.window.fetch("data/spells.json");
  assert.equal(editor.calls(), 2, "Admin editors must always read the current source file.");

  await runtime.window.PFCatalogCache.clear();
  assert.equal(
    [...runtime.caches.stores.keys()].some((name) =>
      name.startsWith("pathfriends-rule-catalogs-"),
    ),
    false,
  );

  const cachedPages = [
    "map.html",
    "character-sheet.html",
    "bag-of-holding.html",
    "characters.html",
    "enemies.html",
    "magic-craft-calculator.html",
    "class-editor.html",
    "class-feature-pool-editor.html",
    "feat-editor.html",
    "item-catalog-editor.html",
    "race-editor.html",
    "spell-editor.html",
  ];
  cachedPages.forEach((path) => {
    assert(
      fs.readFileSync(path, "utf8").includes("scripts/catalog-cache.js?v=2"),
      `${path} must initialize the shared catalog cache.`,
    );
  });

  const invalidationGuards = [
    ["scripts/pages/spell-editor.js", 'invalidate?.("data/spells.json")'],
    ["scripts/pages/feat-editor.js", 'invalidate?.("data/feats.json")'],
    ["scripts/pages/race-editor.js", 'invalidate?.("data/races.json")'],
    ["scripts/pages/item-catalog-editor.js", "invalidate?.(catalog.file)"],
    ["scripts/pages/class-editor.js", 'invalidatePrefix?.("data/classes/")'],
    [
      "scripts/pages/class-feature-pool-editor.js",
      'invalidatePrefix?.("data/class-feature-pools/")',
    ],
  ];
  invalidationGuards.forEach(([path, expected]) => {
    assert(
      fs.readFileSync(path, "utf8").includes(expected),
      `${path} must invalidate its exported catalog.`,
    );
  });

  [
    "class-editor.html",
    "class-feature-pool-editor.html",
    "feat-editor.html",
    "item-catalog-editor.html",
    "race-editor.html",
    "spell-editor.html",
  ].forEach((path) => {
    assert(
      fs.readFileSync(path, "utf8").includes('id="refreshRulesCacheBtn"'),
      `${path} must expose manual rule-cache recovery.`,
    );
  });

  console.log("Persistent catalog cache checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
