/* ============================================================
   RENDER THE ANIMATED MARK TO A GIF.

   Playwright steps the CSS clock frame by frame and ffmpeg encodes the
   result, so the GIF is the site's own animation rather than a hand-made
   approximation of it. Re-run this whenever brand/logo-gif.html changes:

     node scripts/make-logo-gif.mjs

   WHY FRAME-STEPPING RATHER THAN SCREEN RECORDING. A recording samples
   whenever the compositor felt like it, so the loop never closes cleanly
   and the last frame is a near-duplicate of the first — which in a GIF
   shows up as a visible stutter every cycle. Seeking the animation to an
   exact time per frame gives a mathematically closed loop.

   WHY A PALETTE PASS. The mark is two greens on near-black with round
   caps. GIF's 256 colours are plenty, but ffmpeg's default palette is
   picked from one frame and then dithered, which puts visible noise in
   the flat background. palettegen over the WHOLE clip plus Bayer
   dithering keeps the background genuinely flat.
   ============================================================ */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "brand", "logo-gif.html");
const OUT_DIR = path.join(root, "brand");
const FRAMES = path.join(root, "brand", ".frames");

/* 2.4s at 25fps = 60 frames. 25 is the sweet spot for this: 30 buys no
   visible smoothness on a slow pulse and adds 20% to a file that has to
   sit in an email signature. */
const DURATION_S = 2.4;
const FPS = 25;
const FRAME_COUNT = Math.round(DURATION_S * FPS);

/* Two sizes. 256 for a signature or an avatar; 128 for clients that
   refuse to scale and for anywhere with a hard size cap. */
const SIZES = [256, 128];

function ffmpeg(args) {
  const res = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (res.status !== 0) {
    console.error(res.stderr?.split("\n").slice(-12).join("\n"));
    throw new Error(`ffmpeg failed (${res.status})`);
  }
}

async function main() {
  if (!existsSync(SRC)) throw new Error(`missing ${SRC}`);
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    /* 1 rather than 2: the source is already drawn at the encode size, so
       a device pixel ratio of 2 would render 1024 and force a downscale
       that softens the round caps. */
    deviceScaleFactor: 1,
  });
  await page.goto("file://" + SRC.replace(/\\/g, "/"), { waitUntil: "load" });

  /* Freeze, then seek. Setting animation-delay to a negative value jumps
     a paused animation to that offset — the standard trick, and the only
     one that gives an exactly reproducible frame. */
  await page.evaluate(() => document.documentElement.classList.add("frozen"));

  const stage = page.locator("#stage");
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = (i / FRAME_COUNT) * DURATION_S;
    await page.evaluate((offset) => {
      for (const id of ["dot", "arc", "ring"]) {
        const el = document.getElementById(id);
        if (el) el.style.animationDelay = `-${offset}s`;
      }
    }, t);
    await stage.screenshot({ path: path.join(FRAMES, `f${String(i).padStart(3, "0")}.png`) });
  }
  await browser.close();
  console.log(`captured ${FRAME_COUNT} frames`);

  for (const size of SIZES) {
    const out = path.join(OUT_DIR, `nevamis-mark-${size}.gif`);
    ffmpeg([
      "-y", "-framerate", String(FPS),
      "-i", path.join(FRAMES, "f%03d.png"),
      /* One palette for the whole clip, then Bayer dithering: ordered
         rather than error-diffused, because error diffusion crawls
         between frames and turns a flat background into static. */
      "-vf", `scale=${size}:${size}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`,
      "-loop", "0",
      out,
    ]);
    const kb = (statSync(out).size / 1024).toFixed(1);
    console.log(`${path.basename(out)}  ${size}x${size}  ${kb} KB`);
  }

  /* A still, for the places that refuse animation entirely — most email
     PROFILE photos, and Outlook's signature editor. Taken at the resting
     frame so it matches what the loop settles on. */
  const still = path.join(OUT_DIR, "nevamis-mark-256.png");
  ffmpeg([
    "-y", "-i", path.join(FRAMES, "f000.png"),
    "-vf", "scale=256:256:flags=lanczos", still,
  ]);
  console.log(`${path.basename(still)}  256x256  ${(statSync(still).size / 1024).toFixed(1)} KB`);

  console.log(`\nframes kept in ${path.relative(root, FRAMES)} (delete freely)`);
  console.log(`files: ${readdirSync(OUT_DIR).filter((f) => /^nevamis-mark/.test(f)).join(", ")}`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
