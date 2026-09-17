# Sprint 7 — Comparador antes/depois no círculo da seção 5

## Objetivo

O círculo central da seção "A transformação" era **uma foto só**, com o antes e o
depois já montados lado a lado. Passa a ser um **comparador**: duas fotos
inteiras, empilhadas, e a seta do centro vira a alça que a pessoa arrasta para
revelar mais de uma ou da outra. Começa no meio, com metade de cada.

| Imagem | Papel | Lado |
|---|---|---|
| `section_06_image_01_center.png` | planilha no notebook — o **antes** | esquerda (base) |
| `section_06_image_02_center.png` | atleta em quadra — o **depois** | direita (recortada) |

As duas já vêm recortadas em círculo, 647×647 — a mesma medida da referência.

## Arquitetura

```
.trans__stage                   --split: 50        ← o token, 0 a 100
├ .trans__foto                  (animada: opacity + scale)
│ ├ img.trans__foto-img              o ANTES, inteiro, sempre
│ ├ img.trans__foto-img--depois      o DEPOIS, clip-path a partir do corte
│ └ span.trans__corte                a linha branca do corte
├ p.trans__antes                 legenda do antes
├ span.trans__seta               a ALÇA — left calculado do --split
└ img.trans__logo                legenda do depois
```

**Uma fonte, três leitores.** `--split` vive no `.trans__stage` e é lido pelo
`clip-path` da foto de cima, pelo `left` da linha e pelo `left` da seta. Nenhum
número se repete entre eles — mover o token move as três em bloco.

### A armadilha que ditou o desenho

O `style.css` já avisava, no topo do bloco da seção 5:

> *quem o Anime.js anima NÃO pode usar transform para se posicionar.*

A seta tem os **dois** níveis de transform ocupados: o `<span>` pela entrada da
coreografia (Anime.js escreve `transform` a cada frame), o `<img>` pelo pulso
(CSS `@keyframes`). Um terceiro transform para arrastar anularia um deles.

Por isso a alça é posicionada com **`left: calc(var(--split) * 1% - 4.4%)`**.
O `-4.4%` é metade da largura (8.8%) e põe o *centro* da seta sobre o corte —
confere no estado inicial: `50% - 4.4% = 45.6%`, que era o valor fixo anterior.

O mesmo raciocínio vale para as legendas: elas somem com **`filter: opacity(0)`**,
não com `opacity`, porque a opacidade delas é da coreografia.

### Por que um módulo independente

`compare.js` **não depende do `window.anime`**. Isto é interação, não animação —
se dependesse da biblioteca, cairia junto com ela, e um navegador sem o CDN
mostraria duas fotos empilhadas com uma alça inerte. Funciona sem biblioteca,
com movimento reduzido e no telefone.

## Decisões técnicas

| Decisão | Por quê | Alternativa descartada |
|---|---|---|
| `left` em vez de `transform` na alça | Os dois níveis de transform já estão ocupados pela coreografia e pelo pulso | `translateX` — anularia a entrada ou o pulso |
| `filter: opacity(0)` nas legendas | A `opacity` delas é escrita pelo Anime.js a cada frame; dois interpoladores na mesma propriedade brigam | `opacity` ou `visibility` (binária) |
| Módulo sem dependência da biblioteca | Interação não pode cair junto com uma animação | Pôr o arrasto dentro do `section-05.js` |
| `.is-ativa` separada de `.is-pulsando` | Respondem a perguntas diferentes: "a seta já entrou?" e "a pessoa já usou?". O scroll liga e desliga a primeira sem ressuscitar o pulso | Uma classe só |
| Alça inerte até `.is-ativa` | A seta nasce em `opacity: 0`; sem o portão haveria uma alça invisível e arrastável sobre a foto | Arrastável desde sempre |
| `role="slider"` + teclado | É exatamente o que o controle é, e dá as setas do teclado de graça | `<button>`, ou nada |
| Medir o palco a cada `pointermove` | A seção é fixada e o círculo muda de tamanho com a janela e com o deslize do palco duplo | Guardar o `rect` no `pointerdown` |

## Estrutura de arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | `.trans__foto` virou `<div>` com as duas imagens e a linha; a seta ganhou `role="slider"`, `tabindex` e os `aria-value*`; o texto das pílulas ganhou o `<i>`; `compare.js` no fim da lista de scripts |
| `assets/css/style.css` | `--split` no `.trans__stage`; bloco do comparador; alça com `left`, `touch-action`, área de toque e foco; legendas com `filter`; o traço em `.trans__pill i::after` |
| `assets/js/anim/compare.js` | **Novo.** Arrasto, teclado, o portão da alça e os limiares dos riscos |
| `assets/js/anim/section-05.js` | `.is-ativa` ligada junto de `.is-pulsando`, nos dois caminhos (scrub e `tocarUmaVez`) |
| `tests/compare.node.mjs` | **Novo.** 34 asserções de lógica, em Node + jsdom |

## Fluxos principais

**Arrasto** — `pointerdown` na seta → `setPointerCapture` (é o que segura o gesto
quando o dedo sai de cima da alça) → cada `pointermove` converte o `clientX` em
porcentagem do círculo → `definir()` grampeia em 0–100 e escreve tudo.

**Teclado** — `←` `→` movem 2, com `Shift` (ou `PageUp`/`PageDown`) movem 10,
`Home`/`End` vão aos extremos.

**Quando a alça acende** — a coreografia põe `.is-ativa` no mesmo instante em que
traz a seta para a tela. Nos modos em que a coreografia não roda (sem biblioteca,
movimento reduzido), o próprio `compare.js` acende — ele testa as **mesmas duas
condições** que o `section-05.js` usa para desistir.

## Adendo — os riscos sobre as fontes espalhadas

Conforme o computador aparece, as fontes que ele substitui vão sendo riscadas, de
cima para baixo. Voltar o arrasto desfaz na ordem inversa, e cada traço se recolhe
por onde veio.

| `--split` | Risca |
|---|---|
| 20% | WHATSAPP |
| 40% | PLANILHAS |
| 60% | REDE SOCIAIS |
| 80% | PDF |
| 100% | GRUPOS |

**O `<i>` em volta do texto não é decoração.** O `<span>` da pílula tem largura
fixa e centraliza o texto por grid — um traço do tamanho dele riscaria o vazio
dos lados também, e "PDF" ganharia a mesma linha de "REDE SOCIAIS". O `<i>` é a
única caixa que mede a *palavra*. Teve de ser uma tag que **não** fosse `<span>`:
a coreografia anima `.trans__pill span`, e um segundo `<span>` aqui dentro
entraria na conta e seria animado junto, sem querer.

**O traço é um pseudo-elemento, e isso é o que permite a convivência.** O
Anime.js anima a opacidade da pílula escrevendo `style` inline, e não existe
`style` inline para `::after` — o risco fica fora do alcance da coreografia. É a
terceira vez nesta seção que a solução é "põe num nível que o Anime.js não
alcança": o pulso da seta no `<img>`, as legendas no `filter`, o risco no
`::after`.

**Os limiares são calculados, não escritos cinco vezes**: `(i+1) * 100 / n`.
Tirar ou acrescentar uma pílula no HTML redistribui tudo sozinho. A ordem dos
fatores importa — `(i+1) * 100 / n` fecha em 100 exato na última, o que
`(i+1) * (100/n)` não garante.

**Zona morta de 1.5%** nos limiares, pelo mesmo motivo (e com o mesmo remédio) da
`ZONA_MORTA` dos cards da seção 4: num círculo de 400px, 1px de tremido são
0.25%, e o traço leva 340ms para desenhar — cada tremido sobre um limiar viraria
uma animação visível indo e voltando.

**Consequência do estado inicial**: o corte nasce em 50%, então WHATSAPP e
PLANILHAS já aparecem riscadas quando a seção entra. É o que a regra pedida
produz — metade do computador visível, duas fontes já substituídas.

## Riscos

1. **Não verificado no navegador** (mesma limitação da sprint 6): o Chromium do
   Playwright está instalado, mas faltam bibliotecas de sistema (`libnspr4`) e a
   instalação pede `sudo` com senha. A **lógica** está coberta pelos 34 testes; o
   **desenho** — recorte, posição da alça, linha do corte e o traço sobre as
   palavras — não foi visto rodando.
   É o primeiro item a conferir.
2. **`touch-action: none` cria uma zona morta** de rolagem vertical no centro do
   círculo (~125px na referência, o alvo de toque da alça). Foi dimensionado como
   meio-termo; se no telefone incomodar, o número é o `inset` do
   `.trans__seta::before`.
3. **`clip-path` dentro de um elemento com `scale`**: a coreografia escala o
   `.trans__foto` de 0.6 a 1 na entrada. As porcentagens do `clip-path` resolvem
   contra a caixa do filho (a escala é só pintura), então o corte acompanha — mas
   é o ponto exato a olhar se a divisão parecer deslocada durante a entrada.
4. **`section_5_bg.png` ficou sem uso.** Não foi apagado de propósito: apagar
   material do cliente não é decisão de quem programa.
5. **O comparador não é raspado pelo scroll.** Se a pessoa arrastar o corte e
   depois rolar para trás, a coreografia refaz a entrada das fotos, mas o corte
   fica onde ela deixou. É o comportamento correto (foi uma escolha dela), mas é
   uma diferença de natureza em relação a tudo o mais nesta seção.

## Onde mexer no futuro

| Quero... | Mexo em |
|---|---|
| Começar fora do meio | `definir(50)` no fim do `compare.js` |
| A linha do corte mais grossa/discreta | `.trans__corte` no CSS |
| Trocar o lado das imagens | A ordem dos dois `<img>` no HTML; o `clip-path` sempre recorta a de cima |
| As legendas sumirem antes/depois | `SO_DEPOIS` / `SO_ANTES` no `compare.js` |
| Mudar os limiares dos riscos | Tirar/acrescentar `<li class="trans__pill">` no HTML — eles se redistribuem |
| O traço mais grosso, ou mais rápido | `height` e `transition` de `.trans__pill i::after` |
| O traço piscar menos/mais nos limiares | `ZONA_MORTA` no `compare.js` |
| O passo do teclado | `PASSO` / `PASSO_GRANDE` |
| Alvo de toque maior | `inset` do `.trans__seta::before` |

## Melhorias futuras

- **As legendas somem, mas não são recortadas.** "ANTES" e o logo desaparecem por
  inteiro quando a foto delas vira um filete. Recortá-las junto com a foto daria
  um resultado melhor, mas exige uma camada nova no palco — não cabia no escopo
  desta sprint. **É a primeira coisa a avaliar com o cliente.**
- Arrastar clicando em qualquer ponto do círculo, não só na seta (hoje é só a
  alça, como foi pedido).
- Uma dica visual na primeira vez ("arraste"), que suma depois do primeiro uso —
  a classe `.ja-usou` já existe e serviria de gatilho.
- Cobrir o desenho no Playwright, junto com os specs da sprint 6.

## Como debugar

```js
const palco = document.querySelector('.trans__stage');
palco.style.getPropertyValue('--split')          // onde está o corte
palco.style.setProperty('--split', 20)           // move na unha
document.querySelector('.trans__seta').className // is-ativa? is-pulsando? ja-usou?
```

- **A alça não responde** → falta `.is-ativa`. Ela entra quando a coreografia
  chega na seta; role até lá.
- **A seta some ao arrastar** → alguém pôs `transform` nela. Tem de ser `left`.
- **O traço não aparece** → confira se a palavra está dentro de um `<i>`; o
  `::after` é dele, não do `<span>`.
- **A alça fica desalinhada do corte** → o `-4.4%` no `left` deixou de ser metade
  da largura da seta.
- **As legendas piscam** → alguém voltou a mexer na `opacity` delas em vez do
  `filter`.
