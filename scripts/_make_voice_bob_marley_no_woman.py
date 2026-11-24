"""Gera voice.wav + words.json para Bob Marley Story - No Woman No Cry."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bob-marley-story-no-woman-no-cry")
TEXT = (
    "Você sabe por que Bob Marley fez No Woman, No Cry? Curte, segue e compartilha essa história! "
    "A música foi inspirada nas lembranças de Bob Marley em Trenchtown, na Jamaica, onde ele viveu tempos difíceis. "
    "Mas, em vez de falar só de dor, ele quis trazer conforto e esperança. "
    "No Woman, No Cry é como um abraço: uma mensagem dizendo que, mesmo nas dificuldades, tudo vai ficar bem. "
    "Bob Marley transformou a luta do povo em uma canção de força e carinho. "
    "Por isso essa música emociona tanta gente até hoje. "
    "Comenta NO WOMAN NO CRY se essa música toca seu coração!"
)

async def main():
    os.makedirs(OUT, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    audio = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"text": chunk["text"], "offset": chunk["offset"] / 10_000_000, "duration": chunk["duration"] / 10_000_000})
    with open(os.path.join(OUT, "voice.wav"), "wb") as f:
        f.write(audio)
    with open(os.path.join(OUT, "words.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rate": RATE, "text": TEXT, "words": words}, f, ensure_ascii=False, indent=2)
    dur = (words[-1]["offset"] + words[-1]["duration"]) if words else 0
    print(f"words={len(words)} dur={dur:.3f}s")

asyncio.run(main())
