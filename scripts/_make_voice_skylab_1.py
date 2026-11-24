"""Voz Skylab 1 - Morte falsa"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+0%"; PITCH="-4Hz"; OUT=os.path.join("public","skylab-story-1-fake-death")
TEXT=("Boa noite. Eu sou Rogério Skylab. E eu preciso te contar uma tragédia: eu morri... e ninguém percebeu. Curte, segue e compartilha, por respeito ao defunto. "
"Eu resolvi fazer uma experiência filosófica. Publiquei no meu blog que eu tinha morrido. "
"Uma homenagem culta, uma paródia de Machado de Assis. Eu esperava lágrimas, velas virtuais, talvez um feriado nacional. "
"E aí veio o plot twist: nada. Silêncio absoluto. Nem um emoji triste. "
"A moral da história é deprimente, mas útil: se você for sumir, deixa o like antes. Depois do óbito, o engajamento cai muito. "
"Comenta SKYLAB VIVO, curte, segue e compartilha. Eu imploro com dignidade mínima.")
async def main():
    os.makedirs(OUT,exist_ok=True)
    comm=edge_tts.Communicate(TEXT,VOICE,rate=RATE,pitch=PITCH,boundary="WordBoundary")
    words=[]; audio=bytearray()
    async for chunk in comm.stream():
        if chunk["type"]=="audio": audio.extend(chunk["data"])
        elif chunk["type"]=="WordBoundary": words.append({"text":chunk["text"],"offset":chunk["offset"]/10_000_000,"duration":chunk["duration"]/10_000_000})
    open(os.path.join(OUT,"voice.wav"),"wb").write(audio)
    json.dump({"voice":VOICE,"rate":RATE,"pitch":PITCH,"text":TEXT,"words":words},open(os.path.join(OUT,"words.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(f"words={len(words)} dur={words[-1]['offset']+words[-1]['duration']:.3f}s")
asyncio.run(main())
