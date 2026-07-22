// Local preview only: `node serve.js` then open http://localhost:3211
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".css": "text/css", ".js": "text/javascript" };

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.normalize(path.join(root, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, "index.html");
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  })
  .listen(3211, "127.0.0.1", () => console.log("nevamis preview: http://localhost:3211"));
