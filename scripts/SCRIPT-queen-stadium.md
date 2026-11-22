# SCRIPT — A origem genial do ritmo de "We Will Rock You" (Queen)

**Duração alvo:** 65–75s (> 60s) | **Formato:** 9:16 (1080x1920, 30 fps) | **Idioma:** pt-BR  
**Tom:** curioso e revelador no início, épico e emocionante no meio, impactante e nostálgico no final  
**Voz (TTS):** edge-tts `pt-BR-AntonioNeural`, `rate=+8%`  
**Hook (0–3s):** “O ritmo mais icônico do rock não foi criado para ser legal. Foi criado por uma emergência genial do Freddie Mercury.”  
**CTA final:** “Agora você nunca mais vai ouvir essa música do mesmo jeito. Manda esse vídeo agora para aquele seu amigo que ama Queen!”

## Narração (roteiro final, ~190 palavras)

> "O ritmo mais icônico do rock, We Will Rock You, da banda Queen, não foi criado para ser apenas legal. Ele nasceu de uma emergência genial do Freddie Mercury.
> 
> Era 1977. A banda tocava em um estádio gigantesco, lotado com mais de oitenta mil pessoas. De repente, no meio da apresentação, o sistema de som falhou completamente. O som simplesmente desapareceu.
> 
> O silêncio tenso poderia ter arruinado o show inteiro. Mas, naquele momento, Freddie Mercury teve um estalo. Ele percebeu que a única forma de fazer aquela multidão colossal participar, sem precisar de microfones ou caixas de som, era usar o próprio corpo humano como instrumento.
> 
> Então ele pediu para todos baterem os pés no chão, duas vezes. E depois, dar uma palma bem forte.
> 
> Pisada, pisada, palma.
> 
> Simples. Poderoso. E funcionou perfeitamente, criando a vibração mais intensa que aquele estádio já tinha visto em toda a sua história.
> 
> Agora você sabe: esse hino não é só música. É a prova de que a verdadeira conexão não precisa de tecnologia, só de ritmo, de união e de energia.
> 
> Agora você nunca mais vai ouvir essa música do mesmo jeito. Manda esse vídeo agora para aquele seu amigo que ama Queen!"

## Pontos obrigatórios cobertos
- Ritmo não criado para ser “legal”, nasceu de uma emergência.
- 1977, estádio com mais de 80.000 pessoas.
- Sistema de som falhou completamente durante o show.
- Estalo genial de Freddie: usar o corpo humano como instrumento.
- Pedido ao público: pés duas vezes e uma palma — “Pisada, pisada, palma”.
- Simples, poderoso, vibração intensa.
- Conclusão: conexão verdadeira não precisa de tecnologia, só de ritmo.
- CTA final de compartilhamento para amigo fã de Queen.

## Cenas planejadas (guiadas por `words.json`)
1. **Hook/Backstage (misterioso):** Freddie confiante se preparando, luzes roxas/azuis, close/médio.
2. **Estádio 1977:** palco enorme, 80.000 pessoas (silhuetas), energia de show.
3. **Falha do som (tensão):** som some, silêncio, Freddie preocupado, chiado/silêncio visual.
4. **Estalo genial:** close no olhar/iluminação de ideia, Freddie percebe o corpo como instrumento.
5. **Convocação:** Freddie gesticula para o público; banda ao fundo reagindo.
6. **Pisada, pisada, palma (clímax):** micro-cortes/punch-ins sincronizados com “Pisada, pisada, palma”, estádio responde (pés/palmas).
7. **Vibração épica:** estádio pulsando em dourado/vermelho, multidão em uníssono, Freddie triunfante.
8. **Conclusão/CTA (nostálgico, golden hour):** close em Freddie com bloom/partículas de luz e CTA final.

## Personagens e assets
- **Freddie Mercury (asset principal, design consistente):** bigode icônico curto, cabelo escuro volumoso levemente ondulado, regata branca justa, calça jeans justa escura, postura confiante/carismática, olhar expressivo. Cartoon 2D com contorno ink, reutilizado em todas as cenas com variações de expressão/pose. `public/queen-stadium/freddie.png` (+ variações de expressão se geradas).
- **Banda (secundários simplificados):** silhuetas/cartoon 2D básicos ao fundo (máx. 3–4 com algum detalhe por cena), foco no Freddie.
- **Público:** silhuetas/mãos levantadas/multidão estilizada no estádio.

## Áudio
- Narração: `public/queen-stadium/voice.wav` (0 dB), `pt-BR-AntonioNeural`, `rate=+8%`
- Timing: `public/queen-stadium/words.json` (segmentos e palavras com `start/end`)
- Música: `public/queen-stadium/music.wav` (instrumental épico/stadium, crescente, CC0/gerada localmente — sem Queen/copyright), mix ~-20 dB
- SFX (se viável): `public/queen-stadium/sfx_*` discretos (chiado/falha, impacto/palma-pisada, whoosh), voz sempre principal

## Estilo
Exclusivamente **`jimi-3d-short-v2`** (2D em cartão/canvas com contorno ink em mundo 3D, DOF/lens blur, bloom discreto, tone mapping neutral, grade dia/golden hour, câmera suave). Proibido v1 "bolinha", 2D flat puro, fotorrealismo e mistura de estilos.
