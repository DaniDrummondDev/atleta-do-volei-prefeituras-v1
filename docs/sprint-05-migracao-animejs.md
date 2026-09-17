# Sprint 5 — Migração das animações para Anime.js 4.5.0

> **Status:** SPRINT CONCLUÍDA. As quatro fases feitas e verificadas em
> navegador — **71 asserções, 0 falhas**. A página inteira roda no Anime.js,
> o motor antigo foi removido e a entrega é só por CDN.
> **Regra que governa a sprint:** *não mudar nenhuma animação existente*.
> Só muda **como** ela é feita. Qualquer diferença visual é bug, não melhoria.

---

## Objetivo

Substituir o motor de animação artesanal (`assets/js/main.js` + `@keyframes`
calculados na mão) pelo Anime.js 4.5.0, mantendo **comportamento idêntico**, para
ganhar controle declarativo sobre timing, easing e sequenciamento.

Arquitetura pedida pelo cliente:

- **Entre seções:** o `onScroll()` do Anime.js inicia e para as animações.
- **Dentro de cada seção:** os recursos da biblioteca (`createTimeline`,
  `stagger`, `eases`, `onUpdate`).

---

## Prova de viabilidade (já executada)

Antes de planejar, validei a hipótese mais crítica no sandbox, carregando o
bundle real da 4.5.0:

```
x(t) = 90 * (1 - outElastic(1, .3))   vs   keyframes CSS atuais
  t=0.00  anime:   90.00px | css:   90.00px
  t=0.04  anime:   45.64px | css:   45.64px
  t=0.08  anime:   -5.40px | css:   -5.40px
  t=0.12  anime:  -31.69px | css:  -31.69px
  t=0.20  anime:  -11.25px | css:  -11.25px
  t=0.28  anime:   11.81px | css:   11.81px
  t=0.44  anime:   -4.17px | css:   -4.17px
```

**Batem ao centavo.** A entrada elástica dos cards da seção 4 não vai ficar
"parecida" — vai ser matematicamente a mesma curva. Isso valida o método:
para cada animação, dá para comparar a curva nova com a antiga numericamente
antes de trocar.

Confirmado também no bundle 4.5.0 (`anime.umd.min.js`, 115.3 KB, MIT):
`animate`, `createTimeline`, `createTimer`, `onScroll`, `ScrollObserver`,
`eases`, `stagger`, `utils`, `engine`, `createSpring`, `cubicBezier`.

---

## Inventário — o que existe hoje

| # | Animação | Onde | Mecanismo atual | Tipo |
|---|---|---|---|---|
| 1 | Reveal de entrada (hero, seção 2, seção 4) | `main.js:26 reveal()` | IntersectionObserver → `.is-visible` + `transition` CSS | gatilho |
| 2 | Reveal por escopo (seção 2) | `main.js:57 observeScope()` | IO a 98% de visibilidade | gatilho |
| 3 | Contadores das stats | `main.js:76 counters()` | rAF + easeOutCubic, 1400 ms | tempo |
| 4 | Entrada elástica dos cards (seção 4) | `style.css slide-right-elastic` | `@keyframes` amostrados à mão | tempo |
| 5 | Scrub do vídeo do hero | `main.js:133 createVideoScrubber()` | `video.currentTime` + fila de seek | **scrub** |
| 6 | Tira de fundo do hero (`--reel`) | `main.js:264` | cálculo direto no rAF | **scrub** |
| 7 | Palco dos celulares (`--p`) | `main.js:255` | sticky + progresso no rAF | **scrub** |
| 8 | Parallax (`--py`) | `main.js:182 createParallax()` | rAF, amplitude em `data-parallax` | **scrub** |
| 9 | Entradas dos cards da seção 3 (`--e`) | `main.js:210 createEnters()` | rAF, reversível | **scrub** |
| 10 | Timeline da seção 4 (`--t` + `.is-current`) | `main.js:233 createTimelines()` | sticky + progresso no rAF | **scrub** |
| 11 | `.bridge.is-active` | `main.js:271` | classe quando `--p > .50` | gatilho |
| 12 | `wiggle` da arte da seção 2 | `style.css:523` | `@keyframes` infinito | loop |

A coluna **Tipo** é a que decide o mapeamento. São três famílias, e só uma
delas é migração trivial.

---

## Mapeamento proposto

### Família A — animações de tempo (itens 1, 2, 3, 4, 12)

Migração direta e de baixo risco.

| De | Para |
|---|---|
| IO + `.is-visible` + `transition` | `animate(el, {...}, { autoplay: onScroll({ enter: 'bottom-=20% top', sync: 'play' }) })` |
| `data-reveal-delay` × 110 ms | `delay: stagger(110)` |
| `@keyframes slide-right-elastic` | `ease: 'outElastic(1, .3)'`, `duration: 1100` |
| `counters()` com easeOutCubic | `animate({ n: 0 }, { n: 340, ease: 'outCubic', duration: 1400, onUpdate })` |
| `@keyframes wiggle` | fica no CSS — loop infinito puro não ganha nada indo para JS |

### Família B — animações raspadas pelo scroll (itens 6, 7, 8, 9, 10)

Aqui mora o risco. Hoje **todas** compartilham *um* `requestAnimationFrame` com
*uma* leitura de layout por frame (`main.js:242 update()`). É uma decisão
deliberada de performance, documentada no cabeçalho do arquivo.

Indo para `onScroll({ sync: true })`, cada animação vira um `ScrollObserver`
próprio. O Anime.js tem um motor central que coalesce isso, mas o número de
`getBoundingClientRect()` por frame sobe. Nesta página há hoje **11 elementos
com `data-parallax` e 5 com `data-enter`** — viram 16 observers.

**Mitigação proposta:** manter um observer por *seção* (não por elemento) e
usar `stagger` / `onUpdate` para distribuir os valores internamente — que é
exatamente a arquitetura que o cliente pediu ("onScroll entre seções, recursos
da biblioteca dentro da seção").

### Família C — o scrub do vídeo (item 5)

`video.currentTime` não é propriedade animável, e o código atual tem lógica que
o Anime.js não substitui: fila de seek (`seeking`), tolerância de 0.04 s e o
`play()/pause()` mudo que destrava a decodificação no Safari/iOS
(`main.js:141-170`).

**Proposta:** animar um objeto JS (`{ time: 0 }`) com `onScroll({ sync: true })`
e escrever em `currentTime` dentro do `onUpdate`, **preservando a fila de seek
intacta**. O Anime.js entra só como fonte do progresso.

---

## Estrutura de arquivos

```
index.html
  └── <script src="…animejs@4.5.0/…/anime.umd.min.js"></script>   ← novo, antes do main.js

assets/js/
  ├── main.js            ← permanece como orquestrador (DOMContentLoaded, reduceMotion)
  └── anim/              ← NOVO
      ├── engine.js      guarda do reduced-motion + defaults do anime
      ├── hero.js        itens 3, 5, 6, 7, 11
      ├── section-02.js  itens 2, 8
      ├── section-03.js  item 9
      └── section-04.js  itens 1, 4, 10
```

Um arquivo por seção: quando a seção 5 chegar, cria-se `section-05.js` e nada
mais é tocado. É também o que torna a migração **fatiável** — dá para migrar
uma seção e deixar as outras no motor antigo, rodando lado a lado.

---

## Fases

| Fase | Escopo | Critério de pronto |
|---|---|---|
| **0** | CDN + guarda de fallback | `anime` global disponível; sem `anime`, o motor antigo assume |
| **1** | **Piloto: seção 4** (itens 1, 4, 10) | Entrada elástica e timeline idênticas ao atual |
| **2** | Decisão | Piloto aprovado? Se não, reverter é 1 arquivo |
| **3** | Seções 2 e 3 (itens 2, 8, 9) | Parallax e entradas idênticos |
| **4** | Hero (itens 3, 5, 6, 7, 11) | Scrub do vídeo sem travar no iOS |
| **5** | Limpeza | Remover do `main.js` o que virou Anime.js |

A **Fase 1 é o teste que o cliente pediu**. As fases 3 e 4 só existem se a 2
aprovar.

---

## Decisões técnicas

**1. CDN jsDelivr, bundle UMD, versão fixa, com SRI.** *(decidido pelo cliente)*

```html
<script
  src="https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js"
  integrity="sha384-InMmvD3VoYcY7hGjSC80aLb2bNNE4CzpX+Eq6FVDlmB0IKgDvmfPw4UY8L/M++iG"
  crossorigin="anonymous"></script>
```

Tamanhos medidos: 115.3 KB bruto · **39.7 KB gzip** · 35.3 KB brotli.
O hash `sha384` acima foi calculado sobre o arquivo real da 4.5.0.

Por que UMD e não ESM: o `main.js` atual é um IIFE clássico com `<script defer>`.
O bundle ESM obrigaria `type="module"`, o que muda a ordem de execução de todos
os scripts da página. UMD expõe `window.anime` e não mexe em nada.

Por que versão fixa e não `animejs@4`: `@4` resolve para a última 4.x a cada
visita. Um patch quebrado do fornecedor viraria um bug em produção sem nenhum
commit nosso. Com `integrity`, uma troca de bytes no CDN faz o navegador
**recusar** o arquivo — daí a guarda do item 2 abaixo ser obrigatória, não
opcional.

**Alternativa avaliada e descartada pelo cliente:** vendorizar em
`assets/js/vendor/`. O argumento técnico era que o cache HTTP é particionado por
site de topo desde Chrome 86 / Firefox 85 / Safari 15.4 — ou seja, o ganho
clássico de CDN compartilhado não existe mais, e o terceiro origin ainda cobra
DNS + TCP + TLS antes do primeiro byte. Fica registrado como caminho de saída se
o LCP pesar ou se a hospedagem exigir (é uma landing de órgão público: o CDN vê
o IP de cada visitante).

**2. O CSS continua dono do estado inicial.**

O Anime.js escreve estilo inline, que ganha do CSS. Mas ele só escreve **depois**
que o script carrega. Se o estado inicial (`opacity: 0`) sair do CSS, há um
flash do conteúdo já visível antes de o CDN responder — pior em conexão ruim.
Então: estado inicial no CSS, animação no Anime.js.

**3. `prefers-reduced-motion` continua no CSS.**

O bloco da seção 8 do `style.css` já resolve. No JS, `reduceMotion` passa a não
instanciar nenhum `onScroll`.

---

## Riscos

| # | Risco | Gravidade | Mitigação |
|---|---|---|---|
| 1 | **+115 KB de JS** (39.7 KB gzip) numa landing que hoje tem 13 KB | Alta | Medir LCP antes/depois. Se pesar, usar os submódulos (`animejs/animation` + `animejs/events`) via importmap em vez do bundle cheio |
| 2 | **Dependência de CDN de terceiro** — jsDelivr fora, ou SRI recusando o arquivo = página sem animação | Alta | **Obrigatório:** guarda `if (!window.anime) { motorAntigo(); }` no `main.js`. Enquanto a migração for parcial isso sai de graça, porque o motor antigo ainda está lá |
| 3 | **Scrub do vídeo regredir no iOS** | Alta | Fase 4, por último, e só depois de teste em device real |
| 4 | **Mais leituras de layout por frame** que o rAF único de hoje | Média | Um observer por seção, não por elemento |
| 5 | **Diferença visual imperceptível vira débito** | Média | Comparar curva numericamente antes de trocar, como já foi feito com a `outElastic` |
| 6 | Sem `package.json`, o CDN não tem *lockfile* | Baixa | SRI hash no `<script>` |

---

## O que eu recomendo

Fazer **só a Fase 1** agora. A seção 4 é a mais nova, a mais isolada e é a única
onde já provei que a curva bate exatamente. Se o resultado agradar, seguimos;
se não, o custo de reverter é um arquivo.

Migrar hero e vídeo junto, num passo só, seria trocar o motor de uma página
inteira sem nenhuma medição no meio — e o hero é a parte que mais dói se quebrar.

---

---

## Execução da Fase 1 — o que foi feito

| Arquivo | Mudança |
|---|---|
| `index.html` | `<script>` do CDN com SRI; `data-anime="gains"` na seção 4; `<script>` do módulo novo |
| `assets/js/anim/section-04.js` | **novo** — as 3 animações da seção com a biblioteca |
| `assets/js/main.js` | `animeReady` + `migrated()`; `reveal()` e `createTimelines()` passam a filtrar o que foi migrado |
| `assets/css/style.css` | regra `.is-anime [data-reveal] { transition: none; animation: none }` |
| `tests/` | **novo** — 2 suítes em Playwright + README |

## Três armadilhas que só o teste em navegador pegou

**1. `ease: 'cubicBezier(...)'` em string foi removido do core na 4.5.0.**
A biblioteca avisa no console e **cai no easing padrão**. Ou seja: a animação
fica errada sem quebrar nada, sem erro, sem sintoma visível num code review.
Medido: string → `12.00` (idêntico a linear, ignorada) · função → `46.63`.
Correção: `anime.cubicBezier(.22, 1, .36, 1)`.

Importante para as próximas fases: **isso não vale para todas as strings.**
`'outElastic(1, .3)'` continua funcionando (dá `135.21`, igual a
`eases.outElastic(1, .3)`), assim como `'outCubic'` e `'linear'`. Só a família
`cubicBezier` saiu. Ao migrar cada animação, **teste a string antes de confiar
nela** — o modo de falha é silencioso.

**2. O `target` do `onScroll` dos cards estava na `<section>`.**
Como a seção tem 260vh (é o curso da timeline), qualquer medida relativa a ela
caía a centenas de pixels de onde o card realmente está. Corrigido para a
`.gains__list`.

## 3. A ordem das palavras no `enter` é "CONTAINER ALVO"

Este era o problema em aberto, e a resposta estava no fonte da biblioteca
(`dist/modules/events/scroll.js`), não na documentação:

```js
const splitted = enter.split(' ');
enterContainer = splitted[0];   // PRIMEIRO  = ponto do CONTAINER
enterTarget    = splitted[1];   // SEGUNDO   = ponto do ALVO
```

Eu havia assumido o inverso, "alvo container". Por isso `'top+=20% bottom'`
nunca disparava: ele pedia "container em top+=20%, alvo em bottom", que não
descreve nada útil. Os padrões da lib são `enterContainer: 'end'` e
`enterTarget: 'start'`.

O equivalente exato de `threshold: 0.2` é:

```js
enter: 'end top+=20%'
//      │     └─ ponto do ALVO: 20% abaixo do topo dele
//      └─ ponto do CONTAINER: a base da viewport
```

Lê-se: *dispara quando o ponto a 20% da altura do alvo cruza a base da tela* —
que é a definição de `threshold: 0.2` para quem entra por baixo.

**Segundo achado, no mesmo problema:** sem `target` explícito, o `onScroll`
procura um elemento DOM entre os alvos da animação. Quando se anima um objeto
JS (a timeline faz isso), não há elemento, e o gatilho dispara num ponto sem
relação nenhuma com a tela — na medição, 880 a 1000px cedo demais. Por isso
todas as chamadas passam `target` explicitamente, mesmo quando ele coincide
com o elemento animado.

## Verificação

```
tests/section-04.spec.js   22 asserções   0 falhas
tests/fallback.spec.js      8 asserções   0 falhas
tests/threshold.spec.js     1 asserção    0 falhas
```

Três coisas que valem pelo resto:

1. **A curva elástica aplicada pela biblioteca bate ponto a ponto com os
   `@keyframes` que ela substituiu**, tolerância de 0.05px.
2. **O gatilho novo dispara no mesmo pixel que o `IntersectionObserver`
   antigo.** O `threshold.spec.js` roda os dois lado a lado nos mesmos
   elementos e compara o `scrollY` de cada disparo:

   | elemento | IntersectionObserver | onScroll | diferença |
   |---|---|---|---|
   | badge | y=7199 | y=7199 | **0px** |
   | título 1 | y=7269 | y=7269 | **0px** |
   | título 2 | y=7329 | y=7329 | **0px** |
   | cards | y=7459 | y=7459 | **0px** |

3. **Com o SRI recusando o arquivo, o motor antigo assume a seção inteira sem
   erro** — o Risco 2 deixou de ser teórico.

Com isso, **não resta nenhuma diferença de comportamento conhecida** entre o
antes e o depois desta seção.

---

# Fase 2 — seções 2 e 3

| Arquivo | Mudança |
|---|---|
| `assets/js/anim/effects.js` | **novo** — `[data-parallax]` e `[data-enter]` genéricos |
| `assets/js/anim/section-02.js` | **novo** — o reveal em bloco da seção 2 |
| `index.html` | `data-anime` nas seções 2 e 3, mais dois `<script>` |
| `assets/js/main.js` | guardas em `createParallax()`, `createEnters()` e nos escopos |
| `tests/fase-02.spec.js` | **novo** — 17 asserções |

**Desvio do plano:** `effects.js` não é "por seção". `[data-parallax]` e
`[data-enter]` são efeitos POR ELEMENTO, dirigidos por atributo, presentes em
várias seções; quebrá-los por seção duplicaria o mesmo laço em dois arquivos.
O que é realmente específico de uma seção (o reveal em bloco, a timeline)
continua em arquivo próprio.

**O que animamos:** as custom properties `--py` e `--e`, não as propriedades
finais. A fórmula que vira pixel e opacidade continua no CSS. Assim o CSS
segue sendo fonte única, e o caminho de fallback é o mesmo CSS, sem divergir.
Verificado que a 4.5.0 anima custom properties e o CSS as consome.

## A realimentação do rect ao vivo — a descoberta da fase

O `main.js` mede com `getBoundingClientRect()`, que **já inclui o transform
que a própria animação acabou de aplicar**. A conta dele é recursiva, e o que
está na tela é o *ponto fixo* dessa recursão. Não foi projetado assim, mas é o
que está no ar.

O Anime.js mede a posição estática. Mais são — e por isso mesmo, diferente.

A correção não foi reintroduzir o laço, e sim **deslocar os limites pela mesma
distância**, o que dá o mesmo resultado sem realimentação. Isso exigiu
descobrir, medindo, três coisas que nenhuma documentação diz:

1. **A régua da biblioteca nasce deslocada do valor INICIAL da animação.**
   Ela calibra o observador depois de aplicar esse valor. No parallax isso é
   `+amp`; nas entradas, `(1-0) * --enter-y`. Media 1.974px de erro constante
   no parallax e 110px de erro no início das entradas.
2. **A régua herda também o transform dos ANCESTRAIS.** O `.card__phone` vive
   num `.card` que é `[data-enter]` e nasce 110px deslocado. Erro permanente
   de 5.8px, não um transitório.
3. **`link()` guarda UMA animação só** (`this.linked = linked` no fonte). Três
   `link()` no mesmo observador deixavam duas animações paradas para sempre.

## Verificação

```
tests/fase-02.spec.js   17 asserções   0 falhas   (5 execuções seguidas)
```

O teste não compara "em que pixel disparou" — `--py` e `--e` são contínuos.
Ele **resolve o ponto fixo da conta antiga** a partir da posição estática e
compara com o que a biblioteca escreveu, ao longo de toda a rolagem:

| medida | divergência |
|---|---|
| `--e` das entradas (48 amostras) | **0.0000** |
| `--py` sem ancestral animado | **0.000px** |
| `--py` com o card assentado (o caso normal) | **0.025px** |
| `--py` com o card entrando | 1.8px |
| `--py` com o card ainda invisível | 3.9px |

## O resíduo que fica, e por quê

O parallax dos **filhos de um card** não bate enquanto o card está entrando ou
ainda invisível. É inerente: no motor antigo esse parallax está acoplado à
entrada do card pelo rect ao vivo, e o acoplamento muda a cada frame.
Reproduzi-lo exigiria o mesmo laço por frame que a migração veio tirar.

O desvio fica confinado a um card que está com `opacity: var(--e)` igual a
**zero** — literalmente invisível — ou deslizando 110px. Assim que o card
assenta, a divergência cai para 0.025px e lá fica pelo resto da página.

## Nota para quem for mexer no teste

Ele falhava em ~1 de cada 3 execuções por corrida de medição, não por erro do
código. O sintoma distingue os dois casos:

- **erro real** → divergência constante e reproduzível (foi assim que os
  110px e os 40px apareceram);
- **corrida** → divergência enorme e intermitente (0.5, 0.87) num valor que,
  medido depois de assentar, bate em 0.0000.

A espera agora é de três frames mais 80ms. Se voltar a oscilar, o suspeito é
o teste.

---

# Fase 3 — o hero

| Arquivo | Mudança |
|---|---|
| `assets/js/anim/hero.js` | **novo** — reveals, contadores, `--p`, `--reel`, `.bridge`, scrub |
| `index.html` | `data-anime="hero"`, mais um `<script>` |
| `assets/js/main.js` | guarda em `counters()`; `scrollFx()` desliga o bloco do palco |
| `tests/fase-03.spec.js` | **novo** — 20 asserções |

Diferente das seções 2 e 3, aqui **não há realimentação de rect ao vivo**: o
palco não é deslocado por animação nenhuma, então a fórmula do `main.js` não é
recursiva e a tradução foi direta.

## Resultado

| medida | divergência |
|---|---|
| `--p` do palco (37 amostras) | **0.0000** |
| `--reel` da tira de fundo | **0.0000** |
| `.bridge.is-active` em `--p > 0.50` | exato |
| `'outCubic'` da lib vs `1-(1-t)^3` do `main.js` | **0.0000** |
| gatilhos dos reveals vs `IntersectionObserver` | **2px** (= a resolução do teste) |
| contador vs `IntersectionObserver` | 24px — ver abaixo |

## O contador não pode ser bit-idêntico, e o motivo é interessante

O `<b data-count>` vive dentro de `.hero__stats`, que é `[data-reveal]`. O
`IntersectionObserver` antigo lê a posição **ao vivo**, e durante os 800ms do
reveal essa posição está *em movimento*.

Ou seja: **o ponto de disparo antigo depende da velocidade com que a pessoa
rola**. Rolando devagar o reveal termina antes e o contador começa num lugar;
rolando rápido, noutro. Não existe um valor único "certo" para reproduzir.

O gatilho novo mira o estado assentado, que é o que um leitor normal vê. Os
24px medidos são o teto, num teste que rola a 100px/s de propósito.

## O vídeo: o que foi e o que não foi verificado

**Não verificado:** o scrub ponta a ponta. O Chromium que vem com o Playwright
não traz o codec H.264 — `canPlayType('video/mp4; codecs="avc1.42E01E"')`
devolve string vazia e o `<video>` falha com `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`.
Não é defeito nosso e não adianta insistir no CI: **precisa de navegador com
codec, e o comportamento no iOS precisa de aparelho de verdade.**

**Verificado:**
- a conta que mapeia `--p` em `currentTime` (com `VIDEO_IN` 0.55);
- que `--p`, a única entrada do scrub, bate em **0.0000** com o motor antigo;
- que o miolo do scrub é **idêntico** nos dois arquivos.

Esse último é o risco concreto da fase: o miolo é uma **cópia gêmea** entre
`main.js` (fallback) e `anim/hero.js` (o que roda de fato), e cópias gêmeas
divergem. Os dois trechos estão entre marcas `===== MIOLO GÊMEO =====` e o
teste compara os textos normalizados. Confirmei que o detector funciona
injetando uma divergência de propósito (`0.04` → `0.08`): o teste falhou.

---

# Fase 4 — limpeza

**Decisão do cliente:** remover o motor antigo e ficar **só com o CDN**.
Eu havia recomendado vendorizar antes de remover; a decisão foi outra e está
registrada aqui com as consequências, não como ressalva pendente.

| Arquivo | Mudança |
|---|---|
| `assets/js/main.js` | **408 → 66 linhas**. Sobrou o menu e a rede de segurança |
| `assets/css/style.css` | nova seção 6c, `.sem-anime` |
| `assets/js/anim/hero.js` | scrub deixou de ser "cópia gêmea": é a única |
| `assets/js/anim/effects.js` | seletores deixam de exigir `[data-anime]` |
| `tests/fallback.spec.js` | reescrito para o contrato novo |
| `tests/fase-03.spec.js` | teste de cópias gêmeas removido (perdeu o objeto) |

O que saiu do `main.js`: `reveal()`, `observeScope()`, `counters()`,
`createVideoScrubber()`, `createParallax()`, `createEnters()`,
`createTimelines()`, `scrollFx()` e a fronteira `migrated()`.

## A rede de segurança — por que a limpeza não podia ser só apagar

Sem o motor antigo, se a biblioteca não chegar o resultado **não seria "página
sem animação"**: seria **página em branco**. O CSS esconde de propósito tudo
que vai ser animado (`[data-reveal]` nasce com `opacity: 0`, `[data-enter]`
com `opacity: var(--e, 0)`) — é isso que evita o flash de conteúdo enquanto o
script não chega. E as seções 1 e 4 têm vários viewports de altura só para
servirem de curso às animações.

Então a fase 4 inclui uma rede:

- `main.js` marca o `<html>` com **`.sem-anime`** quando `window.anime` não
  existe, e escreve o valor final dos contadores (o único caso que o CSS não
  resolve: o HTML traz `<b data-count="340">0</b>`);
- a **seção 6c do `style.css`** devolve tudo ao estado final — conteúdo
  visível, pins soltos, filetes acesos, linha do tempo cheia.

Custa 40 linhas de CSS e 10 de JS, e é a diferença entre degradar e quebrar.

## O que o `fallback.spec.js` garante agora

Servindo a página com o hash SRI corrompido (o navegador baixa e recusa):

| verificação | resultado |
|---|---|
| `window.anime` indefinido, `<html>` com `.sem-anime` | ✓ |
| os 19 elementos animáveis visíveis | ✓ |
| `.gains__sticky` e `.showcase__stage` soltaram o pin | ✓ |
| `.gains` volta de 2.6 para 1.0 tela | ✓ |
| contadores em 340 / 10 / 17, não em zero | ✓ |
| filetes acesos, linha do tempo em 100% | ✓ |
| nenhum erro de runtime | ✓ |

## O risco que a decisão deixa em pé

Com CDN e sem motor antigo, **jsDelivr fora do ar = página sem nenhuma
animação**. A rede garante que ela continua legível e navegável, não que
continua animada. Se um dia isso incomodar, o caminho é curto: baixar
`anime.umd.min.js` para `assets/js/vendor/`, trocar o `src` no `index.html` e
apagar as 40 linhas de `.sem-anime`. O hash para conferir o arquivo está na
seção de decisões técnicas.

---

# Ajuste posterior — a régua comanda os cards da seção 4

Pedido depois da sprint: os cards deixam de ter gatilho próprio. A barra
começa **toda cinza** e cada card entra quando o laranja alcança o terço dele.
Rolando de volta, a animação se desfaz.

| antes | agora |
|---|---|
| barra nascia com 33% laranja | nasce em 0% |
| cada card com gatilho próprio | a régua dá a partida |
| escalonamento por `stagger` | escalonamento pela rolagem |
| entrada só de ida | ida e volta |

## A saída: linear, por decisão do cliente

A ida mantém o elástico `outElastic(1, .3)`. A volta é **linear**.

Chegou a ser o espelho exato da entrada, com `inElastic` — que é o inverso
temporal de `outElastic` (verificado no navegador: `inElastic(t) ==
1 - outElastic(1 - t)`, com **erro zero** em todos os pontos). Ficou decidido
que a volta não precisa de elástico: sair é desfazer, não um efeito por si.

A opacidade mantém o desenho da entrada invertido — sobe nos primeiros 264ms
na ida, desce nos últimos 264ms na volta —, o que faz o card continuar visível
enquanto desliza para fora em vez de sumir antes de sair.

As animações não passam `from`: partem do valor em que o card estiver naquele
instante. É isso que faz inverter o sentido no meio de uma entrada ser
contínuo, sem salto.

Tentei antes o caminho óbvio, `reverse()`, e **não funciona como alternador**:
ele volta uma vez e depois fica preso em `reversed: true` — medido, chamá-lo
de novo não retoma para frente.

## Dois defeitos que este ajuste desenterrou

**1. A biblioteca congela o progresso ao sair da faixa.** Ela para de
sincronizar e deixa o valor onde estava, em vez de grampeá-lo na borda.
Medido: subindo, `--t` parava em `0.0136` e ficava ali.

Isso já existia, e **era uma regressão da fase 3**: o motor antigo recalculava
a cada frame e grampeava. Não aparecia porque a barra começava em 33% e nada
dependia de `--t` voltar a zero.

No hero o efeito era visível: descer um pouco e voltar ao topo deixava `--p`
travado em `0.1235`, com os celulares parados a meio caminho da transição.
Passou batido porque **todos os testes só amostravam descendo**.

Corrigido nos dois arquivos com uma trava de borda nos callbacks. Os nomes
deles não seguem o sentido da rolagem — subir para fora do início dispara
`onLeave`, descer além do fim dispara `onEnter` —, então a trava não confia no
nome: pergunta ao DOM onde a seção está.

**2. O critério de "a seção fixa" estava errado.** Eu usava "é mais alta que a
tela". Em 390px de largura a seção 4 tem 1,2 telas de conteúdo empilhado mas
`position: static` — a conta dizia "fixa" onde não fixa, e os cards ficavam em
`opacity: 0` para sempre. Agora a pergunta é feita ao CSS
(`getComputedStyle(...).position === "sticky"`), o que mantém as duas pontas
em sincronia sozinhas.

## Regra para daqui em diante

Qualquer coisa presa ao scroll precisa ser verificada **nos dois sentidos**.
Foi só descer e subir que os dois defeitos apareceram, e ambos estavam no ar
havia duas fases.

## Melhorias futuras (fora do escopo desta sprint)

- `debug: true` do `onScroll` desenha as linhas de gatilho na tela — vale expor
  por `?debug=1` na URL enquanto a landing estiver em ajuste.
- Converter as imagens da seção 4 para WebP (1,7 MB → ~200 KB) — pendente da
  sprint anterior.
- Com o Anime.js no projeto, `createTimeline()` permite sequenciar seções
  inteiras de forma declarativa. **Não fazer agora**: mudaria as animações.
