(function (root, factory) {
  const api = factory();
  if (root) root.PFTextureCatalog = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const textures = Object.freeze([
    Object.freeze({ id: "charnel", name: "Charnel", url: "assets/shape icons/charnel.png" }),
    Object.freeze({ id: "dark-fog", name: "Dark Fog", url: "assets/shape icons/dark fog.png" }),
    Object.freeze({ id: "flames", name: "Flames", url: "assets/shape icons/flames.png" }),
    Object.freeze({ id: "fog", name: "Fog", url: "assets/shape icons/fog.png" }),
    Object.freeze({ id: "grass", name: "Grass", url: "assets/shape icons/grass.png" }),
    Object.freeze({ id: "pit", name: "Pit", url: "assets/shape icons/pit.png" }),
    Object.freeze({ id: "poison-fog", name: "Poison Fog", url: "assets/shape icons/poison fog.png" }),
    Object.freeze({ id: "prism", name: "Prism", url: "assets/shape icons/prism.png" }),
    Object.freeze({ id: "stone", name: "Stone", url: "assets/shape icons/stone.png" }),
  ]);

  function all() {
    return [...textures];
  }

  function find(textureId = "") {
    return textures.find((texture) => texture.id === textureId) || null;
  }

  return { all, find };
});
