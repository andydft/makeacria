"""Gera voice.wav + words.json para BTS Curiosity 2 - Bondade com ARMY."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bts-curiosity-2-army-kindness")
TEXT = (
    "ARMY, você sabia por que os fãs do BTS são tão apaixonados? Curte, comenta e fica até o fim, isso é lindo! "
    "O BTS sempre mostrou um carinho enorme pelos fãs. "
    "Eles fazem reverências profundas, escrevem cartas e nunca escondem o quanto a ARMY é importante. "
    "Em shows, o mar roxo das ARMY Bombs virou um símbolo de amor entre o BTS e os fãs. "
    "Foi o V que criou a frase Eu te roxo, dizendo que roxo significa confiança e amor por muito tempo. "
    "Por isso, a ligação entre BTS e ARMY não é só de fã e artista. "
    "É uma família que cresceu junta, com gratidão, respeito e carinho dos dois lados."
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
