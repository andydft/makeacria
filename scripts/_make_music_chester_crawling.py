import wave, struct, math, os, random
random.seed(17)
base=r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\chester-crawling"
os.makedirs(base, exist_ok=True)
sr=44100; dur=74.0; N=int(sr*dur)
samples=[0.0]*N

def clamp(x,a=-1,b=1): return max(a,min(b,x))

def env(t,t0,t1,a=0.02,r=0.08):
    if t<t0 or t>t1: return 0.0
    tt=t-t0; L=max(1e-6,t1-t0)
    e=1.0
    if tt<a: e=tt/a
    if (L-tt)<r: e=min(e,max(0,(L-tt)/r))
    return e

def add_sine(freq,amp,t0,t1,a=0.02,r=0.1):
    i0=max(0,int(t0*sr)); i1=min(N,int(t1*sr))
    for i in range(i0,i1):
        t=i/sr; e=env(t,t0,t1,a,r)
        samples[i]+=math.sin(2*math.pi*freq*t)*amp*e

def add_saw(freq,amp,t0,t1,a=0.02,r=0.12,cut=0.45):
    i0=max(0,int(t0*sr)); i1=min(N,int(t1*sr))
    for i in range(i0,i1):
        t=i/sr; e=env(t,t0,t1,a,r)
        v=0.0
        for h in range(1,9):
            v += ((-1)**(h+1))*math.sin(2*math.pi*freq*h*t)/h
        v=v*(2/math.pi)
        v=(1-cut)*v + cut*math.sin(2*math.pi*freq*t)
        samples[i]+=v*amp*e

def add_noise(amp,t0,t1,a=0.01,r=0.05):
    i0=max(0,int(t0*sr)); i1=min(N,int(t1*sr))
    for i in range(i0,i1):
        t=i/sr; e=env(t,t0,t1,a,r)
        samples[i]+=(random.random()*2-1)*amp*e

bpm=84.0; beat=60.0/bpm
# drums - emotional alt rock pulse, builds then resolves
for b in range(int(dur/beat)+2):
    t=b*beat
    if t>dur: break
    # intensity by narrative arc
    if t<12: inten=0.18
    elif t<25: inten=0.22
    elif t<38: inten=0.30  # revelation energy
    elif t<52: inten=0.24
    elif t<65: inten=0.34  # grammy
    else: inten=0.26
    if b%4 in (0,2): # kick
        i0=int(t*sr); i1=min(N,int((t+0.2)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t; e=math.exp(-tt*16)
            f=58+35*math.exp(-tt*20)
            samples[i]+=math.sin(2*math.pi*f*tt)*inten*0.55*e
    if b%4 in (1,3): # snare
        i0=int(t*sr); i1=min(N,int((t+0.16)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t; e=math.exp(-tt*18)
            samples[i]+=((random.random()*2-1)*0.55 + math.sin(2*math.pi*180*tt)*0.35)*inten*0.32*e
    # hat
    if not (12<=t<25 and b%2==1): # sparse in conflict
        i0=int(t*sr); i1=min(N,int((t+0.03)*sr))
        for i in range(i0,i1):
            tt=(i/sr)-t
            samples[i]+=(random.random()*2-1)*0.12*inten*math.exp(-tt*70)

# bass drone / pulse
roots=[55.0,55.0,65.41,49.0] # Am C G ish feel
for bar in range(int(dur/(beat*4))+1):
    t0=bar*beat*4
    r=roots[bar%len(roots)]
    amp=0.08 if t0<12 else 0.10 if t0<38 else 0.09 if t0<52 else 0.12
    if t0>68: amp*=0.5
    add_sine(r,amp,t0,min(dur,t0+beat*3.6),a=0.03,r=0.4)
    add_sine(r*2,amp*0.2,t0,min(dur,t0+beat*2.8),a=0.03,r=0.3)

# atmospheric pad - cold/blue in conflict, warm in grammy
for t0 in range(0,int(dur),4):
    tt=float(t0)
    if tt<12: chord=[220,261.63,329.63]; amp=0.025
    elif tt<25: chord=[220,261.63,311.13]; amp=0.03 # minor/cold
    elif tt<38: chord=[220,277.18,329.63]; amp=0.035
    elif tt<52: chord=[207.65,246.94,311.13]; amp=0.028
    elif tt<65: chord=[220,277.18,329.63,440]; amp=0.04 # triumphant
    else: chord=[220,261.63,329.63]; amp=0.03
    for n in chord:
        add_sine(n,amp,tt,min(dur,tt+4.2),a=0.5,r=1.0)

# distorted guitar texture in revelation and grammy
for t0 in range(25,66,2):
    tt=float(t0)
    if 38<=tt<45: continue
    prog=0.6 if tt<38 else 0.8 if tt>=52 else 0.4
    r=[110,110,130.81,98][(int(tt)//4)%4]
    add_saw(r,0.03*prog,tt,tt+1.8,a=0.03,r=0.25,cut=0.4)
    add_saw(r*1.5,0.02*prog,tt,tt+1.7,a=0.03,r=0.25,cut=0.45)

# emotional lead swell at grammy
for tt in [52,54,56,58,60,62]:
    add_sine(440,0.035,tt,tt+1.8,a=0.08,r=0.5)
    add_sine(554.37,0.02,tt+0.1,tt+1.6,a=0.08,r=0.5)

# noise swells
add_noise(0.008,10,14,a=1.5,r=1.5)
add_noise(0.012,24,28,a=1.0,r=1.0)
add_noise(0.015,50,55,a=1.5,r=1.5)

# normalize
peak=max(1e-6,max(abs(s) for s in samples))
gain=0.82/peak
for i in range(N):
    t=i/sr
    fin=min(1.0,t/1.2)
    fout=1.0 if t<68 else max(0.0,1.0-(t-68)/6.0)
    samples[i]=clamp(samples[i]*gain*fin*fout)

path=os.path.join(base,'music.wav')
with wave.open(path,'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h',int(s*32767)) for s in samples))
print('music.wav', os.path.getsize(path))

# sfx whoosh
n=int(sr*0.5); out=[]
for i in range(n):
    t=i/sr; e=math.sin(math.pi*t/0.5)
    out.append((math.sin(2*math.pi*(350+900*t/0.5)*t)*0.2+(random.random()*2-1)*0.12)*e)
with wave.open(os.path.join(base,'sfx_whoosh.wav'),'w') as wf:
    wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_whoosh.wav')
# impact
n=int(sr*0.35); out=[]
for i in range(n):
    t=i/sr; e=math.exp(-t*14)
    out.append((math.sin(2*math.pi*90*t)*0.6+(random.random()*2-1)*0.2)*e)
with wave.open(os.path.join(base,'sfx_impact.wav'),'w') as wf:
    wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_impact.wav')
# crowd swell
n=int(sr*3.0); out=[]
for i in range(n):
    t=i/sr; e=min(1.0,t/0.5)*min(1.0,(3.0-t)/0.8)
    clap=sum(math.exp(-(((t*5+k*0.19)%1.0))*12)*0.07 for k in range(14))
    out.append(((random.random()*2-1)*0.5+clap)*e*0.35)
with wave.open(os.path.join(base,'sfx_crowd.wav'),'w') as wf:
    wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(sr)
    wf.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,s))*32767)) for s in out))
print('sfx_crowd.wav')
