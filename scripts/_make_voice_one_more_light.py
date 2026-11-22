"""Gera voice.wav + words.json para One More Light via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-one-more-light"
VOICE = "pt-BR-AntonioNeural"
RATE = "+4%"
DURATION = 75.0

SENTENCES = [
    "Essa música deu nome a um álbum inteiro… e começou com uma despedida.",
    "Em 2015, a banda perdeu uma amiga. Amy Zaret trabalhava havia 25 anos na gravadora do Linkin Park. Ela morreu depois de um diagnóstico de câncer.",
    "Tempos depois, Mike Shinoda estava no estúdio com o compositor Eg White. Os dois conversaram sobre amigos que tinham perdido… e decidiram escrever sobre isso.",
    "A ideia era simples: mesmo diante de algo muito traumático, uma das coisas mais importantes é mostrar às pessoas que você se importa.",
    "A banda nunca tinha dado a um álbum o nome de uma música. Dessa vez, todos concordaram. Chester disse que era a faixa mais pesada… com o título mais esperançoso.",
    "O álbum saiu em maio de 2017. Dois meses depois, em 20 de julho, Chester Bennington morreu.",
    "Fãs do mundo todo passaram a ouvir essa música pensando nele. Mike disse que o mundo decidiu que ela era sobre o Chester. Qual música do Linkin Park te acompanhou quando você mais precisou?",
]

TEXT = " ".join(SENTENCES)


def toks(s: str):
    return [w.strip(".,;:!?\"'…—-()[]") for w in s.split() if w.strip(".,;:!?\"'…—-()[]")]


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

    expected = sum(len(toks(s)) for s in SENTENCES)
    print("WORD BOUNDARIES", len(wb), "EXPECTED", expected, flush=True)

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

    duration = max(DURATION, (words[-1]["end"] + 1.5) if words else DURATION)

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


if __name__ == "__main__":
    asyncio.run(main())
