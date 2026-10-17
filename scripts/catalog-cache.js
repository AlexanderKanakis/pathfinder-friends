(function (root) {
  const CACHE_PREFIX = "pathfriends-rule-catalogs-";
  const CACHE_VERSION = "1";
  const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
  const EDITOR_PAGE_PATTERN = /\/(?:class|class-feature-pool|feat|item-catalog|race|spell)-editor\.html$/i;
  const nativeFetch = root.fetch.bind(root);
  const pendingRequests = new Map();
  const supported = Boolean(root.caches && root.Request && root.Response);

  function catalogUrl(input) {
    let value = input;
    if (root.Request && input instanceof root.Request) value = input.url;
    try {
      const url = new URL(String(value || ""), root.location.href);
      if (url.origin !== root.location.origin) return null;
      if (!/\/data\/.*\.json$/i.test(url.pathname)) return null;
      url.search = "";
      url.hash = "";
      return url;
    } catch (_error) {
      return null;
    }
  }

  function requestMethod(input, init = {}) {
    return String(init.method || input?.method || "GET").toUpperCase();
  }

  function cacheRequest(url) {
    return new Request(url.href, {
      method: "GET",
      credentials: "same-origin",
    });
  }

  async function removeObsoleteCaches() {
    if (!supported) return;
    const names = await root.caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => root.caches.delete(name)),
    );
  }

  const ready = removeObsoleteCaches().catch((error) => {
    console.warn("Could not prepare the rule catalog cache.", error);
  });

  async function storeResponse(request, response) {
    if (!supported || !response?.ok) return;
    try {
      await ready;
      const cache = await root.caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    } catch (error) {
      console.warn("Could not cache a rule catalog.", error);
    }
  }

  async function fetchFresh(input, init, url, { store = true } = {}) {
    const response = await nativeFetch(input, {
      ...init,
      cache: "no-cache",
    });
    if (store) await storeResponse(cacheRequest(url), response);
    return response;
  }

  async function fetchCatalog(input, init = {}) {
    const url = catalogUrl(input);
    if (!url || requestMethod(input, init) !== "GET" || !supported) {
      return nativeFetch(input, init);
    }

    const request = cacheRequest(url);
    if (EDITOR_PAGE_PATTERN.test(root.location.pathname)) {
      return fetchFresh(input, init, url);
    }

    await ready;
    const cache = await root.caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    if (!pendingRequests.has(url.href)) {
      const pending = fetchFresh(input, init, url).finally(() => {
        pendingRequests.delete(url.href);
      });
      pendingRequests.set(url.href, pending);
    }
    return (await pendingRequests.get(url.href)).clone();
  }

  async function invalidate(paths) {
    if (!supported) return false;
    await ready;
    const cache = await root.caches.open(CACHE_NAME);
    const values = Array.isArray(paths) ? paths : [paths];
    const requests = values
      .map(catalogUrl)
      .filter(Boolean)
      .map(cacheRequest);
    const results = await Promise.all(requests.map((request) => cache.delete(request)));
    return results.some(Boolean);
  }

  async function invalidatePrefix(pathPrefix) {
    if (!supported) return false;
    await ready;
    const prefix = new URL(pathPrefix, root.location.href).pathname;
    const cache = await root.caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const matches = requests.filter(
      (request) => new URL(request.url).pathname.startsWith(prefix),
    );
    const results = await Promise.all(matches.map((request) => cache.delete(request)));
    return results.some(Boolean);
  }

  async function clear() {
    if (!supported) return false;
    pendingRequests.clear();
    const names = await root.caches.keys();
    const results = await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX))
        .map((name) => root.caches.delete(name)),
    );
    return results.some(Boolean);
  }

  root.fetch = fetchCatalog;
  root.PFCatalogCache = Object.freeze({
    cacheName: CACHE_NAME,
    version: CACHE_VERSION,
    supported,
    ready,
    invalidate,
    invalidatePrefix,
    clear,
  });

  if (EDITOR_PAGE_PATTERN.test(root.location.pathname)) {
    root.addEventListener("DOMContentLoaded", () => {
      const button = document.getElementById("refreshRulesCacheBtn");
      if (!button) return;
      button.addEventListener("click", async () => {
        button.disabled = true;
        await clear();
        root.location.reload();
      });
    });
  }
})(window);
