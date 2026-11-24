"""Voz Skylab 2 - Jô Soares"""
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+0%"; PITCH="-4Hz"; OUT=os.path.join("public","skylab-story-2-jo-soares")
TEXT=("Boa noite. Eu sou Rogério Skylab. E hoje eu vou te contar como fui humilhado ao vivo na televisão brasileira. Curte, segue e compartilha esse desastre. "
"Na minha primeira vez no programa do Jô, eu tive uma ideia brilhante: dizer que Ayrton Senna era um peão das multinacionais. "
"A plateia me vaiou. O Jô me olhou com desprezo. Eu senti minha carreira evaporar em rede nacional. "
"Mas veio o plot twist: o Jô pediu pra eu cantar. Eu cantei. O público aplaudiu. Cantei outra. Aplaudiram mais. Eu voltei dos mortos ao vivo. "
"A moral da história: quando o mundo te odeia, canta. Se não resolver, canta mais alto. "
"Comenta VIRA VIRA, curte, segue e compartilha. Me ajuda, eu sobrevivi à humilhação, eu mereço.")
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
