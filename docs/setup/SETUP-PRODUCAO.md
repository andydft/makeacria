# Setup de Produção — Cartoon Short / Remotion

Documentação do setup usado para produzir os shorts 9:16 (música, curiosidades, histórias) no projeto `jimi-broom-short`.

## 1) Visão geral

- **Repo:** `C:\Users\Pichau\cartoon-short\jimi-broom-short`
- **GitHub:** `https://github.com/andydft/makeacria.git` (branch `master`)
- **Assets/entregas no D:** `D:\cartoon-short-assets\`
- **Prompt mestre:** `C:\Users\Pichau\cartoon-short\PROMPT_MESTRE_VIDEOS_MUSICAIS.txt` (atualizar/abrir quando salvar novo prompt)
- **Arquivo de emergência:** `C:\Users\Pichau\Desktop\EMERGENCIA_PROJETO_CARTOON_SHORT.md`

## 2) Ambiente / pré-requisitos

- **OS:** Windows (PowerShell)
- **Node.js / npm:** usado via `npx remotion ...`
- **Python:** usado para gerar TTS com `edge-tts`
- **Chrome para render Remotion:** `C:\Program Files\Google\Chrome\Application\chrome.exe`
- **Temp Remotion (obrigatório neste setup):** `C:\remotion-tmp`
  - Antes de render/still:  
    ```powershell
    $env:REMOTION_TMP="C:\remotion-tmp"; $env:TEMP="C:\remotion-tmp"; $env:TMP="C:\remotion-tmp"
    ```
- **C: quase cheio:** após render, copiar MP4 para D e limpar `out/` local.

## 3) Comandos principais

No diretório do repo:

```powershell
cd C:\Users\Pichau\cartoon-short\jimi-broom-short
$env:REMOTION_TMP="C:\remotion-tmp"; $env:TEMP="C:\remotion-tmp"; $env:TMP="C:\remotion-tmp"
```

### Still (frame)
```powershell
npx remotion still src/index.ts <CompositionId> out/<nome>.png --frame=0 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### Render vídeo
```powershell
npx remotion render src/index.ts <CompositionId> out/<nome>.mp4 --codec=h264 --crf=22 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## 4) Padrão de vídeo

- **Formato:** 1080x1920, 9:16
- **FPS:** 30
- **Codec:** H264, CRF 22
- **Composição:** registrada em `src/Root.tsx`
- **Estilo visual:** cards 2D/cartoon com contorno em ambiente 3D (Three.js via `@remotion/three`), cenários ricos, DOF/bloom/tone/grade.
- **Safe area:** manter personagens legíveis e centralizados; evitar cortar cabeça/pés.
- **Animação:** piscar ok; corpo/balanço ok; **boca só anima quando fala/canta**. Em shows silenciosos, usar ciclo de boca por tempo/BPM/cues.
- **Áudio:** sem música comercial com copyright no render. Shows musicais podem ser silenciosos para overlay no CapCut.

## 5) TTS / narração

- **Voz padrão:** `pt-BR-AntonioNeural` (Edge TTS)
- **Rate comum:** `+8%`; para tom mais emocional/deadpan pode ajustar, ex.: `rate="+0%"`, `pitch="-3Hz"` / `"-4Hz"`.
- **Saída por vídeo:** `public/<slug>/voice.wav` e `public/<slug>/words.json`
- **Script padrão:** `scripts/_make_voice_<slug>.py`

Modelo:

```python
import asyncio, json, os, edge_tts
VOICE="pt-BR-AntonioNeural"; RATE="+8%"
OUT=os.path.join("public","<slug>")
TEXT="..."
async def main():
    os.makedirs(OUT, exist_ok=True)
    comm=edge_tts.Communicate(TEXT,VOICE,rate=RATE,boundary="WordBoundary")
    words=[]; audio=bytearray()
    async for chunk in comm.stream():
        if chunk["type"]=="audio": audio.extend(chunk["data"])
        elif chunk["type"]=="WordBoundary":
            words.append({"text":chunk["text"],"offset":chunk["offset"]/10_000_000,"duration":chunk["duration"]/10_000_000})
    open(os.path.join(OUT,"voice.wav"),"wb").write(audio)
    json.dump({"voice":VOICE,"rate":RATE,"text":TEXT,"words":words},open(os.path.join(OUT,"words.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
asyncio.run(main())
```

## 6) Estrutura do projeto

- `src/Root.tsx` — registro de composições Remotion
- `src/videos/...` — componentes de vídeo por projeto
- `src/characters/base/` — base de personagens (ex.: `MaleBaseCharacter.tsx`)
- `src/characters/presets/` — presets/componentes específicos (BTS, Fresno, Bob Marley, Skylab etc.)
- `src/videos/jimi3d/` — efeitos/ink/lens/grade usados nos vídeos 3D
- `public/` — áudio/words/svgs/assets públicos
- `public/reference/` — SVGs de palco/props/referências
- `assets/characters/` — assets versionados de personagens
- `scripts/` — TTS, copy, utilitários
- `out/` — renders temporários (limpar após copiar para D)
- `docs/setup/` — esta documentação

## 7) Personagens / presets

### Regra principal
**Nunca sobrescrever personagem aprovado.** Criar nova versão (`v1`, `v2`...) ou novo arquivo.

### Base
- `src/characters/base/MaleBaseCharacter.tsx`
  - Suporta variações como `hairVariant` (`emo` etc.), `eyeStyle` (`thin` etc.), acessórios, tatuagens, cores e pose.
- `src/characters/base/useSvgTexture.tsx` — renderiza SVG React em textura para card 3D.

### Presets/componentes usados
- BTS v1: `rmBtsV1..jungkookBtsV1` em `src/characters/presets/`
- Fresno: `LucasFresnoV1.tsx`, `TavaresFresnoV1.tsx`, `DrummerFresnoV1.tsx`
- Bob Marley: `BobMarleyV1.tsx` (props: `eyeOpen`, `mouthShape`, `pose`, `shirtColor`, `adidasStripes`)
- Rogério Skylab: `RogerioSkylabV1.tsx`

### Assets versionados
- Repo: `assets/characters/<nome>/<versao>/`
- D: `D:\cartoon-short-assets\characters\<nome>\<versao>\`

## 8) Padrões de vídeo usados

### Curiosidade / história (com narração)
- Hook forte nos 3s
- “BTS/ARTISTA” visível no fundo quando relevante
- Narração TTS + `words.json`
- Legenda grande, com destaque de palavras ativas
- CTA de curtir/seguir/comentar/compartilhar
- Ex.: BTS Curiosidades 1-5, Bob Marley curiosidades/histórias, Skylab histórias.

### Show musical (silencioso para overlay)
- Sem áudio com copyright
- Boca animada por ciclo/tempo/BPM/cues
- Câmera dinâmica, closes no rosto/instrumento
- Texto “Add your music / Intro”
- Ex.: Fresno shows, Bob Marley “Buffalo Soldier”.

## 9) Workflow de entrega

1. Criar/ajustar componente em `src/videos/<slug>/`
2. Registrar composição em `src/Root.tsx`
3. Se tiver narração: gerar `public/<slug>/voice.wav` e `words.json`
4. Render still para checar enquadramento
5. Render MP4 final
6. Copiar para `D:\cartoon-short-assets\videos\<slug>\`
7. Criar copy/hashtags em `scripts/COPY-<slug>.md`
8. Limpar `out/` local
9. `git add` apenas arquivos relacionados, commit e push

## 10) Git / GitHub

- Branch: `master`
- Push autorizado pelo usuário.
- Antes de push, se remoto mudou:  
  ```powershell
  git pull --rebase origin master
  git push origin master
  ```
- Evitar commitar: `backups/`, `cache/`, `node_modules/`, renders grandes desnecessários, arquivos temporários.
- `out/` pode conter renders locais temporários; preferir não versionar MP4s pesados desnecessários.

## 11) Skills do projeto

Em `.opencode/skills/`:

- `cartoon-3d-short/SKILL.md` — estilo cartoon 3D/short
- `character-bible/SKILL.md` — versionamento de personagens, não sobrescrever
- `scene-scenery/SKILL.md` — checklist de cenário/props/SVGs existentes
- `video-qa-release/SKILL.md` — QA/release/copy/assets/git/D

## 12) Gotchas / lições

- **C: cheio**: sempre copiar para D e limpar `out/`.
- **Boca/dentes**: evitar mouth fill branco estranho; usar formas normais open/smile/neutral.
- **Olho fechado no final**: em shows, evitar blink no final se for sincronizar refrão.
- **Guitarra/props**: conferir orientação (vertical/deitada) com still antes de render final.
- **TTS encoding**: ao escrever scripts Python no Windows, cuidar com acentuação/corrupt encoding; validar `words.json`.
- **Renders paralelos pesados**: evitar; pode dar race no cache rspack.
- **Push lock/reject**: fazer `pull --rebase` e push novamente.
- **Personagens**: nunca substituir arquivo aprovado; criar v2/v3.

## 13) Checklist rápido antes de entregar

- [ ] Composição registrada no `Root.tsx`
- [ ] 1080x1920, 30fps, H264 CRF 22
- [ ] Sem música com copyright no render
- [ ] Boca só fala/canta quando necessário
- [ ] Personagens legíveis, sem corte ruim
- [ ] Cenário não vazio / props corretos
- [ ] TTS/legenda ok (se houver)
- [ ] Copy/hashtags criada
- [ ] Copiado para D
- [ ] `out/` limpo
- [ ] Commit/push feito (quando solicitado)
