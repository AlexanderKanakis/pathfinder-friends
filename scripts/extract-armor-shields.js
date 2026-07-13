const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://www.d20pfsrd.com/equipment/armor/";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "armor-shields.json");
const DETAIL_CONCURRENCY = 6;

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014|\u00e2\u20ac\u201d/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013|\u00e2\u20ac\u201c/g, "-")
    .replace(/&times;|&#215;|&#xD7;|\u00d7|\u00c3\u2014|\u00c3\u0192\u00e2\u20ac\u201d/g, "x")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/â€™|&#8217;|&#x2019;/g, "'")
    .replace(/â€œ|&#8220;|&#x201C;/g, '"')
    .replace(/â€|&#8221;|&#x201D;/g, '"')
    .replace(/â€“|&#8211;|&#x2013;/g, "-")
    .replace(/â€”|&#8212;|&#x2014;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
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

function isArmorShieldTable(rows) {
  const header = rows.slice(0, 3).flat().map(cell => cell.text.toLowerCase()).join(" ");
  return header.includes("cost") &&
    (header.includes("armor bonus") || header.includes("shield bonus")) &&
    header.includes("armor check penalty") &&
    header.includes("spell failure") &&
    header.includes("weight");
}

function tableType(rows) {
  const title = rows[0]?.[0]?.text.toLowerCase() || "";
  const header = rows.slice(0, 3).flat().map(cell => cell.text.toLowerCase()).join(" ");
  return title.includes("shield") || header.includes("shield cost") ? "Shield" : "Armor";
}

function groupFor(html, tableIndex, fallbackType) {
  void html;
  void tableIndex;
  return fallbackType;
}

function groupFromRows(rows, fallbackType) {
  const title = rows[0]?.[0]?.text || "";
  if (title && !/^(armor|shield|extra)$/i.test(title)) return title;
  return fallbackType;
}

function summaryFor(row, type, group) {
  const parts = [
    group && group !== type ? group : type,
    row.bonus ? `${type} bonus: ${row.bonus}` : "",
    row.maxDex ? `Max Dex: ${row.maxDex}` : "",
    row.penalty ? `Penalty: ${row.penalty}` : "",
    row.failure ? `Spell failure: ${row.failure}` : "",
    row.speed30 ? `Speed 30 ft.: ${row.speed30}` : "",
    row.speed20 ? `Speed 20 ft.: ${row.speed20}` : "",
    row.weight ? `Weight: ${row.weight}` : ""
  ].filter(Boolean);
  return parts.join(". ");
}

function normalizeArmorShield(row, type, group) {
  const summary = summaryFor(row, type, group);
  return {
    name: row.name,
    description: summary,
    count: 1,
    type,
    details: {
      source: "d20pfsrd armor",
      summary,
      armorGroup: group,
      bonus: row.bonus === "-" ? "0" : row.bonus,
      enhancement: "0",
      enchantment: "",
      maxDex: row.maxDex === "-" ? "" : row.maxDex,
      penalty: row.penalty === "-" ? "" : row.penalty,
      failure: row.failure === "-" ? "" : row.failure,
      speed30: row.speed30 === "-" ? "" : row.speed30,
      speed20: row.speed20 === "-" ? "" : row.speed20,
      cost: row.cost,
      weight: row.weight,
      sourceBook: row.source,
      link: row.link || ""
    },
    effects: []
  };
}

function parseArmorShieldTables(html) {
  const output = [];
  for (const block of tableBlocks(html)) {
    const rows = parseRows(block.html);
    if (!isArmorShieldTable(rows)) continue;
    const type = tableType(rows);
    const group = groupFromRows(rows, groupFor(html, block.index, type));
    for (const cells of rows.slice(1)) {
      if (cells.length < 8) continue;
      if (!cells[0].link) continue;
      const row = {
        name: cells[0].text,
        link: cells[0].link,
        cost: cells[1]?.text || "",
        bonus: cells[2]?.text || "",
        maxDex: cells[3]?.text || "",
        penalty: cells[4]?.text || "",
        failure: cells[5]?.text || "",
        speed30: cells[6]?.text || "",
        speed20: cells[7]?.text || "",
        weight: cells[8]?.text || "",
        source: cells[9]?.text || ""
      };
      if (!row.name || /^cost$/i.test(row.name) || row.name.includes("Generated")) continue;
      output.push(normalizeArmorShield(row, type, group));
    }
  }
  const seen = new Set();
  return output.filter(item => {
    const key = `${item.name}|${item.type}|${item.details.armorGroup}|${item.details.cost}|${item.details.bonus}`;
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
    (value.includes("armor bonus") || value.includes("shield bonus"));
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
  const items = parseArmorShieldTables(html);
  if (!items.length) throw new Error("No armor or shield rows extracted. The source page markup may have changed.");
  await enrichDescriptions(items);
  fs.writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`Wrote ${items.length} armor/shield items to ${OUT}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
