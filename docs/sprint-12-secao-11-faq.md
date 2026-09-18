# Sprint 12 — Seção 11: "Ainda tem dúvidas?" (FAQ / accordion)

## Objetivo

Fechar a página com uma área de perguntas frequentes. Sem animação de entrada:
a única seção da landing em que o movimento responde ao **clique**, não à rolagem.
Comportamento pedido: tudo fechado no início e, ao clicar num item, **todos os
outros fecham antes** de o clicado abrir.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `index.html` (seção `.faq`, antes de `</main>`) | Estrutura e conteúdo das 7 perguntas |
| `assets/css/style.css` (bloco 11, fim do arquivo) | Aparência + a transição de altura |
| `assets/js/anim/faq.js` | Só a **sequência** fecha → espera → abre |

Divisão proposital: o CSS desenha e anima, o JS apenas orquestra o tempo e o
estado ARIA. Nenhum estilo é escrito pelo JS além da altura em px.

## Decisões técnicas

1. **`<button>` + painel, não `<details>`.** `<details>` abre sozinho no clique;
   não há como adiar a abertura até o outro item terminar de fechar — que é
   exatamente o requisito.
2. **`height` em px medido (`scrollHeight`), não `max-height` chutado.** Com
   `max-height` a duração real varia com o tamanho do texto e painéis curtos
   parecem travar. Ao terminar de abrir, a altura volta a `auto` para o painel
   acompanhar redimensionamentos.
3. **Independente do anime.js.** Como `compare.js` e `bene.js`: se o CDN cair,
   o accordion continua funcionando.
4. **Sem `data-snap`.** A seção muda de altura conforme o item aberto; a regra de
   scroll snap do projeto só encaixa seções de exatamente uma tela.
5. **`--faq-dur` (CSS) espelha `DUR` (JS).** Um desenha, o outro agenda.
6. **Fontes do projeto**, herdadas do `body` via `font: inherit` no botão —
   apenas pesos 400 e 600, como o resto do CSS.

## Fluxos principais

```
clique → já aberto?  ── sim → fecha (sanfona)
                     └─ não → há outro aberto? ── sim → fecha, espera --faq-dur, abre
                                                └─ não → abre imediatamente
```

ARIA: `aria-expanded` no botão, `aria-controls` → `id` do painel, `role="region"`
+ `aria-labelledby` no painel, `hidden` quando fechado (tira do Tab).

## Riscos

- **Mudar a duração só no CSS ou só no JS**: o painel pisca no fim ou sobra uma
  pausa morta antes de abrir o próximo.
- **Ids duplicados** ao copiar um bloco: a tela parece certa, o leitor de tela lê
  o item errado. Trocar sempre o par `faq-bN` / `faq-pN`.
- **`:has()`** pinta a borda do item aberto; em navegador antigo a borda só fica
  cinza — degradação visual, não funcional.
- **Padding no painel** (em vez de no `.faq__resposta`) impediria a altura de
  chegar a zero.

## Melhorias futuras

- Abrir o item correspondente ao hash da URL (`#duvidas-3`) para links diretos.
- Setas ↑/↓ navegando entre as perguntas (padrão APG de accordion).
- Schema.org `FAQPage` em JSON-LD para rich snippet no Google.

## Testes manuais

1. Carregar a página: os 7 itens fechados, nenhum "+" girado.
2. Abrir o 1, clicar no 5: o 1 fecha por inteiro **antes** de o 5 começar a abrir.
3. Clicar duas vezes rápido em itens diferentes: nunca dois abertos ao mesmo tempo.
4. Tab: o foco nunca entra num painel fechado; anel laranja visível no botão.
5. `prefers-reduced-motion: reduce`: troca instantânea, sem pausa.
6. Abrir um item e redimensionar a janela: o painel acompanha o texto.
