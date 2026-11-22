import re, json, wave, math, struct, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\gato-banheiro"
vtt_path = os.path.join(base, "words_raw.vtt")
wav_path = os.path.join(base, "voice.wav")

def parse_time(t):
    # 00:00:01.234 or 00:01.234
    parts = t.strip().split(':')
    if len(parts)==3:
        h,m,s = parts
    else:
        h='0'; m,s = parts
    return int(h)*3600 + int(m)*60 + float(s)

cues = []
if os.path.exists(vtt_path):
    with open(vtt_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    # split blocks
    blocks = re.split(r'\n\s*\n', content.strip())
    for b in blocks:
        lines = [l.strip('\ufeff').strip() for l in b.splitlines() if l.strip()]
        if not lines: continue
        # find timing line
        tline = None
        text_lines = []
        for l in lines:
            if '-->' in l:
                tline = l
            elif l.upper()=='WEBVTT' or re.match(r'^\d+$', l):
                continue
            else:
                text_lines.append(l)
        if tline and text_lines:
            m = re.match(r'([0-9:.]+)\s*-->\s*([0-9:.]+)', tline)
            if m:
                s,e = parse_time(m.group(1)), parse_time(m.group(2))
                text = ' '.join(text_lines)
                cues.append((s,e,text))

# try to get duration from wav
duration = 0.0
if os.path.exists(wav_path):
    with wave.open(wav_path,'rb') as wf:
        frames = wf.getnframes(); rate = wf.getframerate()
        duration = frames/float(rate)

# build words from cues
words = []
for s,e,text in cues:
    # edge-tts vtt often gives small chunks/words
    # split but keep timing distributed
    parts = text.strip().split()
    if not parts: continue
    if len(parts)==1:
        words.append({"word": parts[0], "start": round(s,3), "end": round(e,3)})
    else:
        total = len(''.join(parts))
        t = s
        span = max(0.01, e-s)
        for w in parts:
            wdur = span * (len(w)/total) if total else span/len(parts)
            words.append({"word": w, "start": round(t,3), "end": round(t+wdur,3)})
            t += wdur
        words[-1]["end"] = round(e,3)

# if cues empty, fallback: proportional over narration text
if not words:
    narration = ("Seu gato te segue até o banheiro por um motivo que você nunca imaginou. "
                 "Não é só curiosidade. "
                 "A primeira razão é instinto: portas fechadas significam território desconhecido, e ele precisa investigar. "
                 "A segunda é proteção. Na natureza, esse é o momento mais vulnerável, e ele está de guarda por você. "
                 "Mas a terceira razão é a mais bonita. "
                 "Para ele, você é a família. Ele só quer garantir que está perto de quem ele ama. "
                 "Então, da próxima vez, agradeça. Seu gato só não quer perder nenhum segundo ao seu lado. "
                 "Seu gato faz isso? Comenta aqui e me segue para mais curiosidades felinas.")
    allw = narration.split()
    dur = duration or 56.0
    total = len(''.join(allw))
    t=0.0
    for w in allw:
        wdur = dur * (len(w)/total)
        words.append({"word": w, "start": round(t,3), "end": round(t+wdur,3)})
        t+=wdur
    duration = dur

# derive duration end
if words:
    duration = max(duration, words[-1]['end'])

seg_texts = [
  "Seu gato te segue até o banheiro por um motivo que você nunca imaginou.",
  "Não é só curiosidade.",
  "A primeira razão é instinto: portas fechadas significam território desconhecido, e ele precisa investigar.",
  "A segunda é proteção. Na natureza, esse é o momento mais vulnerável, e ele está de guarda por você.",
  "Mas a terceira razão é a mais bonita.",
  "Para ele, você é a família. Ele só quer garantir que está perto de quem ele ama.",
  "Então, da próxima vez, agradeça. Seu gato só não quer perder nenhum segundo ao seu lado.",
  "Seu gato faz isso? Comenta aqui e me segue para mais curiosidades felinas.",
]
# assign words to segments by matching sequence
segments = []
wi = 0
all_words_flat = [w['word'] for w in words]
def norm(s):
    return re.sub(r'[^a-z0-9áàâãéêíóôõúç]','', s.lower())
for st in seg_texts:
    sw = st.split()
    count = len(sw)
    seg_words = words[wi:wi+count] if wi < len(words) else []
    # try to be flexible if mismatch
    if not seg_words:
        # fallback proportional
        s = segments[-1]['end'] if segments else 0.0
        e = min(duration, s + 6.0)
        segments.append({"start": round(s,3), "end": round(e,3), "text": st})
        continue
    s = seg_words[0]['start']
    e = seg_words[-1]['end']
    segments.append({"start": round(s,3), "end": round(e,3), "text": st})
    wi += len(seg_words)
# if leftover words, extend last segment
if wi < len(words) and segments:
    segments[-1]['end'] = round(words[-1]['end'],3)

out = {
  "language": "pt-BR",
  "duration": round(duration,3),
  "voice": "pt-BR-AntonioNeural",
  "rate": "+8%",
  "segments": segments,
  "words": words,
}
with open(os.path.join(base, "words.json"), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

# report
print('duration', duration)
print('words', len(words), 'segments', len(segments))
for s in segments:
    print(s['start'], s['end'], s['text'][:40])
