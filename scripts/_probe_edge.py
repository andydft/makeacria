import asyncio, edge_tts, json, sys

async def main():
    comm = edge_tts.Communicate("A música que definiu uma geração inteira foi criada em um quarto bagunçado, com um teclado de cinquenta dólares. Em 2000, o Hybrid Theory vendeu mais de trinta milhões de cópias.", "pt-BR-AntonioNeural", rate="+8%", boundary="WordBoundary")
    types = {}
    n = 0
    async for chunk in comm.stream():
        t = chunk["type"]
        types[t] = types.get(t, 0) + 1
        if t == "WordBoundary":
            print(json.dumps(chunk, ensure_ascii=False), flush=True)
            n += 1
            if n >= 14:
                break
    print("TYPES", types, flush=True)

asyncio.run(main())
