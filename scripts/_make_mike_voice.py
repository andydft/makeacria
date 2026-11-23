"""Gera voice.wav + words.json do short do Mike Shinoda via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\mike-shinoda"
VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
DURATION = 76.0

SENTENCES = [
    "A música que marcou uma geração inteira nasceu num quarto bagunçado, com um teclado de cinquenta dólares.",
    "Em dois mil, o Hybrid Theory vendeu trinta milhões de cópias e virou o maior álbum de estreia do século.",
    "Mas antes do estúdio, antes do Grammy, existia só o quarto do Mike Shinoda.",
    "Ele tinha acabado de sair do colégio.",
    "Um gravador de quatro faixas, uma guitarra ligada num amp minúsculo e um microfone.",
    "O próprio Mike contou depois: o setup inteiro valia mais ou menos trezentos dólares.",
    "As primeiras versões das músicas surgiram ali, na casa dos pais dele.",
    "Ele não estava tentando fazer um álbum.",
    "Mal estava pensando em montar uma banda.",
    "A banda ainda se chamava Xero, e as gravadoras não se interessavam.",
    "Até que um executivo ouviu as fitas e ligou de volta.",
    "Ele disse: não faz sentido nenhum, essas músicas soam muito bem.",
    "E ali, tudo começou a mudar.",
    "Crawling nasceu de um vocal que sobrou de outra música, chamada Blue.",
    "Chester escreveu a letra, e o Mike construiu a música em volta dela.",
    "Em dois mil e dois, Crawling levou o Grammy de Melhor Performance de Hard Rock.",
    "De um quarto bagunçado e um teclado barato, saiu uma voz que ainda fala por milhões.",
    "Qual música do Linkin Park marcou a sua vida?",
]

TEXT = " ".join(SENTENCES)


def toks(s: str):
    return [w.strip(".,;:!?\"“”") for w in s.split() if w.strip(".,;:!?\"“”")]


def vtt_time(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


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

    print("WORD BOUNDARIES", len(wb), "EXPECTED", sum(len(toks(s)) for s in SENTENCES), flush=True)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        mp3 = f.name
        f.write(audio)
    wav = os.path.join(BASE, "voice.wav")
    subprocess.run([
        "ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.unlink(mp3)

    words = []
    cues = []
    idx = 0
    expected_counts = [len(toks(s)) for s in SENTENCES]
    for si, sent in enumerate(SENTENCES):
        want = expected_counts[si]
        chunk = wb[idx:idx + want]
        if len(chunk) < want and idx < len(wb):
            # fallback: consume remaining if mismatch
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
    segments = [
        {"start": cues[i]["start"], "end": cues[min(i + 2, len(cues) - 1)]["end"],
         "text": " ".join(cues[j]["text"] for j in range(i, min(i + 3, len(cues))))}
        for i in range(0, len(cues), 3)
    ]

    with open(os.path.join(BASE, "words_raw.vtt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{vtt_time(c['start'])} --> {vtt_time(c['end'])}\n{c['text']}\n\n")

    out = {
        "language": "pt-BR",
        "duration": round(duration, 3),
        "voice": VOICE,
        "rate": RATE,
        "segments": segments,
        "cues": cues,
        "words": words,
    }
    with open(os.path.join(BASE, "words.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(BASE, "narration.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(SENTENCES))

    print("DURATION", round(duration, 3), "CUES", len(cues), "WORDS", len(words), flush=True)
    for i, c in enumerate(cues):
        print(i, c["start"], c["end"], c["text"][:80], flush=True)


asyncio.run(main())
