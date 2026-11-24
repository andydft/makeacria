"""Gera voice.wav + words.json para BTS Curiosity 3 - Purple Ocean."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bts-curiosity-3-purple-ocean")
TEXT = (
    "Você sabia como nasceu o Purple Ocean do BTS? Curte, segue e compartilha agora! "
    "Em shows de K-pop, cada grupo tem uma cor oficial de lightstick. "
    "Mas em alguns momentos, fãs de outros grupos apagavam as luzes quando o BTS subia ao palco. "
    "Foi aí que a ARMY tomou uma atitude linda: eles cobriram a arena inteira de roxo. "
    "Assim nasceu o famoso Purple Ocean, um mar roxo feito de amor e união. "
    "Desde então, o roxo virou símbolo da ligação entre BTS e ARMY. "
    "Se você é ARMY, comenta EU TE AMO BTS, curte e manda pra outro fã!"
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
