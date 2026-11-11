/* ============================================================
   THE PRICE DATA THE CHECKS READ: SERVED, OR SERVED PLUS THE CATALOG.

   Owner decision #83 (2026-11-11) cut the price file nevamis.ca serves,
   pricing-config.js, to the three Front Desk sizes. The offers it hid (The
   Works, the Performance Partnership, Enterprise and the add-on catalog)
   moved to config/pricing-catalog.js, which _config.yml keeps off the site.

   loadPricing(root) is what the site serves: the data every check of what is
   SOLD or PUBLISHED must read (llms.txt, the homepage, book.html). With
   { catalog: true } it runs config/pricing-catalog.js after it in the same
   window and returns the whole priced catalog as it stood before #83: the
   data the checks of text that still DESCRIBES the hidden offers read
   (terms.html, config/elevenlabs/, docs/PROPOSAL-LINKS.md). Which one a
   check reads is the decision it encodes; say why where it is called.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const SERVED_FILE = "pricing-config.js";
export const CATALOG_FILE = "config/pricing-catalog.js";

/** window.NV_PRICING from the served file, or with the unpublished catalog
 *  run after it in the same window. Throws when either file is missing or
 *  does not evaluate, so a check never judges against nothing. */
export function loadPricing(root, { catalog = false } = {}) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, SERVED_FILE), "utf8"), sandbox, { timeout: 1000, filename: SERVED_FILE });
  if (catalog) vm.runInContext(fs.readFileSync(path.join(root, CATALOG_FILE), "utf8"), sandbox, { timeout: 1000, filename: CATALOG_FILE });
  return sandbox.window.NV_PRICING;
}
