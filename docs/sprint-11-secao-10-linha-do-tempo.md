# Sprint 11 — Seção 10 "Como implementamos" (a linha do tempo)

## Objetivo

Uma seção de tela cheia, fundo branco, que começa limpa e se monta conforme a
pessoa rola: pílula e título sobem de baixo para cima; embaixo, uma linha do
tempo de cinco passos que se desenha da esquerda para a direita — traço,
blocos e pontos.

## Arquitetura

Três arquivos, a mesma divisão de responsabilidades das seções 8 e 9:

| Arquivo | Responsabilidade |
|---|---|
| `index.html` (`<section class="passos" data-anime="passos">`) | conteúdo e ordem (ordem do DOM = ordem da animação) |
| `assets/css/style.css` (bloco 11) | layout, tipografia, **estado de partida** e redes de segurança |
| `assets/js/anim/section-10.js` | coreografia (Anime.js 4.5.0) |

Contratos entre eles, por atributo:

- `[data-passo="txt"]` — pílula e título (entram escalonados, de cima para baixo)
- `[data-passo="traco"]` — a linha (cresce `scaleX` 0 → 1)
- `[data-passo="bloco"]` — cada uma das cinco colunas
- `[data-passo="ponto"]` — o ponto (`section_10_point.png`, via `background`)

## Decisões técnicas

1. **Dois tokens de altura alinham a linha aos pontos, sem JS.**
   `--pill-h` e `--rail-h` vivem em `.passos`. O traço é absoluto e seu topo é
   `calc(var(--pill-h) + var(--rail-h) / 2)` — exatamente o centro do trilho
   onde os pontos moram. Por isso a altura da pílula é um token e não o
   resultado do seu padding: mudar uma sem a outra desencosta a linha.

2. **A cascata é derivada: `PASSO = DUR_TRACO / nº de blocos`.**
   Os blocos entram no ritmo da varredura do traço, e acrescentar um sexto
   passo no HTML reajusta o ritmo sozinho.

3. **O traço usa `ease: "linear"`, o resto usa `--ease-out`.**
   Ele é o relógio da coreografia; com easing ele desacelera no fim enquanto
   os blocos continuam entrando em intervalos iguais, e a linha passa a chegar
   *depois* do bloco que deveria anunciar.

4. **A rolagem é o relógio (`sync: true`), não um gatilho `play`.**
   Nada toca sozinho: a barra de rolagem é a agulha, e rolar para cima
   desmonta a seção. Mesma receita do `duo.js` e do `[data-enter]`.
   Consequência: tudo vive numa **única `createTimeline`** — com quatro
   `animate()` em `sync: true` cada um ganharia o próprio observador e a
   própria régua, e os quatro só ficariam em fase por coincidência.

   A faixa de curso é `enter: 'end center'` → `leave: 'start+=5% start'`: o
   gatilho é o **meio da seção (50%)** cruzando a base da tela, e o fim é o
   topo dela quase encaixado — ~45% da altura da tela de curso. Ele tem de
   caber **antes** do encaixe: a seção é 100vh com `scroll-snap`, e depois de
   encaixada não sobra rolagem para raspar. Faixa curta é a consequência
   direta de disparar no meio; para alongá-la, mova o `enter` para baixo
   (`'end-=15% start'` era o valor anterior) — não estique as durações, que
   são proporções e não tempo.

   Junto vem a **trava de borda** (`travarBorda`), o mesmo defeito conhecido
   que o `duo.js` já tratava: ao sair da faixa a biblioteca congela o
   progresso no último valor em vez de grampeá-lo em 0 ou 1.

5. **O ponto anima opacidade *e* escala, com meio bloco de atraso.**
   Opacidade de pai e filho se multiplicam; o atraso garante que o bloco já
   esteja perto de 1 quando o ponto surge — senão ele apareceria cinzento.

6. **Estado de partida no CSS, nunca no JS**: sem isso há flash de conteúdo
   enquanto o bundle do CDN não chegou.

## Fluxos principais

As "durações" abaixo não são tempo: são **proporções do curso de rolagem**
(curso total = 1000 unidades de linha do tempo ≈ 80vh de scroll). O que
importa é a razão entre elas — dobrar todas não muda nada.

```
curso 0%  ─────────────────────────────────────────────── 100%
   │ txt     0 →  350   (stagger 90, translateY 24 -> 0)
   │ traço 200 →  760   (scaleX 0 -> 1, linear)
   │ blocos 200 → 1000  (stagger 112 = 560/5, translateX -18 -> 0)
   └ pontos 320 → 1050  (stagger 112, scale .4 -> 1)

rolar para cima percorre isto ao contrário, quadro a quadro.
```

## Riscos

- **Alinhamento linha/ponto**: qualquer regra que mude a altura real da pílula
  (fonte maior, padding, quebra de linha em duas linhas) sem mexer em
  `--pill-h` desencosta o traço. É o ponto mais frágil da seção.
- **Nomes de passo longos** podem vazar da pílula em telas estreitas entre
  861px e ~1000px, onde ainda são cinco colunas.
- **Mobile (≤860px)**: o traço horizontal é ocultado de propósito; o ponto
  vira marcador à esquerda. Se um dia quiser o traço vertical, será preciso
  trocar `scaleX` por `scaleY` no JS — dois comportamentos para manter.

## Melhorias futuras

- Teste Playwright dedicado (`tests/section-10.spec.js`) cobrando a **ordem**
  (traço antes dos blocos, bloco antes do seu ponto) e a **fidelidade**
  (centro do ponto na mesma coordenada Y da linha, ±1px). As seções 9 e 10
  ainda não têm spec.
- Trocar o `background-image` do ponto por SVG inline se a paleta virar tema.
