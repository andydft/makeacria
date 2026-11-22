"""Gera voice.wav + words.json para Emily Armstrong Linkin Park origin via edge-tts."""
import asyncio, json, os, subprocess, tempfile
import edge_tts

BASE = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\emily-armstrong-linkin-park-origin"
VOICE = "pt-BR-AntonioNeural"
RATE = "+15%"
DURATION = 80.0

SENTENCES = [
    "Emily Armstrong não fez uma audição tradicional para entrar no Linkin Park… e um comentário de Joe Hahn ajudou a mudar tudo.",
    "A história começou anos antes do anúncio.",
    "Em 2019, Emily, vocalista do Dead Sara, começou a trabalhar com Mike Shinoda em algumas sessões de composição.",
    "Naquela época, eles não estavam procurando uma nova cantora para o Linkin Park. Estavam apenas fazendo música.",
    "Anos depois, Mike voltou a trabalhar com Emily e outros músicos, enquanto a banda tentava descobrir como seguir em frente.",
    "E foi aí que algo começou a mudar.",
    "Mike percebeu que, quando Emily cantava nas novas músicas, pela primeira vez aquela voz fazia sua cabeça aceitar: isso soa como Linkin Park.",
    "Mas a grande virada aconteceu durante uma conversa no estúdio.",
    "Joe Hahn perguntou se Emily poderia cantar músicas inteiras, como vocal principal, para que eles ouvissem como ficariam.",
    "Mike ficou surpreso. Ele já acreditava nela… mas agora Joe também tinha chegado àquela conclusão sozinho.",
    "As sessões deixaram de ser apenas encontros para escrever música. Emily começou a se tornar parte do futuro da banda.",
    "E quando finalmente recebeu o convite, ela mal conseguia acreditar.",
    "A garota que começou apenas compondo com Mike Shinoda acabou se tornando uma das vozes do novo Linkin Park.",
    "Não foi uma audição comum. Foi uma conexão musical que cresceu até se tornar uma nova história.",
    "Você acha que Emily combina com o novo Linkin Park? Conta nos comentários.",
]

TEXT = " ".join(SENTENCES)


def toks(s: str):
    return [w.strip(".,;:!?\"'…—-()[]") for w in s.split() if w.strip(".,;:!?\"'…—-()[]")]


def vtt_time(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


async def main():
    os.makedirs(BASE, exist_ok=True)
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE, boundary="WordBoundary")
    audio = bytearray()
    wb = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            wb.append({"word": chunk["text"], "start": round(chunk["offset"] / 1e7, 3), "end": round((chunk["offset"] + chunk["duration"]) / 1e7, 3)})

    expected = sum(len(toks(s)) for s in SENTENCES)
    print("WORD BOUNDARIES", len(wb), "EXPECTED", expected, flush=True)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        mp3 = f.name
        f.write(audio)
    wav = os.path.join(BASE, "voice.wav")
    subprocess.run(["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.unlink(mp3)

    words, cues, idx = [], [], 0
    for sent in SENTENCES:
        want = len(toks(sent))
        chunk = wb[idx:idx + want]
        if len(chunk) < want and idx < len(wb):
            chunk = wb[idx:]; idx = len(wb)
        else:
            idx += want
        if not chunk: continue
        s, e = chunk[0]["start"], chunk[-1]["end"]
        cues.append({"start": s, "end": e, "text": sent})
        words.extend(chunk)
    if idx < len(wb):
        words.extend(wb[idx:]); cues[-1]["end"] = wb[-1]["end"]

    duration = max(DURATION, (words[-1]["end"] + 1.5) if words else DURATION)
    segments = [{"start": cues[i]["start"], "end": cues[min(i + 2, len(cues) - 1)]["end"], "text": " ".join(cues[j]["text"] for j in range(i, min(i + 3, len(cues))))} for i in range(0, len(cues), 3)]

    with open(os.path.join(BASE, "words_raw.vtt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{vtt_time(c['start'])} --> {vtt_time(c['end'])}\n{c['text']}\n\n")
    out = {"language": "pt-BR", "duration": round(duration, 3), "voice": VOICE, "rate": RATE, "segments": segments, "cues": cues, "words": words}
    with open(os.path.join(BASE, "words.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(BASE, "narration.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(SENTENCES))
    print("DURATION", round(duration, 3), "CUES", len(cues), "WORDS", len(words), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
