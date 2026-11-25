"""TTS - Goku Origem Parte 3 (Luta contra Raditz)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-origem-parte3")
TEXT = (
    "Depois de sequestrar Gohan, Raditz parecia invencível. Mas Goku não ia desistir do seu filho. "
    "A batalha começou. Goku lutou com tudo, mas Raditz era mais forte e rápido. "
    "Quando tudo parecia perdido, Gohan mostrou uma força surpreendente e ajudou a abrir uma brecha. "
    "Goku aproveitou o momento, segurou Raditz, e um ataque decisivo acabou com a ameaça. "
    "Mas a vitória teve um preço alto. Antes de cair, Raditz revelou que outros Saiyajins ainda mais poderosos viriam para a Terra. "
    "A luta acabou... mas o perigo estava só começando. "
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