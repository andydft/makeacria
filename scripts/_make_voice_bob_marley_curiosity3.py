"""Gera voice.wav + words.json para Bob Marley Curiosity 3 - Three Little Birds."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bob-marley-curiosity-3-three-little-birds")
TEXT = (
    "Você sabia que uma das músicas mais felizes do Bob Marley nasceu de um momento simples? "
    "Curte e compartilha essa história boa! "
    "A música Three Little Birds foi inspirada por passarinhos que apareciam perto da janela de Bob Marley, na Jamaica. "
    "Eles cantavam, e aquilo virou uma mensagem de paz e alegria. "
    "Por isso a música diz: não se preocupe com nada, porque tudo vai ficar bem. "
    "Uma cena simples virou um hino de felicidade no mundo inteiro. "
    "Comenta THREE LITTLE BIRDS se essa música te deixa feliz!"
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
