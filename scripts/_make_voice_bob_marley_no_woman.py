"""Gera voice.wav + words.json para Bob Marley Story - No Woman No Cry."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+0%"
PITCH = "-3Hz"
OUT = os.path.join("public", "bob-marley-story-no-woman-no-cry")
TEXT = (
    "Oi, eu sou Bob Marley. Curte e segue se essa história tocar seu coração. "
    "Eu escrevi No Woman, No Cry lembrando dos meus dias em Trenchtown, na Jamaica. "
    "A vida era difícil, mas a gente tinha um ao outro, e isso dava força. "
    "Quando eu cantava essa música, eu queria abraçar cada pessoa que estava sofrendo. "
    "Eu queria dizer: não chore, tudo vai ficar bem, a gente vai superar juntos. "
    "Essa canção é o meu carinho em forma de música. "
    "Comenta NO WOMAN NO CRY, curte e compartilha essa mensagem!"
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
    dur = (words[-1]["offset"] + words[-1]["duration"]) if words else 0
    print(f"words={len(words)} dur={dur:.3f}s")

asyncio.run(main())
