/* ============================================================
   THE HOMEPAGE BREADTH MODEL, AND THE ONE SEAM ITS DATA COMES THROUGH.

   Section 4 of the homepage answers "what work do you take off my plate", in
   four pillars with two or three concrete tasks under each. Every name,
   sentence, readiness word and count on that block is produced here and
   nowhere else. Two files call in:

     scripts/build-breadth.mjs   renders the model into home.html
     scripts/check-consistency.js (rule 7k) rebuilds the model and fails if
                                 the markup disagrees with it

   ONE FUNCTION, ONE INPUT, ON PURPOSE. `breadthModel(source)` takes a single
   object shaped { pillars, services } and knows nothing about where it came
   from. Today the caller reads roadmap-config.js, which is the interim source
   while the generated public-safe manifest (canonical capabilities + the
   automation registry + the roadmap, reconciled through the shared
   presentation-contract export) is still being specified. When that manifest
   lands, the ONLY thing that changes is the loader in the two callers: this
   file keeps its shape, the markup keeps its shape, and the guard keeps
   comparing markup to whatever came through the seam. Nothing here may reach
   back out to a config file, import a path, or special-case a slug, because
   any of those turn the swap into a rewrite.

   `publicSafe()` is the other half of that seam and is deliberately trivial
   today. Everything in roadmap-config.js is already published on
   /coming-soon.html, so nothing is filtered. The generated manifest WILL carry
   entries that must never reach a public surface (the automation registry's
   `platform` category, `integration.heartbeat` among them), and this is the
   single place that decision gets applied. It is a named predicate rather than
   an inline `true` so the swap has somewhere obvious to land.
   ============================================================ */

/* THE FIXED PUBLIC AVAILABILITY VOCABULARY, owner directive 2026-08-28. These
   six strings and no others may describe readiness on a public surface.

   "Live" is absent and must stay absent: it is reserved for a canonical Live
   gate that has not passed, and a marketing page borrowing the word would spend
   a claim the product has not earned. Nothing here should be softened either -
   "In development" covers both `planned` and `researching`, because the
   distinction between "we intend to build this" and "we are still working out
   whether to" is real internally and is not a distinction a buyer can act on. */
export const AVAILABILITY_WORDS = Object.freeze([
  "Available today",
  "Limited pilot",
  "In development",
  "Requires setup",
  "Requires a supported connection",
  "Not supported",
]);

/* Roadmap status -> public word. `paused` is DELIBERATELY ABSENT. There is no
   honest word in the fixed vocabulary for a service that was started and
   stopped: "In development" flatters it and "Not supported" buries it, and
   guessing either one on a public page is the kind of small dishonesty nobody
   would sign off on if asked directly. A paused service therefore fails the
   build and asks a person, which is the correct behaviour for a status no
   service currently carries. */
const WORD_BY_STATUS = Object.freeze({
  available: "Available today",
  private_pilot: "Limited pilot",
  planned: "In development",
  researching: "In development",
});

/* The visual state each word renders in. Three states are styled because three
   are reachable from the statuses that exist; the rest map onto the "not
   running" treatment, which is the safe direction for a word nobody has
   designed a chip for yet. */
const STATE_BY_WORD = Object.freeze({
  "Available today": "avail",
  "Limited pilot": "pilot",
  "In development": "dev",
  "Requires setup": "dev",
  "Requires a supported connection": "dev",
  "Not supported": "dev",
});

/* How many tasks a pillar shows before it starts counting the rest. Three is
   the owner's ceiling: the block has to communicate breadth at a glance and
   sixteen cards of equal weight communicates a catalogue instead. */
export const TASKS_SHOWN = 3;

export const availabilityWordFor = (status) => WORD_BY_STATUS[status] || null;
export const availabilityStateFor = (word) => STATE_BY_WORD[word] || "dev";

/* THE PUBLIC-SAFE FILTER. See the header: trivial today, load-bearing the day
   the generated manifest replaces roadmap-config.js as the input. */
export const publicSafe = (service) => !service.internalOnly;

/* Available first, then source order, stable. Deterministic and derived: the
   two or three tasks a pillar shows are NOT hand-picked, because a hand-picked
   set is a hand-maintained list wearing a different hat and it goes stale the
   first time a service ships. Showing what is running before what is not is
   also the honest ordering for a reader skimming one pillar. */
const rank = (services) => [
  ...services.filter((s) => s.status === "available"),
  ...services.filter((s) => s.status !== "available"),
];

/**
 * Build the section-4 breadth model from ONE source object.
 * @param {{pillars: Array, services: Array}} source
 * @returns {{pillars: Array, problems: Array<string>}}
 */
export function breadthModel(source) {
  const problems = [];
  const pillars = [];

  const declaredPillars = Array.isArray(source && source.pillars) ? source.pillars : null;
  const allServices = Array.isArray(source && source.services) ? source.services : null;
  if (!declaredPillars || !allServices) {
    return { pillars, problems: ["the breadth source carries no pillars/services array"] };
  }

  const known = new Set(declaredPillars.map((p) => p.id));
  const services = allServices.filter(publicSafe);

  for (const s of services) {
    if (!known.has(s.pillar)) {
      problems.push(`service "${s.slug}" is assigned to pillar "${s.pillar}", which is not declared. `
        + "It would vanish from the homepage without appearing anywhere else, which is the exact "
        + "failure the pillar guard exists to catch. Declare the pillar or reassign the service.");
    }
    if (!availabilityWordFor(s.status)) {
      problems.push(`service "${s.slug}" has status "${s.status}", which has no word in the fixed public `
        + `availability vocabulary (${AVAILABILITY_WORDS.join(" / ")}). Choosing one for it is an owner `
        + "decision about what a stranger is told, not something this renderer may guess.");
    }
  }
  if (problems.length) return { pillars, problems };

  for (const p of declaredPillars) {
    const mine = services.filter((s) => s.pillar === p.id);
    /* A pillar with nothing public-safe under it is legitimately absent from
       the page. A pillar WITH services that is absent is the failure the guard
       reports, and that comparison is made against this list. */
    if (!mine.length) continue;
    const ordered = rank(mine);
    const shown = ordered.slice(0, TASKS_SHOWN);
    const more = ordered.length - shown.length;
    const availableCount = mine.filter((s) => s.status === "available").length;
    pillars.push({
      id: p.id,
      name: p.name,
      line: p.line,
      total: mine.length,
      availableCount,
      /* ONE availability summary per pillar, and it is a count rather than a
         verdict. "Capture: Available today" would be true of a pillar with one
         shipped service out of nine and would read as all nine. */
      summary: `Available today: ${availableCount} of ${mine.length}`,
      more,
      moreLabel: more > 0 ? `+${more} more in ${p.name}` : null,
      tasks: shown.map((s) => {
        const word = availabilityWordFor(s.status);
        return { slug: s.slug, name: s.name, availability: word, state: availabilityStateFor(word), what: s.desc };
      }),
    });
  }

  return { pillars, problems };
}

/* ---------- rendering ----------
   Only build-breadth.mjs calls this. The guard deliberately does NOT compare
   rendered strings: it parses the page and compares FIELDS, so a whitespace
   change in this template cannot fail a build over copy that is correct, and a
   reworded sentence cannot pass because the template happened to move with it. */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Decorative, keyed by pillar id, and the one thing on this block that is not
   derived: there is no glyph in the source of truth and inventing a field for
   one would put a drawing decision inside a truth file. The guard requires one
   icon per pillar and says nothing about its shape, which is the correct split
   between what must be true and what must merely be there. */
const ICONS = {
  capture: '<path d="M4 5h16v11H8l-4 4z"/>',
  convert: '<path d="M4 17 L10 11 L14 15 L20 7"/><path d="M15 7h5v5"/>',
  operate: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  grow: '<path d="M4 20V12M10 20V7M16 20V14M22 20H2"/>',
};

const icon = (id) =>
  '<span class="pillar-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" '
  + 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">'
  + (ICONS[id] || ICONS.operate) + "</svg></span>";

export function renderBreadth(model) {
  const pillar = (p) => [
    `        <div class="pillar" data-pillar="${esc(p.id)}">`,
    `          <div class="pillar-head">${icon(p.id)}<h4 class="pillar-name">${esc(p.name)}</h4>`,
    `            <p class="pillar-line">${esc(p.line)}</p></div>`,
    `          <ul class="tasks">`,
    ...p.tasks.map((t) =>
      `            <li><strong>${esc(t.name)}</strong>`
      + `<span class="task-flag mono ${esc(t.state)}">${esc(t.availability)}</span>`
      + `<span class="task-what">${esc(t.what)}</span></li>`),
    `          </ul>`,
    `          <p class="pillar-sum">${esc(p.summary)}</p>`,
    ...(p.moreLabel ? [`          <p class="pillar-more">${esc(p.moreLabel)}</p>`] : []),
    `        </div>`,
  ].join("\n");

  return [
    `      <div class="pillars reveal" id="breadthPillars">`,
    ...model.pillars.map(pillar),
    `      </div>`,
  ].join("\n");
}
