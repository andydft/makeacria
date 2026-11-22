"""Gera voice.wav + words.json para o short Linkin Park Chester Tape via edge-tts.
Roda com: python scripts/_make_voice_chester_tape.py
"""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-chester-tape"
VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
DURATION = 75.0

SENTENCES = [
    "A voz que mudou uma das maiores bandas do rock chegou… numa fita enviada pelo correio.",
    "Na época, eles nem eram Linkin Park. Eram uma banda chamada Xero, tentando encontrar o som e a formação certos.",
    "Depois de tentativas e dificuldades para encontrar a formação certa, faltava uma peça importante: uma voz que encaixasse naquele som que misturava rap, guitarras e melodias.",
    "Em 1999, Chester Bennington soube da oportunidade de fazer um teste para a banda. Ele ouviu as demos instrumentais e decidiu criar sua própria interpretação.",
    "Em vez de esperar, Chester foi ao estúdio, gravou suas partes vocais e enviou a demo. A gravação chamou a atenção de quem estava procurando o próximo vocalista.",
    "Pouco depois, Chester viajou para Los Angeles e conheceu a banda. Sua voz trouxe uma combinação poderosa: melodia, intensidade e uma energia que encaixava com o rap de Mike Shinoda.",
    "Com Chester, a banda entrou em uma nova fase. Xero virou Hybrid Theory… e, mais tarde, o nome que o mundo inteiro aprenderia a cantar: Linkin Park.",
    "Às vezes, uma oportunidade chega em uma fita — e muda tudo. Você conhecia essa história? Comenta qual música do Linkin Park marcou a sua vida.",
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
            # fallback: consume remaining proportionally for last cue
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
