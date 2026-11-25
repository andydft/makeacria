"""Simple retro 16-bit style SFX + chiptune bed for Goku Moto Reels."""
import math, os, wave, struct, random
random.seed(7)
OUT = os.path.join("public", "goku-moto-reels")
SR = 22050

def write_wav(name, samples):
    path = os.path.join(OUT, name)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        for s in samples:
            s = max(-1, min(1, s))
            wf.writeframes(struct.pack('<h', int(s * 32767)))
    print(name, len(samples)/SR)

def env(i, n, a=0.01, d=0.05):
    t = i / SR
    dur = n / SR
    if t < a: return t / a
    if t > dur - d: return max(0, (dur - t) / d)
    return 1.0

def tone(freq, dur, vol=0.3, shape='square'):
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        ph = (t * freq) % 1.0
        if shape == 'square': v = 0.8 if ph < 0.5 else -0.8
        elif shape == 'tri': v = 4*abs(ph-0.5)-1
        elif shape == 'noise': v = random.uniform(-1,1)
        else: v = math.sin(2*math.pi*freq*t)
        out.append(v * vol * env(i, n))
    return out

def mix(*tracks):
    n = max(len(t) for t in tracks)
    out = [0.0]*n
    for t in tracks:
        for i, v in enumerate(t):
            out[i] += v
    m = max(1e-6, max(abs(v) for v in out))
    if m > 1: out = [v/m for v in out]
    return out

def pad(samples, start_s):
    pad_n = int(SR * start_s)
    return [0.0]*pad_n + samples

def chiptune_bed(duration=40.0):
    # simple looping arpeggio + bass, low volume
    notes = [262,330,392,523,392,330]  # C major arpeggio
    bass = [131,131,165,165,196,196]
    n = int(SR*duration)
    out=[0.0]*n
    step = 0.18
    for i in range(n):
        t=i/SR
        idx=int(t/step)
        freq = notes[idx % len(notes)]
        bfreq = bass[(idx//4) % len(bass)]
        ph=(t*freq)%1.0
        lead = 0.12*(0.7 if ph<0.5 else -0.7)
        pb=(t*bfreq)%1.0
        b = 0.08*(0.6 if pb<0.5 else -0.6)
        # light hat
        h = 0.02*random.uniform(-1,1) if (idx%2==0 and (t%step)<0.02) else 0
        out[i]=(lead+b+h)*0.35
    # fade in/out
    for i in range(min(int(SR*1.0),n)):
        out[i]*=i/(SR*1.0)
    for i in range(min(int(SR*1.5),n)):
        out[n-1-i]*=i/(SR*1.5)
    return out

def sfx_touch():
    return tone(880,0.05,0.25,'square') + tone(660,0.05,0.2,'square')

def sfx_motor():
    n=int(SR*1.8)
    out=[]
    for i in range(n):
        t=i/SR
        f=90+60*math.sin(t*18)+40*t
        ph=(t*f)%1.0
        v=(0.7 if ph<0.5 else -0.7)*0.25
        v+=random.uniform(-0.05,0.05)
        out.append(v*env(i,n,0.05,0.3))
    return out

def sfx_horn():
    a=tone(440,0.18,0.22,'square'); b=tone(554,0.18,0.20,'square')
    return mix(a,b) + [0]*int(SR*0.08) + mix(tone(440,0.18,0.2,'square'),tone(554,0.18,0.18,'square'))

def sfx_scare():
    return tone(1200,0.06,0.2,'square')+tone(900,0.08,0.2,'square')+tone(600,0.12,0.18,'square')

os.makedirs(OUT, exist_ok=True)
write_wav('bgm.wav', chiptune_bed(40.0))
write_wav('sfx-touch.wav', sfx_touch())
write_wav('sfx-motor.wav', sfx_motor())
write_wav('sfx-horn.wav', sfx_horn())
write_wav('sfx-scare.wav', sfx_scare())
