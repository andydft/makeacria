"""Gera voice.wav + words.json para BTS Curiosity 4 - Records."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bts-curiosity-4-records")
TEXT = (
    "Você tem ideia do tamanho dos recordes do BTS? Curte, segue e compartilha agora! "
    "O BTS foi o primeiro grupo de K-pop a chegar ao topo da Billboard Hot 100. "
    "Eles também lotaram estádios gigantes pelo mundo, incluindo Wembley, nos Estados Unidos e no Brasil. "
    "Com clipes que quebram recordes em horas, o BTS provou que a música não tem barreiras de idioma. "
    "Cada conquista foi celebrada junto com a ARMY, que sempre esteve ao lado deles. "
    "De grupo novato a fenômeno mundial, o BTS fez história. "
    "Se você tem orgulho do BTS, comenta RECORDES, curte e segue pra mais!"
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
