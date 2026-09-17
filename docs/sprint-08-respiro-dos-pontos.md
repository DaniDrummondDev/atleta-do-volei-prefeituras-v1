# Sprint 8 — O respiro dos pontos do anel

## Objetivo

Os dez pontos laranja do anel da direita (seção 5) ganham uma animação comum:
opacidade de **100% a 20% e de volta a 100%**, com easing **linear**. Nunca todos
ao mesmo tempo, e em **ordem aleatória**.

## Arquitetura

A animação é **CSS puro**. O JS entra uma vez, sorteia dois números por ponto, e
acaba — não há laço, timer nem `requestAnimationFrame` rodando na página.

```
spots.js  (uma vez, no carregamento)
   └→ --ciclo e --atraso no .trans__spot
        └→ herdados até .trans__spot i::after
             └→ @keyframes spot-respirar   ← a animação mora aqui
```

### O conflito que ditou o desenho (de novo)

A opacidade do `<i>` **já é da coreografia** — o Anime.js a reescreve a cada
frame, raspada pelo scroll. E uma `@keyframes` de `opacity` no próprio `<i>`
**ganharia** do `style` inline (animação CSS tem prioridade sobre inline): os
pontos acenderiam antes de a coreografia chegar neles.

Então o desenho do ponto desceu para `i::after`. Pseudo-elemento não recebe
`style` inline, e a opacidade dele **multiplica** a do pai:

| Pergunta | Quem responde |
|---|---|
| "o ponto já apareceu?" | a coreografia, na `opacity` do `<i>` |
| "o ponto está piscando?" | o `@keyframes`, na `opacity` do `::after` |

É a quarta vez nesta seção que a saída é a mesma — pôr a coisa num nível que o
Anime.js não alcança:

| Efeito | Onde foi parar |
|---|---|
| Pulso da seta | `.trans__seta img` |
| Legendas sumindo | `filter`, não `opacity` |
| Risco das pílulas | `.trans__pill i::after` |
| Respiro dos pontos | `.trans__spot i::after` |

### Por que o sorteio é no JS, e os ângulos no HTML

`--ang` é **dado do item**: "Atletas" fica a −60°, sempre, e por isso mora no
HTML. O atraso não é dado de coisa nenhuma — ele precisa ser **diferente a cada
visita**, que é o que "ordem aleatória" quer dizer. Valores fixos no HTML dariam
sempre a mesma ordem, para todo mundo, para sempre.

Os dois números são escritos no `.trans__spot` (o `<li>`), **não no `<i>`**: o
`<i>` é o elemento que a coreografia anima, e o `style` inline dele é território
do Anime.js. Custom properties herdam, então escrever no pai chega ao `::after`
do mesmo jeito, sem dividir o atributo com ninguém.

## A decisão medida: ciclo igual para todos

A primeira versão sorteava **também** o ciclo (7–9,5s), para as fases derivarem e
a ordem nunca se repetir. Simulei 30 minutos de animação antes de aceitar:

| Ciclo | Média simultânea | 4 ou mais juntos | Pico |
|---|---|---|---|
| 7–9,5s (sorteado) | 2,0 de 10 | **12,0% do tempo** | 7 |
| 7,4–8,6s (faixa estreita) | 2,0 de 10 | **11,4% do tempo** | 7 |
| 8s (igual para todos) | 2,0 de 10 | **0%** | 3 |

A deriva que garantia a variedade era a mesma que empilhava os pontos — estreitar
a faixa não ajudou, porque o empilhamento vem da deriva em si, não do tamanho
dela. Com o ciclo igual, as fatias embaralhadas ficam espaçadas **para sempre**.

O preço é a ordem sorteada se repetir a cada 8s. É imperceptível, porque a ordem
é aleatória **no anel** — não uma varredura de um ponto para o vizinho. Trocamos
uma variedade que ninguém vê por uma garantia que todo mundo vê.

### Fatias embaralhadas, não instantes sorteados

Cada ponto recebe uma **fatia** diferente do ciclo (8s ÷ 10 = 0,8s), e são as
fatias que passam pelo Fisher-Yates — não os instantes.

A diferença importa: sorteando um instante solto para cada ponto, o acaso junta
dois no mesmo momento com frequência (é o paradoxo do aniversário) e deixa
buracos longos sem ninguém. Distribuindo fatias e embaralhando, o espaçamento
fica garantido e o que é aleatório é a **ordem** — que é o que foi pedido.

Dentro da fatia ainda há uma tremida de até 60% dela, para os inícios não caírem
num relógio perfeito. Sobram pelo menos 0,32s entre duas piscadas.

## Estrutura de arquivos

| Arquivo | O que mudou |
|---|---|
| `assets/js/anim/spots.js` | **Novo.** Sorteia `--ciclo` e `--atraso`. Roda uma vez |
| `assets/css/style.css` | `.trans__spot i` virou caixa; o desenho e o respiro foram para `i::after`; `@keyframes spot-respirar` |
| `index.html` | `spots.js` no fim da lista de scripts |
| `tests/spots.node.mjs` | **Novo.** 9 asserções sobre o sorteio |

Nada mudou no HTML das pílulas ou dos pontos — o efeito inteiro coube em CSS mais
um sorteio.

## Números

| Constante | Valor | Onde |
|---|---|---|
| Ciclo (piscada + pausa) | 8s | `CICLO`, `spots.js` |
| Fração do ciclo que pisca | 20% (≈1,6s) | `@keyframes spot-respirar` |
| Opacidade mínima | 20% | idem |
| Tremida dentro da fatia | 60% | `TREMIDA`, `spots.js` |
| Nova piscada a cada | 0,8s | calculado (ciclo ÷ pontos) |

## Riscos

1. **Não verificado no navegador**, pela mesma limitação das sprints 6 e 7
   (faltam bibliotecas de sistema do Chromium; a instalação pede `sudo`). O
   sorteio está coberto pelos 9 testes e o empilhamento foi simulado; a piscada
   em si — que é `@keyframes` — não foi vista rodando.
2. **`animation` no `::after` de um elemento com `transform`**: a coreografia
   escala o `<i>` de 0 a 1 na entrada. O `::after` acompanha a escala (é efeito
   de pintura do pai), então o ponto cresce e pisca ao mesmo tempo sem conflito —
   mas é o ponto a olhar se algo parecer estranho durante a entrada.
3. **Dez animações CSS infinitas** rodam enquanto a página está aberta, mesmo com
   a seção fora da tela. São animações de `opacity` (compostas na GPU) em
   elementos de 7px, então o custo é desprezível — mas se um dia o perfil de
   desempenho acusar, a correção é pausá-las com a mesma classe `.is-ativa` que
   a seção já usa.
4. **Se `spots.js` não carregar**, os valores de reserva do CSS (`0s`) deixam os
   pontos acesos e parados. É o estado final correto — degrada em silêncio.

## Onde mexer no futuro

| Quero... | Mexo em |
|---|---|
| Piscar mais devagar / mais rápido | `CICLO` no `spots.js` |
| Mais ou menos pontos piscando juntos | a fração do `@keyframes spot-respirar` (20%) |
| Piscar mais fundo que 20% | o `10% { opacity: .2 }` do `@keyframes` |
| Os inícios mais/menos irregulares | `TREMIDA` no `spots.js` |
| O mesmo respiro nas pílulas da esquerda | o seletor do `::after`; o mecanismo é o mesmo |

## Como debugar

```js
// o que cada ponto sorteou nesta visita
[...document.querySelectorAll('.trans__spot')]
  .map(s => [s.textContent.trim(), s.style.getPropertyValue('--atraso')])
  .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))   // a ordem da vez
```

- **Todos piscam juntos** → `spots.js` não rodou, e todos caíram no mesmo
  `--atraso` de reserva.
- **Nada pisca** → `--ciclo` está em `0s` (o valor de reserva), ou o movimento
  reduzido está ligado.
- **Os pontos acendem antes da coreografia** → a animação voltou para o `<i>`.
  Ela tem de ficar no `::after`.
