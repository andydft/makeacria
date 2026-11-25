# Script — Curiosidade Son Goku (Dragon Ball GT)

Preenchido a partir de `scripts/TEMPLATE-SCRIPT-curiosidade-musical.md` antes de gerar o vídeo.

## 1) OBJETO E SLUG
- **Objeto:** Son Goku em Dragon Ball GT — por que ele virou criança e o perigo das Esferas do Dragão de Estrelas Negras
- **Slug:** `dragon-ball-gt-goku-crianca`

## 2) SOBRE
- **Slug:** `dragon-ball-gt-goku-crianca`
- **Composição:** `DragonBallGtGokuCriancaCuriosity`
- **Duração alvo:** 35–45s
- **Formato:** 1080x1920 (9:16), 30 fps
- **Idioma:** pt-BR

## 3) TOM E VOZ
- **Tom:** curioso, nostálgico, com leve tensão no meio e fechamento intrigante
- **Voz (TTS):** Edge TTS `pt-BR-AntonioNeural`, `rate=+8%`, `pitch` neutro ou levemente grave conforme teste
- **Ritmo:** hook rápido, frases curtas, pausa pequena antes da virada
- **Regra:** boca anima só quando fala; fora da fala, neutra/sutil

## 4) HOOK (0–3s)
- **Texto:** “Você lembra por que o Goku virou criança de novo em Dragon Ball GT?”
- **Visual:** Goku GT criança em destaque no centro, nuvem voadora atrás, fundo espacial com estrelas e brilho laranja.

## 5) CTA (final)
- **Texto na tela:** “Segue pra mais curiosidades de anime!”
- **Fala:** “Se você curtia GT, segue pra mais curiosidades de anime.”
- **CTA simples, legível, sem poluir a cena.**

## 6) NARRAÇÃO / ESTRUTURA (por tempo)

| Tempo | Narração (pt-BR) | Visual / Cena |
|---|---|---|
| 0–3s | “Você lembra por que o Goku virou criança de novo em Dragon Ball GT?” | Hook grande. Goku GT criança no centro, olhar determinado, nuvem voadora ao fundo. |
| 3–10s | “No começo de GT, o Pilaf encontra as Esferas do Dragão de Estrelas Negras e, sem querer, deseja que o Goku volte a ser pequeno.” | Pilaf/silhueta cômica pequena ao lado, 7 esferas negras com estrelas vermelhas brilhando. |
| 10–20s | “Só que essas esferas não eram comuns: elas foram criadas pelo Kami antes de se separar do Piccolo Daimaoh, e tinham um poder muito mais perigoso.” | Close no Goku, fundo muda para templo/céu místico; esferas negras em primeiro plano com aura. |
| 20–32s | “Depois de um desejo, elas se espalham pela galáxia inteira. E o pior: se não forem reunidas em um ano, a Terra explode.” | Mapa/galáxia estilizada, esferas voando para pontos diferentes; Terra com contorno vermelho de perigo. |
| 32–40s | “Foi por isso que Goku, Pan e Trunks embarcaram numa jornada pelo espaço. Uma ideia simples que começou uma das fases mais polêmicas de Dragon Ball.” | Goku na nuvem voadora, Pan e nave/silhueta do Trunks ao fundo, sensação de aventura. |
| 40–45s | “Se você curtia GT, segue pra mais curiosidades de anime.” | CTA na tela, Goku acena/sorri leve, logo/encerramento limpo. |

## 7) ELEMENTOS VISUAIS / COMPOSIÇÃO

- **Personagem principal:** Son Goku GT (criança), versão canônica/versionada do projeto; sempre visível nas cenas-chave.
- **Props:** Nuvem Voadora, Esferas do Dragão de Estrelas Negras (estrelas vermelhas/pretas), Terra, estrelas/galáxia, nave/silhueta da aventura.
- **Fundo:** céu 3D colorido + espaço/galáxia estilizada; sem cenário vazio.
- **Composição 9:16:** Goku no terço central, texto seguro nas margens, CTA no topo ou inferior com contraste.
- **Câmera:** leve push-in no hook, drift lateral suave nas cenas de explicação, plano mais aberto no CTA.
- **Regra de cena:** manter profundidade (DOF leve), luz quente no personagem, legibilidade total em celular.

## 8) ÁUDIO / MÚSICA

- **Voz:** TTS Edge `pt-BR-AntonioNeural +8%`, gerar `voice.wav` e `words.json`.
- **Música:** não usar música comercial/copyright. Opção A: trilha synth original simples e discreta. Opção B: render silencioso para o usuário colocar música por cima.
- **SFX:** whoosh suave nas transições, brilho nas esferas, impacto leve na frase “a Terra explode”.
- **Mix:** voz sempre prioritária.

## 9) DIREÇÃO DE ARTE / ASSETS

- **Goku GT:** roupa azul/vermelha/branca do GT, cabelo preto espetado, expressão confiante/curiosa; boca só em fala.
- **Esferas Negras:** pretas com estrelas vermelhas, brilho roxo/vermelho para diferenciar das esferas comuns.
- **Nuvem Voadora:** dourada, volumétrica, cartoon.
- **Paleta:** laranja/azul espacial, preto estrelado, acentos vermelhos de perigo.
- **Evitar:** personagens fora de modelo, placeholders toscos, texto pequeno demais, fundo vazio.

## 10) CHECKLIST DE PRODUÇÃO

- [ ] Preencher template antes de gerar (este arquivo).
- [ ] Confirmar roteiro com usuário.
- [ ] Criar/usar asset versionado do Goku GT (não sobrescrever aprovado).
- [ ] Gerar voz com Edge TTS + `words.json`.
- [ ] Montar cena com Goku visível, nuvem voadora e elementos DBGT.
- [ ] Validar 9:16, safe area, legibilidade, sem boca constante.
- [ ] Render 1080x1920, 30fps, H264 CRF 22.
- [ ] Criar `scripts/COPY-dragon-ball-gt-goku-crianca.md`.
- [ ] Copiar MP4 para `D:\cartoon-short-assets\videos\...` e limpar `out/`.
- [ ] Commit/push.

## 11) FONTES / VERIFICAÇÃO RÁPIDA

- Dragon Ball GT, episódio 1 / premissa: Pilaf usa as Esferas do Dragão de Estrelas Negras e Goku vira criança.
- Esferas do Dragão de Estrelas Negras: criadas por Kami antes da separação de Piccolo Daimaoh; espalham-se pela galáxia após desejo; risco de destruição da Terra se não reunidas em um ano.
- Jornada inicial: Goku, Pan e Trunks viajam pelo espaço para recuperar as esferas.

*Observação: antes da render final, fazer checagem rápida de nomes/termos em PT-BR e manter a narração fiel à premissa sem exagerar fatos.*