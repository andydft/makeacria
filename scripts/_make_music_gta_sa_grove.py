"""Original G-funk-inspired instrumental (no copyrighted melody/samples)."""
import os, wave, struct, math, random
random.seed(7)
OUT = os.path.join("public", "gta-sa-grove-street-parody")
SR = 44100
DUR = 36.0
N = int(SR * DUR)
BPM = 94
beat = 60.0 / BPM
sixteenth = beat / 4

def env_exp(t, k): return math.exp(-k * t)
def clamp(x): return max(-1, min(1, x))

bufL = [0.0] * N
bufR = [0.0] * N

def add_mono(sig, i, v, pan=0.0):
    if 0 <= i < N:
        l = v * (0.5 - pan/2)
        r = v * (0.5 + pan/2)
        bufL[i] += sig * l
        bufR[i] += sig * r

# Drums
for step in range(int(DUR / sixteenth) + 1):
    t0 = step * sixteenth
    i0 = int(t0 * SR)
    s = step % 16
    # kick on 0,10
    if s in (0, 10):
        for i in range(int(0.25*SR)):
            t=i/SR
            f=55*math.exp(-18*t)+38
            v=math.sin(2*math.pi*f*t)*env_exp(t,10)*0.9
            add_mono(v, i0+i, 1.0)
    # snare on 4,12
    if s in (4, 12):
        for i in range(int(0.2*SR)):
            t=i/SR
            n=(random.random()*2-1)*env_exp(t,18)
            tone=math.sin(2*math.pi*180*t)*env_exp(t,14)*0.3
            add_mono(n*0.5+tone, i0+i, 0.75)
    # hihat 8ths/16ths
    if True:
        for i in range(int(0.04*SR)):
            t=i/SR
            n=(random.random()*2-1)*env_exp(t,60)
            amp=0.18 if s%2==0 else 0.1
            add_mono(n*amp, i0+i, 0.6, pan=0.15)

# Bass (simple g-funk-ish pattern)
notes = [36,36,43,36, 34,34,41,34] # C2/F2, Bb1/Eb2 etc midi-ish
for bar in range(int(DUR/(beat*4))+1):
    for q in range(8):
        t0 = bar*beat*4 + q*beat/2
        i0 = int(t0*SR)
        midi = notes[(bar*8+q)%len(notes)]
        freq = 440*(2**((midi-69)/12))
        dur_n = int(beat*0.45*SR)
        for i in range(dur_n):
            t=i/SR
            env=min(1,t/0.01)*env_exp(t,5)
            v=(math.sin(2*math.pi*freq*t)*0.7 + math.sin(2*math.pi*freq*2*t)*0.15)*env*0.32
            add_mono(v, i0+i, 1.0, pan=-0.05)

# Lead synth (simple pentatonic plucks)
scale=[60,63,65,67,70,72]
for step in range(int(DUR/sixteenth)+1):
    if step%4!=2: continue
    if random.random()<0.45: continue
    t0=step*sixteenth
    i0=int(t0*SR)
    midi=scale[(step//3)%len(scale)]+(12 if step%32>16 else 0)
    freq=440*(2**((midi-69)/12))
    dur_n=int(0.35*SR)
    for i in range(dur_n):
        t=i/SR
        env=min(1,t/0.005)*env_exp(t,6)
        v=(math.sin(2*math.pi*freq*t)+0.4*math.sin(2*math.pi*freq*2.01*t))*env*0.08
        add_mono(v, i0+i, 0.8, pan=0.2)

# simple pad
for i in range(N):
    t=i/SR
    chord=[48,55,60] if int(t/(beat*4))%2==0 else [46,53,58]
    v=0
    for m in chord:
        f=440*(2**((m-69)/12))
        v+=math.sin(2*math.pi*f*t)*0.02
    add_mono(v, i, 0.6, pan=-0.1)

# normalize
mx=max(max(abs(x) for x in bufL), max(abs(x) for x in bufR), 1e-6)
gain=0.9/mx
os.makedirs(OUT, exist_ok=True)
path=os.path.join(OUT,"beat.wav")
with wave.open(path,"wb") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    for i in range(N):
        l=int(clamp(bufL[i]*gain)*32767)
        r=int(clamp(bufR[i]*gain)*32767)
        wf.writeframes(struct.pack('<hh',l,r))
print(path)
