import re, json, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-jayz"
vtt_path = os.path.join(base, "words_raw.vtt")

with open(vtt_path, 'rb') as f:
    raw = f.read()
text = None
for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin1'):
    try:
        t = raw.decode(enc)
        text = t
        if 'Jay' in t or 'Linkin' in t or 'Numb' in t:
            break
    except Exception:
        pass
if text is None:
    text = raw.decode('latin1', errors='replace')

text = text.replace('\r\n', '\n').replace('\r', '\n')
blocks = re.split(r'\n\s*\n', text.strip())

def parse_ts(t):
    t = t.strip().replace(',', '.')
    parts = t.split(':')
    if len(parts) == 3:
        h, m, s = parts
    else:
        h = '0'; m, s = parts
    return int(h) * 3600 + int(m) * 60 + float(s)

cues = []
for b in blocks:
    lines = [l.strip() for l in b.splitlines() if l.strip()]
    if not lines:
        continue
    tline = None
    tparts = []
    for l in lines:
        if '-->' in l:
            tline = l
        elif l.upper() == 'WEBVTT' or re.match(r'^\d+$', l):
            continue
        else:
            tparts.append(l)
    if tline and tparts:
        m = re.match(r'([0-9:,.]+)\s*-->\s*([0-9:,.]+)', tline)
        if m:
            s, e = parse_ts(m.group(1)), parse_ts(m.group(2))
            cues.append((s, e, ' '.join(tparts)))

words = []
for s, e, txt in cues:
    parts = txt.split()
    if not parts:
        continue
    total = sum(len(p) for p in parts) or 1
    cur = s
    span = max(0.01, e - s)
    for i, p in enumerate(parts):
        wdur = span * (len(p) / total)
        wend = cur + wdur
        if i == len(parts) - 1:
            wend = e
        words.append({"word": p, "start": round(cur, 3), "end": round(wend, 3)})
        cur = wend

# extend composition >60s with visual/CTA tail and dramatic spacing
duration = 70.0
if words:
    duration = max(duration, words[-1]['end'] + 1.5)

def seg(idxs):
    idxs = [i for i in idxs if 0 <= i < len(cues)]
    if not idxs:
        return None
    ss = cues[idxs[0]][0]
    ee = cues[idxs[-1]][1]
    txt = ' '.join(cues[i][2] for i in idxs)
    return {"start": round(ss, 3), "end": round(ee, 3), "text": txt}

n = len(cues)
segments = []
# 11 cues expected:
# 0 hook pegadinha
# 1 Mike Shinoda criou mashup Numb/Encore e enviou
# 2 Jay-Z escutou pensou não pode ser sério
# 3 algo naquela mistura era diferente
# 4 rock e rap se encaixavam perfeitamente
# 5 se encontraram no estúdio e decidiram gravar juntos
# 6 O resultado?
# 7 Collision Course e show lendário Grammy 2006 Chester e Jay-Z dividiram palco
# 8 Rock e rap dois mundos opostos criaram algo único
# 9 Rock ou Rap?
# 10 CTA comenta e manda
if n >= 11:
    segments = [
        seg([0]),          # Cena 1: Hook / pegadinha
        seg([1, 2]),       # Cena 2: Envio / reação surpresa
        seg([3, 4, 5]),    # Cena 3: Encontro / encaixe / decidiram gravar
        seg([6, 7]),       # Cena 4/5: Resultado + Grammy lendário (fusão/clímax)
        seg([8]),          # Conclusão
        seg([9, 10]),      # Cena 6: CTA
    ]
elif n >= 8:
    segments = [seg([0]), seg([1,2]), seg([3,4]), seg([5,6]), seg(list(range(7,n)))]
else:
    segments = [seg(list(range(n)))] if cues else []

segments = [s for s in segments if s]

out = {
    "language": "pt-BR",
    "duration": round(duration, 3),
    "voice": "pt-BR-AntonioNeural",
    "rate": "+8%",
    "segments": segments,
    "cues": [{"start": round(s, 3), "end": round(e, 3), "text": t} for s, e, t in cues],
    "words": words,
}

with open(os.path.join(base, "words.json"), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print('DUR', round(duration, 3))
print('CUES', len(cues))
for i, (s, e, t) in enumerate(cues):
    print(i, round(s, 3), round(e, 3), t[:110])
print('---SEGS---')
for i, s in enumerate(segments):
    print(i, s['start'], s['end'], s['text'][:110])
print('WORDS', len(words))
