import wave, struct, math, os, random

random.seed(11)
base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-anthem"
os.makedirs(base, exist_ok=True)

sr = 44100
dur = 74.0
N = int(sr * dur)

def clamp(x, a=-1.0, b=1.0):
    return max(a, min(b, x))

def env(t, a, d=0.0, s=1.0, r=0.0, length=None):
    # simple attack/decay/sustain/release over note length
    if length is None:
        length = d + s + r
    if t < 0: return 0.0
    if t < a: return t / max(1e-6, a)
    t -= a
    if t < d: return 1.0 - (1.0 - s) * (t / max(1e-6, d))
    t -= d
    sustain_dur = max(0.0, length - a - d - r)
    if t < sustain_dur: return s
    t -= sustain_dur
    if r > 0 and t < r: return s * (1.0 - t / r)
    return 0.0

samples = [0.0] * N

# Helpers
def add_sine(freq, amp, t0, t1, attack=0.01, release=0.05, pan=0.0):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr
        tt = t - t0
        L = t1 - t0
        e = 1.0
        if tt < attack: e = tt/attack
        elif (L-tt) < release: e = max(0.0, (L-tt)/release)
        v = math.sin(2*math.pi*freq*t) * amp * e
        samples[i] += v

def add_saw(freq, amp, t0, t1, attack=0.01, release=0.08, filt=0.5):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr
        tt = t - t0; L = t1 - t0
        e = 1.0
        if tt < attack: e = tt/attack
        elif (L-tt) < release: e = max(0.0, (L-tt)/release)
        # naive saw via harmonics
        v = 0.0
        hmax = 12
        for h in range(1, hmax+1):
            v += ((-1)**(h+1)) * math.sin(2*math.pi*freq*h*t) / h
        v = v * (2/math.pi)
        # soften
        v = (1-filt)*v + filt*math.sin(2*math.pi*freq*t)
        samples[i] += v * amp * e

def add_noise(amp, t0, t1, attack=0.01, release=0.05):
    i0 = max(0, int(t0*sr)); i1 = min(N, int(t1*sr))
    for i in range(i0, i1):
        t = i/sr; tt=t-t0; L=t1-t0
        e=1.0
        if tt<attack: e=tt/attack
        elif (L-tt)<release: e=max(0.0,(L-tt)/release)
        samples[i] += (random.random()*2-1) * amp * e

# Structure (seconds): 0-12 tension intro, 12-25 tension build, 25-38 drive, 38-55 climax/anthem, 55-65 emotional resolve, 65-74 outro
# Pad/piano motif (melancholic) - simple repeating minor figure
piano_notes = [220.0, 261.63, 329.63, 261.63]  # Am-ish arpeggio A3 C4 E4
for bar in range(0, 74):
    base_t = bar * 1.0
    intens = 0.0
    if base_t < 12: intens = 0.18
    elif base_t < 25: intens = 0.22
    elif base_t < 38: intens = 0.26
    elif base_t < 55: intens = 0.32
    elif base_t < 65: intens = 0.24
    else: intens = 0.18
    n = piano_notes[bar % len(piano_notes)]
    add_sine(n, intens*0.35, base_t, base_t+0.9, attack=0.005, release=0.25)
    add_sine(n*2, intens*0.12, base_t, base_t+0.7, attack=0.005, release=0.2)
    # low drone
    if bar % 2 == 0:
        add_sine(110.0 if base_t < 55 else 130.81, intens*0.22, base_t, min(dur, base_t+2.0), attack=0.05, release=0.4)

# Tension pulses (kick-like low thumps / heartbeat)
for t in [i*1.0 for i in range(0, 74)]:
    if 0 <= t < 38:
        amp = 0.08 if t < 12 else 0.12 if t < 25 else 0.16
        i0=int(t*sr); i1=min(N,int((t+0.18)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            e=math.exp(-tt*18)
            f=60 + 40*math.exp(-tt*25)
            samples[i]+=math.sin(2*math.pi*f*tt)*amp*e
    elif 38 <= t < 55:
        # heavier drums in climax
        amp=0.22
        i0=int(t*sr); i1=min(N,int((t+0.22)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            e=math.exp(-tt*14)
            f=55 + 35*math.exp(-tt*20)
            samples[i]+=math.sin(2*math.pi*f*tt)*amp*e
        # snare-ish noise on offbeats
        if int(t)%2==1:
            add_noise(0.06, t+0.0, t+0.08, attack=0.002, release=0.05)

# Distorted power-chord/synth layers in drive+climax
chords = [
    (12, 25, [110.0, 164.81, 220.0], 0.05),   # build
    (25, 38, [110.0, 164.81, 220.0, 261.63], 0.07),
    (38, 55, [130.81, 196.0, 261.63, 329.63], 0.12), # climax lift
    (55, 65, [110.0, 164.81, 220.0], 0.08),
]
for t0,t1,notes,amp in chords:
    step = 2.0
    tt = t0
    while tt < t1:
        for n in notes:
            add_saw(n, amp*0.5, tt, min(t1, tt+1.7), attack=0.03, release=0.2, filt=0.4)
            add_sine(n*2, amp*0.18, tt, min(t1, tt+1.5), attack=0.03, release=0.2)
        tt += step

# Climax extra energy (38-55): bright pulses
for k in range(int(38*2), int(55*2)):
    t = k/2.0
    add_sine(523.25, 0.03, t, t+0.12, attack=0.005, release=0.08)
    add_sine(659.25, 0.025, t+0.05, t+0.16, attack=0.005, release=0.08)

# Intro tape-like tension noise bed (subtle)
add_noise(0.015, 0.0, 12.0, attack=1.0, release=1.0)
add_noise(0.02, 12.0, 25.0, attack=0.5, release=0.5)
# crowd-like noise swell in climax
add_noise(0.03, 38.0, 65.0, attack=2.0, release=3.0)

# Normalize softly and write
peak = max(1e-6, max(abs(s) for s in samples))
gain = 0.9 / peak
# overall gentle fade in/out
for i in range(N):
    t = i/sr
    fin = min(1.0, t/1.0)
    fout = min(1.0, (dur - t)/2.0) if t > dur-2.0 else 1.0
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
# tape rewind/stop at start ~2.2s
n=int(sr*2.2); out=[]
for i in range(n):
    t=i/sr
    envv = math.exp(-t*1.3)
    f = 1200*(1.0 - t/2.2) + 80
    noise=(random.random()*2-1)*0.4
    tone=math.sin(2*math.pi*f*t)*0.5
    out.append((noise+tone)*envv*0.35)
with wave.open(os.path.join(base,'sfx_rewind.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_rewind.wav')

# heavy kick/impact 0.5s
n=int(sr*0.5); out=[]
for i in range(n):
    t=i/sr
    envv=math.exp(-t*10)
    body=math.sin(2*math.pi*(70+40*math.exp(-t*25))*t)*0.8
    click=(random.random()*2-1)*math.exp(-t*40)*0.3
    out.append((body+click)*envv*0.5)
for name in ['sfx_kick1.wav','sfx_kick2.wav']:
    with wave.open(os.path.join(base,name),'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
    print(name)

# crowd roar swell 6s
n=int(sr*6.0); out=[]
for i in range(n):
    t=i/sr
    envv = math.sin(math.pi * t/6.0)**1.2
    low = math.sin(2*math.pi*120*t + 0.5*math.sin(2*math.pi*2*t))*0.2
    noise=(random.random()*2-1)*0.6
    out.append((low+noise)*envv*0.35)
with wave.open(os.path.join(base,'sfx_crowd.wav'),'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h', int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_crowd.wav')
