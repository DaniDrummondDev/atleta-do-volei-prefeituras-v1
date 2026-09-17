# Sprint 6 — Palco duplo: seções 4 e 5 num pin só

## Objetivo

Três pedidos do cliente, que na prática são um só:

1. A passagem da seção 4 ("O que a prefeitura ganha?") para a 5 ("A transformação")
   deixa de ser rolagem vertical e passa a ser **deslize horizontal**.
2. A régua que existia embaixo de cada uma vira **uma só**, compartilhada pelas
   duas, e **não acompanha o deslize** — fica parada enquanto os painéis passam.
3. O terceiro rótulo da régua, **"Não é mais um sistema", sai**.

## Arquitetura

As duas seções pararam de ser seções fixadas independentes e viraram **painéis**
de um palco único.

```
.duo                      altura = 260 + 40 + 320 vh  ← o curso de rolagem
└ .duo__sticky            position: sticky; 100vh; overflow: hidden
  ├ .duo__rail            width: 200%; translateX(--pan * -50%)
  │ ├ .duo__panel → section.gains#beneficios
  │ └ .duo__panel → section.trans#transformacao
  └ .timeline.duo__timeline      ← IRMÃ do trilho, por isso não desliza
```

**O ponto central**: a régua é irmã do trilho, não filha. Essa posição no DOM é a
única coisa que a mantém parada. Se alguém a mover para dentro de um painel, ela
volta a viajar.

### Um maestro, três atos

`assets/js/anim/duo.js` é o único driver de scroll das duas seções. Ele mede o
palco inteiro (progresso `p` de 0 a 1) e fatia em três atos:

```
p:  0 ............ f4 ...... fPan ................. 1
    |  coreografia  |deslize |   coreografia da 5   |
    |   da seção 4  |  4->5  |                      |
         → t4            → pan            → t5
```

As fronteiras **não estão escritas no JS**: saem dos tokens `--curso-4`,
`--curso-pan` e `--curso-5` do `.duo` no CSS, lidos com `getComputedStyle`. Os
mesmos tokens definem a altura da seção. Uma fonte só — mexeu no CSS, o JS
acompanha.

### Contrato público — `window.DUO`

| Membro | O que faz |
|---|---|
| `.fixo()` | `true` se o palco está realmente fixado (pergunta ao CSS, não à altura) |
| `.subscribe(fn)` | `fn` recebe `{ p, t4, pan, t5 }` a cada frame; é chamada uma vez na inscrição |

`duo.js` carrega **antes** de `section-04.js` e `section-05.js` no `index.html`.
Com `defer`, a ordem das tags é a ordem de execução.

## Decisões técnicas

| Decisão | Por quê | Alternativa descartada |
|---|---|---|
| Um maestro, não três observadores | Deslize e as duas coreografias viraram tempos do mesmo movimento; três `onScroll` independentes não têm como garantir que o deslize só comece depois de a 4 fechar | Cada seção com o seu `onScroll` |
| Painéis mantêm `<section>`, `id` e `data-anime` | Âncoras (`#beneficios`, `#transformacao`) e os seletores dos módulos continuam valendo | Fundir tudo numa seção só |
| `section-04/05` viraram **pintores puros** (`paint(t)` / `pintar(p)`) | Separar "onde as coisas estão" de "quem mede o scroll" é o que permitiu virar painel sem tocar numa linha de coreografia | Passar geometria para dentro delas |
| Fronteiras lidas do CSS | Os cursos já viviam lá (definem a altura); repetir os números no JS criaria duas verdades | Constantes duplicadas com comentário "espelha:" |
| `--rodape` como token do palco | Três coisas precisam concordar sobre a faixa da régua: o painel, a régua e o `--u` da seção 5 (que calcula a largura do círculo a partir da altura disponível) | Padding solto em cada seção — **recortava o círculo da seção 5** |
| Régua unificada mede o palco inteiro | Decisão do cliente nesta sprint: barra ancorada, preenchimento contínuo de 0% (início da 4) a 100% (fim da 5) | Preenchimento congelado, só indicador de capítulo |

## Estrutura de arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | Seções 4 e 5 embrulhadas em `.duo`; as duas réguas antigas removidas; régua unificada com **2 rótulos**; `duo.js` na ordem de carga |
| `assets/css/style.css` | Bloco novo **5d-bis** (palco duplo); `.gains`/`.trans` viraram painéis (sem `height`/`sticky` próprios); `.timeline__labels` em 2 colunas; `.duo` desempilhado nos 3 fallbacks |
| `assets/js/anim/duo.js` | **Novo.** O maestro |
| `assets/js/anim/section-04.js` | `seçãoFixa()` pergunta ao `window.DUO`; `paint()` virou `paint(t)`; driver próprio removido |
| `assets/js/anim/section-05.js` | `pintar(p)` extraído; driver próprio removido; `tocarUmaVez()` **novo**, para quando não há pin |

## Fluxos principais

**Desktop, palco fixado**

```
scroll → duo.js (onScroll sync) → pintar(p)
                                   ├→ --pan no .duo__rail      (o deslize)
                                   ├→ --t no .duo              (a régua unificada)
                                   ├→ .is-current nos rótulos  (troca no meio do deslize)
                                   └→ ouvintes: section-04 paint(t4) · section-05 pintar(t5)
```

**Telefone (≤720px), movimento reduzido, ou sem a biblioteca**

O CSS troca o `sticky` por `static` e empilha os painéis na vertical.
`DUO.fixo()` devolve `false`, `duo.js` não instala driver nenhum, e cada seção
volta ao gatilho próprio: seção 4 com gatilho por card, seção 5 tocando a
partitura uma vez ao entrar na tela.

## Riscos

1. **Não verificado no navegador.** O ambiente não tem as bibliotecas de sistema
   do Chromium (`libnspr4`, entre outras) e instalá-las pede `sudo` com senha. A
   sintaxe do JS e o balanceamento do HTML foram conferidos; o comportamento
   visual **não**. É o primeiro item a checar.
2. **`onScroll` solto em `tocarUmaVez()`** — o observador é usado só pelo
   callback `onEnter`, sem animação atrelada. É a forma que funciona com
   `timeline` (o cabeçalho de `section-05.js` explica por quê), mas é o trecho
   menos exercitado do arquivo.
3. **Os testes em `tests/` vão falhar.** `section-04.spec.js`, `section-05.spec.js`,
   `snap.spec.js`, `threshold.spec.js` e `fallback.spec.js` afirmam a estrutura
   antiga: `.gains__sticky`, `.trans__sticky`, alturas de 260vh/320vh, três
   rótulos na régua. Não há `package.json` no projeto, então não deu para rodá-los
   aqui. Precisam ser atualizados numa sub-sprint.
4. **O bloco de desempilhar aparece 3 vezes** no CSS (`.sem-anime`,
   `prefers-reduced-motion`, `@media 720px`), porque nenhuma das três situações
   pode depender das outras. Está marcado "cópia N de 3" nos três. Mexeu num,
   mexa nos três.
5. **Altura do painel.** Cada painel tem exatamente `100vh - --rodape`. Conteúdo
   que cresça além disso é cortado pelo `overflow: hidden` do sticky, sem aviso.

## Onde mexer no futuro

| Quero... | Mexo em |
|---|---|
| O deslize durar mais/menos | `--curso-pan` no `.duo` (o JS se ajusta sozinho) |
| A seção 4 ou 5 rolar mais devagar | `--curso-4` / `--curso-5` |
| A régua mais alta ou mais baixa | `--rodape` no `.duo` |
| O rótulo trocar mais cedo | `estado.pan < 0.5` em `pintar()`, `duo.js` |
| Um terceiro painel | `.duo__rail { width: 300% }`, painel a `33.333%`, mais um curso e mais uma fatia em `pintar()` |

## Melhorias futuras

- Atualizar os specs (risco 3) e cobrir o novo contrato `window.DUO` — as funções
  `fatia()` e `fronteiras()` são puras e testáveis sem navegador.
- Um `package.json` com o Playwright, para os testes deixarem de ser manuais.
- Considerar `scroll-snap` nas duas fronteiras do deslize, se o cliente achar a
  transição escorregadia demais.
- Acessibilidade: com o palco fixado, navegar por teclado (Tab) para dentro do
  painel 2 enquanto ele está fora da tela pode gerar foco invisível. Vale um
  `inert` no painel que não está na vez.

## Como debugar

No console, com o palco na tela:

```js
window.DUO.fixo()                               // o palco está fixado?
window.DUO.subscribe(d => console.log(d))       // acompanha p, t4, pan, t5
getComputedStyle(document.querySelector('.duo')).getPropertyValue('--curso-pan')
document.querySelector('.duo__rail').style.getPropertyValue('--pan')
```

- **Seção 5 invisível** → `t5` nunca sai de 0, ou o `.trans` ficou fora do
  `overflow` do sticky. Confira `--pan` chegando a 1.
- **Régua deslizando junto** → ela voltou para dentro do `.duo__rail`.
- **Círculo da seção 5 cortado embaixo** → `--rodape` não está sendo descontado
  em `--u`.
