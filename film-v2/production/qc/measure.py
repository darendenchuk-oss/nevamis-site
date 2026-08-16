import subprocess, sys, os, math
from PIL import Image
import colorsys

def sample(path, tag, fps=4):
    out = f"qc/_m_{tag}"
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(os.path.join(out,f))
    subprocess.run(['ffmpeg','-v','error','-i',path,'-vf',f'fps={fps},scale=192:108',
                    '-y',f'{out}/%04d.png'], check=True)
    files = sorted(os.listdir(out))
    rows=[]
    for i,fn in enumerate(files):
        im = Image.open(os.path.join(out,fn)).convert('RGB')
        px = list(im.getdata())
        n=len(px)
        lum = sum(0.2126*r+0.7152*g+0.0722*b for r,g,b in px)/n
        sat = sum(colorsys.rgb_to_hsv(r/255,g/255,b/255)[1] for r,g,b in px)/n
        rows.append((i/fps, lum, sat*100))
    return rows

def report(rows, name, segs):
    print(f"\n### {name}  ({rows[-1][0]:.1f}s sampled)")
    print(f"{'segment':>14} | {'mean lum':>8} | {'mean sat%':>9}")
    for a,b,label in segs:
        sel=[r for r in rows if a<=r[0]<b]
        if not sel: continue
        print(f"{label:>14} | {sum(r[1] for r in sel)/len(sel):8.1f} | {sum(r[2] for r in sel)/len(sel):9.1f}")
    # biggest single luminance jump
    d=[(rows[i][0], rows[i][1]-rows[i-1][1]) for i in range(1,len(rows))]
    big=max(d,key=lambda x:abs(x[1]))
    print(f"  largest luminance step: {big[1]:+.1f} at {big[0]:.2f}s")
    print(f"  luminance range across film: {min(r[1] for r in rows):.1f} .. {max(r[1] for r in rows):.1f}")

ref = sample(r'C:/Users/daren/Downloads/Sentient-Desk-reference-clean.mp4','ref')
report(ref,'REFERENCE Sentient Desk',[(0,14,'0-14s'),(14,20,'14-20s'),(20,34,'20-34s'),(34,99,'34-end')])

ours = sample('NEVAMIS-V2-PROOF-10s.mp4','ours')
report(ours,'OURS NEVAMIS V2',[(0,3.5,'0-3.5s'),(3.5,5,'3.5-5s'),(5,8,'5-8s'),(8,99,'8-end')])
