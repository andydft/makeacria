"""Gera voice.wav + words.json para Bob Marley Story - Love Message."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bob-marley-story-love-message")
TEXT = (
    "Você sabia que Bob Marley queria espalhar amor para o mundo inteiro? Curte, segue e compartilha! "
    "Mais do que fama, Bob Marley queria usar a música para unir pessoas. "
    "Em suas canções, ele falava de paz, respeito, fé e amor ao próximo. "
    "Para ele, o reggae era uma forma de curar corações e aproximar pessoas diferentes. "
    "Mesmo em tempos difíceis, Bob Marley escolheu espalhar luz em vez de ódio. "
    "Por isso sua mensagem continua viva até hoje: One Love. "
    "Comenta ONE LOVE se você também acredita nessa mensagem!"
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
