import re, json, os

base = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\queen-stadium"
vtt_path = os.path.join(base, "words_raw.vtt")

with open(vtt_path, 'rb') as f:
    raw = f.read()
text = None
for enc in ('utf-8-sig','utf-8','cp1252','latin1'):
    try:
        t = raw.decode(enc)
        # crude sanity: lots of replacement chars? prefer one with known words if possible
        text = t
        if 'ritmo' in t.lower() or 'freddie' in t.lower() or 'queen' in t.lower():
            break
    except Exception:
        pass
if text is None:
    text = raw.decode('latin1', errors='replace')

text = text.replace('\r\n','\n').replace('\r','\n')
blocks = re.split(r'\n\s*\n', text.strip())

def parse_ts(t):
    t = t.strip().replace(',', '.')
    parts = t.split(':')
    if len(parts)==3:
        h,m,s = parts
    else:
        h='0'; m,s = parts
    return int(h)*3600 + int(m)*60 + float(s)

cues = []
for b in blocks:
    lines = [l.strip() for l in b.splitlines() if l.strip()]
    if not lines: continue
    tline = None; tparts=[]
    for l in lines:
        if '-->' in l:
            tline = l
        elif l.upper()=='WEBVTT' or re.match(r'^\d+$', l):
            continue
        else:
            tparts.append(l)
    if tline and tparts:
        m = re.match(r'([0-9:,.]+)\s*-->\s*([0-9:,.]+)', tline)
        if m:
            s,e = parse_ts(m.group(1)), parse_ts(m.group(2))
            cues.append((s,e,' '.join(tparts)))

# build words distributed within each cue
words=[]
for s,e,txt in cues:
    parts = txt.split()
    if not parts: continue
    total = sum(len(p) for p in parts) or 1
    cur = s
    span = max(0.01, e-s)
    for i,p in enumerate(parts):
        wdur = span * (len(p)/total)
        wend = cur + wdur
        if i==len(parts)-1: wend = e
        words.append({"word": p, "start": round(cur,3), "end": round(wend,3)})
        cur = wend

duration = 80.736
if words: duration = max(duration, words[-1]['end'])

# scene segments (aligned to narrative beats / cues)
# cues indices 0-based as parsed: 0 hook+origin,1 nasceu/emergencia,2 era 1977,3 estadio 80k,
# 4 som falhou,5 som desapareceu,6 silencio tenso,7 teve estalo,8 percebeu corpo humano,
# 9 pediu pes duas vezes,10 e depois palma,11 pisada pisada palma,12 simples,13 poderoso,14 vibração intensa,
# 15 agora voce sabe hino/conexao,16 cta final
def seg(idxs, label=None):
    ss = cues[idxs[0]][0]; ee = cues[idxs[-1]][1]
    txt = ' '.join(cues[i][2] for i in idxs)
    return {"start": round(ss,3), "end": round(ee,3), "text": txt}

segments = []
# fallback if cue count differs
if len(cues) >= 17:
    segments = [
      seg([0,1]),        # hook + origem emergencia
      seg([2,3]),        # 1977 estadio 80k
      seg([4,5,6]),      # som falhou, silencio tenso
      seg([7,8]),        # estalo genial, corpo como instrumento
      seg([9,10]),       # convocacao pes e palma
      seg([11,12,13,14]),# PISADA PISADA PALMA + simples poderoso vibração
      seg([15]),         # conclusão conexão sem tecnologia
      seg([16]),         # CTA final
    ]
else:
    # generic grouping
    n = len(cues)
    groups = [cues[max(0,int(i*n/8)):int((i+1)*n/8)] for i in range(8)]
    # rebuild by indices
    idx=0
    for g in range(8):
        count = len(groups[g])
        if count<=0: continue
        indices = list(range(idx, idx+count))
        idx += count
        if indices:
            segments.append(seg(indices))

# extend last segment a bit for visual tail (CTA hold) if needed
tail_end = round(max(duration, segments[-1]['end'] if segments else duration) + 0.5, 3)
# but keep duration as voice end; composition can pad

out = {
  "language": "pt-BR",
  "duration": round(duration,3),
  "voice": "pt-BR-AntonioNeural",
  "rate": "+8%",
  "segments": segments,
  "cues": [{"start": round(s,3), "end": round(e,3), "text": t} for s,e,t in cues],
  "words": words,
}
with open(os.path.join(base, "words.json"), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print('DUR', duration)
print('CUES', len(cues))
for i,(s,e,t) in enumerate(cues):
    print(i, round(s,3), round(e,3), t[:60])
print('---SEGS---')
for s in segments:
    print(s['start'], s['end'], s['text'][:70])
print('WORDS', len(words))
