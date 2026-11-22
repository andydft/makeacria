import wave, math, struct, os
base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\gato-banheiro"
# get voice duration
voice_path = os.path.join(base, "voice.wav")
with wave.open(voice_path,'rb') as wf:
    dur = wf.getnframes()/float(wf.getframerate())
dur = max(dur, 50.0) + 1.0
sr = 44100
n = int(dur*sr)
# simple warm lo-fi pad: two detuned sines + soft triangle, slow amplitude swell, very low level
# -20dB relative to voice ~ amplitude 0.1 of full scale is plenty low; use ~0.03
notes = [261.63, 329.63, 392.00, 523.25] # C major-ish pad
out_path = os.path.join(base, "music.wav")
with wave.open(out_path,'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    chunk = 4096
    for i in range(0, n, chunk):
        frames = bytearray()
        for j in range(i, min(i+chunk, n)):
            t = j/sr
            # slow chord cycle
            idx = int((t/8.0)) % len(notes)
            f1 = notes[idx]
            f2 = notes[(idx+1)%len(notes)]*0.5
            # crossfade
            ph = (t % 8.0)/8.0
            a = 0.5 - 0.5*math.cos(2*math.pi*ph)
            v = 0.0
            v += math.sin(2*math.pi*f1*t) * (1-a)
            v += math.sin(2*math.pi*f2*t) * a
            v += 0.4*math.sin(2*math.pi*f1*1.002*t)
            v += 0.25*math.sin(2*math.pi*(f1*2)*t) * 0.3 # soft harmonic
            # gentle envelope
            env = min(1.0, t/2.0) * min(1.0, max(0.0,(dur-t)/2.0))
            # slow tremolo
            env *= 0.85 + 0.15*math.sin(2*math.pi*0.25*t)
            sample = v/2.2 * 0.035 * env  # very low ~ -29dBFS
            sample = max(-1.0, min(1.0, sample))
            frames += struct.pack('<h', int(sample*32767))
        wf.writeframes(frames)
print('music', os.path.getsize(out_path), 'dur', dur)
