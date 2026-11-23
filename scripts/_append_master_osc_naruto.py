# -*- coding: utf-8 -*-
path = r"C:\Users\Pichau\cartoon-short\PROMPT_MESTRE_VIDEOS_MUSICAIS.txt"
entry = """

---

# PROMPT SALVO — 2026-11-23 — one-step-closer-naruto-link

## Pedido do usuário
"consegeu contar a historia de one step closer e linkar com naruto?" / "pode fazer"

## Direção
- Vídeo curto 9:16 (1080x1920, 30fps, H264 CRF 22), estilo `jimi-3d-short-v2` com personagens SVG base.
- Contar a história de "One Step Closer" (Linkin Park, Hybrid Theory, 2000): frustração no estúdio, pressão do produtor Don Gilmore, Chester chegando ao limite, a frase "Shut up when I'm talking to you" virando catarse.
- Link temático com Naruto: sentimento de ser empurrado ao limite, isolamento/pressão/raiva acumulada, mas sem usar assets protegidos de Naruto (sem clipes, arte oficial, logos, trilha, personagens copiados). Naruto pode ser citado como referência cultural na narração, com cuidado.
- Narração pt-BR-AntonioNeural (+8%), voice.wav + words.json.
- Sem música protegida; usar som original/sintético leve ou só narração.
- CTA final padrão do canal.
"""
with open(path, "a", encoding="utf-8") as f:
    f.write(entry)
print("ok")
