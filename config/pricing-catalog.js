/* ============================================================
   THE OFFERS NEVAMIS NO LONGER SELLS TO NEW CLIENTS: NOT PUBLISHED.

   Owner decision #83 (2026-11-11), "Front Desk only everywhere": every
   surface a prospect or a new client sees sells only the three Front Desk
   sizes. The Works, the Performance Partnership, Enterprise and the
   automation add-on catalog stay BUILT (the engine keeps them in
   src/domain/canonical.ts, and a client who already holds one keeps it), but
   the price file nevamis.ca serves, pricing-config.js, no longer carries
   them. They live here instead.

   config/ is excluded in _config.yml, so this file is never served. It is
   read only by the checks, through scripts/lib/pricing-catalog.mjs
   (loadPricing(root, { catalog: true })), which runs pricing-config.js and
   then this file in the same window. The result is the whole priced catalog
   as it stood before #83, so the checks that judge text still describing
   these offers hold that text to their figures:
     - terms.html (counsel's text, which still names The Works, the
       Partnership's fee, Enterprise and the add-ons; scripts/check-legal-truth.mjs
       and guard 7t of scripts/check-consistency.js);
     - config/elevenlabs/, the agent documents (guard 7q);
     - docs/PROPOSAL-LINKS.md (the proposal-link guard).
   Every check of what is SOLD or PUBLISHED (llms.txt, the homepage's price
   list and structured data, book.html) reads the served file alone, and
   guard 7v of scripts/check-consistency.js refuses any of the names below in
   the served file.

   TO SELL ONE AGAIN: move its record from here into pricing-config.js
   (plans or addOns, the fields in the same order), add its key to SOLD_NOW in
   the engine's canonical.ts in the same train, and delete it here; guard 7v
   refuses a key that is in both files. The figures mirror canonical as of
   #83. The engine's cross-repo check reads only the served file, so it does
   not compare this one: change canonical and this file together.
   ============================================================ */
(function () {
  var P = window.NV_PRICING;
  if (!P || !Array.isArray(P.plans)) {
    throw new Error("config/pricing-catalog.js runs after pricing-config.js, in the same window");
  }
  /* The front-desk lines every plan carried, read off the AI Front Desk so
     they are written once: its features are "One business phone line" and
     then these. */
  var desk = P.plans.filter(function (p) { return p.id === "pro"; })[0];
  var EVERY_PLAN = desk ? desk.features.filter(function (f) { return f !== "One business phone line"; }) : [];

  /* Enterprise is quoted per client, so it is not a plans[] entry.
     `launchFrom` is a floor ("starting at"), never a price. */
  P.enterprise = {
    name: "Enterprise",
    launchFrom: 5000,
    note: "Multi-location, custom integrations, custom data pipelines and advanced deployments are quoted per client, from what a scan of the business finds. The recurring amount and any performance component are quoted per client."
  };

  /* The add-on catalog. Every automation is its own sale. `soldAlone: true`
     means it may be bought with nothing beside it; `sellable: false` means it
     may be described as coming and never sold, with no Buy control.
     `launch` is 0 on every module, and `freeMonths` mirrors canonical.
     Order is the order the retired pricing page listed them in. */
  P.addOns = (P.addOns || []).concat([
    /* `partnership` is what this item costs on the Performance Partnership.
       Bought on its own, or beside any other plan, it is its own figure. */
    {
      id: "quote_chase", name: "Quote-Chase Engine",
      monthly: 500, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
      partnership: { launch: 0, monthly: 0, attributableTo: "a quote Nevamis recovered" },
      blurb: "Every estimate that goes quiet gets followed up: the day it stales, day four, day eleven, each touch approved by you."
    },
    {
      id: "missed_call_recovery", name: "Missed-Call Recovery",
      monthly: 350, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
      blurb: "A caller you missed gets one text back, between 8 a.m. and 8 p.m. your time, every day, with your name on it and a working opt-out."
    },
    {
      id: "get_paid", name: "Get-Paid Autopilot",
      monthly: 500, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
      blurb: "Overdue invoices get a gentle nudge, a firm one a week later, and at three weeks you get told instead, because past that point the judgment call belongs to a person."
    },
    {
      id: "review_engine", name: "Review Engine",
      monthly: 300, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
      blurb: "Post-job review requests by text, policy-safe: one ask per finished job, with your own review link, and every request released by a person."
    },
    /* Listed as coming. It carries no price and is never sold. */
    {
      id: "seo_rankings", name: "Search Rankings",
      monthly: 0, launch: 0, freeMonths: 0, sellable: false, soldAlone: false,
      blurb: "Better search rankings for the work you want more of. Not built yet."
    },
    {
      id: "reactivation", name: "Customer Reactivation",
      perCampaign: 2000, launch: 0, freeMonths: 0, sellable: false, soldAlone: false,
      blurb: "A win-back campaign over your own past-customer list, inside the consent rules. Not sellable until it ships end to end."
    }
  ]);

  /* What an item costs on the Performance Partnership, derived as the
     engine's partnershipTerms() derives it: an add-on with no `partnership`
     block is charged its own figures there. Null for an id the catalog does
     not have, rather than a plausible-looking zero. */
  P.partnershipTerms = function (id) {
    var a = (this.addOns || []).filter(function (x) { return x.id === id; })[0];
    if (!a) return null;
    if (a.partnership) {
      return { launch: a.partnership.launch, monthly: a.partnership.monthly,
               attributableTo: a.partnership.attributableTo };
    }
    return { launch: a.launch || 0, monthly: a.monthly || 0, attributableTo: null };
  };

  /* The fee-aware sentence the served file's startLine() is the fee-free
     case of. A plan's or an add-on's figures as the one approved sentence:
       a Launch & Implementation fee:  "<fee> Launch & Implementation to
                                        start, then <monthly> a month,
                                        <performanceNote>."
       no fee:                         "<monthly> a month."
     It gives the served sentence for every Front Desk size. */
  P.startLine = function (pl) {
    var lp = this.launchPart(pl);
    return (lp ? lp + ", then " : "") + this.money(pl.monthly) + " a month"
      + this.monthlyBand(pl) + (pl.performanceNote ? ", " + pl.performanceNote : "") + ".";
  };
  /* The fee half of startLine(): "<fee> Launch & Implementation to start",
     with "From" in front when the plan has `launchRange`. Empty for an item
     whose fee is 0: a zero fee is no figure, and it is never printed. */
  P.launchPart = function (pl) {
    if (!(pl.launch > 0)) return "";
    return (Array.isArray(pl.launchRange) ? "From " : "") + this.money(pl.launch)
      + " Launch & Implementation to start";
  };
  /* What follows the monthly figure of a plan with `monthlyRange`: that it
     is the default inside the band, and the band's two ends. Empty for a
     plan without one, which is every plan since the Partnership's figures
     were fixed. */
  P.monthlyBand = function (pl) {
    return Array.isArray(pl.monthlyRange)
      ? " by default, inside a monthly band of " + this.money(pl.monthlyRange[0])
        + " to " + this.money(pl.monthlyRange[1])
      : "";
  };
  /* The lowest and highest monthly a plan may be agreed at: its band where
     it has `monthlyRange`, otherwise its one published monthly at both
     ends. The retired proposal page honoured an agreed ?quote= only inside
     these. */
  P.monthlyBounds = function (pl) {
    return Array.isArray(pl.monthlyRange) ? [pl.monthlyRange[0], pl.monthlyRange[1]] : [pl.monthly, pl.monthly];
  };
  /* The one plan that carries a Launch & Implementation fee, in one line,
     with Enterprise's floor beside it. Empty when no plan carries one. */
  P.partnerNote = function () {
    var self = this;
    var pl = (this.plans || []).filter(function (p) { return p.launch > 0; });
    if (pl.length !== 1) return pl.map(function (p) { return p.name + ": " + self.launchPart(p) + "."; }).join(" ");
    var ent = this.enterprise && this.enterprise.launchFrom
      ? " " + this.enterprise.name + " is quoted per client, its Launch & Implementation starting at " + this.money(this.enterprise.launchFrom) + "."
      : "";
    return "The " + pl[0].name + " is the one published plan with a Launch & Implementation fee: " + this.launchPart(pl[0]) + "."
      + (pl[0].inviteNote ? " " + pl[0].inviteNote : "") + ent;
  };

  /* The two plans, in the order the price file carried them before #83:
     first, ahead of the three sizes. `starter` is the Partnership's key and
     `growth` The Works', as in canonical; stored subscriptions and links
     carry them. */
  P.plans = [
    {
      /* By invitation. `selfServe: false`: never presented as the default,
         and checkout refuses it without an approval. */
      id: "starter", name: "Performance Partnership",
      monthly: 350, launch: 5000, freeMonths: 0, includedMinutes: 250,
      callRange: "80 to 125 typical calls", overage: 1.10,
      selfServe: false,
      performanceNote: "plus an agreed share of collected revenue directly attributable to a business Nevamis found or a quote Nevamis recovered, set in your agreement before anything is charged",
      inviteNote: "Offered by invitation and approval.",
      bestFor: "A partnership we offer by invitation, where Nevamis takes on substantially more of the acquisition risk. It is the plan that carries the growth stack: the Quote-Chase Engine, Missed-Call Recovery, Get-Paid Autopilot and Review Engine are each a separate item you choose. Its Launch & Implementation fee and its monthly are fixed; what the items you choose change is the agreed share and the monthly of each item you add. Not suitable for every business, and never the default.",
      features: [
        "One business phone line",
        "The growth stack, each item added on its own: the Quote-Chase Engine, paid on this plan's agreed-share terms, and Missed-Call Recovery, Get-Paid Autopilot and Review Engine, each at its own listed monthly. Search Rankings is coming and is not sold."
      ].concat(EVERY_PLAN)
    },
    {
      id: "growth", name: "The Works",
      monthly: 2100, launch: 0, freeMonths: 1, includedMinutes: 1400,
      callRange: "470 to 700 typical calls", overage: 0.75,
      /* The bundle: every sellable automation included, as a flag so no
         reader has to know which key means "the bundle". */
      includesAutomations: true,
      selfServe: true,
      performanceNote: null,
      bestFor: "The whole engine: the AI Front Desk plus every sellable automation, priced under the sum of its parts.",
      features: [
        "Everything in the AI Front Desk",
        "Missed-Call Recovery: one text back to a caller you missed, between 8 a.m. and 8 p.m. your time, every day, with your name on it and a working opt-out",
        "Quote-Chase Engine: follow-up on every quiet estimate: day it stales, day 4, day 11, each touch approved by you",
        "Get-Paid Autopilot: overdue-invoice reminders, with the owner told at three weeks instead of a third email",
        "Review Engine: post-job review requests by text, one ask per finished job, with every request released by a person",
        "One business phone line"
      ].concat(EVERY_PLAN)
    }
  ].concat(P.plans);
})();
