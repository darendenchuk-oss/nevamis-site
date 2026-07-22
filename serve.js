// Local preview only: `node serve.js` then open http://localhost:3211
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
http
  .createServer((req, res) => {
    const html = fs.readFileSync(path.join(root, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  })
  .listen(3211, "127.0.0.1", () => console.log("nevamis preview: http://localhost:3211"));
