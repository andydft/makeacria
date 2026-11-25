"""Voz - Curiosidade Son Goku Dragon Ball GT (criança / Esferas de Estrelas Negras)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "dragon-ball-gt-goku-crianca")
TEXT = (
    "Você lembra por que o Goku virou criança de novo em Dragon Ball GT? "
    "No começo de GT, o Pilaf encontra as Esferas do Dragão de Estrelas Negras e, sem querer, deseja que o Goku volte a ser pequeno. "
    "Só que essas esferas não eram comuns: elas foram criadas pelo Kami antes de se separar do Piccolo Daimaoh, e tinham um poder muito mais perigoso. "
    "Depois de um desejo, elas se espalham pela galáxia inteira. E o pior: se não forem reunidas em um ano, a Terra explode. "
    "Foi por isso que Goku, Pan e Trunks embarcaram numa jornada pelo espaço. Uma ideia simples que começou uma das fases mais polêmicas de Dragon Ball. "
    "Se você curtia GT, segue pra mais curiosidades de anime."
)

async def main():
    os.makedirs(OUT, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    submaker = edge_tts.SubMaker()
    words = []
    audio = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({
                "text": chunk["text"],
                "offset": chunk["offset"] / 10_000_000,
                "duration": chunk["duration"] / 10_000_000,
            })
    with open(os.path.join(OUT, "voice.wav"), "wb") as f:
        f.write(audio)
    with open(os.path.join(OUT, "words.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rate": RATE, "pitch": PITCH, "text": TEXT, "words": words}, f, ensure_ascii=False, indent=2)
    dur = words[-1]["offset"] + words[-1]["duration"] if words else 0
    print(f"words={len(words)} dur={dur:.3f}s")

asyncio.run(main())
