/* =========================================================
   ESTATÍSTICAS VIVAS — atletas, equipes e eventos
   ---------------------------------------------------------
   Um único número por métrica alimenta DOIS lugares da página:

     .hero__stats   (seção 1)
     .mapa__stats   (seção 9)

   Antes cada lista tinha o seu próprio data-count escrito à mão e os dois
   divergiam (340 x 1568 atletas). Agora o HTML só diz QUAL é a métrica —
   data-stat="atletas" — e este arquivo escreve o data-count de hoje nos dois.
   O data-count que está no HTML continua valendo como valor estático de
   segurança, para o caso de este script não rodar.

   ---------------------------------------------------------
   COMO O NÚMERO CRESCE

   Cada dia corrido desde EPOCA soma um incremento sorteado dentro da faixa
   da métrica. O sorteio NÃO é Math.random(): é um hash de (dia, métrica).

   Por que hash e não random:
     - o mesmo dia dá sempre o mesmo número, para todo mundo, em qualquer
       aba — com Math.random() o contador mudaria a cada F5, o que lê como
       bug, não como crescimento;
     - o número nunca regride, porque é a soma de todos os dias anteriores;
     - não precisa de servidor, cookie ou localStorage.

   O preço: é um número FICTÍCIO e previsível, não um dado real. Se um dia
   existir uma API com os números de verdade, o lugar de trocar é valor() —
   o resto da página não precisa saber.

   ---------------------------------------------------------
   ONDE MEXER

     BASE    — os valores do dia da EPOCA (o "zero" da contagem)
     EPOCA   — a data em que BASE valia; NÃO mude sem mudar BASE junto,
               senão o número salta de uma vez
     FAIXA   — quanto cada métrica cresce por dia [mínimo, máximo]

   Mudar a faixa muda o crescimento só dos dias FUTUROS? Não: a soma é
   recalculada do zero a cada carga, então o número de hoje muda junto.
   É aceitável aqui (é número de vitrine), mas é bom saber.
   ========================================================= */
(function () {
  "use strict";

  /* O dia em que os valores de BASE eram os corretos. Meia-noite UTC: a
     virada do contador tem de ser a mesma para todos os fusos, senão dois
     visitantes no mesmo instante veem números diferentes. */
  var EPOCA = Date.UTC(2026, 8, 18); /* 18/09/2026 — mês é 0-based */

  var BASE = {
    atletas: 1568,
    equipes: 37,
    eventos: 17
  };

  /* [mínimo, máximo] de incremento por dia, ambos inclusive. */
  var FAIXA = {
    atletas: [50, 100],
    equipes: [0, 10],
    eventos: [1, 5]
  };

  /* Trava de sanidade: se a data da máquina do visitante estiver em 2040, ou
     se alguém esquecer a EPOCA para trás por anos, o laço de soma não pode
     rodar milhões de vezes nem cuspir um número absurdo. 10 anos é teto de
     sobra para uma landing page. */
  var TETO_DIAS = 3650;

  var DIA_MS = 86400000;

  /* ---------- o sorteio determinístico ----------
     FNV-1a sobre a string "<dia>:<métrica>", com uma mistura final (o
     "avalanche" do xorshift) para que dias vizinhos não produzam valores
     vizinhos — sem ela, dia 10 e dia 11 cairiam quase sempre no mesmo
     ponto da faixa e o crescimento ficaria visivelmente linear.

     Math.imul é o que mantém a multiplicação em 32 bits; com * comum o
     número estoura o inteiro seguro do JS e o hash degenera. */
  function sorteio(dia, metrica) {
    var texto = dia + ":" + metrica;
    var h = 2166136261;

    for (var i = 0; i < texto.length; i++) {
      h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
    }

    h ^= h >>> 15;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;

    return (h >>> 0) / 4294967296; /* 0 <= x < 1 */
  }

  /* Quantos dias inteiros se passaram desde a EPOCA. Negativo (relógio do
     visitante atrasado) vira 0: o contador nunca fica abaixo da BASE. */
  function diasCorridos() {
    var agora = new Date();
    var hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
    var dias = Math.floor((hoje - EPOCA) / DIA_MS);

    if (!isFinite(dias) || dias < 0) return 0;
    return Math.min(dias, TETO_DIAS);
  }

  /* O valor de hoje = base + a soma dos incrementos de cada dia passado.
     Somar dia a dia (em vez de "média * dias") é o que garante que a série
     seja a MESMA todo dia: o valor de ontem é sempre um prefixo do de hoje. */
  function valor(metrica, dias) {
    var base = BASE[metrica];
    var faixa = FAIXA[metrica];

    if (base === undefined || !faixa) return null;

    var min = faixa[0];
    var largura = faixa[1] - faixa[0] + 1; /* +1 = máximo inclusive */
    var total = base;

    for (var d = 1; d <= dias; d++) {
      total += min + Math.floor(sorteio(d, metrica) * largura);
    }

    return total;
  }

  /* ---------- aplicação no DOM ----------
     Só escrevemos o data-count. Quem ANIMA continua sendo anim/hero.js e
     anim/section-09.js, e quem escreve o número na tela sem biblioteca
     continua sendo rede() no main.js — por isso este script tem de vir
     ANTES do main.js no HTML.

     O <b> segue com "0" no texto: é o estado inicial da contagem. */
  function aplicar() {
    var dias = diasCorridos();
    var cache = {};

    document.querySelectorAll("[data-stat]").forEach(function (el) {
      var metrica = el.dataset.stat;

      if (!(metrica in cache)) cache[metrica] = valor(metrica, dias);
      if (cache[metrica] === null) return; /* métrica desconhecida: mantém o HTML */

      el.dataset.count = String(cache[metrica]);
    });
  }

  /* defer garante o DOM pronto; o if é só para o caso de alguém mover este
     <script> para o <head> sem defer no futuro. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicar);
  } else {
    aplicar();
  }
})();
