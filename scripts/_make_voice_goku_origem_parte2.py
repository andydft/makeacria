"""TTS - Goku Origem Parte 2 (Bloco A)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-origem-parte2")
TEXT = (
    "Na parte um, a gente viu como o Goku nasceu de uma lenda. Mas a história dele ainda ia ficar muito maior. "
    "Quando tudo parecia só uma aventura, Goku já tinha crescido, formado família e descobriu que era pai do Gohan. "
    "Mas a grande revelação veio com Raditz: Goku era um Saiyajin, vindo de outro planeta, e seu nome verdadeiro era Kakaroto. "
    "Aquela cauda, que parecia só uma curiosidade, fazia parte da origem dele. "
    "Depois veio Vegeta, o príncipe dos Saiyajins. No começo, ele era um rival perigoso e orgulhoso, mas com o tempo se tornaria um dos personagens mais marcantes da saga. "
    "E teve uma curiosidade famosa: Akira Toriyama comentou que deixar o cabelo do Goku loiro no Super Saiyajin também ajudava no trabalho do mangá. "
    "O resultado foi uma das transformações mais icônicas de todos os animes. "
    "De uma lenda antiga a uma saga cheia de batalhas, revelações e transformações... e isso ainda é só o começo. "
    "Segue pra ver a próxima parte!"
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