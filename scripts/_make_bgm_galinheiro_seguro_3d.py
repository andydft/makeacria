import numpy as np, wave, os
OUT = os.path.join("public","galinheiro-seguro-3d","bgm.wav")
sr=44100; dur=115
t=np.linspace(0,dur,int(sr*dur),endpoint=False)
# gentle rural/acoustic feel: simple major arpeggio + pad
def env(x,a=2,r=3):
    e=np.ones_like(x); n=len(x)
    aN=int(a*sr); rN=int(r*sr)
    e[:aN]=np.linspace(0,1,aN); e[-rN:]=np.linspace(1,0,rN)
    return e
# C major pad
sig = 0.08*np.sin(2*np.pi*130.81*t) + 0.06*np.sin(2*np.pi*164.81*t) + 0.05*np.sin(2*np.pi*196.00*t)
sig += 0.03*np.sin(2*np.pi*261.63*t)
# soft pluck pattern
pluck = np.zeros_like(t)
notes=[261.63,329.63,392.00,523.25,392.00,329.63]
step=int(0.75*sr)
for i,note in enumerate(notes*(int(dur/ (0.75*len(notes)))+2)):
    s=i*step
    if s>=len(t): break
    length=min(int(0.6*sr), len(t)-s)
    tt=np.arange(length)/sr
    p=0.06*np.sin(2*np.pi*note*tt)*np.exp(-3*tt)
    pluck[s:s+length]+=p
# light shaker noise
rng=np.random.default_rng(2)
noise=rng.normal(0,0.008,len(t))
k=120; kernel=np.ones(k)/k
noise=np.convolve(noise,kernel,mode='same')
beat=np.zeros_like(t)
bstep=int(sr*1.0)
for i in range(0,len(t),bstep):
    l=min(int(0.03*sr),len(t)-i)
    beat[i:i+l]+=np.hanning(l)*0.03
sig = sig*0.7 + pluck + noise*0.3 + beat
sig *= env(sig)
# slight swell around predator section ~56-78s
pred=np.clip((t-55)/3,0,1)*np.clip((78-t)/3,0,1)
sig = sig*(1-0.25*pred) + 0.04*np.sin(2*np.pi*110*t)*pred
sig = sig/np.max(np.abs(sig))*0.28
audio=(sig*32767).astype(np.int16)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT,'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(audio.tobytes())
print('ok')