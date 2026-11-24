"""Voz Skylab 2 - Jô Soares"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+8%"; OUT=os.path.join("public","skylab-story-2-jo-soares")
TEXT=("Oi, eu sou Rogério Skylab. Eu fui vaiado ao vivo no Jô Soares e achei que minha carreira tinha acabado. Curte, segue e compartilha esse vexame histórico! "
"Na minha primeira vez no programa do Jô, eu resolvi soltar uma frase filosófica: disse que o Ayrton Senna era um peão das multinacionais. "
"A plateia me vaiou na hora. O Jô não gostou. Eu senti o cheiro do cancelamento antes do cancelamento existir. "
"Mas veio o plot twist: o Jô me pediu pra cantar. Eu cantei, o público aplaudiu, cantei de novo, aplaudiram mais. "
"A moral da história: quando a vida te vaia, canta até o povo esquecer. "
"Comenta VIRA VIRA, curte, segue e manda pra quem já passou vergonha ao vivo!")
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
