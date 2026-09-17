# Testes de animação

Dois arquivos, sem framework: cada um sobe um servidor estático na pasta do
projeto, abre a página num Chromium de verdade e afirma sobre o **estilo
computado** — não sobre o código. É o único jeito de verificar animação:
`node --check` não sabe se um card chegou em `x = 0`.

## Rodar

```bash
npm install playwright          # só a primeira vez
npx playwright install chromium # baixa o navegador

node tests/section-04.spec.js   # a seção 4 com Anime.js
node tests/fallback.spec.js     # a seção 4 com a biblioteca recusada
node tests/threshold.spec.js    # o gatilho novo é igual ao antigo?
node tests/fase-02.spec.js      # as seções 2 e 3 com Anime.js
node tests/fase-03.spec.js      # o hero com Anime.js
node tests/snap.spec.js         # o encaixe de rolagem por seção
```

node tests/section-05.spec.js   # a coreografia da seção 5

Total atual: **126 asserções, 0 falhas**.

**`section-05.spec.js`** cobre duas coisas distintas:

- a **ordem** da coreografia (foi pedido um ritmo, então o teste varre a
  seção e cobra a sequência, não só "cada peça aparece");
- a **fidelidade à referência**. A seção reconstrói o palco 1000×563 do mock e
  posiciona tudo em fração dele, então 12 medidas são comparadas com o que foi
  medido na imagem original. Isso existe porque a primeira versão usava o
  `.container` de 1160px: a composição mudava de proporção a cada largura de
  tela, o círculo saía pequeno e a régua ia parar no meio da seção.

⚠️ **As suítes dependem do CDN.** Se o jsDelivr não responder, dezenas de
asserções falham de uma vez com `window.anime carregou — undefined exports`.
Isso é rede, não regressão: o sintoma é falhar **tudo ao mesmo tempo**, em
todos os arquivos. Confira o CDN antes de investigar o código.

Se o Chromium já existir em outro lugar, aponte com a variável:

```bash
CHROME_PATH=/caminho/para/chrome node tests/section-04.spec.js
```

## O que cada um cobre

**`section-04.spec.js`** — 20 verificações:

| Bloco | Verifica |
|---|---|
| 1 | a biblioteca carrega do CDN e o SRI aceita o arquivo |
| 2 | o motor antigo do `main.js` **não** toca na seção migrada |
| 3 | estado inicial: card em `opacity: 0`, deslocado 90px |
| 4 | os 3 cards se movem e pousam em `x = 0`, opacos |
| 5 | badge e as duas linhas do título pousam em `y = 0` |
| 5b | **a curva elástica aplicada bate com os `@keyframes` antigos**, ponto a ponto, com tolerância de 0.05px |
| 6 | `--t` vai de 0 a 1, o fill de 33% a 100%, e o índice ativo de 0 a 2 |
| 7 | só o card da vez tem o filete laranja aceso |
| 8 | o hero continua animado pelo motor antigo (não foi migrado junto sem querer) |

**`fallback.spec.js`** — 12 verificações:

- console limpo (sem aviso de API removida da biblioteca);
- servindo a página com o **hash SRI corrompido**, a rede `.sem-anime` entra:
  os 19 elementos animáveis ficam visíveis, `.gains__sticky` e
  `.showcase__stage` soltam o pin, `.gains` volta de 2.6 para 1.0 tela, os
  contadores mostram 340/10/17 em vez de zero, os filetes acendem e a linha do
  tempo aparece cheia — sem nenhum erro de runtime.

Esse é o teste mais importante do conjunto depois da fase 4. A entrega é só
por CDN e o motor antigo foi removido, então ele é o que separa "a página não
anima" de "a página não aparece".

Por que corromper o SRI em vez de bloquear a rede: bloquear via
`page.route()` dá falso-positivo, porque o arquivo já em cache é servido sem
gerar requisição — não há o que interceptar, e o teste passa sem ter testado
nada. Corromper o hash exercita o caminho real (o navegador baixa e recusa) e
não depende de cache.

**`threshold.spec.js`** — a prova de que o gatilho não mudou:

Roda um `IntersectionObserver({ threshold: 0.2 })` — o mesmo que o `main.js`
usa — **lado a lado** com o `onScroll()` do Anime.js, nos mesmos elementos, e
compara em que `scrollY` cada um dispara, rolando de 10 em 10px.

```
elemento    IntersectionObserver  onScroll    diferenca
badge       y=7199                y=7199      0px
titulo 1    y=7269                y=7269      0px
titulo 2    y=7329                y=7329      0px
cards       y=7459                y=7459      0px
```

É o teste a rodar primeiro ao migrar qualquer outra seção: se o gatilho novo
não cair no mesmo pixel, a animação mudou, por mais que pareça igual.

## Cuidado ao escrever novos testes

O `style.css` tem `html { scroll-behavior: smooth }`. Sem desligar isso, todo
`window.scrollTo` do teste ainda está a caminho quando você mede, e o teste
falha por um motivo que não existe. Os dois arquivos já injetam
`scroll-behavior: auto` logo depois do `goto` — mantenha isso.

## Achados que estes testes produziram

1. `ease: 'cubicBezier(...)'` **em string foi removido do core na 4.5.0**. A
   biblioteca avisa no console e cai no easing padrão — a animação fica errada
   sem quebrar nada. Tem de ser a função `anime.cubicBezier(...)`.
   Cuidado: isso **não** vale para todas as strings. `'outElastic(1, .3)'`,
   `'outCubic'` e `'linear'` continuam funcionando. Teste antes de confiar.
2. O `target` do `onScroll` dos cards estava na `<section>`, que tem 260vh. O
   threshold caía a centenas de pixels de onde o card realmente está.
3. **A ordem das palavras no `enter` é "CONTAINER ALVO"**, não "alvo
   container". Está no fonte da lib (`dist/modules/events/scroll.js`):
   `enterContainer = splitted[0]; enterTarget = splitted[1];`.
   O equivalente de `threshold: 0.2` é `enter: 'end top+=20%'`.
4. **Sem `target` explícito**, o `onScroll` procura um elemento DOM entre os
   alvos da animação. Animando um objeto JS não há elemento, e o gatilho
   dispara num ponto arbitrário — medido, 880 a 1000px cedo demais. Sempre
   passe `target`.
5. **A régua do observador nasce deslocada do valor INICIAL da animação**, e
   também do transform dos ANCESTRAIS. Ver o cabeçalho de `effects.js`: valia
   1.974px de erro constante no parallax, 110px nas entradas e mais 5.8px nos
   filhos dos cards.
6. **`link()` guarda uma animação só** (`this.linked = linked`, no fonte).
   Para N animações no mesmo gatilho, crie N observadores.

**`snap.spec.js`** — 12 verificações do encaixe de rolagem.

**A regra:** encaixa só a seção de **exatamente uma tela**. Tudo que passa de
100vh é contínuo — nem no meio, nem na chegada.

O motivo é que uma seção mais alta que a tela é mais alta **de propósito**: a
altura extra é o curso de rolagem de uma animação (`--p`, `--reel`, o vídeo,
`--e`, `--t`). Nelas não existe "posição certa" para encaixar — cada pixel de
rolagem é um quadro. Encaixar seria escolher um quadro pela pessoa.

| seção | altura | comportamento |
|---|---|---|
| `.hero` | 5,6 telas | contínua |
| `.social` | 1 tela | **encaixa** (±150px verificados) |
| `.features` | 2,2 telas | contínua |
| `.gains` | 2,6 telas | contínua |

Quem encaixa é marcado com `data-snap` no HTML, não por lista de classes no
CSS — uma seção nova de 100vh ganha encaixe só adicionando o atributo. O teste
confere que **todo `[data-snap]` cabe mesmo em uma tela**: se alguém deixar o
atributo numa seção que cresceu, a regra teria sido violada sem sintoma
visível, e é essa verificação que avisa.

## O vídeo do hero não é testável aqui

O Chromium que vem com o Playwright **não tem o codec H.264**:
`canPlayType('video/mp4; codecs="avc1.42E01E"')` devolve string vazia e o
`<video>` falha com `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`. Não é defeito do
projeto, e não adianta insistir — precisa de um navegador com codec, e o
comportamento no iOS precisa de aparelho de verdade.

No lugar disso, o `fase-03.spec.js` testa o risco que existe de fato: o miolo
do scrub é uma **cópia gêmea** entre `main.js` (fallback) e `anim/hero.js` (o
que roda). Os dois trechos vivem entre marcas `===== MIOLO GÊMEO =====` e o
teste compara os textos normalizados, falhando se alguém mexer num e esquecer
do outro. Confirmado que o detector pega, injetando uma divergência de
propósito.

**O que continua precisando de verificação manual, em navegador real:** o
scrub do vídeo ponta a ponta, e principalmente no iOS.

## Instabilidade: como diferenciar de bug

O `fase-02.spec.js` chegou a falhar em ~1 de cada 3 execuções por corrida de
medição, e não por erro de código. O sintoma separa os dois casos:

- **erro real** → divergência **constante e reproduzível** (foi assim que os
  110px e os 40px foram achados);
- **corrida** → divergência **enorme e intermitente** (0.5, 0.87) num valor
  que, medido depois de assentar, bate em 0.0000.

A espera depois de cada scroll é de três frames mais 80ms, porque a biblioteca
atualiza os observadores no laço dela, que roda depois do nosso.
