import wave, math, struct, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\queen-stadium"
voice_dur = 80.736
dur = voice_dur + 3.0  # pad tail
sr = 44100
n = int(dur * sr)
out_path = os.path.join(base, "music.wav")

# Epic/cinematic stadium build: low drone + pulse that grows + brighter chord in climax
# No Queen melody. Simple original progression.

def clamp(x, a=-1.0, b=1.0):
    return max(a, min(b, x))

def env_segment(t):
    # energy curve over time (0..1.2) - grows to climax around "pisada pisada palma" (~51s) and stays high then settles
    if t < 10: return 0.35 + 0.05*(t/10)
    if t < 26: return 0.4 + 0.15*((t-10)/16)   # tension/build
    if t < 43: return 0.55 + 0.15*((t-26)/17)  # build
    if t < 51: return 0.7 + 0.25*((t-43)/8)    # to eureka/call
    if t < 63: return 1.05                       # CLIMAX (stomp stomp clap / vibração)
    if t < 75: return 0.95
    return 0.85  # tail/nostalgic

# chord roots over sections (Hz) - Dm, Bb, F, C feel but simple
chords = [
    (0, 146.83),   # D3
    (10, 146.83),
    (26, 116.54),  # Bb2
    (43, 130.81),  # C3
    (51, 174.61),  # F3 (lift/climax)
    (63, 196.00),  # G3
    (75, 146.83),  # resolve
]

def chord_freq(t):
    f = chords[0][1]
    for s,cf in chords:
        if t >= s: f = cf
    return f

with wave.open(out_path, 'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    chunk = 4096
    phase_pulse = 0.0
    for i in range(0, n, chunk):
        frames = bytearray()
        for j in range(i, min(i+chunk, n)):
            t = j / sr
            e = env_segment(t)
            root = chord_freq(t)
            fifth = root * 1.5
            octv = root * 2.0
            # slow global fade in/out
            g = min(1.0, t/2.5) * min(1.0, max(0.0, (dur - t)/2.5))
            v = 0.0
            # deep drone
            v += 0.55 * math.sin(2*math.pi*root*0.5*t)
            v += 0.35 * math.sin(2*math.pi*root*t)
            v += 0.18 * math.sin(2*math.pi*fifth*t)
            # brightness increases with energy
            v += 0.22 * e * math.sin(2*math.pi*octv*t)
            v += 0.12 * e * math.sin(2*math.pi*(octv*1.25)*t)  # major-ish color in lift
            # subtle pulse (stadium thump feel) stronger in build/climax
            pulse_rate = 2.0 if t < 43 else 2.4  # ~120/144 bpm feel, not melody
            pulse = 0.5 + 0.5*math.sin(2*math.pi*pulse_rate*t)
            pulse = pulse ** 3.0  # tighten
            v *= (0.78 + 0.22 * pulse * min(1.0, e))
            # gentle shimmer
            v += 0.06 * e * math.sin(2*math.pi*root*4.01*t) * (0.5+0.5*math.sin(2*math.pi*0.18*t))
            # normalize-ish and apply level (target ~ -20dB vs voice)
            sample = (v / 1.6) * 0.06 * e * g
            sample = clamp(sample)
            frames += struct.pack('<h', int(sample * 32767))
        wf.writeframes(frames)

print('music', os.path.getsize(out_path), 'dur', dur)
