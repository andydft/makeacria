"""Voz Skylab 3 - Ronco"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+0%"; PITCH="-4Hz"; OUT=os.path.join("public","skylab-story-3-snoring")
TEXT=("Boa noite. Eu sou Rogerio Skylab. E vou revelar a origem nojenta de uma das minhas musicas. Curte, segue e compartilha esse sofrimento conjugal. "
"As pessoas acham que minhas letras vem de crises existenciais, filosofia pesada, tormento cosmico. "
"Para de Roncar, FDP, por exemplo. Parece odio puro, parece revolta contra o universo. "
"Mas veio o plot twist: eu escrevi essa musica porque minha mulher estava roncando do meu lado. Sem metafora. Sem poesia. So ronco. "
"A moral da historia: o amor e belo, mas o ronco e terrorismo sonoro. "
"Comenta RONCO FDP, curte, segue e compartilha. Se voce ronca, peca perdao e de like.")
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
