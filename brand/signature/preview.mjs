/* ============================================================
   RENDER THE SIGNATURE THE WAY REAL CLIENTS WILL.

     node brand/signature/preview.mjs

   Builds .out/preview-*.png for light, dark, two phone widths, images
   blocked, and Outlook's first-frame-only behaviour.

   The markup is READ OUT OF signature.html rather than copied into this
   file, so a preview can never show something the user is not actually
   pasting. Only two things are rewritten: the absolute image URL becomes
   a local path (the asset is not deployed yet), and the animated GIF is
   swapped for the static PNG in the Outlook case, which is precisely what
   those clients do.
   ============================================================ */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, ".out");
mkdirSync(OUT, { recursive: true });

const raw = readFileSync(path.join(here, "signature.html"), "utf8");
const m = raw.match(/PASTE FROM HERE =+ -->([\s\S]*?)<!-- =+ PASTE TO HERE/);
if (!m) throw new Error("could not find the paste markers in signature.html");
const SIG = m[1].trim();

/* The preview pages are written into .out/, one level below the assets. */
const local = (s, file) =>
  s.replace(/https:\/\/nevamis\.ca\/brand\/signature\/nevamis-signature\.gif/g, "../" + file);

/* A signature is never seen alone — it is seen under the last line of an
   email, which is the only way to judge whether it is too heavy. */
const CASES = [
  { name: "light", w: 720, bg: "#ffffff", fg: "#202124",
    label: "Gmail / Apple Mail — light", img: "nevamis-signature.gif" },
  { name: "dark", w: 720, bg: "#202124", fg: "#e8eaed",
    label: "Gmail — dark mode", img: "nevamis-signature.gif" },
  { name: "applemail-dark", w: 720, bg: "#1e1e1e", fg: "#dddddd",
    label: "Apple Mail — dark mode", img: "nevamis-signature.gif" },
  { name: "mobile-375", w: 375, bg: "#ffffff", fg: "#202124",
    label: "iPhone — 375px", img: "nevamis-signature.gif" },
  { name: "mobile-320", w: 320, bg: "#ffffff", fg: "#202124",
    label: "narrowest phone — 320px", img: "nevamis-signature.gif" },
  { name: "outlook-firstframe", w: 720, bg: "#ffffff", fg: "#202124",
    label: "Outlook — animation frozen on frame 1", img: "nevamis-signature.png" },
  { name: "images-blocked", w: 720, bg: "#ffffff", fg: "#202124",
    label: "images blocked", img: "__blocked__.gif" },
];

const page = (c) => `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:${c.bg}; color:${c.fg};
         font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .frame { padding:22px 20px 26px; }
  .tag { font:11px/1 ui-monospace,Menlo,Consolas,monospace; letter-spacing:.09em;
         text-transform:uppercase; opacity:.45; margin-bottom:16px; }
  .body { margin-bottom:22px; }
  .rule { height:1px; background:currentColor; opacity:.12; margin:0 0 18px; }
</style>
<div class="frame">
  <div class="tag">${c.label} &middot; ${c.w}px</div>
  <div class="body">Thanks — I'll send the pilot details over this afternoon.<br>Will</div>
  <div class="rule"></div>
  ${local(SIG, c.img)}
</div>`;

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
for (const c of CASES) {
  const p = await browser.newPage({ viewport: { width: c.w, height: 420 }, deviceScaleFactor: 2 });
  const html = page(c);
  writeFileSync(path.join(OUT, `preview-${c.name}.html`), html);
  await p.goto("file://" + path.join(OUT, `preview-${c.name}.html`).replace(/\\/g, "/"));
  await p.waitForTimeout(350);
  await p.locator(".frame").screenshot({ path: path.join(OUT, `preview-${c.name}.png`) });
  await p.close();
  console.log(`  preview-${c.name}.png`);
}
await browser.close();
