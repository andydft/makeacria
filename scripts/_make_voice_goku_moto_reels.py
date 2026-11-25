"""TTS for Goku Moto Reels - 4 scenes."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-moto-reels")

SCENES = [
    ("scene1", "No começo da jornada, o Goku deu de cara com um negócio muito estranho no meio da estrada... e olhou tudo com cara de quem não confia nem na própria sombra."),
    ("scene2", "Sem saber o que era aquilo, ele foi chegando de mansinho e mandou uma cutucada só pra ver se o bicho reagia."),
    ("scene3", "Na mesma hora o motor roncou, soltou fumaça e fez barulho! O Goku pulou de susto achando que o bicho ia partir pra cima dele!"),
    ("scene4", "Depois que viu que ninguém se machucou, ele soltou aquele sorriso bobo e seguiu viagem como se nada tivesse acontecido."),
]

async def make(name, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    words = []
    audio = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"text": chunk["text"], "offset": chunk["offset"] / 10_000_000, "duration": chunk["duration"] / 10_000_000})
    with open(os.path.join(OUT, f"{name}.wav"), "wb") as f:
        f.write(audio)
    with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rate": RATE, "pitch": PITCH, "text": text, "words": words}, f, ensure_ascii=False, indent=2)
    dur = (words[-1]["offset"] + words[-1]["duration"]) if words else 0
    print(f"{name}: words={len(words)} dur={dur:.3f}s")

async def main():
    os.makedirs(OUT, exist_ok=True)
    for name, text in SCENES:
        await make(name, text)

asyncio.run(main())
