// Reads an agent's WhatsApp post ("CLASSY Selfcon at Talba... 500k🔥 ✅POP...")
// and guesses the listing fields. Plain rules, no AI: Rhema checks the
// form afterwards, so a wrong guess costs one tap, a missed one costs nothing.
import type { Amenity } from "./amenities";
import type { Campus, RoomType } from "./options";
import { ROOM_TYPES } from "./options";

export type ParsedPost = {
  title?: string;
  roomType?: RoomType;
  campus?: Campus;
  area?: string;
  price?: number;
  agentFee?: number;
  cautionFee?: number;
  feesNote?: string;
  amenities: Amenity[];
  description?: string;
  agentId?: string;
  phone?: string; // WhatsApp number found in the post, as 2348031234567
  noPrice: boolean; // "DM for price"
};

const AMENITY_WORDS: [RegExp, Amenity][] = [
  [/running water|borehole|bore ?water|water supply/i, "running_water"],
  [/\bwc\b|toilet|bathroom/i, "toilet_inside"],
  [/kitchen/i, "kitchen"],
  [/prepaid|meter/i, "prepaid_meter"],
  [/transformer/i, "own_transformer"],
  [/fence|gate/i, "fenced"],
  [/security/i, "security"],
  [/tile/i, "tiled"],
  [/\bpop\b/i, "pop_ceiling"],
  [/wardrobe/i, "wardrobe"],
  [/heater/i, "water_heater"],
];

const NOT_AN_AREA = /^(immediately|once|town|gk|gidan kwano|bosso|minna|fut|futminna|school|campus|the school|niger state)$/i;

// Strips WhatsApp bold/italic marks and emoji, keeps letters, digits, ₦ and punctuation.
function clean(s: string): string {
  return s
    .replace(/[*_~]/g, "")
    .replace(/[^\p{L}\p{N}₦.,:&/()'+\- ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "340k" → 340000, "1.2m" → 1200000, "₦250,000" → 250000, "3k" → 3000.
function moneyIn(line: string): number[] {
  const out: number[] = [];
  const re = /₦?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m|million)?\b/gi;
  for (const m of line.matchAll(re)) {
    let n = Number(m[1].replace(/,/g, ""));
    const unit = (m[2] ?? "").toLowerCase();
    if (unit === "k") n *= 1000;
    else if (unit === "m" || unit === "million") n *= 1_000_000;
    else if (n < 1000) continue; // "7 months", "phase 3"
    if (n >= 1000) out.push(Math.round(n));
  }
  return out;
}

function niceCase(word: string): string {
  if (/^[A-Z]{2,4}$/.test(word) || /^[a-z]{2,3}$/.test(word) && /^(kff|gk|ume|nnpc)$/i.test(word)) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function sentence(s: string): string {
  const words = s.split(" ").map((w) => (/^[A-Z]{2,4}$/.test(w) ? w : w.toLowerCase()));
  const out = words.join(" ");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function findArea(text: string, knownAreas: string[]): string | undefined {
  const lower = text.toLowerCase();
  // An area already used on the site wins, so spellings stay the same.
  const known = [...knownAreas].sort((a, b) => b.length - a.length).find((a) => {
    const base = a.toLowerCase().replace(/\s+road$/, "");
    return base.length > 2 && new RegExp(`\\b${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower);
  });
  if (known) return known;

  const flat = text.replace(/[*_~]/g, "");
  const patterns = [
    /📍\s*([^,\n.]+)/u,
    /@\s*([A-Za-z][A-Za-z ]{1,25}?)(?=\s+for\b|[,.\n]|\s*$)/,
    /\b(?:along|at|in|around|behind|opposite|close to|near)\s+([A-Za-z][A-Za-z ]{1,25}?(?:\s+road)?)(?=\s+(?:for|now|area|with)\b|[,.\n!🔥]|\s*$)/iu,
  ];
  for (const re of patterns) {
    for (const m of flat.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))) {
      const raw = clean(m[1]).replace(/\s+(available|now)$/i, "");
      if (!raw || NOT_AN_AREA.test(raw) || raw.split(" ").length > 4) continue;
      return raw.split(" ").map(niceCase).join(" ");
    }
  }
  return undefined;
}

export function parsePost(
  text: string,
  opts: { knownAreas?: string[]; agents?: { id: string; name: string; whatsapp?: string }[] } = {},
): ParsedPost {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const result: ParsedPost = { amenities: [], noPrice: false };

  // Room type: most specific first. "Single room selfcon" is a self-contain.
  if (/room ?mate|roommate|shared|\bshare\b/i.test(lower)) result.roomType = "shared";
  else if (/room (?:and|&|n) ?parlou?r|room\s*&\s*parlou?r|r\s*&\s*p\b/i.test(lower)) result.roomType = "room_parlour";
  else if (/\bflat\b|\d\s*bed ?room|apartment|duplex|bungalow/i.test(lower)) result.roomType = "flat";
  else if (/self[\s-]?con|selfcon|self[\s-]?contain/i.test(lower)) result.roomType = "self_contain";
  else if (/single room|\bsingle\b/i.test(lower)) result.roomType = "single_room";

  if (/gidan kwano|\bgk\b|\btalba\b/i.test(lower)) result.campus = "gidan_kwano";
  else if (/\bbosso\b/i.test(lower)) result.campus = "bosso";

  result.area = findArea(text, opts.knownAreas ?? []);

  // Money: fee lines feed the fee fields, everything else is rent.
  const rents: number[] = [];
  const notes: string[] = [];
  const PHONE = /(?:\+?234|0)\s*[789][01]\d[\s-]?\d{3}[\s-]?\d{4}/g;
  for (const line of lines) {
    const amounts = moneyIn(line.replace(PHONE, " "));
    const l = line.toLowerCase();
    if (/inspection/.test(l)) {
      if (amounts[0]) notes.push(`Inspection fee ₦${amounts[0].toLocaleString("en-NG")}`);
      continue;
    }
    if (/agen(?:t|cy)\s*(?:fee)?|commission/.test(l) && amounts[0]) {
      result.agentFee = amounts[0];
      continue;
    }
    if (/caution/.test(l) && amounts[0]) {
      result.cautionFee = amounts[0];
      continue;
    }
    if (/legal|damage|service charge/.test(l) && amounts[0]) {
      notes.push(clean(line));
      continue;
    }
    rents.push(...amounts);
  }
  if (rents.length) {
    // The figure repeated most (agents repeat the price), else the biggest.
    const count = new Map<number, number>();
    rents.forEach((r) => count.set(r, (count.get(r) ?? 0) + 1));
    result.price = [...count.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  }
  result.noPrice = !result.price || /dm for price|call for price|price on request/i.test(lower);
  if (result.noPrice) result.price = undefined;

  if (/total package|all inclusive|all-inclusive/i.test(lower)) notes.unshift("Total package (fees included)");
  const months = lower.match(/for\s+(\d{1,2})\s*months?/);
  if (months) notes.unshift(`Price is for ${months[1]} months`);
  if (notes.length) result.feesNote = notes.join(" · ");

  // Ticked lines: known ones become amenity ticks, the rest the description.
  const extras: string[] = [];
  const amenities = new Set<Amenity>();
  for (const line of lines) {
    const ticked = /^[✅✔☑️✓\-•]/u.test(line);
    if (!ticked && !/move in|immediately|available from/i.test(line)) continue;
    const item = clean(line);
    if (!item || moneyIn(item).length) continue;
    const hits = AMENITY_WORDS.filter(([re]) => re.test(item)).map(([, a]) => a);
    hits.forEach((a) => amenities.add(a));
    if (/move in|immediately/i.test(item)) extras.unshift("Move in immediately");
    else if (/burglary/i.test(item)) extras.push("Burglary-proof windows");
    else if (!hits.length || /spacious|heater and|cabinet/i.test(item)) extras.push(sentence(item));
  }
  result.amenities = [...amenities];
  if (extras.length) result.description = [...new Set(extras)].join(". ") + ".";

  // A phone number in the post: matches an agent we have, or is a new one.
  const phoneMatch = text.match(/(?:\+?234|0)\s*[789][01]\d[\s-]?\d{3}[\s-]?\d{4}/);
  if (phoneMatch) {
    let digits = phoneMatch[0].replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "234" + digits.slice(1);
    result.phone = digits;
    const byPhone = (opts.agents ?? []).find((a) => a.whatsapp === digits);
    if (byPhone) result.agentId = byPhone.id;
  }

  // Agent: a name (or first word of it) mentioned in the post.
  for (const a of result.agentId ? [] : (opts.agents ?? [])) {
    const first = a.name.trim().split(/\s+/)[0]?.toLowerCase();
    if (lower.includes(a.name.toLowerCase()) || (first && first.length > 3 && new RegExp(`\\b${first}\\b`).test(lower))) {
      result.agentId = a.id;
      break;
    }
  }

  // Title: "Classy self-contain on Talba Road" / "Self-contain near GK".
  const headline = lines.slice(0, 2).join(" ").toLowerCase();
  const adjective = headline.match(/\b(classy|clean|soft|luxury|spacious|executive|newly built|brand new|cozy|cosy)\b/)?.[1];
  const type = result.roomType ? ROOM_TYPES[result.roomType].toLowerCase() : "room";
  const where = result.area
    ? `${/road$/i.test(result.area) ? "on" : "in"} ${result.area}`
    : result.campus
      ? `near ${result.campus === "bosso" ? "Bosso" : "GK"}`
      : "";
  const base = [adjective, type, where].filter(Boolean).join(" ");
  result.title = base.charAt(0).toUpperCase() + base.slice(1);

  return result;
}
