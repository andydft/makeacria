"""Gera voice.wav + words.json para Emily first introduction via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-emily-first-introduction"
VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
DURATION = 100.0

SENTENCES = [
    "Por sete anos, os fãs do Linkin Park não sabiam se voltariam a ver a banda daquele jeito.",
    "Depois da perda de Chester Bennington, o futuro parecia impossível de imaginar.",
    "Mas, em setembro de 2024, Mike Shinoda subiu ao palco com uma notícia que mudaria tudo.",
    "O Linkin Park estava de volta… com uma nova voz.",
    "Emily Armstrong.",
    "No dia 5 de setembro, a banda revelou a nova formação em uma apresentação transmitida para o mundo inteiro.",
    "E Emily não ficou escondida atrás de ninguém.",
    "Ela entrou no palco, dividiu os vocais com Mike e mostrou sua força em The Emptiness Machine.",
    "Mas a história ficou ainda mais emocionante alguns dias depois.",
    "No Kia Forum, em Los Angeles, Mike olhou para a plateia e perguntou se todos já conheciam a amiga deles… Emily.",
    "A reação veio em forma de gritos e aplausos.",
    "Aquela era a primeira noite da nova turnê, e Emily estava diante de uma arena cheia, cantando músicas que marcaram gerações.",
    "Quando chegaram os clássicos, milhares de pessoas cantaram junto.",
    "Mike ainda pediu que o público demonstrasse carinho por Emily… e a resposta foi enorme.",
    "Ela não estava tentando ser Chester.",
    "Estava mostrando quem era, com sua própria voz, sua energia e sua presença.",
    "E Mike deixou claro: aquele retorno não era para apagar o passado… era para começar um novo capítulo.",
    "Naquela noite, Emily não apenas foi apresentada ao público.",
    "Ela começou a conquistar seu lugar na história do Linkin Park.",
    "Você lembra da primeira vez que viu Emily cantando com a banda? Conta nos comentários.",
]

TEXT = " ".join(SENTENCES)

def toks(s: str):
    return [w.strip(".,;:!?\"'…—-()[]") for w in s.split() if w.strip(".,;:!?\"'…—-()[]")]

def vtt_time(t: float) -> str:
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

async def main():
    os.makedirs(BASE, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, boundary="WordBoundary")
    audio = bytearray(); wb = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio": audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            wb.append({"word": chunk["text"], "start": round(chunk["offset"]/1e7,3), "end": round((chunk["offset"]+chunk["duration"])/1e7,3)})

    expected = sum(len(toks(s)) for s in SENTENCES)
    print("WORD BOUNDARIES", len(wb), "EXPECTED", expected, flush=True)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        mp3 = f.name; f.write(audio)
    wav = os.path.join(BASE, "voice.wav")
    subprocess.run(["ffmpeg","-y","-i",mp3,"-ac","1","-ar","48000","-c:a","pcm_s16le",wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.unlink(mp3)

    words, cues, idx = [], [], 0
    for sent in SENTENCES:
        want = len(toks(sent))
        chunk = wb[idx:idx+want]
        if len(chunk) < want and idx < len(wb): chunk = wb[idx:]; idx = len(wb)
        else: idx += want
        if not chunk: continue
        s,e = chunk[0]["start"], chunk[-1]["end"]
        cues.append({"start":s,"end":e,"text":sent}); words.extend(chunk)
    if idx < len(wb): words.extend(wb[idx:]); cues[-1]["end"]=wb[-1]["end"]

    duration = max(DURATION, (words[-1]["end"]+1.5) if words else DURATION)
    segments = [{"start":cues[i]["start"],"end":cues[min(i+2,len(cues)-1)]["end"],"text":" ".join(cues[j]["text"] for j in range(i,min(i+3,len(cues))))} for i in range(0,len(cues),3)]
    with open(os.path.join(BASE,"words_raw.vtt"),"w",encoding="utf-8") as f:
        for i,c in enumerate(cues,1): f.write(f"{i}\n{vtt_time(c['start'])} --> {vtt_time(c['end'])}\n{c['text']}\n\n")
    out = {"language":"pt-BR","duration":round(duration,3),"voice":VOICE,"rate":RATE,"segments":segments,"cues":cues,"words":words}
    with open(os.path.join(BASE,"words.json"),"w",encoding="utf-8") as f: json.dump(out,f,ensure_ascii=False,indent=2)
    with open(os.path.join(BASE,"narration.txt"),"w",encoding="utf-8") as f: f.write("\n".join(SENTENCES))
    print("DURATION", round(duration,3), "CUES", len(cues), "WORDS", len(words), flush=True)

if __name__ == "__main__":
    asyncio.run(main())
