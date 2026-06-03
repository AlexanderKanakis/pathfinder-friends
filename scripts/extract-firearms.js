const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://www.d20pfsrd.com/equipment/weapons/firearms/";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "firearms.json");
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

function rowCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => ({
    html: match[1],
    text: cleanText(match[1]),
    link: firstLink(match[1])
  }));
}

function parseRows(html) {
  return [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map(match => rowCells(match[0]))
    .filter(row => row.length);
}

function firearmWeaponType(group = "") {
  const value = group.toLowerCase();
  if (value.includes("two-handed")) return "Firearm (Two-Handed)";
  if (value.includes("ammunition")) return "Ranged Weapon";
  return "Firearm (One-Handed)";
}

function isAmmunition(group = "") {
  return group.toLowerCase().includes("ammunition");
}

function summaryFor(row) {
  const parts = [
    row.era ? `${row.era} firearm` : "Firearm",
    row.group || "",
    row.damageType ? `Damage type: ${row.damageType}` : "",
    row.misfire ? `Misfire: ${row.misfire}` : "",
    row.capacity ? `Capacity: ${row.capacity}` : "",
    row.special && row.special !== "-" ? `Special: ${row.special}` : "",
    row.range && row.range !== "-" ? `Range: ${row.range}` : "",
    row.weight && row.weight !== "-" ? `Weight: ${row.weight}` : ""
  ].filter(Boolean);
  return parts.join(". ");
}

function normalizeFirearm(row) {
  const ammo = isAmmunition(row.group);
  const weaponType = firearmWeaponType(row.group);
  const summary = summaryFor(row);
  return {
    name: row.name,
    description: summary,
    count: 1,
    type: ammo ? "Item" : "Weapon",
    details: {
      source: "d20pfsrd firearms",
      summary,
      proficiency: "Exotic",
      firearmEra: row.era,
      weaponGroup: row.group,
      weaponType,
      attackScale: "DEX",
      damage: ammo || row.damageMedium === "-" ? "" : row.damageMedium,
      damageSmall: row.damageSmall === "-" ? "" : row.damageSmall,
      critical: row.critical === "-" ? "" : row.critical,
      damageScale: ammo ? "" : "",
      enhancement: "0",
      enchantment: "",
      range: row.range === "-" ? "" : row.range,
      misfire: row.misfire === "-" ? "" : row.misfire,
      capacity: row.capacity === "-" ? "" : row.capacity,
      cost: row.cost,
      weight: row.weight,
      damageType: row.damageType,
      special: row.special === "-" ? "" : row.special,
      sourceBook: row.source,
      link: row.link || ""
    },
    effects: []
  };
}

function isHeaderRow(row) {
  const text = row.map(cell => cell.text.toLowerCase()).join(" ");
  return text.includes("cost") && text.includes("dmg") && text.includes("misfire") && text.includes("capacity");
}

function parseFirearmRows(html) {
  const output = [];
  let currentEra = "";
  let currentGroup = "";
  for (const cells of parseRows(html)) {
    if (cells.length === 1 && /firearms/i.test(cells[0].text)) {
      currentEra = cells[0].text.replace(/\s+/g, " ").trim();
      continue;
    }
    if (isHeaderRow(cells)) {
      currentGroup = cells[0].text.replace(/^\((Early|Advanced|Modern)\)\s*/i, "").trim();
      const eraMatch = cells[0].text.match(/\((Early|Advanced|Modern)\)/i);
      if (eraMatch) currentEra = `${eraMatch[1][0].toUpperCase()}${eraMatch[1].slice(1).toLowerCase()} Firearms`;
      continue;
    }
    if (cells.length < 10 || !cells[0].link) continue;
    const row = {
      era: currentEra,
      group: currentGroup,
      name: cells[0].text,
      link: cells[0].link,
      cost: cells[1]?.text || "",
      damageSmall: cells[2]?.text || "",
      damageMedium: cells[3]?.text || "",
      critical: cells[4]?.text || "",
      range: cells[5]?.text || "",
      misfire: cells[6]?.text || "",
      capacity: cells[7]?.text || "",
      weight: cells[8]?.text || "",
      damageType: cells[9]?.text || "",
      special: cells[10]?.text || "",
      source: cells[11]?.text || ""
    };
    if (!row.name || /^cost$/i.test(row.name)) continue;
    output.push(normalizeFirearm(row));
  }
  const seen = new Set();
  return output.filter(item => {
    const key = `${item.name}|${item.details.weaponGroup}|${item.details.cost}|${item.details.damage}`;
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
    value.includes("critical");
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

async function enrichDescriptions(items) {
  let completed = 0;
  await mapWithConcurrency(items, DETAIL_CONCURRENCY, async item => {
    if (!item.details.link) return item;
    try {
      const html = await fetchText(item.details.link);
      const description = detailDescriptionFromHtml(html);
      if (description) item.description = description;
    } catch (error) {
      console.warn(`Could not fetch description for ${item.name}: ${error.message}`);
    } finally {
      completed += 1;
      if (completed % 25 === 0 || completed === items.length) {
        console.log(`Fetched detail pages: ${completed}/${items.length}`);
      }
    }
    return item;
  });
  return items;
}

async function main() {
  const html = await fetchText(SOURCE_URL);
  const firearms = parseFirearmRows(html);
  if (!firearms.length) throw new Error("No firearm rows extracted. The source page markup may have changed.");
  await enrichDescriptions(firearms);
  fs.writeFileSync(OUT, `${JSON.stringify(firearms, null, 2)}\n`, "utf8");
  console.log(`Wrote ${firearms.length} firearms to ${OUT}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
