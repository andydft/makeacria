import wave, struct, math, os, random
random.seed(7)
base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\queen-stadium"
sr = 44100

def write_wav(name, samples):
    path = os.path.join(base, name)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        frames = bytearray()
        for s in samples:
            s = max(-1.0, min(1.0, s))
            frames += struct.pack('<h', int(s * 32767))
        wf.writeframes(frames)
    print(name, os.path.getsize(path), len(samples)/sr)

# mic fail / static burst ~2.2s
n = int(sr*2.2)
out=[]
for i in range(n):
    t=i/sr
    env = math.exp(-t*1.2) * (0.6 + 0.4*math.sin(2*math.pi*3*t))
    noise = (random.random()*2-1)
    tone = 0.3*math.sin(2*math.pi*60*t) + 0.2*math.sin(2*math.pi*120*t)
    crackle = (random.random()*2-1) if random.random()<0.02 else 0
    out.append((noise*0.5 + tone*0.3 + crackle*0.7) * env * 0.35)
write_wav('sfx_fail.wav', out)

# whoosh 0.7s
n=int(sr*0.7); out=[]
for i in range(n):
    t=i/sr
    env = math.sin(math.pi * t/0.7)**1.5
    f = 200 + 1200*(t/0.7)
    val = (random.random()*2-1)*0.6 + 0.4*math.sin(2*math.pi*f*t)
    out.append(val*env*0.25)
write_wav('sfx_whoosh.wav', out)

# stomp/clap impact 0.45s
n=int(sr*0.45); out=[]
for i in range(n):
    t=i/sr
    env = math.exp(-t*12)
    env2 = math.exp(-max(0,t-0.02)*18)
    body = math.sin(2*math.pi*80*t)*env + math.sin(2*math.pi*140*t)*env*0.5
    clap = (random.random()*2-1)*env2
    out.append((body*0.6 + clap*0.5)*0.45)
write_wav('sfx_stomp.wav', out)
