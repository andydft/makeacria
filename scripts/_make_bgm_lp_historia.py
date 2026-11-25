import numpy as np, wave, os, math
OUT = os.path.join("public","linkin-park-historia-geracao","bgm.wav")
sr=44100; dur=80; t=np.linspace(0,dur,int(sr*dur),endpoint=False)
# simple atmospheric rock pad: layered sine/triangle, slow pulse
def env(x, a=2, r=3):
    e=np.ones_like(x)
    n=len(x)
    aN=int(a*sr); rN=int(r*sr)
    e[:aN]=np.linspace(0,1,aN)
    e[-rN:]=np.linspace(1,0,rN)
    return e
sig = 0.12*np.sin(2*np.pi*55*t) + 0.08*np.sin(2*np.pi*110*t) + 0.04*np.sin(2*np.pi*165*t)
sig += 0.03*np.sin(2*np.pi*73.42*t) # D
pulse = 0.5+0.5*np.sin(2*np.pi*0.25*t)
sig *= (0.6+0.4*pulse)
# subtle noise texture
rng=np.random.default_rng(1)
noise = rng.normal(0,0.01,len(t))
# lowpass-ish by simple moving avg
k=200; kernel=np.ones(k)/k
noise=np.convolve(noise,kernel,mode='same')
sig += noise
sig *= env(sig)
sig = sig/np.max(np.abs(sig))*0.35
audio=(sig*32767).astype(np.int16)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT,'w') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(audio.tobytes())
print('ok')