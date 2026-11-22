# Como Jimi Hendrix aprendeu a tocar guitarra — SCRIPT (PT-BR)

Tema do usuário: história de Jimi Hendrix improvisando com uma vassoura antes de ter uma guitarra de verdade, até se tornar um dos maiores guitarristas da história.

## Fatos verificados e fontes
- **Infância e contexto:** James Marshall "Jimi" Hendrix (1942–1970) cresceu em Seattle, em condições financeiras difíceis.  
  Fontes: [Encyclopaedia Britannica – Jimi Hendrix](https://www.britannica.com/biography/Jimi-Hendrix), [Biografia oficial](https://www.jimihendrix.com/biography/)
- **"Guitarra" de vassoura:** Antes de ter um instrumento de verdade, ele simulava tocar usando uma vassoura. O biógrafo Charles R. Cross (*Room Full of Mirrors*, 2005) relata que ele tocava a vassoura com tanta força que perdia a palha.  
  Fontes: [NYT – resenha de *Room Full of Mirrors* (2005)](https://www.nytimes.com/2005/08/28/books/review/room-full-of-mirrors-sixstring-revolutionary.html), [Los Angeles Times (2005)](https://www.latimes.com/archives/la-xpm-2005-jul-30-et-hendrixbook30-story.html)
- **Ukulele de uma corda (relato biográfico):** Ainda criança, teria encontrado um ukulele descartado com apenas uma corda e conseguido tirar melodias de ouvido. (Detalhe menos consensual em todas as biografias; usar com cautela visual/narrativa.)  
  Fonte de apoio: [Wikipedia – Jimi Hendrix](https://en.wikipedia.org/wiki/Jimi_Hendrix)
- **Primeiro violão:** Em meados de 1958, aos 15 anos, conseguiu seu primeiro violão acústico usado por cerca de US$ 5 e passou a praticar por horas todos os dias.  
  Fontes: [Biografia oficial](https://www.jimihendrix.com/biography/), [Wikipedia – Jimi Hendrix](https://en.wikipedia.org/wiki/Jimi_Hendrix), [Britannica](https://www.britannica.com/biography/Jimi_Hendrix)
- **Autodidata, de ouvido:** Aprendeu sozinho ouvindo discos e rádio (incluindo Elvis Presley e músicos de blues) e observando outros músicos; não sabia ler partituras.  
  Fontes: [Biografia oficial](https://www.jimihendrix.com/biography/), [Britannica](https://www.britannica.com/biography/Jimi-Hendrix)
- **Primeira guitarra elétrica:** No verão seguinte (1959), seu pai Al comprou sua primeira guitarra elétrica, uma Supro Ozark 1560S, usada quando entrou para a banda The Rocking Kings.  
  Fontes: [Biografia oficial](https://www.jimihendrix.com/biography/), [PBS American Masters](https://www.pbs.org/wnet/americanmasters/jimi-hendrix-jimi-hendrix-biography/2743/)

> Nota: a skill original pede narração em inglês (“English only”), mas este roteiro foi feito em português a pedido do usuário.

## Roteiro de narração (PT-BR, ~62 s, ~228 palavras)
*Fórmula: gancho → cenário → ação (escalada) → estalo → "Felizmente… / Infelizmente…" → explicação com analogia → consequência → callback. Sem legendas na tela. Tom constante. Ritmo alvo ~3,7 palavras/s.*

**[GANCHO]**  
Antes de fazer uma guitarra gritar, Jimi Hendrix ensaiava com uma vassoura.

**[CENÁRIO]**  
Na Seattle dos anos 1950, ele era um garoto sem dinheiro, sem professor e com a cabeça cheia do blues que ouvia no rádio.

**[AÇÃO / ESCALADA]**  
Sem ter um instrumento, dedilhava o cabo da vassoura como se ele tivesse cordas, copiando no ar as músicas que imaginava.  
Ouvia discos de Elvis Presley e de mestres do blues, e tentava repetir cada nota, uma por uma, só de ouvido.  
Em 1958, aos quinze anos, conseguiu enfim um violão acústico usado, comprado por cinco dólares, e passou a praticar por horas todos os dias.  
Ele não sabia ler partituras. Então errava, ouvia, ajustava as mãos e tentava de novo.

**[ESTALO]**  
Até que, um dia, o som que saía dos dedos dele finalmente era igual ao som que ele tinha na cabeça.

**[FELIZMENTE / INFELIZMENTE]**  
Felizmente, ninguém ensinou a ele o jeito certo de tocar.  
Infelizmente, ninguém ensinou a ele o jeito certo de tocar.

**[EXPLICAÇÃO + ANALOGIA DO COTIDIANO]**  
Aprender de ouvido é como jogar uma bola na parede no escuro: você arremessa, escuta onde ela bate e muda o movimento até o som voltar certinho.  
Cada nota errada era só um quique, mostrando para onde as mãos deviam ir.

**[CONSEQUÊNCIA]**  
O garoto da vassoura não aprendeu apenas a tocar músicas. Ele aprendeu a escutar.

**[CALLBACK]**  
E foi assim que um menino com um violão de cinco dólares acabou transformando seis cordas em algo que o mundo nunca tinha ouvido.

## Ideias visuais (para o plano de cenas/`story.ts` depois)
- Quarto simples em Seattle, menino dedilhando uma vassoura; palhas se soltando (fato relatado por Cross).
- Rádio/discos girando, notas “no ar” sendo copiadas.
- Violão usado de 5 dólares, mãos praticando por horas (repetição/erro → acerto).
- Analogia: bola quicando na parede no escuro, guiada pelo som, até voltar no alvo.
- Callback: silhueta/energia de palco com guitarra (estilo 2D-in-3D da skill, história e personagens próprios).

## Próximos artefatos necessários (pipeline da skill)
- `voice.wav` (narração em tom constante) + `words.json` (timing por palavra) — tudo é sincronizado a isso.
- Projeto Remotion com `@remotion/three` e templates da skill adaptados (`story.ts`, cenas, áudio/mix, render 2K). 
- Definir `REMOTION_TMP`/`TEMP`/`TMP` para `C:\remotion-tmp` durante renders.
