/* ============================================================
   BUILD THE WHOLE SIGNATURE, END TO END.

     node brand/signature/build.mjs

   render frames -> encode GIF -> optimise -> derive PNG + video masters
   -> measure everything -> write metrics.json.

   Every number quoted in README.md comes out of this script rather than
   out of anybody's memory, so the documentation cannot drift from the
   artefact it describes.
   ============================================================ */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");

const SCALE = 2, FPS = 25, COLORS = 256;
const FRAMES = path.join(here, ".frames", `${SCALE}x-${FPS}fps`);
const OUT = here;

/* ONLY THE PUBLIC LINE MAY APPEAR. This repository is public and is served
   at nevamis.ca, so a number pasted into a template by accident is
   published, not merely saved.

   This is an ALLOWLIST, and deliberately so. The obvious design — search
   for the private number and fail on a hit — requires the private number
   to be written down in the file doing the searching, in a repository
   that is world-readable. Two earlier attempts here proved how awkward
   that is: the first failed the build on its own source, because a
   scanner that spells out the string it hunts for is itself a match, and
   the second stored the digits reversed, which is not secrecy, it is one
   trivial step of obfuscation over a public number.

   Asserting that every phone-shaped string is the PUBLIC number stores no
   secret at all, and it is stronger: it rejects the private line, and any
   other number that should not have been here either. */
const PUBLIC_TEL = "+15874130035";
const PUBLIC_DIGITS = "5874130035";
const PHONE_SHAPED = /(\+?1[^0-9a-zA-Z]{0,2})?\(?\d{3}\)?[^0-9a-zA-Z]{0,3}\d{3}[^0-9a-zA-Z]{0,3}\d{4}/g;

function offendingNumbers(text) {
  const bad = [];
  for (const m of text.matchAll(PHONE_SHAPED)) {
    const digits = m[0].replace(/\D/g, "").replace(/^1/, "");
    if (digits.length === 10 && digits !== PUBLIC_DIGITS) bad.push(m[0].trim());
  }
  return bad;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd: opts.cwd || here, shell: false });
  if (r.status !== 0) {
    console.error(r.stdout || ""); console.error(r.stderr || "");
    throw new Error(`${cmd} failed (${r.status})`);
  }
  return (r.stdout || "").trim();
}
const kb = (p) => statSync(p).size / 1024;

function gifsicle() {
  /* Optional: a lossless -O3 pass is worth about 30% here. If the binary
     is not around the build still produces a correct GIF, just a larger
     one, so this degrades rather than fails. */
  const guesses = [
    path.join(root, "node_modules", "gifsicle", "vendor", "gifsicle.exe"),
    process.env.GIFSICLE,
  ].filter(Boolean);
  for (const g of guesses) if (existsSync(g)) return g;
  const scratch = process.env.CLAUDE_SCRATCH;
  if (scratch) {
    const p = path.join(scratch, "node_modules", "gifsicle", "vendor", "gifsicle.exe");
    if (existsSync(p)) return p;
  }
  return null;
}

console.log("1/5  rendering frames");
run("node", [path.join(here, "render.mjs"), "--scale", String(SCALE), "--fps", String(FPS)]);
const man = JSON.parse(readFileSync(path.join(FRAMES, "manifest.json"), "utf8"));

console.log("2/5  encoding GIF");
const rawGif = path.join(OUT, "nevamis-signature.raw.gif");
const finalGif = path.join(OUT, "nevamis-signature.gif");
console.log("     " + run("python", [path.join(here, "encode.py"), FRAMES, rawGif,
  "--colors", String(COLORS), "--method", "median"]));

const gs = gifsicle();
if (gs) {
  run(gs, ["-O3", rawGif, "-o", finalGif]);
  console.log(`     gifsicle -O3: ${kb(rawGif).toFixed(1)} -> ${kb(finalGif).toFixed(1)} KB`);
} else {
  copyFileSync(rawGif, finalGif);
  console.log("     gifsicle not found — shipping the unoptimised GIF");
}

console.log("3/5  static PNG fallback (frame 0 — already the resolved composition)");
copyFileSync(path.join(FRAMES, "f0000.png"), path.join(OUT, "nevamis-signature.png"));

console.log("4/5  video masters");
const seq = path.join(FRAMES, "f%04d.png");
run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", seq,
  "-c:v", "libx264", "-crf", "14", "-preset", "veryslow", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", path.join(OUT, "nevamis-signature-master.mp4")]);
run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", seq,
  "-c:v", "libvpx-vp9", "-crf", "18", "-b:v", "0", "-pix_fmt", "yuv420p",
  path.join(OUT, "nevamis-signature-master.webm")]);

console.log("5/5  verifying + measuring");
const probe = JSON.parse(run("ffprobe", ["-v", "quiet", "-print_format", "json",
  "-show_streams", finalGif]));
const st = probe.streams[0];

/* Runs over every text file the build can publish. The rendered assets are
   generated from scene.html, which is itself scanned, so a number cannot
   reach the pixels without first passing through a file checked here —
   and a number burnt into pixels would not be greppable anyway. */
const publishable = readdirSync(OUT).filter((f) =>
  /\.(html|txt|md|json|mjs|py)$/.test(f));
for (const f of publishable) {
  const bad = offendingNumbers(readFileSync(path.join(OUT, f), "utf8"));
  if (bad.length) {
    throw new Error(`NON-PUBLIC PHONE NUMBER IN ${f}: ${bad.join(", ")} — refusing to build`);
  }
}
const sigHtml = path.join(OUT, "signature.html");
if (existsSync(sigHtml)) {
  const h = readFileSync(sigHtml, "utf8");
  if (!h.includes(`tel:${PUBLIC_TEL}`)) throw new Error("signature.html lost the public tel: link");
  if (!h.includes("https://nevamis.ca")) throw new Error("signature.html lost the site link");
}

const metrics = {
  builtFrom: "brand/signature/scene.html",
  concept: "the line picks up — four channels arrive out of sync, sync on the Nevamis node, one action leaves",
  gif: {
    file: "nevamis-signature.gif",
    bytes: statSync(finalGif).size,
    kb: +kb(finalGif).toFixed(1),
    sourceWidth: st.width, sourceHeight: st.height,
    displayWidth: man.displayW, displayHeight: man.displayH,
    retina: `${SCALE}x`,
    framesInFile: Number(st.nb_frames) || man.distinctFrames,
    framesRendered: man.frames,
    fps: FPS,
    loopSeconds: man.duration,
    palette: `${COLORS} colours, ${"median-cut with the brand vocabulary reserved"}`,
    dither: "none",
    loops: "forever",
    loopClosed: man.loopClosed,
  },
  stillness: {
    longestHeldFrameSeconds: +(man.longestStillRun / man.fps).toFixed(2),
    distinctFrames: man.distinctFrames,
  },
  phoneNumbers: "public Ava line only — verified by allowlist over every text file",
};
writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify(metrics, null, 2) + "\n");

console.log("");
console.log(`   GIF        ${metrics.gif.kb} KB   ${st.width}x${st.height} shown at ` +
            `${man.displayW}x${man.displayH}   ${metrics.gif.framesInFile} frames   ` +
            `${man.duration}s   loops forever`);
console.log(`   masters    mp4 ${kb(path.join(OUT, "nevamis-signature-master.mp4")).toFixed(0)} KB, ` +
            `webm ${kb(path.join(OUT, "nevamis-signature-master.webm")).toFixed(0)} KB`);
console.log(`   privacy    every phone number in all ${publishable.length} text files is the public Ava line`);
