import wave, struct, math, os, random

random.seed(17)
base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-crawling"
os.makedirs(base, exist_ok=True)

sr = 44100
dur = 72.0
N = int(sr * dur)

def clamp(x, a=-1.0, b=1.0):
    return max(a, min(b, x))

samples = [0.0] * N

def add_sine(freq, amp, t0, t1, attack=0.01, release=0.08):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr
        tt = t - t0
        L = max(1e-6, t1 - t0)
        e = 1.0
        if tt < attack: e = tt/attack
        if (L-tt) < release: e = min(e, max(0.0, (L-tt)/release))
        samples[i] += math.sin(2*math.pi*freq*t) * amp * e

def add_saw(freq, amp, t0, t1, attack=0.02, release=0.12, filt=0.55):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr
        tt = t - t0; L = max(1e-6, t1 - t0)
        e = 1.0
        if tt < attack: e = tt/attack
        if (L-tt) < release: e = min(e, max(0.0, (L-tt)/release))
        v = 0.0
        for h in range(1, 10):
            v += ((-1)**(h+1)) * math.sin(2*math.pi*freq*h*t) / h
        v = v * (2/math.pi)
        v = (1-filt)*v + filt*math.sin(2*math.pi*freq*t)
        samples[i] += v * amp * e

def add_noise(amp, t0, t1, attack=0.05, release=0.1):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr; tt=t-t0; L=max(1e-6,t1-t0)
        e=1.0
        if tt<attack: e=tt/attack
        if (L-tt)<release: e=min(e,max(0.0,(L-tt)/release))
        samples[i] += (random.random()*2-1) * amp * e

# Dark cinematic / emotional ambient: somber intro, slow build, emotional swell, then recede to near silence at end
# D minor-ish pad
pad_notes = [146.83, 174.61, 220.0, 174.61]  # D3 F3 A3
for bar in range(0, int(dur)+1):
    t0 = bar * 1.0
    if t0 >= dur: break
    if t0 < 18: intens = 0.18
    elif t0 < 30: intens = 0.22
    elif t0 < 42: intens = 0.26
    elif t0 < 50: intens = 0.30  # emotional peak
    elif t0 < 58: intens = 0.18  # recede
    else: intens = 0.08          # near silence
    n = pad_notes[bar % len(pad_notes)]
    add_sine(n, intens*0.28, t0, min(dur, t0+1.6), attack=0.08, release=0.5)
    add_sine(n*2, intens*0.10, t0, min(dur, t0+1.2), attack=0.08, release=0.4)
    if bar % 2 == 0:
        add_sine(73.42 if t0 < 50 else 87.31, intens*0.22, t0, min(dur, t0+2.2), attack=0.15, release=0.8)

# slow pulse/heartbeat subtle
for t in [i*2.0 for i in range(0, 30)]:
    if t < 58:
        amp = 0.05 if t < 18 else 0.07 if t < 42 else 0.05 if t < 50 else 0.03
        i0=int(t*sr); i1=min(N,int((t+0.25)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            e=math.exp(-tt*10)
            f=55 + 25*math.exp(-tt*18)
            samples[i]+=math.sin(2*math.pi*f*tt)*amp*e

# emotional swell (30-50s) strings-like
for tt in range(30, 52, 2):
    notes = [220.0, 261.63, 329.63] if tt < 42 else [233.08, 293.66, 349.23]
    amp = 0.05 if tt < 42 else 0.07
    for n in notes:
        add_saw(n, amp*0.45, tt, min(dur, tt+2.2), attack=0.25, release=0.6, filt=0.7)
        add_sine(n, amp*0.25, tt, min(dur, tt+2.0), attack=0.2, release=0.6)

# subtle shimmer in mid section
for k in range(int(18*2), int(50*2)):
    t = k/2.0
    if k % 3 == 0:
        add_sine(440.0 if t < 35 else 523.25, 0.012, t, t+0.18, attack=0.02, release=0.12)

# airy noise bed low, fade out to near silence
add_noise(0.012, 0.0, 20.0, attack=1.5, release=1.0)
add_noise(0.015, 20.0, 45.0, attack=1.0, release=1.0)
add_noise(0.010, 45.0, 58.0, attack=0.5, release=2.0)

# normalize and master fade out to near silence at end (respectful silence)
peak = max(1e-6, max(abs(s) for s in samples))
gain = 0.85 / peak
for i in range(N):
    t = i/sr
    fin = min(1.0, t/1.2)
    # strong fade toward end: near silence after ~60s
    if t < 55: fout = 1.0
    elif t < 62: fout = 1.0 - 0.85 * ((t-55)/7.0)
    else: fout = 0.15 * max(0.0, 1.0 - (t-62)/10.0)
    samples[i] = clamp(samples[i] * gain * fin * fout)

path = os.path.join(base, 'music.wav')
with wave.open(path, 'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    frames = bytearray()
    for s in samples:
        frames += struct.pack('<h', int(s * 32767))
    wf.writeframes(frames)
print('music.wav', os.path.getsize(path), dur)

# --- SFX ---
# deep breath at start ~1.8s
n=int(sr*1.8); out=[]
for i in range(n):
    t=i/sr
    envv = math.sin(math.pi * t/1.8)**1.1
    noise=(random.random()*2-1)*0.5
    low = math.sin(2*math.pi*90*t)*0.15
    out.append((noise*0.6+low)*envv*0.22)
with wave.open(os.path.join(base,'sfx_breath.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_breath.wav')

# subtle studio hiss 6s
n=int(sr*6.0); out=[]
for i in range(n):
    t=i/sr
    envv = min(1.0, t/0.5) * min(1.0, (6.0-t)/1.0)
    noise=(random.random()*2-1)*0.25
    out.append(noise*envv*0.12)
with wave.open(os.path.join(base,'sfx_hiss.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_hiss.wav')
