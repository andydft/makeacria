"""Gera voice.wav + words.json para Breaking the Habit origin via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\breaking-the-habit-origin"
VOICE = "pt-BR-AntonioNeural"
RATE = "+18%"
DURATION = 80.0

SENTENCES = [
    "Todo mundo achava que essa música era sobre Chester… mas a inspiração inicial veio de outra pessoa.",
    "A música é Breaking the Habit, do álbum Meteora, do Linkin Park.",
    "E a história começa com Mike Shinoda, que carregava uma ideia na cabeça havia anos.",
    "Ele já tinha tentado escrever aquela letra várias vezes. Mas sempre achava que ficava exagerada, escura demais… ou simplesmente não funcionava.",
    "A ideia musical começou como um instrumental. A banda ouviu e incentivou Mike a transformar aquilo em uma música completa.",
    "Então, quando ele encontrou o som certo, aconteceu algo inesperado: a letra que ele tentava escrever havia cerca de cinco anos finalmente saiu em aproximadamente duas horas.",
    "A inspiração vinha de uma experiência pessoal de Mike, ligada a um amigo próximo da época da faculdade, com quem ele havia perdido contato.",
    "Mas aqui vem a parte que torna essa história ainda mais forte.",
    "Mike não escreveu a música como uma biografia literal de Chester. A ideia era mais metafórica — e cada pessoa podia encontrar nela a própria luta.",
    "Só que Chester se conectou profundamente com aquelas palavras. Ele contou que parecia que Mike estava cantando a vida dele… e que foi tão difícil gravar a música que chegou a chorar.",
    "A inspiração veio de uma história. Mas a voz de Chester fez milhões de pessoas sentirem que aquela história também era delas.",
    "E talvez seja por isso que Breaking the Habit continua tão poderosa até hoje.",
    "Você também sentia que essa música falava diretamente com Chester? Conta nos comentários.",
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
            wb.append({"word": chunk["text"], "start": round(chunk["offset"] / 1e7, 3), "end": round((chunk["offset"] + chunk["duration"]) / 1e7, 3)})

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

    duration = max(DURATION, (words[-1]["end"] + 1.5) if words else DURATION)
    segments = [{"start": cues[i]["start"], "end": cues[min(i + 2, len(cues) - 1)]["end"], "text": " ".join(cues[j]["text"] for j in range(i, min(i + 3, len(cues))))} for i in range(0, len(cues), 3)]
    with open(os.path.join(BASE, "words_raw.vtt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{vtt_time(c['start'])} --> {vtt_time(c['end'])}\n{c['text']}\n\n")
    out = {"language": "pt-BR", "duration": round(duration, 3), "voice": VOICE, "rate": RATE, "segments": segments, "cues": cues, "words": words}
    with open(os.path.join(BASE, "words.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(BASE, "narration.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(SENTENCES))
    print("DURATION", round(duration, 3), "CUES", len(cues), "WORDS", len(words), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
