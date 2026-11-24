"""Gera voice.wav + words.json para Bob Marley Curiosity 2 - Futebol."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bob-marley-curiosity-2-football")
TEXT = (
    "Você sabia que Bob Marley quase amava mais futebol do que música? Segue pra ver esse lado dele! "
    "Sempre que podia, Bob Marley estava jogando bola. "
    "Em turnês, nos bastidores, ou em qualquer campo que encontrava, ele chamava todo mundo pra jogar. "
    "Para ele, o futebol era liberdade, união e alegria, do mesmo jeito que o reggae. "
    "Ele dizia que jogar bola era uma forma de se sentir vivo. "
    "Por isso, além de lenda da música, Bob Marley também era apaixonado por futebol. "
    "Curte, comenta REGGAE e compartilha com quem ama Bob Marley!"
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
