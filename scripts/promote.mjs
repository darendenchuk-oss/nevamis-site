/* Promote the staging homepage (home.html, noindex) to the live one
   (index.html, indexable + Google site verification). Run after any
   home.html change has been verified:  node scripts/promote.mjs        */
import fs from 'node:fs';

let s = fs.readFileSync('home.html', 'utf8');

const ROBOTS_STAGING = /<meta name="robots" content="noindex, nofollow">[^\n]*/;
if (!ROBOTS_STAGING.test(s)) {
  console.error('home.html is missing its staging robots line — refusing to promote.');
  process.exit(1);
}
s = s.replace(ROBOTS_STAGING, '<meta name="robots" content="index, follow">');

if (!s.includes('google-site-verification')) {
  s = s.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="google-site-verification" content="vr6MDC3FTU0lnUvYzz7101_yCm6X10oStXyrIo66Arw">');
}

fs.writeFileSync('index.html', s);
console.log('index.html promoted:',
  'robots ok:', /content="index, follow"/.test(s),
  '| verification ok:', s.includes('google-site-verification'));
