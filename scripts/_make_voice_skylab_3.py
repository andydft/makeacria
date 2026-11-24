"""Voz Skylab 3 - Ronco"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+8%"; OUT=os.path.join("public","skylab-story-3-snoring")
TEXT=("Oi, eu sou Rogério Skylab. Eu escrevi uma música cheia de ódio, mas a inspiração era amorosa. Curte, segue e compartilha esse caos doméstico! "
"O pessoal acha que minhas letras nascem de grandes crises existenciais, tormentos cósmicos e filosofia pesada. "
"A música Pára de Roncar, FDP, parece puro ódio. "
"Mas veio o plot twist: eu me inspirei na minha mulher roncando do meu lado. Sem metáfora. Sem poesia. Só ronco e desespero. "
"A moral da história: o amor é lindo, mas dormir ao lado de quem ronca é arte performática. "
"Comenta RONCO FDP, curte, segue e manda pra quem ronca feito um trator!")
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
