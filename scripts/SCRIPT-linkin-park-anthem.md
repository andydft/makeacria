# SCRIPT — "In the End" quase foi descartada (Linkin Park)

**Slug:** `linkin-park-anthem` | **Composição:** `LinkinParkAnthemShort`
**Duração alvo:** 65–75s (> 60s) | **Formato:** 1080x1920 (9:16), 30 fps | **Idioma:** pt-BR
**Tom:** tenso e rebelde no início, determinado no meio, triunfante e emocional no final.
**Voz (TTS):** edge-tts `pt-BR-AntonioNeural`, `rate=+8%`
**Hook (0–3s):** "A música mais icônica do Linkin Park, In the End, quase foi jogada no lixo pela própria gravadora."
**CTA final:** "Essa história te arrepia? Comenta 'LP' aqui embaixo e manda esse vídeo agora para aquele amigo que nunca cansa de ouvir Linkin Park."

## Narração (voz ~70s, composição com cauda visual > 60s)
> "A música mais icônica do Linkin Park, In the End, quase foi jogada no lixo pela própria gravadora.
> 
> No final dos anos noventa, durante as gravações do álbum Hybrid Theory, a Warner Bros ouviu a mistura de rap pesado, rock e um piano melancólico... e achou que aquilo era simplesmente um erro comercial.
> 
> Eles não entenderam a visão. E disseram, sem hesitar, para cortar a faixa do álbum.
> 
> Mas Chester Bennington e Mike Shinoda se recusaram a aceitar. Eles sabiam, no fundo, que aquela música era diferente. Eles sentiram que ela precisava existir, do jeito que era.
> 
> Então eles lutaram contra os executivos, bateram o pé, mantiveram a faixa intacta... e a lançaram como single para o mundo.
> 
> O resultado? A música explodiu, definiu uma geração inteira, atravessou fronteiras... e se tornou um hino mundial que nunca envelhece.
> 
> Às vezes, a verdadeira arte não pede permissão. Ela precisa ter coragem para ignorar os especialistas.
> 
> Essa história te arrepia? Comenta 'LP' aqui embaixo... e manda esse vídeo agora para aquele amigo que nunca cansa de ouvir Linkin Park."

## Pontos obrigatórios cobertos
- Quase foi cortada do álbum Hybrid Theory. (incluído)
- Gravadora achou mistura de rap, rock e piano um "erro comercial". (incluído)
- Chester Bennington e Mike Shinoda se recusaram a ceder e lutaram pela faixa. (incluído)
- Tornou-se hino mundial e definiu uma geração. (incluído)
- Conclusão: verdadeira arte às vezes precisa ignorar os "especialistas" (não pede permissão/precisa ter coragem). (incluído)

## Cenas e elenco (seção 5 — sem omissões, sem oclusão)
1. **Rejeição / Hook (0–~12s, tensão):** sala de reunião fria da gravadora (mesa de vidro, luz fluorescente azul, paredes frias). **Executivo** (terno escuro, óculos, braços cruzados, cético, centro) nega; **Chester** (cabelo castanho curto/médio, tatuagens estilizadas braço 2D ink, regata preta, calça escura) e **Mike** (boné aba reta 2000s, camisa larga/moletom escuro, fones no pescoço) frustrados ao fundo. Plano médio. Posições: Exec centro, Chester esq-fundo, Mike dir-fundo — **todos visíveis, sem sobreposição**.
2. **O "erro comercial" (12–~22s, rebelde):** estúdio escuro (LEDs vermelho/verde, mesa de mixagem/teclado, cabos, monitores). **Mike** determinado na mesa; **Chester** ao lado dele, cúmplices/determinados. Plano médio. Chester esq, Mike dir — **sem sobreposição**.
3. **A luta (22–~38s, determinação):** estúdio, ângulo diferente. **Chester** no microfone cantando com paixão (olhos fechados/determinado); **Mike** assentindo/focado ao fundo. Close/médio de Chester (offset) com **Mike visível** ao fundo. Executivo **NÃO** aparece.
4. **O hino mundial (38–~53s, triunfo):** **PLANO GERAL (WIDE)** — palco elevado + **Chester** (centro-esq, microfone) + **Mike** (centro-dir) + **multidão LOTADA** (dezenas de milhares, múltiplas camadas de silhuetas 2D ink, braços levantados, pontos de luz/isqueiros-celulares com bloom, fumaça). Luz dourada/vermelha intensa, bloom. **Todos visíveis, sem oclusão**.
5. **Conclusão emocional (53–~65s):** **PLANO GERAL** de contexto + close **Chester** triunfante (sorriso leve, offset) com **Mike** e **multidão** visíveis ao fundo em DOF forte, golden hour suave.
6. **CTA final (65s–fim, >60s):** **Chester** close apontando levemente para a tela (offset), texto CTA, fundo dourado com partículas de luz, **multidão/palco** presentes em DOF atrás.

## Regras de visibilidade (checklist)
- 3 personagens principais + multidão. Chester e Mike visíveis em todas as cenas relevantes (1–6); Executivo apenas 1–2.
- **Sem oclusão:** layout com Chester centro-esq e Mike centro-dir nas cenas de palco/estúdio; ninguém cobre/oculta outro.
- Multidão LOTADA e reagindo nos beats (clímax "hino mundial") nas cenas 4–6.
- ≥2 planos gerais (wide) mostram palco + Chester + Mike + multidão lotada (cenas 4 e 5).
- Design consistente: Chester (tatuagens + regata preta, microfone), Mike (boné + fones), Executivo (terno + óculos).

## Áudio
- Voz: `pt-BR-AntonioNeural` +8% → `public/linkin-park-anthem/voice.wav` + `words.json` (dirige cortes/câmera/texto/ações).
- Música: Cinematic Rock/Nu-Metal Instrumental CC0/local original (tensão→explosão) → `music.wav`/`music.mp3`, mix ~0.1 (-20 dB). **Sem música original do Linkin Park.**
- SFX discretos: `sfx_rewind.wav` (início), `sfx_kick1/2.wav` (impactos/clímax), `sfx_crowd.wav` (palco/multidão). Voz dominante.

## Estilo
Exclusivo `jimi-3d-short-v2` (2D ink em mundo 3D, ink/DOF/bloom/neutral/day-golden, câmera dinâmica). Paleta: azul frio, vermelho, preto, dourado. Sem v1 bolinha, sem 2D flat, sem fotorrealismo.