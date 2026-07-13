const { loadClasses, saveClasses, CLASS_DIR } = require("./class-file-store");
const BASE_URL = "https://www.d20pfsrd.com";

const POOL_FEATURE_PATTERNS = [
  /discover(y|ies)/i,
  /rage power/i,
  /rogue talent/i,
  /advanced talent/i,
  /hex/i,
  /arcana/i,
  /mercy/i,
  /revelation/i,
  /deed/i,
  /exploit/i,
  /investigator talent/i,
  /slayer talent/i,
  /vigilante talent/i,
  /wild talent/i,
  /ki power/i,
  /social talent/i,
  /combat trick/i
];

function absoluteUrl(url) {
  if (/^https?:/i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "PathFriends feature pool scraper" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;|\u2014/g, "-")
    .replace(/&ndash;|&#8211;|&#x2013;|\u2013/g, "-")
    .replace(/&frac12;|Â½/g, "1/2")
    .replace(/&frac14;|Â¼/g, "1/4")
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

function titleCaseFeatureName(value) {
  return String(value || "")
    .trim()
    .replace(/(^|[^A-Za-z])([A-Za-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/(\d)D(\d)/g, "$1d$2");
}

function extractHeadingSections(html) {
  const sections = [];
  const pattern = /<h([2-5])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[2-5][^>]*>|$)/gi;
  for (const match of html.matchAll(pattern)) {
    sections.push({
      level: Number(match[1]),
      title: decodeEntities(match[2]).replace(/\s*\([^)]*\)\s*$/, "").trim(),
      rawTitle: decodeEntities(match[2]).trim(),
      body: decodeEntities(match[3]).slice(0, 1800),
      rawBody: match[3]
    });
  }
  return sections.filter(section => section.title && section.title.length <= 90);
}

function requirementText(text = "") {
  const sentences = String(text)
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => /prerequisite|requires?|must|minimum|level|race|racial|selected|choose|before/i.test(sentence));
  return sentences.slice(0, 2).join(" ").trim();
}

function requirementsFromText(text = "") {
  const req = {};
  const levelMatch = String(text).match(/(?:minimum|at least|requires?|must be|level)\s+(?:\w+\s+){0,4}?(\d+)(?:st|nd|rd|th)?\s+level/i)
    || String(text).match(/(\d+)(?:st|nd|rd|th)?\s+level/i);
  if (levelMatch) req.minClassLevel = Number(levelMatch[1]);
  const reqText = requirementText(text);
  if (reqText) req.text = reqText;
  return req;
}

function looksLikePoolFeature(name = "") {
  return POOL_FEATURE_PATTERNS.some(pattern => pattern.test(name));
}

function matchingSectionsForPool(poolName, sections) {
  const poolSlug = slug(poolName.replace(/s$/i, ""));
  return sections.filter(section => {
    const title = slug(section.title);
    if (title === poolSlug) return false;
    if (title.includes(poolSlug) && title !== poolSlug) return true;
    return false;
  });
}

function candidateOptionsAfterPool(featureName, sections) {
  const poolIndex = sections.findIndex(section => slug(section.title) === slug(featureName.replace(/\s*\([^)]*\)\s*$/, "")));
  if (poolIndex < 0) return [];
  const poolLevel = sections[poolIndex].level;
  const options = [];
  for (let i = poolIndex + 1; i < sections.length; i += 1) {
    const section = sections[i];
    if (section.level <= poolLevel) break;
    if (section.level > poolLevel + 2) continue;
    if (!section.body || section.body.length < 20) continue;
    if (/table:|class skills|weapon and armor proficiency/i.test(section.title)) continue;
    options.push(section);
    if (options.length >= 160) break;
  }
  return options;
}

function mergePoolsForClass(cls, sections) {
  let added = 0;
  for (const level of cls.levelProgression || []) {
    for (const feature of level.classFeatures || []) {
      if (!feature || typeof feature === "string") continue;
      if (!looksLikePoolFeature(feature.name)) continue;
      const existing = Array.isArray(feature.pools) ? feature.pools : [];
      if (existing.length) continue;
      let optionSections = candidateOptionsAfterPool(feature.name, sections);
      if (!optionSections.length) optionSections = matchingSectionsForPool(feature.name, sections);
      const options = optionSections
        .map(section => ({
          name: titleCaseFeatureName(section.title),
          description: section.body,
          requirements: requirementsFromText(section.body),
          scrapeConfidence: "medium"
        }))
        .filter((option, index, list) => option.name && list.findIndex(item => slug(item.name) === slug(option.name)) === index);
      if (!options.length) continue;
      feature.pools = [{
        name: titleCaseFeatureName(feature.name),
        description: feature.description || "",
        requirements: requirementsFromText(feature.description || ""),
        options,
        scrapeSource: cls.sourceUrl,
        scrapeConfidence: optionSections.length > 5 ? "medium" : "low"
      }];
      added += 1;
    }
  }
  return added;
}

async function main() {
  const classes = loadClasses();
  let poolCount = 0;
  for (const cls of classes) {
    if (!cls.sourceUrl) continue;
    if (!(cls.levelProgression || []).some(level => (level.classFeatures || []).some(feature => feature && typeof feature === "object" && looksLikePoolFeature(feature.name)))) continue;
    try {
      console.log(`Scraping pools for ${cls.name}`);
      const html = await fetchText(absoluteUrl(cls.sourceUrl));
      const sections = extractHeadingSections(html);
      poolCount += mergePoolsForClass(cls, sections);
    } catch (error) {
      console.warn(`Failed ${cls.name}: ${error.message}`);
    }
  }
  saveClasses(classes);
  console.log(`Merged ${poolCount} feature pool(s) into ${CLASS_DIR}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
