"""Gera voice.wav + words.json para BTS Curiosity 5 - I Purple You."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bts-curiosity-5-i-purple-you")
TEXT = (
    "Você sabe o significado de I Purple You, do BTS? Curte, segue e compartilha agora! "
    "Em 2016, durante um fanmeeting, o V, do BTS, criou uma frase que mudou tudo. "
    "Ele disse: roxo é a última cor do arco-íris, então significa confiar e amar por muito tempo. "
    "A partir daí, I Purple You virou a forma mais linda da ARMY e do BTS dizerem eu te amo. "
    "Hoje, o roxo representa carinho, confiança e uma conexão que atravessa o mundo. "
    "Uma simples frase virou um símbolo eterno entre BTS e ARMY. "
    "Comenta I PURPLE YOU, curte e segue pra mais curiosidades do BTS!"
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
