"""TTS - Goku Origem Parte 4 (Vegeta)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-origem-parte4")
TEXT = (
    "Depois da batalha contra Raditz, uma nova ameaÃ§a estava a caminho. "
    "Antes de cair, Raditz avisou que dois Saiyajins ainda mais poderosos viriam para a Terra. "
    "Um deles era Vegeta, o prÃ­ncipe dos Saiyajins. "
    "Orgulhoso, frio e incrivelmente forte, Vegeta chegou como um inimigo aterrorizante. "
    "Para ele, Goku era apenas um guerreiro de classe baixa chamado Kakaroto. "
    "Mas Goku mostrou que nÃ£o iria recuar. Os dois travaram uma batalha intensa, que mudou Dragon Ball para sempre. "
    "Vegeta perdeu aquela luta, mas sobreviveu. E aquela rivalidade estava sÃ³ comeÃ§ando. "
    "Continua na parte quatro!"
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
