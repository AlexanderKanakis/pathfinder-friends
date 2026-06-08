const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "mundane-items.json");

const SOURCES = [
  {
    url: "https://www.d20pfsrd.com/equipment/goods-and-services/hunting-camping-survival-gear/",
    category: "Adventuring Gear"
  },
  {
    url: "https://www.d20pfsrd.com/equipment/goods-and-services/books-paper-writing-supplies/",
    category: "Books, Paper, & Writing Supplies"
  },
  {
    url: "https://www.d20pfsrd.com/equipment/goods-and-services/containers-bags-boxes-more/",
    category: "Clothing & Containers"
  },
  {
    url: "https://www.d20pfsrd.com/equipment/goods-and-services/tools-kits/",
    category: "Locks, Keys, Tools & Kits"
  },
  {
    url: "https://www.d20pfsrd.com/equipment/goods-and-services/toys-games-puzzles/",
    category: "Toys & Games"
  }
];

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014|\u00e2\u20ac\u201d/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013|\u00e2\u20ac\u201c/g, "-")
    .replace(/&times;|&#215;|&#xD7;|\u00d7/g, "x")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/Ã¢â‚¬â„¢|&#8217;|&#x2019;/g, "'")
    .replace(/Ã¢â‚¬Å“|&#8220;|&#x201C;/g, '"')
    .replace(/Ã¢â‚¬Â|&#8221;|&#x201D;/g, '"')
    .replace(/Ã¢â‚¬â€œ|&#8211;|&#x2013;/g, "-")
    .replace(/Ã¢â‚¬â€|&#8212;|&#x2014;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function cleanText(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|tr|td|th|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function firstLink(html = "", baseUrl = "") {
  const match = String(html).match(/<a\b[^>]*href=["']([^"']+)["']/i);
  if (!match) return "";
  try {
    return new URL(match[1], baseUrl).href;
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

function rowCells(rowHtml, baseUrl) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => ({
    html: match[1],
    text: cleanText(match[1]),
    link: firstLink(match[1], baseUrl)
  }));
}

function parseRows(tableHtml, baseUrl) {
  return [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map(match => rowCells(match[0], baseUrl))
    .filter(row => row.length);
}

function headingBefore(html, index) {
  const before = html.slice(0, index);
  const headings = [...before.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(match => cleanText(match[2]))
    .filter(Boolean);
  return headings.at(-1) || "";
}

function isMundaneTable(rows) {
  const header = rows.slice(0, 3).flat().map(cell => cell.text.toLowerCase()).join(" ");
  return header.includes("item") && header.includes("price") && (header.includes("weight") || header.includes("source"));
}

function headerIndexMap(rows) {
  const headerRow = rows.find(row => row.some(cell => /^item$/i.test(cell.text))) || rows[0] || [];
  const output = {};
  headerRow.forEach((cell, index) => {
    const key = cell.text.toLowerCase();
    if (key.includes("item")) output.name = index;
    if (key.includes("price") || key.includes("cost")) output.price = index;
    if (key.includes("weight")) output.weight = index;
    if (key.includes("source")) output.source = index;
  });
  return output;
}

function detailSections(html) {
  const headings = [...html.matchAll(/<h([3-5])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(match => ({
      level: Number(match[1]),
      title: cleanText(match[2]),
      start: match.index || 0,
      endOfHeading: (match.index || 0) + match[0].length
    }))
    .filter(heading => heading.title && !["Contents"].includes(heading.title));
  const sections = new Map();
  headings.forEach((heading, index) => {
    const next = headings.find((candidate, candidateIndex) => candidateIndex > index && candidate.level <= heading.level);
    const body = html.slice(heading.endOfHeading, next?.start ?? html.length);
    const text = cleanText(body)
      .replace(/^Source\s+\S+\s*/i, "")
      .trim();
    if (!text || /^(item|price|weight|source)$/i.test(heading.title)) return;
    sections.set(normalizeName(heading.title), { title: heading.title, text });
  });
  return sections;
}

function detailFor(details, name) {
  const key = normalizeName(name);
  if (details.has(key)) return details.get(key).text;
  const found = [...details.entries()].find(([detailKey]) => detailKey === key || detailKey.startsWith(`${key} `) || key.startsWith(`${detailKey} `));
  return found?.[1]?.text || "";
}

function sourceCategory(defaultCategory, group) {
  const text = String(group || "").toLowerCase();
  if (defaultCategory === "Locks, Keys, Tools & Kits" && text.includes("religious")) return "Religious Items";
  if (defaultCategory === "Toys & Games" && text.includes("religious")) return "Religious Items";
  return defaultCategory;
}

function normalizeItem(row, detailText, group, source, url, index) {
  const summary = [
    source.category,
    group && group !== source.category ? group : "",
    row.price ? `Price: ${row.price}` : "",
    row.weight ? `Weight: ${row.weight}` : ""
  ].filter(Boolean).join(". ");
  return {
    id: `mundane:${index}`,
    sourceType: "Mundane Item",
    name: row.name,
    description: detailText || summary,
    count: 1,
    type: "Item",
    details: {
      source: "Mundane Item",
      mundaneCategory: sourceCategory(source.category, group),
      mundaneGroup: group || "",
      price: row.price || "",
      weight: row.weight || "",
      sourceBook: row.source || "",
      link: row.link || url,
      summary
    },
    effects: []
  };
}

function parsePage(html, source, startIndex) {
  const details = detailSections(html);
  const items = [];
  for (const block of tableBlocks(html)) {
    const rows = parseRows(block.html, source.url);
    if (!isMundaneTable(rows)) continue;
    const map = headerIndexMap(rows);
    const group = headingBefore(html, block.index) || source.category;
    const dataRows = rows.filter(row => row.length > 1 && !/^item$/i.test(row[map.name || 0]?.text || ""));
    for (const cells of dataRows) {
      const nameCell = cells[map.name ?? 0];
      const row = {
        name: nameCell?.text || "",
        link: nameCell?.link || "",
        price: cells[map.price]?.text || "",
        weight: cells[map.weight]?.text || "",
        source: cells[map.source]?.text || ""
      };
      if (!row.name || /^(item|price|source|weight)$/i.test(row.name)) continue;
      if (!row.price && !row.weight) continue;
      items.push(normalizeItem(row, detailFor(details, row.name), group, source, source.url, startIndex + items.length));
    }
  }
  return items;
}

async function main() {
  const output = [];
  for (const source of SOURCES) {
    console.log(`Fetching ${source.url}`);
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`Failed ${source.url}: ${response.status}`);
    const html = await response.text();
    output.push(...parsePage(html, source, output.length));
  }

  const seen = new Set();
  const deduped = output.filter(item => {
    const key = `${item.name.toLowerCase()}|${item.details.mundaneCategory}|${item.details.price}|${item.details.weight}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  fs.writeFileSync(OUT, `${JSON.stringify(deduped, null, 2)}\n`);
  console.log(`Wrote ${deduped.length} mundane items to ${path.relative(ROOT, OUT)}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
