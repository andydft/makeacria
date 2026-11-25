"""TTS - Goku Origem Parte 1 (90s)."""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "+8%"
PITCH = "+0Hz"
OUT = os.path.join("public", "goku-origem-parte1")
TEXT = (
    "Você sabia que o Goku foi inspirado em um dos personagens mais famosos de uma antiga lenda chinesa? "
    "A inspiração veio de Sun Wukong, o Rei Macaco, de Jornada ao Oeste. "
    "Ele é um guerreiro poderoso, irreverente e cheio de aventuras. "
    "E até o nome Son Goku vem desse personagem lendário. "
    "Akira Toriyama aproveitou ideias dessa lenda, como o bastão mágico, a nuvem voadora e os traços de macaco. "
    "Mas transformou tudo em algo novo: um garoto com cauda, simples, forte e cheio de curiosidade. "
    "Em vinte de novembro de mil novecentos e oitenta e quatro, Dragon Ball estreou na revista Weekly Shonen Jump. "
    "No começo, era uma aventura cômica em busca das sete Esferas do Dragão. "
    "A cauda deixava o Goku único. E quando olhava para a lua cheia, algo incrível podia acontecer: a transformação no grande Oozaru. "
    "Com o tempo, a história ganhou torneios, artes marciais e batalhas cada vez mais intensas. "
    "Em mil novecentos e oitenta e seis, Dragon Ball virou anime na televisão japonesa e conquistou o mundo. "
    "De uma lenda antiga ao maior herói dos animes... essa história ainda está só começando. "
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