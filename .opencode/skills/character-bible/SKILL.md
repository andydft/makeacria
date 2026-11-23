---
name: character-bible
description: Regras canônicas para criar/ajustar personagens sem sobrescrever versões anteriores. Use ao criar, editar, aprovar ou salvar personagens (Chester, Mike, Emily etc.), presets, renders de referência e assets no repo/D.
---

# Character Bible

## Objetivo
Manter consistência visual e segurança de versionamento dos personagens.

## Regras
- **Nunca sobrescrever** personagem/preset/render aprovado. Sempre criar nova versão: `v1`, `v1-spiky-top`, `v2`, etc.
- Antes de editar, identificar a versão canônica atual e salvar backup se necessário.
- Presets ficam em `src/characters/presets/`. Assets de referência ficam em `assets/characters/<nome>/<versao>/`.
- Copiar assets aprovados para `D:\cartoon-short-assets\characters\<nome>\<versao>\` quando autorizado.
- Só fazer commit/push quando autorizado explicitamente.

## Fluxo
1. Confirmar personagem, versão base e mudança pedida.
2. Criar/atualizar **arquivo versionado** (preset/render), não o original.
3. Renderizar preview e abrir para aprovação.
4. Após aprovação, salvar em `assets/characters/...`, copiar para D, atualizar docs necessários, commitar/pushar se autorizado.

## Checklist de aprovação
- [ ] Parece a versão canônica/fiel?
- [ ] Cabelo/roupa/acessórios/tatuagens corretos?
- [ ] Enquadramento mostra corpo inteiro/cabeça conforme pedido?
- [ ] Nenhum arquivo original foi sobrescrito?
- [ ] Versão anterior ainda acessível?