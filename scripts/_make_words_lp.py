import re, json, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-anthem"
vtt_path = os.path.join(base, "words_raw.vtt")

with open(vtt_path, 'rb') as f:
    raw = f.read()
text = None
for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin1'):
    try:
        t = raw.decode(enc)
        text = t
        if 'Linkin' in t or 'lixo' in t or 'ic' in t.lower():
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

# Narrative mapping (by cue order from narration, 14 cues total in this take):
# 0 hook/lixo
# 1 final anos 90, Hybrid Theory, Warner ouviu rap/rock/piano, erro comercial
# 2 não entenderam visão
# 3 disseram para cortar a faixa
# 4 Chester e Mike recusaram a aceitar
# 5 sabiam era diferente
# 6 sentiram que precisava existir
# 7 lutaram contra executivos, mantiveram intacta, lançaram como single
# 8 "O resultado?"
# 9 música explodiu, definiu geração, hino mundial
# 10 arte não pede permissão
# 11 coragem para ignorar especialistas
# 12 Essa história te arrepia?
# 13 CTA comenta LP / manda vídeo
segments = []
if len(cues) >= 14:
    segments = [
        seg([0]),          # 1 Rejeição / hook
        seg([1, 2, 3]),    # 2 "Erro comercial" / cortar faixa
        seg([4, 5, 6, 7]), # 3 A luta / determinação / mantiveram e lançaram
        seg([8, 9]),       # 4 Hino mundial (explosão/geração)
        seg([10, 11]),     # 5 Conclusão emocional (arte/coragem/ignorar especialistas)
        seg([12, 13]),     # 6 CTA final
    ]
elif len(cues) >= 8:
    segments = [
        seg([0]),
        seg([1, 2]),
        seg([3]),
        seg([4]),
        seg([5]),
        seg([6]),
        seg(list(range(7, len(cues)))),
    ]
elif len(cues) >= 6:
    segments = [seg([0]), seg([1]), seg([2, 3]), seg([4]), seg([5]), seg(list(range(5, len(cues))))]
else:
    segments = [seg(list(range(len(cues))))] if cues else []

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
    print(i, round(s, 3), round(e, 3), t[:90])
print('---SEGS---')
for i, s in enumerate(segments):
    print(i, s['start'], s['end'], s['text'][:90])
print('WORDS', len(words))
