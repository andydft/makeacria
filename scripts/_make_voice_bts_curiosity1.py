"""Gera voice.wav + words.json para BTS Curiosity 1 - Como o BTS começou."""
import asyncio, json, os
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
OUT = os.path.join("public", "bts-curiosity-1-debut")
TEXT = (
    "ARMY, você sabia que o BTS quase nunca existiu? Curte, comenta e fica até o fim, essa história vai te emocionar! "
    "Em dois mil e treze, sete garotos estrearam pela pequena empresa Big Hit Entertainment. "
    "O nome BTS vem de Bangtan Sonyeondan, que significa Escoteiros à Prova de Balas. "
    "Os membros são RM, Jin, SUGA, j-hope, Jimin, V e Jungkook. "
    "No começo, eles enfrentaram muitas dúvidas, críticas e pouco reconhecimento. "
    "Mas com letras sobre juventude, sonhos e pressão social, o BTS conquistou fãs no mundo inteiro. "
    "E foi assim que sete garotos de um pequeno estúdio viraram um fenômeno global que mudou vidas."
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
