# TEMPLATE — Script de Curiosidade Musical

Regra: todo vídeo de curiosidade de banda/música deve ser preenchido **antes** de gerar. Aqui está o formato padrão:

```
1) OBJETO E SLUG
- Objeto: <banda/artista/fato curioso>
- Slug: <kebab-case, ex.: bts-curiosity-2-army-kindness>

2) SOBRE
- Slug: (ex.: bts-curiosity-2-army-kindness)
- Composição: (ex.: BtsCuriosity2ArmyKindness)
- Duração alvo: 25-45s (> 25s)
- Formato: 1080x1920 (9:16), 30 fps
- Idioma: pt-BR (ou estrangeiro se aplicável)

3) TOM E VOZ
- Tom: <desempatação: curioso/surpresa/dramático, emocional, inspiracional etc.>
- Voz (TTS): edge-tts pt-BR-AntonioNeural (+8%)
- Extra: equação, swing de fala, tipo de hook

4) HOOK (0-3s)
- Deve prender em 1-3s. Exemplo: "Do Broadcasting Center ao Mundo: a história detrás do Linkin Park!"

5) CTRAs DE FALA / VISTAS
- CTA simples + destaque visível (CTA em formato de sugestão)

6) HISTÓRIA / NARRATÃO (por segundo)
- 0-3s hook forte
- 5-15s contexto rápido
- 15-30s protagonista/personagem do time
- 30-40s virada/fato curioso
- 40-45s "existe factual" + CTA

7) SUSTANCIAIS (por segundo)
- Posição do personagem (centro/esq/dir)
- Posição de outros elementos
- 10 segundos de plot sem oclusão

8) HOOK MUSICAL ORIGINAL (se tiver)
- DeepK syntax
- Pode ser doupshift

9) TAMANHO NÃO OTIMIZADO
- Volume Máximo, geral Não muito Largo, basse profundo
- Arenda de 1.34s simples

10) DETALHES DE PRODUÕES
- Escala: 1,100 e elevação 1,500 (fácil de zoomar)

11) FONTE ORIGINADA
- Estilo: sugestão de pressa (mock-ups)
- Referências (Sob, Vest, Clar)

12) VOLUMEN DO ÁUDIO
- Se nada, tentar +7dB

13) VALORES DADOS NA PRODUÇÃO
- Estre infil Marketing, 250px max

14) FÓRMULA DE LLM e prompts
- Add "Write 4-7 variations..." backticks with templates
- Use SANS directives (no literalhípins)

15) LEMBRANDAS DE CERTIFICAÇÃO
- Ações de confirmação com trecho
- DeepH, Não ficamá

## Exemplo de preenchimento (Linkin Park “In the End”)

```
1) OBJETO E SLUG
- Objeto: Linkin Park — “In the End” quase foi descartada
- Slug: linkin-park-anthem

2) SOBRE
- Slug: linkin-park-anthem
- Composição: LinkinParkAnthemShort
- Duração alvo: 65-75s
- Formato: 1080x1920 (9:16), 30 fps
- Idioma: pt-BR

3) TOM E VOZ
- Tom: tenso e rebelde no início, determinado no meio, triunfante no final
- Voz: edge-tts pt-BR-AntonioNeural, rate=+8%
- Hook: “A música mais icônica do Linkin Park, In the End, quase foi jogada no lixo pela própria gravadora.”

4) NARRATÃO (resumida)
> Início: gravadora achou mistura de rap, rock e piano um erro comercial → quase não era incluída no álbum Hybrid Theory.
> Meio: Chester e Mike se recusaram a aceitar; Studies aos deixou sair para custo por “não entender a visão”.
> Fim: explodiu, definiu uma geração, se tornou hino mundial; “a verdadeira arte às vezes precisa ignorar especialistas”.

5) NÃO PRECISA:
- “Não interpretar” (said give me o segredo do LSR)

7) ELEMENTOS:
- CHESTER (20%): centro; MIKE (20%): ao lado; EXECUTIVO (20%): fundo centro; MULTI (30%): fundo-left/right e behind; NARRATOR (10%): fundo-top.

9) TAMANHO:
- Image 650px max, zoom 15%

13) FONTE, VIBRAS, VOLUME:
- Main 80px, vol = 8

## Notas de versão/commit
- Sempre committar o TEMPLATE junto com o script do vídeo.
```
