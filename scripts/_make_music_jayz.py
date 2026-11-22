import wave, struct, math, os, random

random.seed(23)
base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-jayz"
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

def add_noise(amp, t0, t1, attack=0.02, release=0.05):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr; tt=t-t0; L=max(1e-6,t1-t0)
        e=1.0
        if tt<attack: e=tt/attack
        if (L-tt)<release: e=min(e,max(0.0,(L-tt)/release))
        samples[i] += (random.random()*2-1) * amp * e

# Cinematic Hip-Hop/Rock Fusion (original, CC0-style): hip-hop beat early, rock guitars enter/build at climax
bpm = 92.0
beat = 60.0/bpm

# hip-hop drums (kick/snare/hat) throughout, stronger mid-late
for b in range(int(dur/beat)+2):
    t = b*beat
    if t > dur: break
    # intensity curve
    if t < 10: inten = 0.22
    elif t < 22: inten = 0.26
    elif t < 35: inten = 0.30
    elif t < 50: inten = 0.36
    elif t < 62: inten = 0.42  # climax
    else: inten = 0.28
    # kick on 1 and 3
    if b % 4 in (0,2):
        i0=int(t*sr); i1=min(N,int((t+0.18)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            e=math.exp(-tt*18)
            f=60 + 40*math.exp(-tt*22)
            samples[i]+=math.sin(2*math.pi*f*tt)*inten*0.55*e
    # snare on 2 and 4
    if b % 4 in (1,3):
        i0=int(t*sr); i1=min(N,int((t+0.14)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            envv=math.exp(-tt*20)
            noise=(random.random()*2-1)*0.5
            tonev=math.sin(2*math.pi*190*tt)*0.4
            samples[i]+=(noise*0.6+tonev)*inten*0.35*envv
    # hats
    if t < 62 or b % 2 == 0:
        i0=int(t*sr); i1=min(N,int((t+0.04)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            envv=math.exp(-tt*60)
            samples[i]+=(random.random()*2-1)*0.18*inten*envv

# hip-hop bass/synth motif early-mid
notes_hip = [55.0, 55.0, 65.41, 49.0]  # A1 C2 G1-ish
for bar in range(0, 35):
    t0 = bar * (beat*2)
    if t0 >= 40: break
    n = notes_hip[(bar//2) % len(notes_hip)]
    amp = 0.12 if t0 < 22 else 0.15
    add_sine(n, amp, t0, min(40.0, t0+beat*1.6), attack=0.02, release=0.15)
    add_sine(n*2, amp*0.25, t0, min(40.0, t0+beat*1.2), attack=0.02, release=0.12)

# subtle keys/chords early
for t0 in range(0, 36, 4):
    tt = float(t0)
    if tt > 38: break
    amp = 0.04 if tt < 20 else 0.05
    for n in [220.0, 277.18, 329.63]:
        add_sine(n, amp, tt, tt+3.2, attack=0.08, release=0.6)

# rock guitars enter and build from ~30s, peak at Grammy/climax ~45-62s
for t0 in range(28, 66, 2):
    tt = float(t0)
    prog = clamp((tt-28)/20)
    amp = 0.03 + 0.08*prog
    if tt > 62: amp *= 0.6
    # power-chord-ish
    roots = [110.0, 98.0, 130.81, 110.0]
    r = roots[((t0-28)//4) % len(roots)]
    add_saw(r, amp*0.5, tt, tt+1.9, attack=0.03, release=0.2, filt=0.45)
    add_saw(r*1.5, amp*0.35, tt, tt+1.8, attack=0.03, release=0.2, filt=0.5)
    add_sine(r*2, amp*0.25, tt, tt+1.6, attack=0.02, release=0.2)
    # extra grit at climax
    if 40 <= tt <= 60:
        add_saw(r*2, amp*0.25, tt, tt+1.2, attack=0.02, release=0.15, filt=0.35)

# lead stab/swell at Grammy moment ~50-58s
for tt in range(50, 58):
    add_saw(440.0, 0.05, tt, tt+0.9, attack=0.04, release=0.25, filt=0.5)
    add_sine(659.25, 0.03, tt, tt+0.8, attack=0.04, release=0.25)

# light crowd noise bed in climax
add_noise(0.01, 35.0, 50.0, attack=1.0, release=1.0)
add_noise(0.018, 50.0, 64.0, attack=0.8, release=1.5)

# normalize and gentle tail
peak = max(1e-6, max(abs(s) for s in samples))
gain = 0.85 / peak
for i in range(N):
    t = i/sr
    fin = min(1.0, t/1.0)
    if t < 64: fout = 1.0
    else: fout = max(0.05, 1.0 - (t-64)/8.0)
    samples[i] = clamp(samples[i] * gain * fin * fout)

path = os.path.join(base, 'music.wav')
with wave.open(path, 'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    frames = bytearray()
    for s in samples:
        frames += struct.pack('<h', int(s * 32767))
    wf.writeframes(frames)
print('music.wav', os.path.getsize(path), dur)

# SFX: whoosh/send (envelope)
n=int(sr*0.6); out=[]
for i in range(n):
    t=i/sr
    e = math.sin(math.pi * t/0.6)
    freq = 300 + 1200*(t/0.6)
    out.append((math.sin(2*math.pi*freq*t)*0.25 + (random.random()*2-1)*0.15) * e)
with wave.open(os.path.join(base,'sfx_whoosh.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_whoosh.wav')

# crowd applause swell
n=int(sr*3.0); out=[]
for i in range(n):
    t=i/sr
    e = min(1.0, t/0.4) * min(1.0, (3.0-t)/0.8)
    noise=(random.random()*2-1)*0.6
    # some clappy texture
    clap = 0.0
    for k in range(18):
        ph = (k*0.17) % 1.0
        tt = (t*6.0 + ph) % 1.0
        clap += math.exp(-tt*10)*0.08
    out.append((noise*0.5 + clap*0.5) * e * 0.35)
with wave.open(os.path.join(base,'sfx_crowd.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_crowd.wav')

# camera flash click
n=int(sr*0.25); out=[]
for i in range(n):
    t=i/sr
    e=math.exp(-t*30)
    click=math.sin(2*math.pi*1800*t)*math.exp(-t*60)+math.sin(2*math.pi*600*t)*e
    out.append(click*0.35*e)
with wave.open(os.path.join(base,'sfx_flash.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_flash.wav')
