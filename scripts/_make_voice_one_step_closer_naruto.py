"""Gera voice.wav + words.json para One Step Closer + Naruto (temático)."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\one-step-closer-naruto-link"
VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
DURATION = 52.0

SENTENCES = [
    "Você já sentiu que estava a um passo de explodir?",
    "Em 2000, durante as gravações do Hybrid Theory, o Chester Bennington chegou nesse limite.",
    "O produtor Don Gilmore pedia pra ele reescrever as letras várias vezes.",
    "A pressão foi aumentando, até que a frustração virou música.",
    "Daquela raiva saiu One Step Closer, com um grito que todo mundo conhece: Shut up!",
    "Não era só revolta. Era alguém dizendo que precisava de espaço antes de quebrar.",
    "E é por isso que tanta gente lembra de Naruto, que foi febre nos anos 2000 e marcou uma geração inteira.",
    "A luta do Rock Lee contra o Gaara virou símbolo disso: ser empurrado ao limite e ainda assim não desistir.",
    "Até hoje, é uma das batalhas mais lembradas pelos fãs, e One Step Closer combina com esse momento antes do estouro.",
    "Às vezes, dar esse passo atrás é o que impede tudo de desabar.",
    "Se curtiu essa conexão, segue o perfil pra mais histórias da música.",
]

TEXT = " ".join(SENTENCES)


def toks(s: str):
    return [w.strip(".,;:!?\"“”") for w in s.split() if w.strip(".,;:!?\"“”")]


async def main():
    os.makedirs(BASE, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, boundary="WordBoundary")
    audio = bytearray()
    wb = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            wb.append({
                "word": chunk["text"],
                "start": round(chunk["offset"] / 1e7, 3),
                "end": round((chunk["offset"] + chunk["duration"]) / 1e7, 3),
            })

    expected = sum(len(toks(s)) for s in SENTENCES)
    print("WORD BOUNDARIES", len(wb), "EXPECTED", expected, flush=True)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        mp3 = f.name
        f.write(audio)
    wav = os.path.join(BASE, "voice.wav")
    subprocess.run(["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.unlink(mp3)

    words, cues, idx = [], [], 0
    for sent in SENTENCES:
        want = len(toks(sent))
        chunk = wb[idx:idx + want]
        if len(chunk) < want and idx < len(wb):
            chunk = wb[idx:]
            idx = len(wb)
        else:
            idx += want
        if not chunk:
            continue
        s, e = chunk[0]["start"], chunk[-1]["end"]
        cues.append({"start": s, "end": e, "text": sent})
        words.extend(chunk)
    if idx < len(wb):
        words.extend(wb[idx:])
        cues[-1]["end"] = wb[-1]["end"]

    duration = max(DURATION, (words[-1]["end"] + 2.5) if words else DURATION)
    out = {"language": "pt-BR", "duration": round(duration, 3), "voice": VOICE, "rate": RATE, "cues": cues, "words": words}
    with open(os.path.join(BASE, "words.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(BASE, "narration.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(SENTENCES))
    print("DURATION", round(duration, 3), "CUES", len(cues), "WORDS", len(words), flush=True)


asyncio.run(main())
