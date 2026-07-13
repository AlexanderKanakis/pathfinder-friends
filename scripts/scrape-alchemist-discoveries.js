const { loadClasses, saveClasses } = require("./class-file-store");

const DISCOVERIES_URL = "https://www.d20pfsrd.com/classes/base-classes/alchemist/discoveries/";
const CONCURRENCY = 6;

const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: "\"",
  rsquo: "'",
  lsquo: "'",
  rdquo: "\"",
  ldquo: "\"",
  ndash: "-",
  mdash: "-",
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => HTML_ENTITIES[key] || `&${key};`);
}

function cleanText(html) {
  return decodeHtml(String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>|<\/div>|<\/li>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function stripHtmlBlock(html, selectorClass) {
  const pattern = new RegExp(`<[^>]*class=["'][^"']*${selectorClass}[^"']*["'][^>]*>[\\s\\S]*?<\\/div>`, "gi");
  return String(html || "").replace(pattern, " ");
}

function firstHref(html) {
  const match = String(html || "").match(/href=["']([^"']+)["']/i);
  return match ? normalizeSourceUrl(decodeHtml(match[1])) : "";
}

function normalizeSourceUrl(url) {
  return String(url || "").replace("/paizo-alchemist-grand-discoveri/", "/paizo-alchemist-grand-discoveries/");
}

function titleCaseWords(value) {
  const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "per", "the", "to", "vs", "with"]);
  return String(value || "")
    .split(/(\s+|-|\/)/)
    .map((part, index) => {
      if (!part || /^\s+$|^-$|^\/$/.test(part)) return part;
      if (/^[A-Z]{2,}$/.test(part) || /^\d+d\d+/i.test(part)) return part;
      const lower = part.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("")
    .replace(/\bDc\b/g, "DC")
    .replace(/\bHp\b/g, "HP")
    .replace(/\bAc\b/g, "AC");
}

function splitTableRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(match => match[0]);
}

function splitCells(rowHtml) {
  return [...rowHtml.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map(match => ({
    tag: match[1].toLowerCase(),
    attrs: match[2] || "",
    html: match[3] || "",
    text: cleanText(match[3] || ""),
    href: firstHref(match[3] || ""),
  }));
}

function parseRequirements(rawPrerequisites, isGrandOption) {
  const text = rawPrerequisites && rawPrerequisites !== "-" && rawPrerequisites !== "—" ? rawPrerequisites : "";
  const requirements = {};
  if (!text) return requirements;

  const alchemistLevel = text.match(/\balchemist\s+(\d+)\b/i);
  if (alchemistLevel) requirements.minClassLevel = Number(alchemistLevel[1]);

  const races = ["drow", "gillman", "goblin", "grippli", "half-orc", "kitsune", "orc", "ratfolk", "tengu", "tiefling", "vishkanya"];
  const race = races.find(item => new RegExp(`\\b${item.replace("-", "[- ]")}\\b`, "i").test(text));
  if (race) requirements.race = titleCaseWords(race);

  const requiredChoices = [];
  for (const match of text.matchAll(/([^,;]+?)\s+discover(?:y|ies)\b/gi)) {
    const candidate = match[1]
      .replace(/\b(grand|greater|normal|other|any|another|a|an|the|alchemist)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!candidate || /^grand$/i.test(candidate) || /grand\s+discover/i.test(match[0])) continue;
    const name = titleCaseWords(candidate);
    if (name && !requiredChoices.includes(name)) requiredChoices.push(name);
  }
  if (requiredChoices.length) requirements.requiredChoices = requiredChoices;

  requirements.text = isGrandOption && !/grand discovery/i.test(text)
    ? `Grand Discovery; ${text}`
    : text;
  return requirements;
}

function parseDiscoveries(html) {
  const captionIndex = html.indexOf("Table: Alchemist Discoveries");
  if (captionIndex === -1) throw new Error("Could not find discoveries table caption.");
  const tableStart = html.lastIndexOf("<table", captionIndex);
  const tableEnd = html.indexOf("</table>", captionIndex);
  if (tableStart === -1 || tableEnd === -1) throw new Error("Could not isolate discoveries table.");

  const rows = splitTableRows(html.slice(tableStart, tableEnd + 8));
  const discoveries = [];
  const grandDiscoveries = [];
  let section = "paizo";
  let publisher = "Paizo";

  for (const row of rows) {
    const cells = splitCells(row);
    if (!cells.length) continue;

    const allHeaders = cells.every(cell => cell.tag === "th");
    if (allHeaders) {
      const heading = cells.map(cell => cell.text).filter(Boolean).join(" ").trim();
      if (!heading || /^(Discovery|Discoveries)\s+Prerequisites\s+Benefits\s+Source$/i.test(heading)) continue;
      if (/^Paizo$/i.test(heading)) {
        section = "paizo";
        publisher = "Paizo";
      } else if (/^Grand Discoveries/i.test(heading)) {
        section = "grand";
        publisher = "Paizo";
      } else if (/^3rd Party Publishers$/i.test(heading)) {
        section = "third-party";
        publisher = "";
      } else if (section === "third-party" && cells.length === 1) {
        publisher = heading;
      }
      continue;
    }

    if (cells.length < 4 || cells[0].tag !== "td") continue;
    const name = cells[0].text.replace(/\s*\*+$/, "").trim();
    if (!name || !cells[0].href || !cells[2].text) continue;

    const isGrandOption = section === "grand";
    const option = {
      name: titleCaseWords(name),
      summary: cells[2].text,
      description: cells[2].text,
      requirements: parseRequirements(cells[1].text, isGrandOption),
      source: cells[3].text,
      sourceUrl: cells[0].href,
      publisher: publisher || (section === "third-party" ? "3rd Party Publisher" : "Paizo"),
      scrapeSource: DISCOVERIES_URL,
      scrapeConfidence: "high",
    };

    if (section === "grand") grandDiscoveries.push(option);
    else discoveries.push(option);
  }

  return { discoveries, grandDiscoveries };
}

function extractArticleDescription(html, fallback = "") {
  const contentMatch = String(html || "").match(/<div[^>]+id=["']article-content["'][^>]*>([\s\S]*?)<div class=["']article-edit-link["']/i);
  let content = contentMatch ? contentMatch[1] : "";
  if (!content) return fallback;
  content = content.replace(/<div[^>]+class=["'][^"']*section15[^"']*["'][\s\S]*$/i, " ");
  content = stripHtmlBlock(content, "breadcrumbs");
  content = stripHtmlBlock(content, "product-right");
  content = stripHtmlBlock(content, "section15");
  content = content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<h1[\s\S]*?<\/h1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = cleanText(content)
    .replace(/\s*Section 15: Copyright Notice[\s\S]*$/i, "")
    .trim();
  return text || fallback;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 PathfinderFriendsDataTool/1.0" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function enrichDescriptions(options) {
  let cursor = 0;
  let enriched = 0;
  async function worker() {
    while (cursor < options.length) {
      const index = cursor;
      cursor += 1;
      const option = options[index];
      if (!option.sourceUrl) continue;
      try {
        const html = await fetchText(option.sourceUrl);
        option.description = extractArticleDescription(html, option.description || option.summary || "");
        enriched += 1;
      } catch (error) {
        option.description = option.description || option.summary || "";
        option.scrapeWarning = `Could not fetch long description: ${error.message}`;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, options.length) }, worker));
  return enriched;
}

function updateAlchemist(classes, discoveries, grandDiscoveries) {
  const alchemist = classes.find(cls => cls.name === "Alchemist");
  if (!alchemist) throw new Error("Could not find Alchemist in split class data.");

  const discoveryPool = {
    name: "Discovery",
    description: "Alchemist discoveries selectable at 2nd level and every 2 levels thereafter. Options include the d20PFSRD discovery table, with prerequisites preserved as warnings for the character sheet.",
    requirements: {},
    options: discoveries,
    scrapeSource: DISCOVERIES_URL,
    scrapeConfidence: "high",
  };

  const grandDiscoveryPool = {
    name: "Grand Discovery",
    description: "Grand discoveries selectable through the alchemist Grand Discovery feature.",
    requirements: { minClassLevel: 20 },
    options: grandDiscoveries,
    scrapeSource: DISCOVERIES_URL,
    scrapeConfidence: "high",
  };

  let discoveryFeatures = 0;
  let grandFeatures = 0;
  for (const level of alchemist.levelProgression || []) {
    for (const feature of level.classFeatures || []) {
      if (/^Discovery$/i.test(feature.name || "")) {
        feature.pools = [JSON.parse(JSON.stringify(discoveryPool))];
        delete feature.choicePools;
        discoveryFeatures += 1;
      }
      if (/^Grand Discovery$/i.test(feature.name || "")) {
        feature.pools = [JSON.parse(JSON.stringify(grandDiscoveryPool))];
        delete feature.choicePools;
        grandFeatures += 1;
      }
    }
  }

  return { discoveryFeatures, grandFeatures };
}

async function main() {
  const html = await fetchText(DISCOVERIES_URL);
  const { discoveries, grandDiscoveries } = parseDiscoveries(html);
  if (discoveries.length < 50) throw new Error(`Parsed suspiciously few discoveries: ${discoveries.length}`);
  if (grandDiscoveries.length < 5) throw new Error(`Parsed suspiciously few grand discoveries: ${grandDiscoveries.length}`);
  const enriched = await enrichDescriptions([...discoveries, ...grandDiscoveries]);

  const classes = loadClasses();
  const counts = updateAlchemist(classes, discoveries, grandDiscoveries);
  saveClasses(classes);

  console.log(`Parsed ${discoveries.length} discoveries and ${grandDiscoveries.length} grand discoveries.`);
  console.log(`Fetched ${enriched} long discovery description(s).`);
  console.log(`Updated ${counts.discoveryFeatures} Discovery feature(s) and ${counts.grandFeatures} Grand Discovery feature(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
