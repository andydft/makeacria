"""TTS - Goku Origem Parte 2 (Raditz)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-origem-parte2")
TEXT = (
    "Na parte um, vimos como o Goku nasceu inspirado em uma lenda. Mas a paz não duraria para sempre. "
    "Goku já estava adulto, vivendo tranquilo na Terra, ao lado do seu filho, Gohan. "
    "Até que um guerreiro misterioso apareceu no céu. Era Raditz. "
    "Ele revelou uma verdade chocante: Goku era um Saiyajin, vindo de outro planeta, e seu nome verdadeiro era Kakaroto. "
    "Raditz queria que Goku se juntasse a ele. Mas Goku recusou. "
    "Então Raditz fez algo cruel: sequestrou o pequeno Gohan e exigiu que Goku obedecesse. "
    "Agora Goku teria que enfrentar o próprio irmão para salvar seu filho. "
    "E essa batalha mudaria Dragon Ball para sempre. "
    "Continua na parte três!"
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