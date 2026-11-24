"""Voz Skylab 1 - Morte falsa"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+8%"; OUT=os.path.join("public","skylab-story-1-fake-death")
TEXT=("Oi, eu sou Rogério Skylab. Eu morri na internet e absolutamente ninguém sentiu minha falta. Curte, segue e compartilha, pelo amor dos vivos! "
"Um dia eu resolvi fazer uma experiência filosófica: publiquei no meu blog que eu tinha morrido. "
"Era uma homenagem culta, uma paródia de Machado de Assis. Eu esperei o caos, o luto, as flores virtuais. "
"E aí veio o plot twist: ninguém percebeu. Ninguém chorou. Nem um emoji de vela. "
"A moral da história é simples: se você sumir, deixa um like antes, porque depois ninguém garante. "
"Comenta SKYLAB VIVO, curte, segue e manda praquele amigo que some do grupo!")
async def main():
    os.makedirs(OUT,exist_ok=True)
    comm=edge_tts.Communicate(TEXT,VOICE,rate=RATE,boundary="WordBoundary")
    words=[]; audio=bytearray()
    async for chunk in comm.stream():
        if chunk["type"]=="audio": audio.extend(chunk["data"])
        elif chunk["type"]=="WordBoundary": words.append({"text":chunk["text"],"offset":chunk["offset"]/10_000_000,"duration":chunk["duration"]/10_000_000})
    open(os.path.join(OUT,"voice.wav"),"wb").write(audio)
    json.dump({"voice":VOICE,"rate":RATE,"text":TEXT,"words":words},open(os.path.join(OUT,"words.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(f"words={len(words)} dur={words[-1]['offset']+words[-1]['duration']:.3f}s")
asyncio.run(main())
