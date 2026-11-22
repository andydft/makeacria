"""Gera voice.wav + words.json para mendigagem digital v2 via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\mendigagem-digital-segue-ai"
VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"

SENTENCES = [
    "Eu tô aqui todo dia fazendo vídeo de curiosidade musical...",
    "montando cena, animando, narrando... caprichando nos detalhes.",
    "E o seguidor? Sumiu. Evaporou.",
    "Foi comprar cigarro e nunca mais voltou.",
    "Então é oficial: começamos a mendigagem digital.",
    "Aqui no canal eu também toco guitarra, baixo, violão, escaleta e gaita de boca.",
    "Eu não tô dizendo que eu sou bom...",
    "só tô dizendo que eu toco mesmo.",
    "Se você curte rock, história de banda e som de verdade, me dá uma moral.",
    "Segue o perfil, curte, comenta e compartilha.",
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

    duration = max(30.0, (words[-1]["end"]+1.2) if words else 30.0)
    out = {"language":"pt-BR","duration":round(duration,3),"voice":VOICE,"rate":RATE,"cues":cues,"words":words}
    with open(os.path.join(BASE,"words.json"),"w",encoding="utf-8") as f: json.dump(out,f,ensure_ascii=False,indent=2)
    with open(os.path.join(BASE,"narration.txt"),"w",encoding="utf-8") as f: f.write("\n".join(SENTENCES))
    print("DURATION", round(duration,3), "CUES", len(cues), "WORDS", len(words), flush=True)

if __name__ == "__main__":
    asyncio.run(main())
