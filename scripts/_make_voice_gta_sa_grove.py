"""Voz GTA SA Grove Street Parody"""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "-2Hz"
OUT = os.path.join("public", "gta-sa-grove-street-parody")
TEXT = (
    "Ah não... GTA seis chegou e todo mundo esqueceu da Grove Street. "
    "Calma. Missão nova: voltar pro San Andreas. "
    "Pega a bike, desvia do bug, respeita a Grove Street. "
    "Missão cumprida: respeito mais noventa e nove. "
    "O GTA seis pode ter gráfico... mas o San Andreas tem alma. "
    "Comenta: SA ou GTA seis? Curte, segue e compartilha."
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
    print(f"words={len(words)} dur={words[-1]['offset'] + words[-1]['duration']:.3f}s")

asyncio.run(main())
