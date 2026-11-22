"""Trilha original + SFX do short do Mike Shinoda (roda com python normal)."""
import wave, struct, math, os, random, subprocess
random.seed(303)

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\mike-shinoda"
os.makedirs(BASE, exist_ok=True)
sr = 44100
dur = 78.0
N = int(sr * dur)
samples = [0.0] * N


def clamp(x, a=-1, b=1):
    return max(a, min(b, x))


def env(t, t0, t1, a=0.02, r=0.08):
    if t < t0 or t > t1:
        return 0.0
    tt = t - t0
    L = max(1e-6, t1 - t0)
    e = 1.0
    if tt < a:
        e = tt / a
    if (L - tt) < r:
        e = min(e, max(0, (L - tt) / r))
    return e


def sine(freq, amp, t0, t1, a=0.02, r=0.1):
    i0, i1 = max(0, int(t0 * sr)), min(N, int(t1 * sr))
    for i in range(i0, i1):
        t = i / sr
        samples[i] += math.sin(2 * math.pi * freq * t) * amp * env(t, t0, t1, a, r)


def saw(freq, amp, t0, t1, a=0.02, r=0.12, cut=0.45):
    i0, i1 = max(0, int(t0 * sr)), min(N, int(t1 * sr))
    for i in range(i0, i1):
        t = i / sr
        v = sum(((-1) ** (h + 1)) * math.sin(2 * math.pi * freq * h * t) / h for h in range(1, 9))
        v = v * (2 / math.pi)
        v = (1 - cut) * v + cut * math.sin(2 * math.pi * freq * t)
        samples[i] += v * amp * env(t, t0, t1, a, r)


def noise(amp, t0, t1, a=0.01, r=0.05):
    i0, i1 = max(0, int(t0 * sr)), min(N, int(t1 * sr))
    for i in range(i0, i1):
        t = i / sr
        samples[i] += (random.random() * 2 - 1) * amp * env(t, t0, t1, a, r)


bpm = 88.0
beat = 60.0 / bpm

# bateria - groove de bedroom demo que vira hino
for b in range(int(dur / beat) + 2):
    t = b * beat
    if t > dur:
        break
    if t < 6:
        inten = 0.14
    elif t < 18:
        inten = 0.20
    elif t < 40:
        inten = 0.15
    elif t < 56:
        inten = 0.28
    elif t < 67:
        inten = 0.36
    else:
        inten = 0.26
    if b % 4 in (0, 2):
        i0, i1 = int(t * sr), min(N, int((t + 0.2) * sr))
        for i in range(i0, i1):
            tt = i / sr - t
            e = math.exp(-tt * 16)
            f = 56 + 38 * math.exp(-tt * 20)
            samples[i] += math.sin(2 * math.pi * f * tt) * inten * 0.55 * e
    if b % 4 in (1, 3):
        i0, i1 = int(t * sr), min(N, int((t + 0.16) * sr))
        for i in range(i0, i1):
            tt = i / sr - t
            e = math.exp(-tt * 18)
            samples[i] += ((random.random() * 2 - 1) * 0.5 + math.sin(2 * math.pi * 180 * tt) * 0.35) * inten * 0.32 * e
    i0, i1 = int(t * sr), min(N, int((t + 0.03) * sr))
    for i in range(i0, i1):
        tt = i / sr - t
        samples[i] += (random.random() * 2 - 1) * 0.11 * inten * math.exp(-tt * 70)

# baixo
roots = [55.0, 55.0, 65.41, 49.0]
for bar in range(int(dur / (beat * 4)) + 1):
    t0 = bar * beat * 4
    r = roots[bar % len(roots)]
    amp = 0.07 if t0 < 18 else 0.09 if t0 < 40 else 0.11 if t0 < 67 else 0.09
    if t0 > 72:
        amp *= 0.5
    sine(r, amp, t0, min(dur, t0 + beat * 3.6), 0.03, 0.4)
    sine(r * 2, amp * 0.22, t0, min(dur, t0 + beat * 2.8), 0.03, 0.3)

# pad - frio na rejeição, quente no Grammy
for t0 in range(0, int(dur), 4):
    tt = float(t0)
    if tt < 6:
        chord, amp = [220, 261.63, 329.63], 0.024
    elif tt < 18:
        chord, amp = [220, 261.63, 329.63], 0.03
    elif tt < 40:
        chord, amp = [220, 261.63, 311.13], 0.028
    elif tt < 56:
        chord, amp = [220, 277.18, 329.63], 0.034
    elif tt < 67:
        chord, amp = [220, 277.18, 329.63, 440], 0.042
    else:
        chord, amp = [220, 261.63, 329.63], 0.03
    for n in chord:
        sine(n, amp, tt, min(dur, tt + 4.2), 0.5, 1.0)

# texto de guitarra/distorsão no build e no Grammy
for t0 in range(38, 67, 2):
    tt = float(t0)
    prog = 0.45 if tt < 56 else 0.8
    r = [110, 110, 130.81, 98][(int(tt) // 4) % 4]
    saw(r, 0.028 * prog, tt, tt + 1.8, 0.03, 0.25, 0.4)
    saw(r * 1.5, 0.02 * prog, tt, tt + 1.7, 0.03, 0.25, 0.45)

# swell lírico no Grammy
for tt in [57, 59, 61, 63, 65]:
    sine(440, 0.034, tt, tt + 1.8, 0.08, 0.5)
    sine(554.37, 0.02, tt + 0.1, tt + 1.6, 0.08, 0.5)

# transições
noise(0.008, 5.5, 7.5, 1.0, 1.0)
noise(0.012, 53, 57, 1.5, 1.5)
noise(0.010, 65, 68, 1.0, 1.0)

peak = max(1e-6, max(abs(s) for s in samples))
gain = 0.82 / peak
for i in range(N):
    t = i / sr
    fin = min(1.0, t / 1.2)
    fout = 1.0 if t < 72 else max(0.0, 1.0 - (t - 72) / 6.0)
    samples[i] = clamp(samples[i] * gain * fin * fout)

wav = os.path.join(BASE, "music.wav")
with wave.open(wav, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    wf.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in samples))
subprocess.run(["ffmpeg", "-y", "-i", wav, "-codec:a", "libmp3lame", "-q:a", "4",
                os.path.join(BASE, "music.mp3")], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("music ok")


def write_sfx(name, fn, seconds):
    n = int(sr * seconds)
    out = []
    for i in range(n):
        t = i / sr
        out.append(clamp(fn(t, seconds)))
    with wave.open(os.path.join(BASE, name), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in out))
    print(name)


write_sfx("sfx_whoosh.wav",
          lambda t, L: (math.sin(2 * math.pi * (300 + 1000 * t / L) * t) * 0.2
                        + (random.random() * 2 - 1) * 0.12) * math.sin(math.pi * t / L), 0.5)

write_sfx("sfx_impact.wav",
          lambda t, L: (math.sin(2 * math.pi * 90 * t) * 0.6 + (random.random() * 2 - 1) * 0.2) * math.exp(-t * 14), 0.35)

write_sfx("sfx_crowd.wav",
          lambda t, L: ((random.random() * 2 - 1) * 0.5
                        + sum(math.exp(-(((t * 5 + k * 0.19) % 1.0)) * 12) * 0.07 for k in range(14)))
          * min(1.0, t / 0.5) * min(1.0, (L - t) / 0.8) * 0.35, 3.0)

write_sfx("sfx_keys.wav",
          lambda t, L: sum(math.sin(2 * math.pi * f * t) * 0.18 * math.exp(-((t - k * 0.085) * 26) ** 2)
                           for k, f in enumerate([523.25, 659.25, 783.99, 587.33, 698.46, 880.0, 659.25, 783.99])), 0.8)

write_sfx("sfx_phone.wav",
          lambda t, L: (math.sin(2 * math.pi * 480 * t) + math.sin(2 * math.pi * 620 * t)) * 0.16
          * (math.sin(math.pi * (t % 0.5) / 0.5) ** 2) * min(1.0, t / 0.1) * min(1.0, (L - t) / 0.2), 1.8)
