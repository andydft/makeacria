# -*- coding: utf-8 -*-
path = r"C:\Users\Pichau\cartoon-short\PROMPT_MESTRE_VIDEOS_MUSICAIS.txt"
entry = """

---

# PROMPT SALVO — 2026-11-22 — mike-shinoda (v2 remake)

## Pedido do usuário
"ta de boa assim, agora eu quero que voce faça refaça um videoq ue ficou muiuto bom, ma agora nos vamos fazer na nossa nova cersão usando o chester o mike, os bones os cabelos, tudo baseado no chetges novo, eu queroq eu voce que voce refaça o video mike-shinoda, pode mudar um pouco o audio pra nao dar prolbmea mas refala ele, agora com toda essa nova qualidaded"

## Direção
- Refazer o vídeo `mike-shinoda` (MikeShinodaShort) na nova versão com qualidade do personagem-base SVG (`src/characters/base/MaleBaseCharacter.tsx`).
- Usar Chester e Mike como personagens baseados no novo sistema: cabelo espetado amarelo, boné, variações de cabelo/acessórios conforme cena.
- Manter formato 1080x1920, 30fps, H264 CRF 22, estilo v2.
- Pode ajustar levemente a narração/áudio para evitar problemas e regravar TTS (pt-BR-AntonioNeural, rate +8% ou próximo), gerando `voice.wav` + `words.json`.
- Manter fatos verificados do script original; atualizar roteiro conforme necessário.
- Sem música protegida; áudio original/sintético simples se necessário.
"""
with open(path, "a", encoding="utf-8") as f:
    f.write(entry)
print("ok")
