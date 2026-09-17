# Sprint 10 — Footer

## Objetivo

O footer da referência, com entrada escalonada: os textos sobem de baixo para
cima, o logo só aparece, e tudo em ordem **da esquerda para a direita**.

## Duas âncoras mortas consertadas de quebra

Os dois botões "Fale com um especialista" — no header e no hero — apontam para
`#contato` desde a etapa 1. **Não havia destino nenhum**: os dois cliques não
saíam do lugar. O footer carrega esse `id`, e o teste agora varre a página
inteira cobrando que nenhuma âncora aponte para o vazio.

## O subtítulo já vem no PNG

A referência mostra "REDE SOCIAL ESPORTIVA" sob o wordmark, e a prévia do
`logo-white.png` parecia não ter — o arquivo mostrava só a bola e "ATLETA DO
VÔLEI" em laranja.

A prévia mentia: o subtítulo é **branco**, e a prévia tem fundo branco. Confirmei
decodificando o PNG (739×200, RGBA, sem entrelaçamento) e varrendo por faixa
vertical:

| faixa y | pixels opacos | brancos | extensão x |
|---|---|---|---|
| 140–159 | 5.124 | 3.762 (73%) | 9 → 605 |

A bola termina em x≈190. Os 73% de branco indo até x=605 só podem ser o
subtítulo. **Não acrescentar um `<p>` com esse texto** — apareceria duas vezes,
uma por cima da outra. Há um teste cobrando isso.

## Medidas

A referência é uma captura 1:1 numa janela de 1908px com o conteúdo de 1167px
centrado — praticamente o `--container` do projeto. Por isso os valores aqui são
px de verdade, e não frações de um palco: esta seção é **tipografia num
container**, como a seção 4, e não uma composição de proporção fixa como a 5 e a
7. Usar `--u` aqui seria copiar a solução errada.

| | Medido | No CSS |
|---|---|---|
| Coluna "Navegação" | 533/1167 | 45,7% |
| Coluna "Contato" | 835/1167 | 71,5% |
| Logo | 167px | `clamp(140px, 14.4vw, 167px)` |
| Espaço entre links | 29px entre linhas | `gap: 8px` (15px de corpo × 1.4 já ocupam 21) |

## A ordem da animação

**É a ordem do DOM**, e não uma lista separada. As três colunas estão escritas no
HTML na ordem em que aparecem na tela, e dentro de cada uma de cima para baixo,
então um `querySelectorAll` já devolve tudo na ordem certa e o `stagger` aplica o
atraso pelo índice.

```
[logo] → descrição → NAVEGAÇÃO → 3 links → CONTATO → 2 itens → copyright
```

O preço é uma dependência que não se vê: **reordenar as colunas no HTML reordena
a animação**, sem erro nenhum. Está avisado no HTML e no módulo, e o teste fixa a
sequência esperada — é o alarme desse acordo.

**Um seletor só para os textos**, e isso importa: é o que faz o índice do stagger
correr contínuo *através* das colunas. Uma animação por coluna faria os atrasos
recomeçarem do zero em cada uma, e as três entrariam ao mesmo tempo.

O logo fica **fora** dessa animação porque não se desloca — só opacidade, como
pedido. O `start: PASSO` do stagger reserva o primeiro passo para ele e mantém a
fila contínua.

## Decisões técnicas

| Decisão | Por quê |
|---|---|
| Módulo próprio (`footer.js`) | O `[data-reveal]` do CSS não tem mais motor genérico; desde a sprint 5 cada seção anima o que é seu |
| Sem `.is-anime` | Aquela classe existe para desligar as `transition` de `[data-reveal]`, e aqui não há nenhuma nos elementos animados |
| `lib.cubicBezier(...)` e não a string | Na 4.5.0 a forma em string foi removida do core e a biblioteca cai no easing padrão sem avisar em tela |
| px e `clamp`, não `--u` | Tipografia num container, não composição de proporção fixa |
| `ease: "linear"` no logo | Só opacidade: uma curva ali não tem o que moldar |

## Estrutura de arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | `<footer id="contato">` com as três colunas e a faixa de baixo; `footer.js` na lista de scripts |
| `assets/css/style.css` | Bloco **5g**; estados iniciais; as duas redes de segurança; responsivo ≤720px |
| `assets/js/anim/footer.js` | **Novo.** A entrada escalonada |
| `tests/footer.node.mjs` | **Novo.** 21 asserções |

## Riscos

1. **Não verificado no navegador**, pela mesma limitação das sprints 6 a 9
   (faltam bibliotecas de sistema do Chromium; a instalação pede `sudo`).
   Estrutura, ordem e as redes de segurança estão cobertas por teste; **cores,
   tamanhos e espaçamentos não foram vistos renderizados**.
2. **A cor de fundo (`#0A1B33`) saiu a olho** da referência. O projeto tem
   `--navy: #0B2545`, que é mais claro — se houver paleta oficial para o footer,
   é um valor a acertar.
3. **O ano do copyright está fixo em 2026**, como na referência. Vira texto
   velho em janeiro de 2027.
4. **Os endereços são os da referência** (`contato@atletadovolei.com.br` e
   `atletadovolei.com.br`). Se forem de exemplo, precisam ser trocados antes de
   publicar.

## Onde mexer no futuro

| Quero... | Mexo em |
|---|---|
| A entrada mais rápida / mais lenta | `DURACAO` no `footer.js` |
| Mais ou menos espaço entre os elementos | `PASSO` |
| O deslocamento maior | `SOBE` no JS **e** o `translateY(24px)` do CSS — os dois espelham |
| Mudar a ordem da animação | a ordem dos blocos no HTML (e o teste avisa) |
| Outra largura de coluna | `grid-template-columns` do `.foot__inner` |

## Como debugar

- **O footer aparece em branco** → um elemento novo nasceu escondido e não entrou
  nas duas redes (`.sem-anime` e movimento reduzido). `tests/footer.node.mjs`
  cobra exatamente isso.
- **Tudo entra junto** → o `stagger` sumiu, ou os textos foram divididos em mais
  de uma animação.
- **A ordem está trocada** → alguém reordenou os blocos no HTML.
- **O logo se desloca** → ele entrou na animação dos textos; tem de ficar na sua.
