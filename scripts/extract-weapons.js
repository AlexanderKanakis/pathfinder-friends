const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://www.d20pfsrd.com/equipment/weapons/";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "weapons.json");
const DETAIL_CONCURRENCY = 6;

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014|\u00e2\u20ac\u201d/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013|\u00e2\u20ac\u201c/g, "-")
    .replace(/&times;|&#215;|&#xD7;|\u00d7|\u00c3\u2014|\u00c3\u0192\u00e2\u20ac\u201d/g, "x")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function cleanText(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|tr|td|th|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstLink(html = "") {
  const match = String(html).match(/<a\b[^>]*href=["']([^"']+)["']/i);
  if (!match) return "";
  try {
    return new URL(match[1], SOURCE_URL).href;
  } catch {
    return match[1];
  }
}

function tableBlocks(html) {
  return [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map(match => ({
    html: match[0],
    index: match.index || 0
  }));
}

function rowCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => ({
    html: match[1],
    text: cleanText(match[1]),
    link: firstLink(match[1])
  }));
}

function parseRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map(match => rowCells(match[0]))
    .filter(row => row.length);
}

function tableTitle(rows) {
  const first = rows[0] || [];
  return cleanText(first[0]?.text || "");
}

function isWeaponTable(rows) {
  const header = (rows[0] || []).map(cell => cell.text.toLowerCase()).join(" ");
  return header.includes("cost") && header.includes("dmg") && header.includes("critical") && header.includes("weight");
}

function proficiencyFor(html, tableIndex) {
  const before = cleanText(html.slice(Math.max(0, tableIndex - 5000), tableIndex));
  const matches = [...before.matchAll(/\((Simple|Martial|Exotic)\)|\b(Simple|Martial|Exotic) Weapons\b/gi)];
  const last = matches.at(-1);
  return last ? (last[1] || last[2] || "").replace(/^\w/, c => c.toUpperCase()) : "";
}

function proficiencyFromTitle(title) {
  const match = String(title || "").match(/\((Simple|Martial|Exotic)\)/i);
  return match ? match[1].replace(/^\w/, c => c.toUpperCase()) : "";
}

function cleanWeaponGroup(title) {
  return String(title || "").replace(/^\((Simple|Martial|Exotic)\)\s*/i, "").trim();
}

function weaponTypeFor(title) {
  const value = String(title || "").toLowerCase();
  if (value.includes("ammunition")) return "Ammunition";
  if (value.includes("ranged")) return "Ranged Weapon";
  if (value.includes("two-handed")) return "Melee Weapon (Two-Handed)";
  if (value.includes("one-handed")) return "Melee Weapon (One-Handed)";
  if (value.includes("light") || value.includes("unarmed")) return "Melee Weapon (Light)";
  return "Weapon";
}

function attackScaleFor(weaponType) {
  return weaponType === "Ranged Weapon" ? "DEX" : "STR";
}

function damageScaleFor(weaponType) {
  if (weaponType === "Ranged Weapon" || weaponType === "Ammunition") return "";
  return "STR";
}

function summaryFor(row, proficiency, title) {
  const weaponGroup = cleanWeaponGroup(title);
  const parts = [
    proficiency ? `${proficiency} weapon` : "Weapon",
    weaponGroup || "",
    row.damageType ? `Damage type: ${row.damageType}` : "",
    row.special && row.special !== "-" ? `Special: ${row.special}` : "",
    row.range && row.range !== "-" ? `Range: ${row.range}` : "",
    row.weight && row.weight !== "-" ? `Weight: ${row.weight}` : ""
  ].filter(Boolean);
  return parts.join(". ");
}

function normalizeWeapon(row, proficiency, title) {
  const weaponType = weaponTypeFor(title);
  const weaponGroup = cleanWeaponGroup(title);
  const link = row.link || "";
  const summary = summaryFor(row, proficiency, title);
  return {
    name: row.name,
    description: summary,
    count: 1,
    type: weaponType === "Ammunition" ? "Item" : "Weapon",
    details: {
      source: "d20pfsrd weapons",
      summary,
      proficiency,
      weaponGroup,
      weaponType: weaponType === "Ammunition" ? "Ranged Weapon" : weaponType,
      attackScale: attackScaleFor(weaponType),
      damage: row.damageMedium === "-" ? "" : row.damageMedium,
      damageSmall: row.damageSmall === "-" ? "" : row.damageSmall,
      critical: row.critical === "-" ? "" : row.critical.replace(/x/g, "x"),
      damageScale: damageScaleFor(weaponType),
      enhancement: "0",
      enchantment: "",
      range: row.range === "-" ? "" : row.range,
      cost: row.cost,
      weight: row.weight,
      damageType: row.damageType,
      special: row.special === "-" ? "" : row.special,
      sourceBook: row.source,
      link
    },
    effects: []
  };
}

function parseWeaponTables(html) {
  const output = [];
  for (const block of tableBlocks(html)) {
    const rows = parseRows(block.html);
    if (!isWeaponTable(rows)) continue;
    const title = tableTitle(rows);
    const proficiency = proficiencyFromTitle(title) || proficiencyFor(html, block.index);
    for (const cells of rows.slice(1)) {
      if (cells.length < 9) continue;
      const row = {
        name: cells[0].text,
        link: cells[0].link,
        cost: cells[1].text,
        damageSmall: cells[2].text,
        damageMedium: cells[3].text,
        critical: cells[4].text,
        range: cells[5].text,
        weight: cells[6].text,
        damageType: cells[7].text,
        special: cells[8].text,
        source: cells[9]?.text || ""
      };
      if (!row.name || /^cost$/i.test(row.name) || row.name.includes("Generated")) continue;
      output.push(normalizeWeapon(row, proficiency, title));
    }
  }
  const seen = new Set();
  return output.filter(item => {
    const key = `${item.name}|${item.details.weaponGroup}|${item.details.damage}|${item.details.cost}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function articleText(html = "") {
  const articleMatch = String(html).match(/<div\b[^>]*class=["'][^"']*\barticle-text\b[^"']*["'][^>]*>([\s\S]*?)<div\b[^>]*class=["'][^"']*\bsection15\b/i);
  if (articleMatch) return articleMatch[1];
  const h1Index = String(html).search(/<h1\b/i);
  const sectionIndex = String(html).search(/<div\b[^>]*class=["'][^"']*\bsection15\b/i);
  if (h1Index >= 0) return String(html).slice(h1Index, sectionIndex > h1Index ? sectionIndex : undefined);
  return "";
}

function isStatParagraph(text = "") {
  const value = text.toLowerCase();
  return value.includes("cost") &&
    value.includes("weight") &&
    value.includes("damage") &&
    value.includes("critical") &&
    value.includes("proficiency");
}

function isNoiseParagraph(text = "") {
  const value = text.toLowerCase();
  return !value ||
    value.includes("subscribe to the open gaming network") ||
    value.includes("section 15") ||
    value.includes("copyright notice");
}

function detailDescriptionFromHtml(html = "") {
  const content = articleText(html);
  if (!content) return "";
  const afterTitle = content.replace(/^[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i, "");
  const paragraphs = [...afterTitle.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => cleanText(match[1]))
    .filter(text => !isNoiseParagraph(text))
    .filter(text => !isStatParagraph(text));
  return paragraphs.join(" ").replace(/\s+/g, " ").trim();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function mapWithConcurrency(items, limit, iteratee) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await iteratee(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function enrichDescriptions(weapons) {
  let completed = 0;
  await mapWithConcurrency(weapons, DETAIL_CONCURRENCY, async weapon => {
    if (!weapon.details.link) return weapon;
    try {
      const html = await fetchText(weapon.details.link);
      const description = detailDescriptionFromHtml(html);
      if (description) weapon.description = description;
    } catch (error) {
      console.warn(`Could not fetch description for ${weapon.name}: ${error.message}`);
    } finally {
      completed += 1;
      if (completed % 25 === 0 || completed === weapons.length) {
        console.log(`Fetched detail pages: ${completed}/${weapons.length}`);
      }
    }
    return weapon;
  });
  return weapons;
}

async function main() {
  const html = await fetchText(SOURCE_URL);
  const weapons = parseWeaponTables(html);
  if (!weapons.length) throw new Error("No weapon rows extracted. The source page markup may have changed.");
  await enrichDescriptions(weapons);
  fs.writeFileSync(OUT, `${JSON.stringify(weapons, null, 2)}\n`, "utf8");
  console.log(`Wrote ${weapons.length} weapons to ${OUT}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
