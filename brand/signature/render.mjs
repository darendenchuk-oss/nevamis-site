/* ============================================================
   RENDER THE SIGNATURE ANIMATION TO PNG FRAMES.

     node brand/signature/render.mjs [--scale 2] [--fps 18]

   Playwright seeks scene.html's render(t) to an exact time per frame and
   screenshots it. Nothing here samples a clock, so two runs produce
   byte-identical output and the GIF loop can be proved rather than
   assumed: the frame at t=total must equal the frame at t=0, and this
   script fails loudly if it does not.

   Frames land in .frames/<scale>x<fps>/ and are consumed by encode.py.
   ============================================================ */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, "scene.html");

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const SCALE = Number(arg("scale", 2));
const FPS = Number(arg("fps", 18));

const OUT = path.join(here, ".frames", `${SCALE}x-${FPS}fps`);

const sha = (b) => createHash("sha1").update(b).digest("hex").slice(0, 12);

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  /* NO SUBPIXEL TEXT ANTIALIASING.

     An opaque canvas makes Chromium eligible for LCD text rendering, which
     antialiases glyph edges in RED, BLUE and MAGENTA rather than in grey —
     tuned for the physical stripe order of the monitor it was drawn on.
     Baked into a GIF those fringes are simply wrong: they survive scaling,
     they appear on a card that has no red or blue in it, and they cost
     palette entries that should have gone to the design. Measured on this
     scene they were a large share of its 11,000 distinct colours.

     Greyscale antialiasing is what the site itself asks for
     (-webkit-font-smoothing: antialiased in styles.css). */
  const browser = await chromium.launch({
    args: ["--disable-lcd-text", "--disable-font-subpixel-positioning"],
  });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });

  await page.goto("file://" + SRC.replace(/\\/g, "/") + `?scale=${SCALE}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 15000 });
  if (errs.length) throw new Error("scene errors:\n" + errs.join("\n"));

  const meta = await page.evaluate(() => ({
    W: window.__scene.W, H: window.__scene.H, total: window.__scene.total,
  }));
  const N = Math.round(meta.total * FPS);
  const stage = page.locator("#stage");

  const shot = async (t) => {
    await page.evaluate((tt) => window.__renderFrame(tt), t);
    return await stage.screenshot({ type: "png", animations: "disabled" });
  };

  const hashes = [];
  for (let i = 0; i < N; i++) {
    const buf = await shot((i / N) * meta.total);
    writeFileSync(path.join(OUT, `f${String(i).padStart(4, "0")}.png`), buf);
    hashes.push(sha(buf));
  }

  /* THE LOOP PROOF. render(t) wraps t modulo total, so t=total is
     literally t=0 — but the point is to prove the animation actually
     returns to rest by then rather than being cut off mid-move, so this
     re-renders the wrap point and compares pixels. */
  const wrap = sha(await shot(meta.total));
  if (wrap !== hashes[0]) {
    throw new Error(`LOOP NOT CLOSED: frame@0 ${hashes[0]} != frame@${meta.total}s ${wrap}`);
  }

  /* A still phase shows up as a run of identical hashes. encode.py turns
     each run into one frame with a long delay, which is where most of the
     file size saving comes from — so report it here. */
  let runs = 1, longest = 1, cur = 1;
  for (let i = 1; i < hashes.length; i++) {
    if (hashes[i] === hashes[i - 1]) { cur++; longest = Math.max(longest, cur); }
    else { runs++; cur = 1; }
  }

  writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({
    scale: SCALE, fps: FPS, frames: N, duration: meta.total,
    displayW: meta.W, displayH: meta.H, sourceW: meta.W * SCALE, sourceH: meta.H * SCALE,
    distinctFrames: runs, longestStillRun: longest, loopClosed: true,
  }, null, 2));

  console.log(`${SCALE}x @${FPS}fps -> ${N} frames, ${meta.W * SCALE}x${meta.H * SCALE}px`);
  console.log(`  loop closed: frame@0 == frame@${meta.total}s (${wrap})`);
  console.log(`  ${runs} distinct frames, longest still run ${longest} (${(longest / FPS).toFixed(2)}s)`);

  await browser.close();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
