# SCRIPT — Por que seu gato segue você até o banheiro?

**Duração alvo:** 50–60s (máx. 70s) | **Formato:** 9:16 (1080x1920, 30 fps) | **Idioma:** pt-BR  
**Tom:** curioso no início, acolhedor e emocional no final  
**Voz (TTS):** edge-tts `pt-BR-AntonioNeural`, rate +8%

## Narração (roteiro final, ~130 palavras)

> "Seu gato te segue até o banheiro por um motivo que você nunca imaginou.
> 
> Não é só curiosidade.
> 
> A primeira razão é instinto: portas fechadas significam território desconhecido, e ele precisa investigar.
> 
> A segunda é proteção. Na natureza, esse é o momento mais vulnerável, e ele está de guarda por você.
> 
> Mas a terceira razão é a mais bonita.
> 
> Para ele, você é a família. Ele só quer garantir que está perto de quem ele ama.
> 
> Então, da próxima vez, agradeça. Seu gato só não quer perder nenhum segundo ao seu lado.
> 
> Seu gato faz isso? Comenta aqui e me segue para mais curiosidades felinas."

## Cenas (segmentos, sincronizadas por `words.json`)
1. **Hook (0–5s):** "Seu gato te segue até o banheiro por um motivo que você nunca imaginou." — close do gato, corredor 3D desfocado (DOF), golden hour, dolly-in lento. Texto: "POR QUE ELE TE SEGUE?" (1s).
2. **A porta fechada (5–12s):** "Não é só curiosidade." — gato em frente à porta fechada, silhueta do dono de costas desaparecendo. Texto: "NÃO É SÓ CURIOSIDADE..." (7s).
3. **Instinto (12–22s):** "A primeira razão é instinto..." — close nos olhos, porta desfocada ao fundo. Texto: "1. INSTINTO" (14s).
4. **Proteção (22–34s):** "A segunda é proteção..." — gato ao lado da silhueta do dono (de costas). Texto: "2. PROTEÇÃO" (24s).
5. **Família (34–48s):** "Mas a terceira razão é a mais bonita..." — sala acolhedora, luz dourada, sofá desfocado. Texto: "3. VOCÊ É A FAMÍLIA" (36s).
6. **CTA (48–58s):** "Então, da próxima vez, agradeça..." — close final, fundo dourado com bloom. Textos: "ELE SÓ QUER FICAR PERTO DE VOCÊ" (48s), "SEU GATO FAZ ISSO? 👇 COMENTA AÍ" (53s), dolly-out lento.

## Personagens
- **Gato (asset único `public/gato-banheiro/cat.png`):** laranja de pelo curto, listras discretas mais escuras, focinho/peito creme, olhos verde-âmbar, nariz rosa, contorno escuro. Sem acessórios. Mesma imagem em todas as cenas (posição/escala/rotação/respiração).
- **Dono:** apenas silhueta de costas (sem rosto), cenas 1 e 4.

## Áudio
- Narração: `public/gato-banheiro/voice.wav` (0 dB)
- Timing: `public/gato-banheiro/words.json`
- Música: `public/gato-banheiro/music.wav` (CC0/gerada localmente, mix ~-20 dB vs voz)

## Estilo
Exclusivamente **jimi-3d-short-v2** (2D em cartão/canvas com contorno em mundo 3D, ink, DOF/lens blur, bloom, tone mapping neutral, grade dia/golden). Proibido v1 "bolinha", 2D flat puro, fotorrealismo e múltiplos personagens complexos.
