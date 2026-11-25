"""Voz DB GT Curiosity V2"""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+6%"
PITCH = "-6Hz"
OUT = os.path.join("public", "dragon-ball-gt-curiosity-v2")
TEXT = (
    "Did you know? In Dragon Ball GT there is a secret fact: Baby Buu took over Earth after Baby Saga. "
    "Did you know? In 1999 GT resurged with a new timeline and Baby Buu..."
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
