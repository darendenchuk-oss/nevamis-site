/* ============================================================
   ONE STATUS PER ROADMAP ITEM, ON EVERY PAGE THAT CHIPS IT (BD-F4)

   roadmap-config.js is the site's mirror of the engine's canonical record for
   what exists, and coming-soon.html renders each entry with the label for its
   status. Other pages carry their own status chips, typed into the markup: the
   homepage's station documentation and section eyebrows, and the module cards
   on revenue-engine.html. Nothing compared them, and by 2026-09-26 the Inbox
   Assistant carried three statuses at once ("In development" on the homepage,
   BEING RESEARCHED on the Roadmap, "Coming soon" on the revenue page), the
   Daily Brief read "In development" against a "planned" entry, and the Review
   Engine, available and sold, had no chip at all.

   The rule: a chip that belongs to a roadmap entry must read the label the
   Roadmap shows for that entry's status (or the entry's own statusLabel, which
   the Roadmap shows instead). The labels are read out of coming-soon.html's
   renderer, not typed here, so a relabelled status moves every page with it.

   Pure functions, no file system: check-consistency.js feeds them the pages
   and runs the fixture table below before it trusts them.
   ============================================================ */

/* Words a page may use for a status beyond the Roadmap's own label. One entry,
   and only because it is the older of the two spellings: the homepage has said
   "Available today" since it was written and the Roadmap says AVAILABLE NOW,
   and both are true of an available entry. Nothing else may widen a status. */
export const STATUS_SYNONYMS = { available: ["available today"] };

const norm = (s) => String(s).replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim().toLowerCase();

/** The status -> label map from coming-soon.html's renderer
 *  (`var statusLabel = { available: "AVAILABLE NOW", ... }`), or null. */
export function statusLabelsFrom(comingSoonHtml) {
  const m = /var\s+statusLabel\s*=\s*(\{[^}]*\})/.exec(comingSoonHtml);
  if (!m) return null;
  const out = {};
  for (const p of m[1].matchAll(/([a-z_]+)\s*:\s*"([^"]*)"/g)) out[p[1]] = p[2];
  return Object.keys(out).length ? out : null;
}

/** The names a page may call an entry by: its name, and its name without a
 *  leading "AI " or "Your " ("Front Desk" for "AI Front Desk"). Derived, so a
 *  renamed entry needs nothing here. */
function namesOf(service) {
  const n = norm(service.name);
  return [...new Set([n, n.replace(/^(?:ai|your) /, "")])];
}

/** What each chip on a page is attached to: the heading it sits in, the
 *  heading straight after it (a card that leads with its chip), or the words
 *  after it up to the next tag (a run of "chip name chip name"). */
export function chipsOf(page) {
  /* Comments and scripts are not what a reader sees; a chip a script builds
     is judged where its data comes from. */
  const html = String(page).replace(/<!--[\s\S]*?-->/g, " ").replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  const out = [];
  const re = /<span class="chip\b([^"]*)">([^<]*)<\/span>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    /* A heading that holds a chip is short, so the last few hundred
       characters are enough to find the one it sits in, if any. */
    const before = html.slice(Math.max(0, m.index - 600), m.index);
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 600);
    const opens = [...before.matchAll(/<h[1-6]\b[^>]*>/g)];
    const last = opens[opens.length - 1];
    let subject = "";
    if (last && !/<\/h[1-6]>/.test(before.slice(last.index))) subject = before.slice(last.index + last[0].length);
    else {
      const next = /^\s*<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/.exec(after);
      subject = next ? next[1] : (/^([^<]*)/.exec(after) || ["", ""])[1];
    }
    out.push({ chip: m[2].trim(), cls: m[1].trim().split(/\s+/), subject: norm(subject), at: m.index });
  }
  return out;
}

/** Every chip on the page that names a roadmap entry and does not read that
 *  entry's label. Returns [{ chip, name, status, want }]. */
export function chipFindings(html, services, labels) {
  const bad = [];
  for (const c of chipsOf(html)) {
    /* .chip.rec is the plan badge (RECOMMENDED), a recommendation and not a
       status, so it is not the Roadmap's to decide. */
    if (!c.subject || c.cls.includes("rec")) continue;
    for (const s of services) {
      const hit = namesOf(s).some((n) => new RegExp("(^|[^a-z0-9-])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9-])").test(c.subject));
      if (!hit) continue;
      const want = s.statusLabel ? [norm(s.statusLabel)]
        : [labels[s.status], ...(STATUS_SYNONYMS[s.status] || [])].filter(Boolean).map(norm);
      if (!want.includes(norm(c.chip))) bad.push({ chip: c.chip, name: s.name, status: s.status, want, at: c.at });
    }
  }
  return bad;
}

/* The judge's own fixtures. check-consistency.js runs these first and fails
   if any is misjudged, so a guard that has stopped firing says so. */
export const CHIP_FIXTURES = {
  services: [
    { name: "Inbox Assistant", status: "researching" },
    { name: "AI Front Desk", status: "available" },
    { name: "Revenue Engine", status: "planned", statusLabel: "IN DEVELOPMENT" },
    { name: "Review Engine", status: "available" },
  ],
  labels: { available: "AVAILABLE NOW", planned: "PLANNED", researching: "BEING RESEARCHED" },
  mustFail: [
    ["a researching item chipped as in development, the finding verbatim",
      '<h4>Inbox Assistant <span class="chip dev">In development</span></h4>'],
    ["a card that leads with its chip, the revenue page's shape",
      '<div class="card"><span class="chip dev">Coming soon</span><h3>Inbox Assistant</h3>'],
    ["a statusLabel entry chipped with its bare status",
      '<h4>Revenue Engine <span class="chip dev">Planned</span></h4>'],
    ["a short name, and an available item said to be coming",
      '<p class="cardfoot"><span class="chip dev">In development</span> Front Desk</p>'],
  ],
  mustPass: [
    ["the Roadmap's own label", '<h4>Inbox Assistant <span class="chip dev">Being researched</span></h4>'],
    ["the homepage's older word for available", '<h4>Review Engine <span class="chip av">Available today</span></h4>'],
    ["a statusLabel", '<div class="card"><span class="chip dev">In development</span><h3>Revenue Engine</h3>'],
    ["a chip that names no roadmap entry", '<p class="k">PLANS <span class="chip av">Published prices</span></p>'],
    ["the recommendation badge is not a status", '<h4>AI Front Desk <span class="chip rec">RECOMMENDED</span></h4>'],
    ["Review is not Revenue",'<h4>Review Engine <span class="chip av">Available now</span></h4>'],
  ],
};
