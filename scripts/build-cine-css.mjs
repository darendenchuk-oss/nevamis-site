/* Inline assets/cinematic/cine-stage.css into home.html, then promote.
   Run:  node scripts/build-cine-css.mjs      (npm run cine:css)

   One command, because doing only the first half leaves index.html, the page
   the public actually loads, carrying last week's stage layout while home.html
   looks correct. scripts/check-cinematic-home.mjs fails when they disagree. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cineCssBlock, applyCineCss, LINK_CINE } from './lib/inline-cine-css.mjs';
import { promoteHtml } from './promote.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, 'home.html');
const cssPath = path.join(root, 'assets/cinematic/cine-stage.css');

const block = cineCssBlock(fs.readFileSync(cssPath, 'utf8'));
const before = fs.readFileSync(homePath, 'utf8');
const after = applyCineCss(before, block);

if (after === null) {
  console.error('ERROR: home.html has neither a generated:cine-css region nor '
    + `the ${LINK_CINE} it replaced. Refusing to write a homepage with no stage layout.`);
  process.exit(1);
}

const eol = (s) => s.replace(/\r\n/g, '\n');
if (eol(after) !== eol(before)) {
  fs.writeFileSync(homePath, after);
  console.log('home.html: cine-stage.css inlined');
} else {
  console.log('home.html: cine-stage.css region already current');
}

const promoted = promoteHtml(after);
if (!promoted.ok) {
  console.error(promoted.error + ' - home.html was written but index.html was NOT promoted.');
  process.exit(1);
}
const indexPath = path.join(root, 'index.html');
const liveBefore = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
if (eol(liveBefore) !== eol(promoted.html)) {
  fs.writeFileSync(indexPath, promoted.html);
  console.log('index.html: promoted');
} else {
  console.log('index.html: already current');
}
