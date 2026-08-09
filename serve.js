// Local preview only: `node serve.js` then open http://localhost:3211
// Another port: `node serve.js 3222` or NV_PORT=3222.
//
// GZIPS TEXT RESPONSES, because GitHub Pages does and a preview server that
// does not is a measurement trap rather than a convenience. Uncompressed, this
// server sent site.css as 41,904 bytes where production sends 11,251 — 3.7x —
// and a throttled-mobile LCP measured here read 4,216 ms against production's
// 2,468 ms. Every performance conclusion drawn from the old behaviour was
// pessimistic by roughly the compression ratio, and the one that mattered
// (which fonts to preload) was chosen against contention that production does
// not have.
//
// Fonts and images are already compressed formats and are sent as-is; gzipping
// them again costs CPU and gains nothing, which is also what Pages does.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || process.env.NV_PORT || 3211);
const types = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".css": "text/css", ".js": "text/javascript" };

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.normalize(path.join(root, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, "index.html");
    }
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = { "Content-Type": types[ext] || "application/octet-stream" };

    // Text formats compress; woff2/webp/png/mp3 are already compressed.
    const compressible = [".html", ".css", ".js", ".svg", ".json", ".txt", ".xml"].includes(ext);
    const accepts = String(req.headers["accept-encoding"] || "").includes("gzip");
    if (compressible && accepts) {
      const gz = zlib.gzipSync(body);
      res.writeHead(200, { ...headers, "Content-Encoding": "gzip", "Content-Length": gz.length });
      res.end(gz);
      return;
    }
    res.writeHead(200, { ...headers, "Content-Length": body.length });
    res.end(body);
  })
  /* Port is overridable so two checkouts can be served at once. Without it,
     a second worktree's test run finds port 3211 already answering, reuses it,
     and silently tests the FIRST checkout: a booking fix measured as absent and
     three pricing tests failing against a tree the runner never touched. */
  .listen(PORT, "127.0.0.1", () => console.log("nevamis preview: http://localhost:" + PORT));
