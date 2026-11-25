"""TTS - Goku: lenda -> mangá -> anime."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-lenda-manga-anime")
TEXT = (
    "Você sabia que o Goku nasceu de uma lenda antiga? "
    "A inspiração veio do Rei Macaco, Sun Wukong, da lenda chinesa Jornada ao Oeste, que também ficou muito famosa no Japão. "
    "Em mil novecentos e oitenta e quatro, Akira Toriyama transformou essa ideia em mangá e criou Dragon Ball. "
    "Poucos anos depois, essa história virou anime, chegou na televisão do mundo inteiro e fez do Goku um dos heróis mais conhecidos de todos os tempos."
)

async def main():
    os.makedirs(OUT, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary")
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
        json.dump({"voice": VOICE, "rate": RATE, "pitch": PITCH, "text": TEXT, "words": words}, f, ensure_ascii=False, indent=2)
    dur = words[-1]["offset"] + words[-1]["duration"] if words else 0
    print(f"words={len(words)} dur={dur:.3f}s")

asyncio.run(main())
