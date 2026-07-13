const { loadClasses, saveClasses } = require("./class-file-store");
const INDEX_URL = "https://www.d20pfsrd.com/classes/core-classes/barbarian/rage-powers/";

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013/g, "-")
    .replace(/&#8217;|&#x2019;|\u2019/g, "'")
    .replace(/&#8220;|&#x201C;|\u201C/g, '"')
    .replace(/&#8221;|&#x201D;|\u201D/g, '"')
    .replace(/&frac12;|Ã‚Â½/g, "1/2")
    .replace(/&frac14;|Ã‚Â¼/g, "1/4")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value = "") {
  return decodeEntities(String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " "));
}

function cleanRulesText(value = "") {
  return decodeEntities(value)
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseFeatureName(value = "") {
  return String(value || "")
    .trim()
    .replace(/(^|[^A-Za-z])([A-Za-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/'([A-Z])/g, (match, letter) => `'${letter.toLowerCase()}`)
    .replace(/(\d)D(\d)/g, "$1d$2")
    .replace(/\bSu\b/g, "Su")
    .replace(/\bEx\b/g, "Ex")
    .replace(/\bSp\b/g, "Sp");
}

function slug(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "PathFriends rage power scraper" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function extractRows(html) {
  const tableStart = html.indexOf("Table: Rage Powers");
  const tableEnd = html.indexOf("</table>", tableStart);
  const tableHtml = tableStart >= 0 && tableEnd > tableStart ? html.slice(tableStart, tableEnd) : html;
  const rows = [];
  for (const rowMatch of tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...rowMatch[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(match => match[1]);
    if (cells.length < 4) continue;
    const firstLink = cells[0].match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!firstLink) continue;
    const url = decodeEntities(firstLink[1]);
    if (!/\/rage-powers\//i.test(url) || /\/rage-powers\/?$/i.test(url)) continue;
    rows.push({
      name: titleCaseFeatureName(stripHtml(firstLink[2])),
      sourceUrl: url,
      prerequisites: stripHtml(cells[1]).replace(/^[-—]+$/, ""),
      summary: stripHtml(cells[2]),
      source: stripHtml(cells[3])
    });
  }
  const seen = new Set();
  return rows.filter(row => {
    const key = slug(row.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractDetailDescription(html, fallback = "") {
  const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (!h1) return fallback;
  const start = h1.index + h1[0].length;
  const section15 = html.indexOf('<div class="section15"', start);
  const comments = html.indexOf("Leave a Reply", start);
  const endCandidates = [section15, comments].filter(index => index > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : Math.min(html.length, start + 8000);
  const text = stripHtml(html.slice(start, end))
    .replace(/^Benefit\s*:\s*/i, "Benefit: ")
    .replace(/\s*Section 15:.*$/i, "")
    .trim();
  return text || fallback;
}

function requirementsFromPrerequisites(prerequisites = "", description = "") {
  const requirements = {};
  const combined = `${prerequisites} ${description}`;
  const levelMatch = combined.match(/\b(?:barbarian|skald|bloodrager)\s+(\d+)\b/i)
    || combined.match(/\b(\d+)(?:st|nd|rd|th)?\s+level\b/i);
  if (levelMatch) requirements.minClassLevel = Number(levelMatch[1]);
  const raceMatch = prerequisites.match(/\b(half-orc|dwarf|elf|gnome|halfling|human|drow|orc|tiefling|aasimar|gillman|kitsune|tengu|vanara)\b/i);
  if (raceMatch) requirements.race = titleCaseFeatureName(raceMatch[1]);
  const requiredChoices = [];
  const cleaned = prerequisites
    .replace(/\b(?:barbarian|skald|bloodrager)\s+\d+\b/ig, "")
    .replace(/\b(?:half-orc|dwarf|elf|gnome|halfling|human|drow|orc|tiefling|aasimar|gillman|kitsune|tengu|vanara)\b/ig, "")
    .replace(/\brage power(?:s)?\b/ig, "")
    .replace(/[.;]/g, ",");
  cleaned.split(",").map(part => part.trim()).filter(Boolean).forEach(part => {
    if (/^[-—]+$/.test(part)) return;
    if (/natural bite attack|class feature|feat|must|trained|skill|rage|bloodrage/i.test(part)) return;
    if (part.length > 3 && part.length < 60) requiredChoices.push(titleCaseFeatureName(part));
  });
  if (requiredChoices.length) requirements.requiredChoices = [...new Set(requiredChoices)];
  const textParts = [];
  if (prerequisites && !/^[-—]+$/.test(prerequisites)) textParts.push(prerequisites);
  const skaldRestriction = description.match(/A skald[^.]+(?:standard action|rounds of rage|select|trained)[^.]*\./i)
    || description.match(/if skald[\s\S]*?(?=Benefit|\.|$)/i)
    || description.match(/a skald can't[^.]+\./i);
  if (skaldRestriction) textParts.push(skaldRestriction[0]);
  const standardActionRestriction = description.match(/(?:standard action|rounds of rage)[^.]*\./i);
  if (standardActionRestriction && !textParts.some(text => text.includes(standardActionRestriction[0]))) {
    textParts.push(standardActionRestriction[0]);
  }
  if (textParts.length) requirements.text = cleanRulesText([...new Set(textParts)].join(" "));
  return requirements;
}

async function scrapeRagePowers() {
  const indexHtml = await fetchText(INDEX_URL);
  const rows = extractRows(indexHtml);
  const options = [];
  for (const [index, row] of rows.entries()) {
    process.stdout.write(`\rFetching rage power ${index + 1}/${rows.length}: ${row.name}`.padEnd(100));
    let description = row.summary;
    try {
      const detailHtml = await fetchText(row.sourceUrl);
      description = extractDetailDescription(detailHtml, row.summary);
    } catch (error) {
      console.warn(`\nCould not fetch detail for ${row.name}: ${error.message}`);
    }
    options.push({
      name: row.name,
      summary: row.summary,
      description,
      requirements: requirementsFromPrerequisites(row.prerequisites, description),
      source: row.source,
      sourceUrl: row.sourceUrl,
      scrapeSource: INDEX_URL,
      scrapeConfidence: "high"
    });
  }
  process.stdout.write("\n");
  return options;
}

function ragePowerPool(options, className) {
  const isSkald = className === "Skald";
  return {
    name: "Rage Power",
    description: isSkald
      ? "Skald rage powers selectable at 3rd level and every 3 levels thereafter. Skald level counts as barbarian level for prerequisites; powers that require a standard action or spending rage rounds are shown with warnings."
      : "Barbarian rage powers selectable at 2nd level and every 2 levels thereafter.",
    requirements: {},
    options,
    scrapeSource: INDEX_URL,
    scrapeConfidence: "high"
  };
}

function mergeIntoClasses(classes, options) {
  let attached = 0;
  for (const cls of classes) {
    if (!["Barbarian", "Skald"].includes(cls.name)) continue;
    for (const level of cls.levelProgression || []) {
      for (const feature of level.classFeatures || []) {
        if (!feature || typeof feature === "string") continue;
        if (!/^rage power/i.test(feature.name || "")) continue;
        feature.pools = [ragePowerPool(options, cls.name)];
        delete feature.choicePools;
        attached += 1;
      }
    }
  }
  return attached;
}

async function main() {
  const classes = loadClasses();
  const options = await scrapeRagePowers();
  const attached = mergeIntoClasses(classes, options);
  saveClasses(classes);
  console.log(`Saved ${options.length} rage powers and attached pool to ${attached} class feature entries.`);
  console.log("Note: base Bloodrager has Bloodrage and bloodline powers, but no Rage Power class-feature choice slots.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
