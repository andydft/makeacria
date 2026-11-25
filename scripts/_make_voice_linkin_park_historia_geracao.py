"""TTS - Linkin Park: A HistÃ³ria de uma GeraÃ§Ã£o."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "-12%"
PITCH = "+0Hz"
OUT = os.path.join("public", "linkin-park-historia-geracao")
TEXT = (
    "Linkin Park definiu uma geraÃ§Ã£o inteira. "
    "Em 2000, Hybrid Theory mudou completamente o cenÃ¡rio do rock. "
    "Mas antes dos grandes palcos, tudo comeÃ§ou em espaÃ§os pequenos, com ideias e instrumentos. "
    "Um teclado, uma guitarra e a vontade de criar algo diferente. "
    "Naquela Ã©poca, ninguÃ©m imaginava o tamanho que aquela banda poderia alcanÃ§ar. "
    "Antes do Linkin Park, o projeto passou por dificuldades e mudanÃ§as. O grupo ainda estava tentando encontrar seu caminho. "
    "Quando as ideias comeÃ§aram a se encaixar, aquelas mÃºsicas passaram a ter uma identidade prÃ³pria. "
    "Uma das mÃºsicas que se destacaram foi Crawling, que ajudou a mostrar a identidade emocional da banda. "
    "Em 2002, o reconhecimento chegou tambÃ©m ao Grammy. "
    "De um quarto pequeno a milhÃµes de pessoas cantando juntas. "
    "Qual mÃºsica do Linkin Park marcou a sua vida?"
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
