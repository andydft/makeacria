---
name: video-qa-release
description: Checklist de QA e release para shorts de música/história. Use antes de render final, ao gerar copy/hashtags, atualizar prompt mestre, salvar assets e publicar no git/D.
---

# Video QA & Release

## QA antes do render final
- [ ] 1080x1920, 9:16, 30fps, H264 CRF 22 (padrão do projeto).
- [ ] Boca **só quando personagem fala**; sem mouth open/close constante.
- [ ] Blink ok; braços/pernas/walk/bob quando aplicável.
- [ ] Enquadramento: personagem inteiro/parte importante visível, sem corte ruim.
- [ ] Cenário completo (ver skill `scene-scenery`).
- [ ] Áudio/TTS ok (`pt-BR-AntonioNeural` quando aplicável), sem música comercial com copyright.
- [ ] Legendas/copy coerentes com o vídeo.

## Render
- Usar Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Usar `REMOTION_TMP=TEMP=TMP=C:\remotion-tmp`

## Release
- [ ] Criar `scripts/COPY-<slug>.md` com copy + hashtags.
- [ ] Atualizar e abrir `C:\Users\Pichau\cartoon-short\PROMPT_MESTRE_VIDEOS_MUSICAIS.txt` quando houver novo prompt salvo.
- [ ] Salvar arquivos versionados; não sobrescrever originais aprovados.
- [ ] Copiar para D somente com autorização.
- [ ] Commit/push somente com autorização explícita.