"""TTS - Galinheiro seguro 3D"""
import asyncio, json, os, edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE = "-15%"
PITCH = "+0Hz"
OUT = os.path.join("public", "galinheiro-seguro-3d")
TEXT = (
    "Para criar um galinheiro produtivo, primeiro precisamos entender como organizar o espaÃ§o onde as galinhas vÃ£o viver. "
    "As galinhas precisam de espaÃ§o para caminhar, ciscar e explorar o terreno. Mas tambÃ©m precisam de um lugar seguro para descansar. "
    "Uma boa estrutura precisa ter uma porta de acesso, espaÃ§o interno e uma Ã¡rea protegida onde as galinhas possam passar a noite. "
    "Por dentro, o galinheiro deve ter poleiros elevados para as galinhas dormirem. O espaÃ§o precisa ser organizado e permitir que todas encontrem um lugar para descansar. "
    "Os poleiros devem ficar em uma altura adequada, com espaÃ§o suficiente para que as galinhas nÃ£o fiquem apertadas. A estrutura precisa ser firme e confortÃ¡vel. "
    "Os ninhos tambÃ©m sÃ£o importantes. Eles precisam ser escuros, protegidos e confortÃ¡veis, para que as galinhas possam botar seus ovos com tranquilidade. "
    "Mas existe um problema: os predadores podem entrar no galinheiro. Alguns conseguem cavar por baixo da cerca e alcanÃ§ar as galinhas. "
    "Mesmo uma cerca aparentemente resistente pode nÃ£o ser suficiente. Um animal pode cavar um buraco e passar por baixo dela. "
    "Uma soluÃ§Ã£o Ã© instalar uma tela metÃ¡lica resistente junto Ã  cerca e enterrÃ¡-la no solo, impedindo que os animais cavem e entrem. "
    "Com poleiros adequados, ninhos protegidos e uma cerca segura, vocÃª pode criar um ambiente mais confortÃ¡vel e transformar seu galinheiro em um espaÃ§o produtivo."
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
