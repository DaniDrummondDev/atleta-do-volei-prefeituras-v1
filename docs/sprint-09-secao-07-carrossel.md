# Sprint 9 — Seção 7: benefícios em carrossel

## Objetivo

Uma seção nova, **depois** do palco duplo e fora dele: quando a rolagem
horizontal termina, a página volta a descer e chega aqui. Cinco slides, trocados
pelo scroll, com o desenho das referências reproduzido fielmente.

Sem animação de entrada — nada nasce escondido esperando um gatilho. O que anima
é só a **troca** de um slide para o outro.

## O conflito do pedido, e como foi resolvido

O pedido foi "100vh, então temos o snap" **e** "tudo será controlado pelo
scroll". As duas coisas não cabem juntas como escritas: um carrossel raspado
pelo scroll precisa de curso de rolagem, e 100vh não tem nenhum. A regra do
próprio projeto ([style.css, seção 1b](../assets/css/style.css)) diz que só
encaixa quem tem no máximo uma tela, e o `tests/snap.spec.js` reprova quem
violar — com razão.

**A saída atende os dois**, sem exceção para ninguém:

| Peça | Altura | Papel |
|---|---|---|
| `.bene` | 500vh (uma por slide) | o curso de rolagem |
| `.bene__sticky` | 100vh | **o que a pessoa vê** — sempre uma tela |
| `.bene__step` × 5 | 100vh cada | os pontos de encaixe, com `data-snap` |

Dentro do sticky ficam três irmãos: o painel preto, a coluna da direita e o
trilho. Não há mais um palco envolvendo os três — o adendo 2 explica por quê.

O `data-snap` vai nos **degraus**, não na seção. Cada degrau tem exatamente uma
tela, então o encaixe cai em cima de cada slide, como pedido, e o teste passa.

## Fidelidade às referências

A referência é um quadro **1051 × 590** (16:9). Todas as medidas foram tiradas
dele e escritas como fração de `--u`, a largura do palco — a mesma solução da
seção 5, e pelo mesmo motivo: num layout que se redistribui a cada largura, a
composição muda de proporção em toda tela.

| Elemento | Medida na referência | No CSS |
|---|---|---|
| Painel preto | 388/1051 | 36,9% |
| Foto: esquerda / topo / largura | 8 / 33 / 297 | `--u ×` .0076 / .0314 / .2825 |
| Coluna da direita | x 473, topo 111 | 45% / 16,6% |
| Filete do título | x 473→683, y 305 | largura 20%, topo 51,7% |
| Trilho de índice | x 945, y 100→345 | 89,9% / 16,9% / altura 41,5% |
| Palavra deitada: base / corpo | base a 3,7px da divisão / ~62px | `.369u − --descida − --folga` / `--u × .059` |

As medidas **dentro do painel preto** são todas em `--u`, nunca em `%` — o
adendo no fim explica por quê.

**`--u` cabe pela ALTURA** (`min(177.97vh, 112vw)`). A primeira versão cobria a
tela com `max()` e recortava a margem de cima da foto — ver o adendo 2. O painel
preto encosta na esquerda, no topo e no pé porque ele sangra por conta própria,
não porque o palco cobre a tela.

**As fotos não usam `object-fit: cover`.** Os PNGs (556 × 946) já vêm com os
cantos arredondados e fundo transparente; recortar para preencher uma caixa de
outra proporção comeria justamente os cantos. A caixa tem a proporção do arquivo.

## A coreografia da troca

O pedido foi "o texto que está na tela sai e vai para baixo, e o próximo entra de
baixo para cima". Tomados ao pé da letra e **ao mesmo tempo**, os dois se
atravessariam no meio do caminho, ambos a meia opacidade, um por cima do outro.

Então a troca é **sequencial**: primeiro um sai, depois o outro entra, e entre os
dois há um instante sem texto nenhum.

```
x = f - i, a distância deste slide até a agulha

x:  -0.30 ...... 0 ......... 0.40 ...... 0.70
    |  entrando  |  parado   |  saindo   |
    (sobe, 0→1)              (desce, 1→0)
```

O começo do "entrando" de um (−0,30) é o fim do "saindo" do anterior
(0,70 − 1 = −0,30): os dois encostam sem se sobrepor. Está conferido no teste,
que varre a seção inteira e nunca acha dois textos visíveis juntos.

Os quatro grupos de texto — número, kicker, parágrafo, legenda da foto e palavra
deitada — passam pelo **mesmo laço**. Escrever quatro laços iguais seria quatro
lugares para dessincronizar.

## O defeito que o teste pegou

As fotos são o caso oposto: não se movem, só fazem crossfade. A primeira versão
dava a cada uma uma rampa de 0,60 para os dois lados, escolhida no olho.

No meio de uma troca, as duas ficavam em 0,167 — **soma 0,333**. Um escurecimento
do painel preto a cada slide, que não apareceria em nenhuma captura parada.

Duas rampas lineares só somam 1 se a subida de uma for exatamente a descida da
outra. Com um platô `P`, a rampa indo de `P` a `1−P`, a conta fecha em qualquer
ponto:

```
parcelas:  (1 − P − a)  e  (a − P),  ambas sobre (1 − 2P)
soma:      (1 − 2P) / (1 − 2P) = 1
```

O teste agora varre a seção inteira somando as cinco fotos e exige 1 em todo
ponto — se alguém trocar a forma da rampa por um ease, ele avisa.

## Dois erros de CSS corrigidos antes de rodar

1. **`--sobe` era uma porcentagem.** `translateY(%)` resolve contra a altura do
   **próprio elemento**, então 2,6% dariam um salto diferente para o parágrafo
   grande e para o "01" — os blocos sairiam em velocidades diferentes. Virou
   comprimento, derivado de `--u`.
2. **A ordem do `transform` da palavra deitada.** `rotate(90deg) translateY(v)`
   move no espaço **já girado**: a palavra sairia para o lado, não para baixo. A
   função mais à esquerda é a que age no espaço do pai, então o certo é
   `translateY(v) translate(-50%,-50%) rotate(90deg)`.

A palavra também é **centrada**, não presa pelo topo: na referência "Dados"
(5 letras) e "Participação" (12) têm o mesmo centro vertical.

## Estrutura de arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | A `<section class="bene">` inteira, depois da `.duo`; `bene.js` na lista de scripts |
| `assets/css/style.css` | Bloco **5f** (a seção toda); responsivo ≤720px; movimento reduzido |
| `assets/js/anim/bene.js` | **Novo.** O carrossel |
| `assets/js/main.js` | `header()`: o header do site passa a viver só sobre o hero |
| `tests/bene.node.mjs` | **Novo.** 74 asserções: coreografia, geometria, o palco em 7 formatos de janela e a ancoragem da palavra |

## Fluxos principais

```
scroll → medir() → p (0..1) → f = p × 4
                                ├→ --on e --y nos textos, legendas e palavras
                                ├→ --on nas fotos (crossfade)
                                ├→ --f no filete do trilho
                                └→ .is-on no número mais próximo
```

Uma pintura por quadro, no máximo: o evento de scroll dispara mais vezes do que a
tela repinta.

**Telefone (≤720px)**: o palco perde a proporção fixa e vira coluna — foto em
cima, texto embaixo —, mas **o carrossel continua**. Trocar de slide é o conteúdo
da seção, não um enfeite. Saem a palavra deitada e o trilho de índice.

**Movimento reduzido**: o carrossel também continua, pelo mesmo motivo —
desligá-lo esconderia quatro quintos do texto. Sai o **movimento**: os blocos
deixam de descer e subir e passam a só aparecer e sumir. A palavra deitada é a
exceção, porque o `transform` dela não é movimento, é o que a deita.

## Adendo — correção de geometria (revisão do cliente)

A primeira entrega saiu com a foto quase três vezes menor que a referência,
arrastando junto a logo e a legenda. **Uma causa só, e vale registrar porque é
uma armadilha de CSS que não dá aviso nenhum.**

Todas as medidas do painel estavam em porcentagem, tiradas da referência de
1051px. Mas os elementos são filhos do `.bene__panel`, que tem **36,9% da
largura do palco** — e porcentagem horizontal resolve contra o pai, não contra o
palco. A foto pedia 28,25% e recebia 28,25% × 36,9% = **10,4%** do palco.

O efeito em cascata explicou as quatro queixas de uma vez:

| Sintoma | Causa |
|---|---|
| "as imagens" pequenas | 10,4% em vez de 28,25% |
| "logo pequena em baixo" | mesma conta: 14px em vez de 38px, e longe da foto encolhida |
| legenda fora da foto | a foto encolheu, a legenda ficou no lugar certo |
| "palavra na vertical" grande demais | a palavra estava certa; era a foto ao lado que sumiu |

**A correção**: tudo dentro do painel passou a ser `calc(var(--u) * fração)`.
As verticais também, embora ali a porcentagem funcionasse — uma régua só para o
bloco inteiro é uma armadilha a menos para quem vier depois.

Conferido contra a referência, número a número:

| | Calculado | Referência |
|---|---|---|
| Foto | 297 × 505, em (8, 33) | 297 × 505, em (8, 33) |
| Logo | 38px, topo em 420 | 38px, topo em 420 |
| Legenda | esquerda 38, largura 267 | esquerda 38, até a borda da foto |
| Palavra | coluna 318→380 | coluna 318→380 |

O `tests/bene.node.mjs` agora refaz essa conta e reprova qualquer `%` horizontal
que volte para dentro do painel.

### A logo do topo não era da seção 7

Era o **header fixo do site** (`logo_branca.png`, `position: fixed`,
`z-index: 50`), que pairava sobre todas as seções desde o começo e só ficou
aparente ao cair sobre o painel preto.

Por decisão do cliente, **o header agora vive só sobre o hero**. Implementado em
`header()`, no `main.js`, com `IntersectionObserver` no `.hero` — a pergunta é
literalmente "este elemento está na tela?", que é o que o observador responde de
graça, sem medir nada a cada quadro. Passado o hero, o header sai com
`transform` e `pointer-events: none`, para não comer cliques invisíveis.

Faz sentido para além desta seção: o header é transparente e a legibilidade dele
vinha do gradiente escuro do hero — fora dali ele nunca teve fundo para se
apoiar.

## Adendo 2 — o palco e o sentido da palavra (segunda revisão)

### O "padding top que não foi aplicado" era padding cortado

O palco era dimensionado para **cobrir** a janela (`max(100vw, 177.97vh)`). Numa
janela mais larga que 16:9 isso o deixa mais **alto** que ela, e o recorte
centralizado come a margem de cima da foto.

E janela mais larga que 16:9 é o **caso comum**, não a exceção: a barra do
navegador come altura, e um monitor 1920×1080 entrega ~1889×955, que é 1,98. Ali
sobravam 6px dos 59px de margem superior.

**A correção**: o palco passa a caber pela **altura** (`min(177.97vh, 112vw)`).
Nada é recortado na vertical, e o que sobra de largura é branco — que já é a cor
daquele lado.

Isso obrigou a separar as réguas, e o `.bene__stage` deixou de existir:

| Parte | Mede-se por | Por quê |
|---|---|---|
| Painel preto e tudo dentro dele | o **palco** (`--u`, derivado da altura) | guarda as proporções da referência |
| Coluna da direita e trilho | a **janela** | senão sobraria faixa branca à direita numa tela larga |

Duas réguas diferentes não cabiam na mesma caixa. O `112vw` é a trava do outro
lado: numa janela 4:3 o painel encostaria na coluna da direita sem folga nenhuma.

Conferido em sete formatos de janela reais (16:9 cheio e com barra, MacBook,
notebook, ultrawide, 4:3 e 1024×690) — o teste agora varre todos e cobra que a
foto caiba inteira e que o painel não encoste na coluna.

### O sentido do giro

Os dois valores deitam a palavra; o que muda é a leitura:

| | Lê | Topos das letras |
|---|---|---|
| `rotate(90deg)` | de cima para baixo | à direita |
| `rotate(-90deg)` | de baixo para cima | à esquerda |

A referência é a segunda — em "Participação", o "ão" fica **em cima**. Estava
com `90deg`. O teste agora fixa o `-90deg`.

## Adendo 3 — ancoragem da palavra e o bloco logo+legenda (terceira revisão)

### A palavra passa a ser ancorada pela BASE das letras

Antes a coluna era centrada num ponto (`left: .3320u`). Agora a **base das
letras** encosta na divisão preto/branco (`.369u`), e as descidas — a perna do
`p`, a cedilha do `ç` — passam dela, como pedido.

Com `rotate(-90deg)` o "para cima" das letras aponta para a **esquerda**: o corpo
delas cresce painel adentro e as descidas caem para a direita, por cima da
divisão. A caixa da linha é centrada em `left` pelo `translate(-50%)`, então
recuar esse centro em `--descida` põe a base exatamente na divisão:

```
centro                  = .369u − --descida
borda direita da caixa  = centro + metade da linha
base das letras         = borda direita − --descida = .369u   ✓
```

`--descida` é a descida da fonte, em `em`. É o **único** número a mexer se a base
sair desalinhada: aumentar empurra a palavra para dentro do preto, diminuir
empurra para fora.

Conferido: base em 388, que é exatamente a divisão; as descidas vazam 15px para
o branco; sobram 36px de folga até a borda direita da foto.

### A consequência que vinha junto

O `.bene__panel` tinha `overflow: hidden`. Com ele, as descidas seriam **aparadas
em linha reta** na divisão — o oposto do pedido. Foi removido.

Nada mais ali dentro vaza: a foto termina em `.2901u` e o painel tem `.369u`, e
as duas medidas escalam juntas, então a folga existe em qualquer tela. O teste
agora reprova um `overflow: hidden` que volte.

### Logo e legenda desceram

Os dois desceram `.014u` (uns 15px na referência), juntos — são um bloco só e o
vão entre eles é parte do desenho. A legenda passou a encostar no pé da foto e a
última linha dela avança uns 5px sobre o preto, o que não muda a leitura (texto
branco nos dois fundos).

Resultado: logo em 435–473, legenda em 492–543, pé do painel em 591 — 19px de vão
entre os dois e 47px de respiro embaixo.

As asserções de geometria mudaram junto: saiu "a legenda fica sobre a foto"
(deixou de ser verdade, e de propósito) e entraram "não vaza pelo pé do painel",
"sobra respiro embaixo" e "logo e legenda não se sobrepõem".

## Adendo 4 — a descida da fonte, medida em vez de chutada

O `--descida` do adendo 3 valia `.25em`, escolhido no olho a partir de uma fonte
genérica. Com ele a base das letras caía **depois** da divisão, e a parte que
passava era desenhada em branco a 20% **sobre branco** — sumia. Não era recorte:
era a cor. Mas lia-se como letra cortada, que é o que o cliente viu.

As métricas foram lidas do arquivo
(`assets/fonts/TT Firs Neue Trial Regular.woff`, tabelas `head`/`hhea`/`OS/2`,
`unitsPerEm` 1000):

| | |
|---|---|
| ascent | 0,950em |
| descent | 0,340em |
| capHeight | 0,700em |

A soma dá **1,29em**, bem acima do `line-height: 1` da regra — o meio-entrelinha
é negativo e as letras transbordam a caixa da linha:

```
meio-entrelinha = (1 − 1,29) / 2   = −0,145em
base, do topo da caixa             =  0,805em
recuo do centro = 0,805 − 0,5      =  0,305em
```

Com `--descida: .305em` a base fica **exatamente** na divisão.

### Dois números, e só um é de gosto

Encostada exatamente, a palavra ainda se lê como cortada — não sobra respiro
nenhum entre a letra e a borda. Daí o segundo token:

| Token | Valor | Natureza |
|---|---|---|
| `--descida` | `.305em` | **medida da fonte.** Não se mexe |
| `--folga` | `.06em` | **gosto.** O único a mexer |

Separá-los é o ponto: quem vier depois não precisa saber de métrica de fonte
para ajustar o respiro, e não vai estragar a matemática tentando.

Resultado na referência: divisão em 388, base em **384** (3,7px para dentro),
corpo das letras de 341 a 384 inteiro no preto, descidas indo até 405 (17px de
vazamento invisível), e 36px de folga até a borda da foto.

O teste cobra as duas pontas: a base **não passa** da divisão (letra normal não
vaza para o branco) e **não recua demais** (continua encostada). E confere que
`--descida` bate com a métrica medida.

## Riscos

1. **O desenho não foi verificado no navegador.** Mesma limitação das sprints 6 a
   8: faltam bibliotecas de sistema do Chromium e a instalação pede `sudo`. A
   **coreografia e a aritmética da geometria** estão cobertas pelos 74 testes,
   mas **nada foi visto renderizado** — e foi exatamente aí que a primeira
   entrega falhou. A revisão do cliente (adendo acima) é a prova de que o
   teste não substitui o olho aqui.
2. **As medidas saíram de leitura das referências em imagem**, não de um arquivo
   de design. Cada uma está no CSS com a fração de origem ao lado
   (`388/1051`, `33/590`…), então corrigir é trocar um número num lugar só.
3. **Cores tiradas a olho** das referências (`#121212` no painel, `#8A8A8A` nos
   rótulos, `rgba(255,255,255,.2)` na palavra). Se houver paleta oficial, são
   cinco valores a acertar.
4. **O crossfade das fotos foi decisão minha**, não pedida — você falou em
   animação só nos textos, e uma troca seca no meio de uma rolagem piscaria. Para
   voltar ao corte seco, é uma linha: o corpo de `fotoDe()`, que já traz a
   substituição escrita no comentário.
5. **500vh de rolagem** para a seção. Com o encaixe é confortável, mas é bastante
   página; se ficar longo, `--slides` não muda isso — o que muda é dar menos de
   uma tela por slide, e aí o encaixe deixa de cair em cima dos slides.

## Onde mexer no futuro

| Quero... | Mexo em |
|---|---|
| Mais ou menos slides | Acrescentar os blocos no HTML (`data-slide`); o JS e o trilho se ajustam |
| O texto ficar parado mais tempo | `PARADO` no `bene.js` |
| A troca mais rápida | `SAINDO` (a saída) e a janela de entrada, que é o espelho dele |
| O texto saltar mais longe | `--sobe` no `.bene` |
| Corte seco nas fotos | corpo de `fotoDe()` — a substituição está no comentário |
| Rolar menos por slide | a altura do `.bene__step` (mas o encaixe deixa de coincidir) |

## Como debugar

```js
const s = document.querySelector('.bene');
// o progresso em slides, 0 a 4
getComputedStyle(document.querySelector('.bene__rail-mark')).getPropertyValue('--f')
// o estado de cada bloco de texto
[...document.querySelectorAll('.bene__text')].map(e => e.style.cssText)
```

- **Dois textos na tela ao mesmo tempo** → `PARADO` ficou maior que `SAINDO`, ou
  a janela de entrada deixou de ser o espelho da de saída.
- **O painel escurece no meio da troca** → a rampa de `fotoDe()` deixou de somar
  1. Rode `tests/bene.node.mjs`.
- **A palavra deitada anda para o lado** → a ordem do `transform` foi trocada.
- **Blocos saindo em velocidades diferentes** → `--sobe` voltou a ser
  porcentagem.
- **O encaixe não cai em cima dos slides** → o `.bene__step` deixou de ter 100vh.
