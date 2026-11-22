import re, json, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-crawling"
vtt_path = os.path.join(base, "words_raw.vtt")

with open(vtt_path, 'rb') as f:
    raw = f.read()
text = None
for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin1'):
    try:
        t = raw.decode(enc)
        text = t
        if 'Crawling' in t or 'vocal' in t.lower() or 'cabin' in t.lower():
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

duration = 70.0
if words:
    duration = max(duration, words[-1]['end'])

def seg(idxs):
    idxs = [i for i in idxs if 0 <= i < len(cues)]
    if not idxs:
        return None
    ss = cues[idxs[0]][0]
    ee = cues[idxs[-1]][1]
    txt = ' '.join(cues[i][2] for i in idxs)
    return {"start": round(ss, 3), "end": round(ee, 3), "text": txt}

# cues (14): 0 hook/única tomada, 1 sem cortes, 2 sem segunda chance,
# 3 entrou cabine/fechou olhos/cantou, 4 canalizou dor, 5 banda ouviu silêncio,
# 6 Mike Brad Rob Dave Joe, 7 ninguém se mexeu, 8 terminou exausto,
# 9 ninguém falou nada, 10 apenas respeito, 11 sabiam testemunhar algo verdadeiro,
# 12 arrepios?, 13 CTA
n = len(cues)
segments = []
if n >= 14:
    segments = [
        seg([0, 1, 2]),        # Hook / preparação - única tomada
        seg([3]),              # Entrou na cabine / cantou
        seg([4]),              # Canalizou dor real
        seg([5, 6, 7]),        # Banda ouviu em silêncio (nomes)
        seg([8, 9, 10]),       # Terminou exausto / ninguém falou / respeito
        seg([11]),             # Testemunhar algo verdadeiro (vulnerabilidade)
        seg([12, 13]),         # CTA
    ]
elif n >= 9:
    segments = [
        seg([0, 1]),
        seg([2, 3]),
        seg([4]),
        seg([5]),
        seg([6, 7]),
        seg(list(range(8, n))),
    ]
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
    print(i, round(s, 3), round(e, 3), t[:100])
print('---SEGS---')
for i, s in enumerate(segments):
    print(i, s['start'], s['end'], s['text'][:100])
print('WORDS', len(words))
