import { items } from '../data/alchemical-crafts.js';

document.addEventListener("DOMContentLoaded", () => {
  window.items = items;

  if (typeof window.loadSelect === "function") {
    window.loadSelect();
  }
});
