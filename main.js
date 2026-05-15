import { items } from './alchemical-crafts.js';

document.addEventListener("DOMContentLoaded", () => {
  window.items = items;

  if (typeof window.loadSelect === "function") {
    window.loadSelect();
  }
});
