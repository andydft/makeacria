# SCRIPT — Chester Bennington / Crawling (Chester Crawling Short)

## Metadados
- **Slug:** `chester-crawling`
- **Composição:** `ChesterCrawlingShort`
- **Duração alvo:** 72s (1080x1920, 30fps, >60s)
- **Idioma:** pt-BR
- **Tom:** curioso, envolvente, narrativo, com energia e emoção
- **CTA:** “Qual música do Chester mais marcou a sua vida?”

## Fatos verificados (fontes confiáveis)
- *Crawling* foi lançada no álbum *Hybrid Theory* (2000), álbum de estreia do Linkin Park. (Wikipedia/LP oficial)
- Chester Bennington explicou que *Crawling* fala sobre a sensação de perder o controle de si mesmo e suas lutas com abuso de substâncias/álcool; também sobre assumir responsabilidade por suas ações. (entrevistas/reportagens amplamente citadas)
- *Crawling* venceu o Grammy de **Best Hard Rock Performance** em 2002 (44th Grammy Awards). 

## Narração (base aprovada)
1. Chester Bennington ganhou um Grammy cantando sobre uma batalha que ele sentia que não conseguia controlar.
2. E o mais surpreendente é que essa história está escondida em uma das músicas mais famosas do Linkin Park.
3. Em 2000, a banda lançou *Crawling*, no álbum *Hybrid Theory*.
4. Mas aquela música não era simplesmente sobre estar triste ou sofrer por alguém.
5. Anos depois, Chester explicou que ela falava sobre a sensação de perder o controle de si mesmo, especialmente durante suas dificuldades com drogas e álcool.
6. Era uma luta interna. Aquela sensação de querer mudar, mas continuar enfrentando os mesmos problemas.
7. E Chester não tentava transformar isso em uma história de vítima.
8. Em uma entrevista, ele explicou que a música também falava sobre assumir responsabilidade pelas próprias ações.
9. Talvez por isso tanta gente tenha se identificado com ela.
10. Em 2002, *Crawling* venceu o Grammy de Melhor Performance de Hard Rock.
11. Chester transformou uma experiência pessoal em uma música que milhões de pessoas passaram a usar para expressar aquilo que não conseguiam colocar em palavras.
12. E é por isso que a voz dele continua marcando tanta gente até hoje.
13. Qual música do Chester mais marcou a sua vida?

## Cenas / Storyboard
| # | Tempo aprox. | Cena | Imagem Chester | Visual | Texto na tela |
|---|---:|---|---|---|---|
| 1 | 0–4s | Hook | normal | Close-up, punch-in, fundo escuro com azul elétrico e vermelho | ELE GANHOU UM GRAMMY… |
| 2 | 4–12s | A música | normal | Estúdio de gravação, plano médio abre para microfone/instrumentos | CRAWLING • 2000 |
| 3 | 12–25s | O conflito | triste | Espelho de camarim/ambiente introspectivo, luz fria, câmera aproxima | UMA BATALHA INTERNA |
| 4 | 25–38s | A revelação | cantando | Palco/microfone, luzes azuis/vermelhas, close e médio | PERDER O CONTROLE |
| 5 | 38–52s | Responsabilidade | triste ou normal | Palco vazio, pausa visual, luz de recorte | ASSUMIR O CONTROLE |
| 6 | 52–65s | O Grammy | normal | Premiação estilizada dourado e azul, troféu ao lado | GRAMMY • 2002 |
| 7 | 65–72s | Final emocional/CTA | normal | Plateia estilizada, luzes coloridas, close final | QUAL MÚSICA MARCOU SUA VIDA? |

## Direção de arte
- Paleta variada por cena: azul elétrico/azul profundo/vermelho/magenta no palco/estúdio; tons frios no introspectivo; dourado reservado ao Grammy.
- Preservar camiseta cinza-clara, cabelo loiro, tatuagens e contorno ink da arte original.
- Iluminação com personalidade (key/fill/rim/luzes coloridas), sem look lavado.
- Personagem sempre legível, sem morphing/deformação; variedade por câmera/enquadramento/parallax/luz.

## Áudio
- Narração: `edge-tts`, `pt-BR-AntonioNeural`, `rate=+8%`, `voice.wav`, `words.json`.
- Música: rock alternativo instrumental original/CC0, ~-20 dB sob voz. Sem gravação/melodia protegida de *Crawling*.
- SFX discretos: whoosh/cut, impacto leve, crowd/grandioso no Grammy/CTA.

## v2 — versão dinâmica para TikTok (21/11/2026)
- **20 planos** com cortes secos em vez de 7 blocos longos; todos os planos têm push-in contínuo (nada de hold estático).
- **Punches sincronizados às palavras** de `words.json`: Grammy, batalha, 2000, Crawling, controle, responsabilidade, 2002, milhões, vida — com avanço de câmera, shake que alterna sinal, roll de impacto e pico de bloom.
- **Close-ups extremos** (fov 31–34°) intercalados com planos médios/wides (fov 42–47°), foco no rosto e DOF variável por plano.
- **Elementos de fundo animados**: vigas de luz coloridas, equalizador, vinil girando no estúdio, partículas de poeira, refletores pulsantes, silhuetas da plateia com braços erguidos, troféu no Grammy.
- Textos de gancho mantidos, agora com entrada com overshoot/rotação sutil.
- Aleatoriedade determinística (`random()` do Remotion) para plateia e partículas — sem flicker entre frames.
