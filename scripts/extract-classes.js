const fs = require("fs");
const path = require("path");

const OUT_DIR = path.resolve(__dirname, "..", "data", "classes");
const BASE_URL = "https://www.d20pfsrd.com";

const CLASS_LINKS = [
  ["core", "Barbarian", "/classes/core-classes/barbarian/"],
  ["core", "Bard", "/classes/core-classes/bard/"],
  ["core", "Cleric", "/classes/core-classes/cleric/"],
  ["core", "Druid", "/classes/core-classes/druid/"],
  ["core", "Fighter", "/classes/core-classes/fighter/"],
  ["core", "Monk", "/classes/core-classes/monk/"],
  ["core", "Paladin", "/classes/core-classes/paladin/"],
  ["core", "Ranger", "/classes/core-classes/ranger/"],
  ["core", "Rogue", "/classes/core-classes/rogue/"],
  ["core", "Sorcerer", "/classes/core-classes/sorcerer/"],
  ["core", "Wizard", "/classes/core-classes/wizard/"],
  ["base", "Alchemist", "/classes/base-classes/alchemist/"],
  ["base", "Cavalier", "/classes/base-classes/cavalier/"],
  ["base", "Gunslinger", "/classes/base-classes/gunslinger/"],
  ["base", "Inquisitor", "/classes/base-classes/inquisitor/"],
  ["base", "Magus", "/classes/base-classes/magus/"],
  ["base", "Omdura", "/classes/base-classes/omdura/"],
  ["base", "Oracle", "/classes/base-classes/oracle/"],
  ["base", "Shifter", "/classes/base-classes/shifter/"],
  ["base", "Summoner", "/classes/base-classes/summoner/"],
  ["base", "Witch", "/classes/base-classes/witch/"],
  ["base", "Vampire Hunter", "/classes/base-classes/vampire-hunter/"],
  ["base", "Vigilante", "/classes/base-classes/vigilante/"],
  ["hybrid", "Arcanist", "/classes/hybrid-classes/arcanist/"],
  ["hybrid", "Bloodrager", "/classes/hybrid-classes/bloodrager/"],
  ["hybrid", "Brawler", "/classes/hybrid-classes/brawler/"],
  ["hybrid", "Hunter", "/classes/hybrid-classes/hunter/"],
  ["hybrid", "Investigator", "/classes/hybrid-classes/investigator/"],
  ["hybrid", "Shaman", "/classes/hybrid-classes/shaman/"],
  ["hybrid", "Skald", "/classes/hybrid-classes/skald/"],
  ["hybrid", "Slayer", "/classes/hybrid-classes/slayer/"],
  ["hybrid", "Swashbuckler", "/classes/hybrid-classes/swashbuckler/"],
  ["hybrid", "Warpriest", "/classes/hybrid-classes/warpriest/"],
  ["occult", "Kineticist", "/alternative-rule-systems/occult-adventures/occult-classes/kineticist"],
  ["occult", "Medium", "/alternative-rule-systems/occult-adventures/occult-classes/medium"],
  ["occult", "Mesmerist", "/alternative-rule-systems/occult-adventures/occult-classes/mesmerist"],
  ["occult", "Occultist", "/alternative-rule-systems/occult-adventures/occult-classes/occultist"],
  ["occult", "Psychic", "/alternative-rule-systems/occult-adventures/occult-classes/psychic"],
  ["occult", "Spiritualist", "/alternative-rule-systems/occult-adventures/occult-classes/spiritualist"],
  ["alternate", "Antipaladin", "/classes/alternate-classes/antipaladin/"],
  ["alternate", "Ninja", "/classes/alternate-classes/ninja/"],
  ["alternate", "Samurai", "/classes/alternate-classes/samurai/"],
  ["unchained", "Barbarian (Unchained)", "/classes/unchained-classes/barbarian-unchained/"],
  ["unchained", "Monk (Unchained)", "/classes/unchained-classes/monk-unchained/"],
  ["unchained", "Rogue (Unchained)", "/classes/unchained-classes/rogue-unchained/"],
  ["unchained", "Summoner (Unchained)", "/classes/unchained-classes/summoner-unchained/"],
  ["npc", "Adept", "/classes/npc-classes/adept/"],
  ["npc", "Aristocrat", "/classes/npc-classes/aristocrat/"],
  ["npc", "Commoner", "/classes/npc-classes/commoner/"],
  ["npc", "Expert", "/classes/npc-classes/expert/"],
  ["npc", "Warrior", "/classes/npc-classes/warrior/"]
];

const PRESTIGE_INDEX = "https://www.d20pfsrd.com/classes/prestige-classes/";

function absoluteUrl(url) {
  if (/^https?:/i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "PathFriends class scraper" } });
  if (!response.ok && url.includes("/alternative-rule-systems/occult-adventures/")) {
    const fallbackUrl = url.replace("/alternative-rule-systems/occult-adventures/", "/occult-adventures/");
    const fallback = await fetch(fallbackUrl, { headers: { "user-agent": "PathFriends class scraper" } });
    if (fallback.ok) return fallback.text();
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013/g, "-")
    .replace(/&frac12;|½/g, "1/2")
    .replace(/&frac14;|¼/g, "1/4")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseSigned(value) {
  const match = String(value || "").match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

function parseBab(value) {
  const first = String(value || "").split("/")[0];
  return parseSigned(first);
}

function cells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeEntities(match[1]));
}

function extractTables(html) {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(match => match[0]);
}

function extractRows(table) {
  return [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(match => cells(match[0])).filter(row => row.length);
}

function normalizeHeader(header) {
  const normalized = slug(header);
  if (normalized.includes("level")) return "level";
  return normalized
    .replace("base attack bonus", "bab")
    .replace("fort save", "fort")
    .replace("ref save", "ref")
    .replace("will save", "will")
    .replace("special", "special");
}

function parseFeatureNames(value) {
  return decodeEntities(value)
    .split(/,(?![^(]*\))/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => !/^[-—]+$/.test(item));
}

function findProgressionTable(html) {
  for (const table of extractTables(html)) {
    let rows = extractRows(table);
    if (!rows.length) continue;
    const levelIndex = rows[0].map(normalizeHeader).findIndex(item => item === "level");
    if (levelIndex > 0) {
      rows = rows.map(row => row.slice(levelIndex));
    }
    const header = rows[0].map(normalizeHeader);
    if (header.some(item => item === "level") && header.some(item => item === "bab") && header.some(item => ["fort", "ref", "will"].includes(item))) {
      return rows;
    }
  }
  return [];
}

function featureDescriptions(html) {
  const map = {};
  const headingPattern = /<h([2-4])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[2-4][^>]*>|$)/gi;
  for (const match of html.matchAll(headingPattern)) {
    const title = decodeEntities(match[2]).replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (!title || title.length > 80) continue;
    const body = decodeEntities(match[3]).slice(0, 1600);
    if (body) map[slug(title)] = body;
  }
  return map;
}

function parseClassPage(html) {
  const rows = findProgressionTable(html);
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const descriptions = featureDescriptions(html);
  const parsedRows = rows.slice(1).map(row => {
    const record = { level: Number(String(row[0]).match(/\d+/)?.[0] || 0) };
    if (!record.level) return null;
    const spellcasting = {};
    headers.forEach((header, index) => {
      const value = row[index] || "";
      if (header === "bab") record.bab = parseBab(value);
      else if (header === "fort") record.fort = parseSigned(value);
      else if (header === "ref") record.ref = parseSigned(value);
      else if (header === "will") record.will = parseSigned(value);
      else if (header === "special") {
        record.classFeatures = parseFeatureNames(value).map(name => ({
          name,
          description: descriptions[slug(name.replace(/\s*\([^)]*\)\s*$/, ""))] || ""
        }));
      } else if (index > 0 && /\d|—|-/.test(value) && /(spell|0|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|known|per day)/i.test(rows[0].join(" "))) {
        spellcasting[rows[0][index] || headers[index] || `column ${index}`] = value;
      }
    });
    if (Object.keys(spellcasting).length) record.spellcasting = spellcasting;
    return record;
  }).filter(record =>
    record &&
    record.level > 0 &&
    record.level <= 20 &&
    Number(record.bab || 0) <= record.level &&
    Math.max(Number(record.fort || 0), Number(record.ref || 0), Number(record.will || 0)) <= 12
  );
  const byLevel = new Map();
  parsedRows.forEach(row => {
    if (!byLevel.has(row.level)) byLevel.set(row.level, row);
  });
  return [...byLevel.values()].sort((a, b) => a.level - b.level);
}

function summarizeSpellcasting(levelProgression) {
  const hasSpellcasting = levelProgression.some(row => row.spellcasting && Object.keys(row.spellcasting).length);
  return hasSpellcasting ? { summary: "See level progression spell columns." } : null;
}

function saveProgression(kind, level) {
  return kind === "good" ? 2 + Math.floor(level / 2) : Math.floor(level / 3);
}

function babProgression(kind, level) {
  if (kind === "full") return level;
  if (kind === "half") return Math.floor(level / 2);
  return Math.floor((level * 3) / 4);
}

const FALLBACK_CHASSIS = {
  "Kineticist": { bab: "threeQuarter", fort: "good", ref: "good", will: "poor" },
  "Medium": { bab: "threeQuarter", fort: "poor", ref: "poor", will: "good" },
  "Mesmerist": { bab: "threeQuarter", fort: "poor", ref: "poor", will: "good", spellcasting: "psychic spellcasting" },
  "Occultist": { bab: "threeQuarter", fort: "good", ref: "poor", will: "good", spellcasting: "psychic spellcasting" },
  "Psychic": { bab: "half", fort: "poor", ref: "poor", will: "good", spellcasting: "psychic spellcasting" },
  "Spiritualist": { bab: "threeQuarter", fort: "good", ref: "poor", will: "good", spellcasting: "psychic spellcasting" },
  "Rogue (Unchained)": { bab: "threeQuarter", fort: "poor", ref: "good", will: "poor" },
  "Skald": { bab: "threeQuarter", fort: "good", ref: "poor", will: "good", spellcasting: "bardic spellcasting" }
};

function fallbackProgression(name) {
  const chassis = FALLBACK_CHASSIS[name];
  if (!chassis) return [];
  return Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;
    const row = {
      level,
      bab: babProgression(chassis.bab, level),
      fort: saveProgression(chassis.fort, level),
      ref: saveProgression(chassis.ref, level),
      will: saveProgression(chassis.will, level),
      classFeatures: []
    };
    if (chassis.spellcasting) row.spellcasting = { summary: chassis.spellcasting };
    return row;
  });
}

async function discoverPrestigeLinks() {
  const html = await fetchText(PRESTIGE_INDEX);
  const links = [];
  const seen = new Set();
  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1];
    const name = decodeEntities(match[2]);
    if (!href.includes("/classes/prestige-classes/")) continue;
    if (/mythic|archetype|3rd-party|favored|prestige-classes\/?$|3\.5/i.test(`${href} ${name}`)) continue;
    if (!name || name.length > 60 || /^[A-Z]-[A-Z]$/.test(name)) continue;
    if (/^(prestige classes|advanced prestige classes|core prestige classes|other|[a-z]-[a-z])$/i.test(name)) continue;
    if (!/^[A-Z][A-Za-z' -]+(?:\([^)]+\))?$/.test(name)) continue;
    const url = absoluteUrl(href);
    if (seen.has(url)) continue;
    seen.add(url);
    links.push(["prestige", name.replace(/\s+\(Redirect\)$/i, ""), url]);
  }
  return links;
}

async function scrapeOne([type, name, url]) {
  const targetUrl = absoluteUrl(url);
  const html = await fetchText(targetUrl);
  const levelProgression = parseClassPage(html);
  const fallback = levelProgression.length ? [] : fallbackProgression(name);
  return {
    name,
    type,
    sourceUrl: targetUrl,
    levelProgression: levelProgression.length ? levelProgression : fallback,
    spellcasting: summarizeSpellcasting(levelProgression.length ? levelProgression : fallback),
    fallback: !levelProgression.length && fallback.length ? "progression chassis only" : undefined
  };
}

async function main() {
  const prestige = await discoverPrestigeLinks();
  const allLinks = [...CLASS_LINKS, ...prestige].filter((entry, index, list) =>
    list.findIndex(item => item[1] === entry[1]) === index
  );
  const output = [];
  for (const entry of allLinks) {
    try {
      console.log(`Scraping ${entry[1]}`);
      output.push(await scrapeOne(entry));
    } catch (error) {
      console.warn(`Failed ${entry[1]}: ${error.message}`);
      const fallback = fallbackProgression(entry[1]);
      output.push({
        name: entry[1],
        type: entry[0],
        sourceUrl: absoluteUrl(entry[2]),
        levelProgression: fallback,
        spellcasting: summarizeSpellcasting(fallback),
        fallback: fallback.length ? "progression chassis only" : undefined,
        scrapeError: error.message
      });
    }
  }
  output.sort((a, b) => {
    const ap = a.type === "prestige" ? 1 : 0;
    const bp = b.type === "prestige" ? 1 : 0;
    return ap - bp || a.name.localeCompare(b.name);
  });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const used = new Map();
  const index = output.map((entry, classIndex) => {
    const base = String(entry.name || `class-${classIndex + 1}`)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `class-${classIndex + 1}`;
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const file = `${count ? `${base}-${count + 1}` : base}.json`;
    fs.writeFileSync(path.join(OUT_DIR, file), `${JSON.stringify(entry, null, 2)}\n`, "utf8");
    return {
      name: entry.name || `Class ${classIndex + 1}`,
      type: entry.type || entry.category || "base",
      category: entry.category || entry.type || "base",
      sourceUrl: entry.sourceUrl || "",
      spellcastingClass: Boolean(entry.spellcastingClass),
      file
    };
  });
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`Wrote ${output.length} classes to ${OUT_DIR}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
