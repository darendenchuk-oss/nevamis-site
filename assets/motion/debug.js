/* ============================================================
   NEVAMIS MOTION INSPECTOR  (?motionDebug=1 only)
   Play/pause, restart, scrub, speed, jump-to-beat, and a
   reduced-motion simulation toggle. Never rendered in the
   normal production view.
   ============================================================ */

import { MOTION } from './tokens.js';

const CSS = `
.nv-dbg{position:fixed;left:16px;bottom:16px;z-index:10000;width:min(420px,calc(100vw - 32px));
  background:rgba(6,14,20,.94);border:1px solid rgba(159,240,206,.22);border-radius:12px;
  padding:12px 14px;color:#EAF3EE;font:12px/1.4 "Spline Sans Mono",ui-monospace,monospace;
  backdrop-filter:blur(8px);box-shadow:0 18px 50px -20px rgba(0,0,0,.8)}
.nv-dbg h4{font:600 10.5px/1 "Spline Sans Mono",monospace;letter-spacing:.18em;text-transform:uppercase;
  color:#9FF0CE;margin:0 0 10px}
.nv-dbg .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.nv-dbg button{font:inherit;cursor:pointer;color:#EAF3EE;background:rgba(159,240,206,.08);
  border:1px solid rgba(159,240,206,.25);border-radius:7px;padding:5px 9px;transition:background .15s}
.nv-dbg button:hover{background:rgba(159,240,206,.18)}
.nv-dbg button.on{background:#9FF0CE;color:#04120C;border-color:#9FF0CE;font-weight:700}
.nv-dbg input[type=range]{flex:1;min-width:140px;accent-color:#2FBF8F}
.nv-dbg .t{color:#9FF0CE;min-width:96px;text-align:right;font-variant-numeric:tabular-nums}
.nv-dbg .beats{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
.nv-dbg .beats button{text-align:left;font-size:11px}
.nv-dbg .hint{color:#8AA5A0;font-size:10.5px;margin-top:8px;line-height:1.5}
`;

export function initDebug(tl) {
  if (!tl) return;
  const gsap = window.gsap;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.className = 'nv-dbg';
  // Not aria-hidden: it holds real controls, and hiding focusable content from
  // the accessibility tree is an anti-pattern. It simply never renders in
  // the production view.
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Motion inspector (development only)');

  const h = document.createElement('h4');
  h.textContent = 'Motion inspector';
  box.appendChild(h);

  // transport row
  const row1 = div('row');
  const playBtn = btn('❚❚ pause');
  const restartBtn = btn('↻ restart');
  const time = document.createElement('span');
  time.className = 't';
  row1.append(playBtn, restartBtn, time);
  box.appendChild(row1);

  // scrubber
  const row2 = div('row');
  const scrub = document.createElement('input');
  scrub.type = 'range';
  scrub.min = '0'; scrub.max = '1000'; scrub.value = '0'; scrub.step = '1';
  scrub.setAttribute('aria-label', 'Timeline position');
  row2.appendChild(scrub);
  box.appendChild(row2);

  // speed
  const row3 = div('row');
  row3.appendChild(label('speed'));
  const speeds = [0.25, 0.5, 1].map((s) => {
    const b = btn(s + '×');
    b.addEventListener('click', () => {
      tl.timeScale(s);
      speeds.forEach((o) => o.classList.toggle('on', o === b));
    });
    if (s === 1) b.classList.add('on');
    row3.appendChild(b);
    return b;
  });
  box.appendChild(row3);

  // beats
  const beats = div('beats');
  MOTION.beats.forEach((b) => {
    const bb = btn(b.time.toFixed(1) + 's  ' + b.label);
    bb.addEventListener('click', () => { tl.pause(Math.min(b.time, tl.duration())); sync(); });
    beats.appendChild(bb);
  });
  box.appendChild(beats);

  // reduced-motion simulation
  const row4 = div('row');
  row4.style.marginTop = '9px';
  const rmBtn = btn('simulate reduced motion');
  const params = new URLSearchParams(location.search);
  if (params.get('reduce') === '1') rmBtn.classList.add('on');
  rmBtn.addEventListener('click', () => {
    const p = new URLSearchParams(location.search);
    if (p.get('reduce') === '1') p.delete('reduce'); else p.set('reduce', '1');
    p.set('motionDebug', '1');
    location.search = p.toString();
  });
  row4.appendChild(rmBtn);
  box.appendChild(row4);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Dev only, never shown in the normal view. Drop ?motionDebug=1 to see the real page.';
  box.appendChild(hint);

  document.body.appendChild(box);

  // ---- wiring ----
  let scrubbing = false;

  playBtn.addEventListener('click', () => {
    if (tl.paused()) { tl.play(); } else { tl.pause(); }
    sync();
  });
  restartBtn.addEventListener('click', () => { tl.restart(); sync(); });

  scrub.addEventListener('input', () => {
    scrubbing = true;
    tl.pause();
    tl.progress(Number(scrub.value) / 1000);
    sync();
  });
  scrub.addEventListener('change', () => { scrubbing = false; });

  function sync() {
    playBtn.textContent = tl.paused() ? '▶ play' : '❚❚ pause';
    const t = tl.time(), d = tl.duration();
    time.textContent = t.toFixed(2) + 's / ' + d.toFixed(2) + 's';
    if (!scrubbing) scrub.value = String(Math.round(tl.progress() * 1000));
  }

  gsap.ticker.add(sync);
  sync();
}

function div(cls) { const n = document.createElement('div'); n.className = cls; return n; }
function btn(text) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; return b; }
function label(text) { const s = document.createElement('span'); s.textContent = text; s.style.color = '#8AA5A0'; return s; }
