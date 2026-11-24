"""Gera voice.wav + words.json para Bob Marley Story - Love Message (1a pessoa)."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bob-marley-story-love-message")
TEXT = (
    "Oi, eu sou Bob Marley. Curte e segue se você também acredita no amor! "
    "Eu sempre acreditei que a música podia unir as pessoas, curar corações e espalhar paz. "
    "Para mim, cantar era uma forma de levar amor para o mundo inteiro. "
    "Quando eu cantava músicas como Is This Love, eu queria que você sentisse esse carinho de verdade. "
    "O amor é a mensagem mais forte que a gente pode deixar. "
    "Então espalhe amor, respeito e boas vibrações por onde você passar. "
    "Comenta ONE LOVE, curte e compartilha essa mensagem!"
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
